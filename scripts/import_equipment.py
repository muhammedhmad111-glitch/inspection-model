"""
One-off Phase 1 seed: parse `inspection model.xlsx` (real IJP checklist data)
into area/section/equipment/equipment_parts, and emit a SQL seed file.

Group/part headers are distinguished from leaf checklist items using the
cell's bold formatting (matches the source document's own visual intent —
confirmed against the mirrored inspection structure.docx, where group
headers are bold+underlined and checklist items are plain text). Column
position alone is NOT reliable: some equipment sections in this sheet keep
groups and items at the same indentation level.

Also dumps the full raw hierarchy (every row, with column + bold flag) to
JSON so Phase 2 (Inspection Library import) can reuse it without re-parsing
the xlsx.

Usage: python scripts/import_equipment.py   (run from project root)
"""
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
XLSX_PATH = ROOT / "inspection model.xlsx"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

AREA_CODE = "RAW-GRINDING"
AREA_NAME = "Raw Materials & Grinding"
SECTION_CODE = "RAW-MILL-CIRCUIT"
SECTION_NAME = "Raw Mill Circuit"


def col_letter_to_idx(ref: str) -> int:
    letters = re.match(r"([A-Z]+)(\d+)", ref).group(1)
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch) - 64)
    return idx - 1


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def slugify(text: str, max_len: int = 50) -> str:
    text = text.upper()
    text = re.sub(r"[^A-Z0-9]+", "-", text).strip("-")
    return text[:max_len] or "PART"


def main() -> None:
    z = zipfile.ZipFile(XLSX_PATH)

    styles_root = ET.fromstring(z.read("xl/styles.xml"))
    fonts = styles_root.find("m:fonts", NS)
    font_bold = [f.find("m:b", NS) is not None for f in fonts.findall("m:font", NS)]
    cell_xfs = styles_root.find("m:cellXfs", NS)
    xf_bold = []
    for xf in cell_xfs.findall("m:xf", NS):
        font_id = int(xf.get("fontId", "0"))
        xf_bold.append(font_bold[font_id] if font_id < len(font_bold) else False)

    ss_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    shared = [
        "".join((t.text or "") for t in si.findall(".//m:t", NS))
        for si in ss_root.findall("m:si", NS)
    ]

    def cell_value(c):
        t = c.get("t")
        v = c.find("m:v", NS)
        if v is None:
            return None
        val = v.text
        return shared[int(val)] if t == "s" else val

    sheet_root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = sheet_root.find("m:sheetData", NS).findall("m:row", NS)

    equipment_header_re = re.compile(r"^(\d+)-\s*(.*)$")
    blocks = []
    current = None

    for row in rows:
        cells = row.findall("m:c", NS)
        if not cells:
            continue
        first = None
        for c in cells:
            val = cell_value(c)
            if val is not None and str(val).strip():
                first = (c, str(val).strip(), col_letter_to_idx(c.get("r")))
                break
        if not first:
            continue
        cell, val, col_idx = first

        m = equipment_header_re.match(val) if col_idx == 0 else None
        if m:
            if current:
                blocks.append(current)
            current = {"num": int(m.group(1)), "raw_name": m.group(2).strip(), "rows": []}
            continue

        if current is None:
            continue

        style_idx = int(cell.get("s", "0"))
        bold = xf_bold[style_idx] if style_idx < len(xf_bold) else False
        current["rows"].append({"col": col_idx, "bold": bold, "text": val})

    if current:
        blocks.append(current)

    print(f"Parsed {len(blocks)} equipment blocks")

    (ROOT / "scripts/data").mkdir(parents=True, exist_ok=True)
    with open(ROOT / "scripts/data/raw-equipment-checklists.json", "w", encoding="utf-8") as f:
        json.dump(blocks, f, ensure_ascii=False, indent=2)

    sql = []
    sql.append("-- Phase 1 seed data, generated from inspection model.xlsx")
    sql.append("-- Do not hand-edit; re-run scripts/import_equipment.py instead.\n")

    sql.append("insert into public.areas (area_code, area_name, description) values")
    sql.append(
        f"  ({sql_str(AREA_CODE)}, {sql_str(AREA_NAME)}, "
        f"{sql_str('Imported from inspection model.xlsx (IJP source data)')})"
    )
    sql.append("on conflict (area_code) do nothing;\n")

    sql.append("insert into public.sections (area_id, section_code, section_name, description)")
    sql.append(
        f"select area_id, {sql_str(SECTION_CODE)}, {sql_str(SECTION_NAME)}, "
        f"{sql_str('Raw meal grinding circuit equipment')}"
    )
    sql.append(f"from public.areas where area_code = {sql_str(AREA_CODE)}")
    sql.append("on conflict (area_id, section_code) do nothing;\n")

    for block in blocks:
        has_name = bool(block["raw_name"].strip())
        name = block["raw_name"] if has_name else f"Unnamed Equipment #{block['num']}"
        code = slugify(block["raw_name"]) if has_name else f"UNSPECIFIED-{block['num']}"
        active = "true" if has_name else "false"

        sql.append("insert into public.equipment (section_id, equipment_code, equipment_name, active)")
        sql.append(f"select section_id, {sql_str(code)}, {sql_str(name)}, {active}")
        sql.append(f"from public.sections where section_code = {sql_str(SECTION_CODE)}")
        sql.append("on conflict (equipment_code) do nothing;\n")

        # bold rows = part/group headers; group via a column-depth stack
        stack = []  # list of (col, part_name)
        seen_codes = {}
        for r in block["rows"]:
            if not r["bold"]:
                continue
            while stack and stack[-1][0] >= r["col"]:
                stack.pop()
            part_group = stack[-1][1] if stack else None

            base_code = slugify(r["text"])
            n = seen_codes.get(base_code, 0) + 1
            seen_codes[base_code] = n
            part_code = base_code if n == 1 else f"{base_code}-{n}"

            sql.append(
                "insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)"
            )
            group_sql = sql_str(part_group) if part_group else "null"
            sql.append(
                f"select equipment_id, {sql_str(part_code)}, {sql_str(r['text'])}, {group_sql}"
            )
            sql.append(f"from public.equipment where equipment_code = {sql_str(code)}")
            sql.append("on conflict (equipment_id, part_code) do nothing;\n")

            stack.append((r["col"], r["text"]))

    with open(ROOT / "scripts/data/seed-phase1.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(sql))

    print("Wrote scripts/data/seed-phase1.sql and scripts/data/raw-equipment-checklists.json")


if __name__ == "__main__":
    main()
