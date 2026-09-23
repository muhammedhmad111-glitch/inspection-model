"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Cog, Map, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { equipmentTags } from "@/lib/equipment-ref";
import { LINE_LABELS_AR, type ProductionLine } from "@/lib/production-line";
import { cn } from "@/lib/utils";

type EquipmentNode = {
  equipment_id: string;
  equipment_code: string;
  equipment_name: string;
  functional_location: string | null;
  active: boolean;
};

type SectionNode = {
  section_id: string;
  section_code: string;
  section_name: string;
  active: boolean;
  equipment: EquipmentNode[];
};

type AreaNode = {
  area_id: string;
  area_code: string;
  area_name: string;
  description: string | null;
  active: boolean;
  sections: SectionNode[];
};

export type LineTree = {
  line: ProductionLine;
  areas: AreaNode[];
  counts: { areas: number; sections: number; equipment: number };
};

/** Everything a machine can be found by: what it is called, and its two numbers. */
function equipmentHaystack(e: EquipmentNode): string {
  return `${e.equipment_name} ${e.equipment_code} ${e.functional_location ?? ""}`.toLowerCase();
}

/**
 * Narrow the tree to what matches, keeping the branch above each hit. A section
 * whose own name matches keeps all its equipment — you searched for the section,
 * so you want to see what is in it.
 */
function filterAreas(areas: AreaNode[], query: string): AreaNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return areas;

  return areas.flatMap((area) => {
    const areaHit = `${area.area_name} ${area.area_code}`.toLowerCase().includes(q);

    const sections = area.sections.flatMap((section) => {
      const sectionHit =
        `${section.section_name} ${section.section_code}`.toLowerCase().includes(q);
      if (areaHit || sectionHit) return [section];

      const equipment = section.equipment.filter((e) => equipmentHaystack(e).includes(q));
      return equipment.length ? [{ ...section, equipment }] : [];
    });

    if (!areaHit && sections.length === 0) return [];
    return [{ ...area, sections }];
  });
}

function countEquipment(area: AreaNode): number {
  return area.sections.reduce((n, s) => n + s.equipment.length, 0);
}

export function StructureClient({ lines }: { lines: LineTree[] }) {
  const [tab, setTab] = useState(String(lines[0]?.line ?? 1));
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">هيكل الأصول</h1>
        <p className="text-sm text-muted-foreground">
          كل خط إنتاج بمناطقه وأقسامه ومعداته — التبويب هنا لا يغيّر الخط المختار
          في باقي الموقع
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالمنطقة أو القسم أو المعدة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap rounded-2xl">
          {lines.map((l) => (
            <TabsTrigger key={l.line} value={String(l.line)} className="rounded-xl">
              {LINE_LABELS_AR[l.line]}
              <span className="ms-2 text-xs text-muted-foreground">
                {l.counts.equipment}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {lines.map((l) => (
          <TabsContent key={l.line} value={String(l.line)} className="mt-5">
            <LinePanel tree={l} search={search} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function LinePanel({ tree, search }: { tree: LineTree; search: string }) {
  const areas = useMemo(() => filterAreas(tree.areas, search), [tree.areas, search]);

  // Collapsed by default — 148 machines under four areas is a wall of text on
  // open. A search is a statement that you want to see the hits, so it expands
  // everything it left standing.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const searching = search.trim().length > 0;

  function toggle(areaId: string) {
    setOpened((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Stat label="مناطق" value={tree.counts.areas} />
        <Stat label="أقسام" value={tree.counts.sections} />
        <Stat label="معدات" value={tree.counts.equipment} />
      </div>

      {areas.length === 0 ? (
        <p className="rounded-3xl bg-card py-10 text-center text-muted-foreground shadow-sm">
          {searching ? "لا توجد نتائج مطابقة" : "لا توجد مناطق على هذا الخط"}
        </p>
      ) : (
        areas.map((area) => {
          const open = searching || opened.has(area.area_id);
          return (
            <div
              key={area.area_id}
              className="overflow-hidden rounded-3xl bg-card shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggle(area.area_id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-5 py-4 text-right transition-colors hover:bg-muted/40"
              >
                <Map className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {area.area_code}
                    </span>
                    <span className="font-semibold">{area.area_name}</span>
                    {!area.active ? <Badge variant="secondary">غير نشط</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {area.sections.length} قسم · {countEquipment(area)} معدة
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>

              {open ? (
                <div className="flex flex-col gap-4 border-t px-5 py-4">
                  {area.sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">لا توجد أقسام بعد</p>
                  ) : (
                    area.sections.map((section) => (
                      <SectionBlock key={section.section_id} section={section} />
                    ))
                  )}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}

function SectionBlock({ section }: { section: SectionNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          {section.section_code}
        </span>
        <span className="text-sm font-semibold">{section.section_name}</span>
        {!section.active ? <Badge variant="secondary">غير نشط</Badge> : null}
        <span className="text-xs text-muted-foreground">
          {section.equipment.length} معدة
        </span>
      </div>

      {section.equipment.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">لا توجد معدات في هذا القسم</p>
      ) : (
        <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {section.equipment.map((e) => (
            <li key={e.equipment_id}>
              <Link
                href={`/master-data/equipment/${e.equipment_id}`}
                className="flex items-start gap-2 rounded-2xl px-3 py-2 transition-colors hover:bg-muted/60"
              >
                <Cog
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    e.active ? "text-muted-foreground" : "text-muted-foreground/40"
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-sm",
                      !e.active && "text-muted-foreground line-through"
                    )}
                  >
                    {e.equipment_name}
                  </span>
                  {/* Both numbers, LTR: a fitter walks to the stencilled floc, a
                      planner searches SAP with the register code. */}
                  <span
                    dir="ltr"
                    className="block truncate text-right font-mono text-xs text-muted-foreground"
                  >
                    {equipmentTags(e).join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-card px-4 py-2.5 shadow-sm">
      <span className="text-lg font-bold">{value}</span>
      <span className="ms-2 text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
