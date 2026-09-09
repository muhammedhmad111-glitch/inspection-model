import {
  equipmentSection,
  equipmentTags,
  NO_EQUIPMENT_AR,
  type EquipmentRef,
} from "@/lib/equipment-ref";

/**
 * The one-line identity of a machine, as an inline span so it can drop into the
 * subtitle line of a card that already says other things after it.
 *
 * The numbers are monospace and LTR on purpose: "B06.04" inside an Arabic sentence
 * renders as "04.B06" without it, which is a different conveyor.
 */
export function EquipmentRefText({
  equipment,
  part,
  showSection = true,
  fallback = NO_EQUIPMENT_AR,
}: {
  equipment: EquipmentRef;
  /** The part inspected, when the row names one. */
  part?: string | null;
  /** Off where the list is already grouped under a section heading. */
  showSection?: boolean;
  fallback?: string;
}) {
  const tags = equipmentTags(equipment);
  const section = showSection ? equipmentSection(equipment) : null;
  return (
    <span dir="auto">
      {equipment?.equipment_name || fallback}
      {tags.map((t) => (
        <span key={t} className="font-mono text-xs" dir="ltr">
          {" · "}
          {t}
        </span>
      ))}
      {part ? ` · ${part}` : null}
      {section ? <span className="opacity-70">{` — ${section}`}</span> : null}
    </span>
  );
}
