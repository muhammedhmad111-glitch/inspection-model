/**
 * Grouping inspection work by the plant section it belongs to. The tasks table and
 * the calendar's day list both do it, and they have to agree on the ordering and on
 * what to call equipment that has not been filed under a section yet.
 */

export type SectionRef = {
  section_id: string;
  section_name: string;
  areas: { area_name: string } | null;
} | null;

/** Any row that reaches a section through its equipment. */
export type SectionedRow = { equipment: { sections: SectionRef } | null };

export const NO_SECTION = {
  id: "__nosection__",
  name: "بدون قسم",
  area: null as string | null,
};

export function sectionOf(row: SectionedRow) {
  const s = row.equipment?.sections;
  if (!s) return NO_SECTION;
  return {
    id: s.section_id,
    name: s.section_name,
    area: s.areas?.area_name ?? null,
  };
}

export type SectionGroup<T> = {
  id: string;
  name: string;
  area: string | null;
  tasks: T[];
};

/** Group rows by section, alphabetically, with the unfiled ones last. */
export function groupBySection<T extends SectionedRow>(rows: T[]): SectionGroup<T>[] {
  const byId = new Map<string, SectionGroup<T>>();
  for (const row of rows) {
    const s = sectionOf(row);
    const g = byId.get(s.id) ?? { ...s, tasks: [] };
    g.tasks.push(row);
    byId.set(s.id, g);
  }
  return [...byId.values()].sort((a, b) => {
    // Equipment with no section yet sinks to the bottom: that is a data gap, not a place.
    if (a.id === NO_SECTION.id) return 1;
    if (b.id === NO_SECTION.id) return -1;
    return a.name.localeCompare(b.name, "ar");
  });
}

export const sectionsWord = (n: number) =>
  n === 1 ? "قسم" : n === 2 ? "قسمين" : n <= 10 ? "أقسام" : "قسمًا";
