// Infers an adaptive input for a checklist item from its (English) label:
// a numeric measurement with a unit — and, where an industry default exists,
// an automatic healthy / attention / out-of-range verdict.

import type { Enums } from "@/lib/supabase/types";

export type MeasurementSpec = {
  kind: "numeric" | "visual";
  unit?: string; // e.g. "°C", "mm/s"
  nameAr?: string; // Arabic descriptor for the field label
  okMax?: number; // value <= okMax → OK
  warnMax?: number; // okMax < value <= warnMax → Attention; above → Not OK
  okMin?: number; // value < okMin → Not OK (e.g. minimum oil pressure)
};

type Rule = { kw: string[]; spec: Omit<MeasurementSpec, "kind"> };

// order matters — more specific keywords first
const RULES: Rule[] = [
  { kw: ["vibration", "vib "], spec: { unit: "mm/s", nameAr: "الاهتزاز", okMax: 4.5, warnMax: 7.1 } }, // ISO 10816
  { kw: ["temperature", "temp."], spec: { unit: "°C", nameAr: "درجة الحرارة", okMax: 80, warnMax: 95 } },
  { kw: ["noise", "sound level", " db"], spec: { unit: "dB", nameAr: "الضوضاء", okMax: 85, warnMax: 90 } },
  { kw: ["pressure"], spec: { unit: "bar", nameAr: "الضغط" } },
  { kw: ["current", "ampere", "amps"], spec: { unit: "A", nameAr: "التيار" } },
  { kw: ["voltage"], spec: { unit: "V", nameAr: "الجهد" } },
  { kw: ["thickness"], spec: { unit: "mm", nameAr: "السُّمك" } },
  { kw: ["speed", "rpm"], spec: { unit: "rpm", nameAr: "السرعة" } },
  { kw: ["flow rate", "flow "], spec: { unit: "m³/h", nameAr: "معدل التدفق" } },
  { kw: ["clearance", "gap", "backlash"], spec: { unit: "mm", nameAr: "الخلوص" } },
  { kw: ["alignment", "runout", "run-out"], spec: { unit: "mm", nameAr: "المحاذاة" } },
  { kw: ["tension"], spec: { unit: "N", nameAr: "الشد" } },
  { kw: ["filling level", "level %", "fill level"], spec: { unit: "%", nameAr: "المستوى" } },
];

export function inferMeasurement(label: string): MeasurementSpec {
  const l = ` ${label.toLowerCase()} `;
  for (const rule of RULES) {
    if (rule.kw.some((k) => l.includes(k))) {
      const spec: MeasurementSpec = { kind: "numeric", ...rule.spec };
      // refine temperature limits by context
      if (spec.unit === "°C") {
        if (/motor|winding|stator/.test(l)) {
          spec.okMax = 120;
          spec.warnMax = 140;
        } else if (/oil|lubric|gear/.test(l)) {
          spec.okMax = 70;
          spec.warnMax = 85;
        } else if (/ambient|room/.test(l)) {
          spec.okMax = 45;
          spec.warnMax = 55;
        }
      }
      return spec;
    }
  }
  return { kind: "visual" };
}

// Maps a reading to the checklist_result verdict, when the spec has thresholds.
export function verdictFor(
  value: number | null,
  spec: MeasurementSpec
): Enums<"checklist_result"> | null {
  if (value == null || Number.isNaN(value)) return null;
  if (spec.okMax == null && spec.okMin == null) return null;
  if (spec.okMin != null && value < spec.okMin) return "Not OK";
  if (spec.okMax != null) {
    if (value <= spec.okMax) return "OK";
    if (spec.warnMax != null && value <= spec.warnMax) return "Attention";
    return "Not OK";
  }
  return "OK";
}

export function rangeHint(spec: MeasurementSpec): string | null {
  if (spec.okMax != null) return `الطبيعي ≤ ${spec.okMax} ${spec.unit ?? ""}`.trim();
  if (spec.okMin != null) return `الطبيعي ≥ ${spec.okMin} ${spec.unit ?? ""}`.trim();
  return null;
}
