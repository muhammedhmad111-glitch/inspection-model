/**
 * How a machine is named everywhere: on screen, in the email, in the PDF, in the
 * WhatsApp message.
 *
 * The name on its own does not identify anything. Five of the six highest-severity
 * open findings in this plant are on equipment called "Belt conveyor"; what tells
 * them apart is the number stencilled on the frame — B06.04, B21(RM1) — and the
 * register code the planner searches SAP with. Both travel with the name, and the
 * section says which end of the plant to walk to.
 */

export type EquipmentRef = {
  equipment_name: string;
  equipment_code?: string | null;
  functional_location?: string | null;
  sections?: { section_name: string } | null;
} | null;

/** Fallback when a row has no equipment at all — rare, but findings allow it. */
export const NO_EQUIPMENT_AR = "معدة غير محددة";

/**
 * The same identity out of a flat row. Views hand the columns back side by side
 * instead of nested, and there is no reason for the caller to care which it got.
 */
export function flatEquipmentRef(row: {
  equipment_name: string | null;
  equipment_code?: string | null;
  functional_location?: string | null;
  section_name?: string | null;
}): EquipmentRef {
  if (!row.equipment_name) return null;
  return {
    equipment_name: row.equipment_name,
    equipment_code: row.equipment_code ?? null,
    functional_location: row.functional_location ?? null,
    sections: row.section_name ? { section_name: row.section_name } : null,
  };
}

/**
 * The numbers, plant-floor one first: `["B06.04", "RM-007"]`. Kept as an array so
 * the UI can render each in a monospace LTR span while the text surfaces join them.
 */
export function equipmentTags(e: EquipmentRef): string[] {
  if (!e) return [];
  const tags: string[] = [];
  const loc = e.functional_location?.trim();
  const code = e.equipment_code?.trim();
  if (loc) tags.push(loc);
  // The register code is dropped when the floc already repeats it — some equipment
  // is stencilled with exactly its code and "RM-007 · RM-007" reads like a bug.
  if (code && code !== loc) tags.push(code);
  return tags;
}

export function equipmentSection(e: EquipmentRef): string | null {
  return e?.sections?.section_name ?? null;
}

/** `Belt conveyor · B06.04 · RM-007` — the machine, without saying where it is. */
export function equipmentLabel(e: EquipmentRef, fallback = NO_EQUIPMENT_AR): string {
  if (!e) return fallback;
  return [e.equipment_name, ...equipmentTags(e)].filter(Boolean).join(" · ");
}

/**
 * `Belt conveyor · B06.04 · RM-007 — Raw materials` : everything on one line, for
 * report tables and chat messages where there is no room for a second field.
 */
export function equipmentFull(e: EquipmentRef, fallback = NO_EQUIPMENT_AR): string {
  const label = equipmentLabel(e, fallback);
  const section = equipmentSection(e);
  return section ? `${label} — ${section}` : label;
}
