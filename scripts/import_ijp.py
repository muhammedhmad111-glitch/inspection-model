"""
Apply one IJP (normalized_export.json for an equipment type) to every equipment
in the DB whose name matches a keyword.

Each IJP "plan" (a worksheet with its own frequency) becomes one recurring
inspection_activity per matched equipment. Its checklist is the plan's tasks,
each labelled with its subphase for context. The equipment's existing generic
'-GEN' activity is replaced.

Usage:
  python scripts/import_ijp.py <json_path> <match_keyword> [out_sql]
Example:
  python scripts/import_ijp.py ".../belt_conveyor_ijps/normalized_export.json" "belt conveyor"
"""
import json
import re
import sys
from pathlib import Path


def q(v: str) -> str:
    return "'" + (v or "").replace("'", "''") + "'"


def clean(v: str) -> str:
    return re.sub(r"\s+", " ", (v or "").replace("\n", " ")).strip()


def map_frequency(value, unit):
    """Return (frequency_type, custom_interval_days|None)."""
    unit = (unit or "").lower()
    try:
        value = int(value)
    except (TypeError, ValueError):
        return "Monthly", None
    if unit == "week":
        if value == 1:
            return "Weekly", None
        if value == 4:
            return "Monthly", None
        return "Custom", value * 7
    if unit == "month":
        if value == 1:
            return "Monthly", None
        if value == 3:
            return "Quarterly", None
        if value == 6:
            return "Semi-Annual", None
        return "Custom", value * 30
    if unit == "year":
        if value == 1:
            return "Annual", None
        return "Custom", value * 365
    if unit == "day":
        return ("Daily", None) if value == 1 else ("Custom", value)
    return "Monthly", None


def scope_from_desc(desc: str, fallback: str) -> str:
    if not desc:
        return fallback
    m = re.search(
        r"inspect\s+(?:all\s+)?(?:the\s+)?(.*?)\s+(?:based on|under)", desc, re.I
    )
    if m:
        s = clean(m.group(1))
        if s:
            return s[:60]
    return fallback


def classify(hay: str) -> tuple[str, str, str]:
    h = hay.lower()

    def has(*w):
        return any(x in h for x in w)

    if has("thickness", "hardness", "wear", "coating", "crack", "worn"):
        cat = "Wear"
    elif has("bearing", "vibrat", "abnormal noise"):
        cat = "Vibration"
    elif has("lubric", "oil", "grease", "gearbox", "gear box"):
        cat = "Lubrication"
    elif has("align"):
        cat = "Alignment"
    elif has("leak"):
        cat = "Leakage"
    elif has("earth", "electr", "cable"):
        cat = "Electrical"
    elif has("clean", "dust", "housekeep"):
        cat = "Housekeeping"
    else:
        cat = "Visual"
    prio = "High" if cat in ("Vibration", "Electrical") else "Medium"
    role = "Inspector" if cat in ("Visual", "Housekeeping") else "Mechanical Engineer"
    return cat, prio, role


def main():
    pos = [a for a in sys.argv[1:] if not a.startswith("--")]
    exclude = None
    codes = None
    for a in sys.argv[1:]:
        if a.startswith("--exclude="):
            exclude = a.split("=", 1)[1].strip().lower()
        elif a.startswith("--codes="):
            codes = [c.strip() for c in a.split("=", 1)[1].split(",") if c.strip()]
    json_path = Path(pos[0])
    keyword = pos[1].strip().lower()
    out = Path(pos[2]) if len(pos) > 2 else (
        Path(__file__).resolve().parent / "data" / "ijp-apply.sql"
    )

    data = json.loads(json_path.read_text(encoding="utf-8"))
    plans = data.get("plans", [])

    rows = []  # (pcode, aname_suffix, cat, freq, custom, prio, role, instructions, checklist_json)
    seen_pcodes: dict[str, int] = {}
    for p in plans:
        phases = p.get("phases", [])
        if not phases:
            continue  # metadata sheet with no tasks
        items = []
        all_text = []
        for ph in phases:
            for sp in ph.get("subphases", []):
                sub = clean(sp.get("subphase_name", "")).rstrip(".")
                for t in sp.get("tasks", []):
                    td = clean(t.get("task_description", ""))
                    if not td:
                        continue
                    label = f"{sub}: {td}" if sub else td
                    items.append({"label": label[:300]})
                    all_text.append(td)
        if not items:
            continue
        base_pcode = re.sub(r"[^A-Za-z0-9]+", "-", p.get("plan_code", "")).strip("-").upper()
        n = seen_pcodes.get(base_pcode, 0) + 1
        seen_pcodes[base_pcode] = n
        pcode = base_pcode if n == 1 else f"{base_pcode}-{n}"
        freq, custom = map_frequency(p.get("frequency_value"), p.get("frequency_unit"))
        cat, prio, role = classify(" ".join(all_text))
        flabel = (p.get("frequency_label") or "").replace("every_", "").replace("_", " ")
        scope = scope_from_desc(p.get("operation_description", ""), pcode)
        suffix = f"{scope} ({flabel})".strip()
        rows.append((
            pcode, suffix[:120], cat, freq, custom, prio, role,
            clean(p.get("operation_description", "")), json.dumps(items, ensure_ascii=False),
        ))

    sql = []
    sql.append(f"-- IJP apply: {json_path.name} -> equipment matching '{keyword}'")
    sql.append(f"-- {len(rows)} plans; replaces existing activities on matched equipment.\n")

    if codes:
        code_list = ", ".join(q(c) for c in codes)
        match = f"e.equipment_code in ({code_list})"
    else:
        match = f"lower(e.equipment_name) like {q('%' + keyword + '%')}"
        if exclude:
            match += f" and lower(e.equipment_name) not like {q('%' + exclude + '%')}"

    sql.append("-- 1) remove existing activities on matched equipment (tasks cascade)")
    sql.append(
        "delete from public.inspection_activities a\n"
        "using public.equipment_parts ep, public.equipment e\n"
        "where a.equipment_part_id = ep.equipment_part_id\n"
        f"  and ep.equipment_id = e.equipment_id and {match};\n"
    )

    sql.append("-- 2) insert IJP plan activities for every matched equipment")
    sql.append(
        "with plan(pcode, suffix, cat, freq, custom_days, prio, role, instructions, checklist) as (values"
    )
    vals = []
    for pcode, suffix, cat, freq, custom, prio, role, instr, checklist in rows:
        custom_sql = str(custom) if custom is not None else "null"
        vals.append(
            f"  ({q(pcode)}, {q(suffix)}, {q(cat)}, {q(freq)}, {custom_sql}, "
            f"{q(prio)}, {q(role)}, {q(instr)}, {q(checklist)}::jsonb)"
        )
    sql.append(",\n".join(vals))
    sql.append(")")
    sql.append(
        "insert into public.inspection_activities\n"
        "  (equipment_part_id, activity_code, activity_name, inspection_category,\n"
        "   frequency_type, custom_interval_days, priority, responsible_role,\n"
        "   instructions, standard_checklist)\n"
        "select ep.equipment_part_id,\n"
        "       e.equipment_code || '-' || pl.pcode,\n"
        "       e.equipment_name || ' — ' || pl.suffix,\n"
        "       pl.cat::public.inspection_category, pl.freq::public.frequency_type,\n"
        "       pl.custom_days::integer, pl.prio::public.priority_level,\n"
        "       pl.role::public.app_user_role, nullif(pl.instructions,''), pl.checklist\n"
        "from plan pl\n"
        "cross join public.equipment e\n"
        "join public.equipment_parts ep on ep.equipment_id = e.equipment_id and ep.part_code = 'MAIN'\n"
        f"where {match};\n"
    )

    out.write_text("\n".join(sql), encoding="utf-8")
    total_items = sum(len(json.loads(r[8])) for r in rows)
    print(f"plans_with_tasks={len(rows)} total_checklist_items={total_items} -> {out.name}")
    for r in rows:
        print(f"  {r[0]:14} freq={r[3]:12} cat={r[2]:12} items={len(json.loads(r[8]))}  {r[1]}")


if __name__ == "__main__":
    main()
