// Infers an adaptive input for a checklist item from its (English) label.
//
// Two shapes:
//   • "numeric" — a reading with a unit (temperature, vibration, pressure, …),
//     with an automatic healthy / attention / out-of-range verdict where an
//     industry default exists.
//   • "scale"   — a graded choice worded for what the item actually inspects
//     (leakage, wear, noise, tightness, cleanliness, …); each grade carries the
//     verdict it implies.
// Anything unmatched falls back to the plain pass/fail buttons.

import type { Enums } from "@/lib/supabase/types";

export type ScaleOption = {
  label: string; // Arabic wording shown on the button
  verdict: Enums<"checklist_result">;
};

export type MeasurementSpec = {
  kind: "numeric" | "scale" | "visual";
  // numeric
  unit?: string;
  okMax?: number;
  warnMax?: number;
  okMin?: number;
  // scale
  options?: ScaleOption[];
  // shared
  nameAr?: string;
};

const OK: Enums<"checklist_result"> = "OK";
const ATT: Enums<"checklist_result"> = "Attention";
const BAD: Enums<"checklist_result"> = "Not OK";

type NumericRule = { kw: string[]; spec: Omit<MeasurementSpec, "kind" | "options"> };
type ScaleRule = { kw: string[]; nameAr: string; options: ScaleOption[] };

// ---------- numeric rules (most specific first) ----------
const NUMERIC_RULES: NumericRule[] = [
  { kw: ["vibration"], spec: { unit: "mm/s", nameAr: "الاهتزاز", okMax: 4.5, warnMax: 7.1 } }, // ISO 10816
  { kw: ["temperature", "temprature", "temp."], spec: { unit: "°C", nameAr: "درجة الحرارة", okMax: 80, warnMax: 95 } },
  { kw: ["differential pressure", "delta p"], spec: { unit: "mbar", nameAr: "فرق الضغط", okMax: 20, warnMax: 25 } },
  { kw: ["pressure"], spec: { unit: "bar", nameAr: "الضغط" } },
  { kw: ["current", "ampere", "amps"], spec: { unit: "A", nameAr: "التيار" } },
  { kw: ["voltage"], spec: { unit: "V", nameAr: "الجهد" } },
  { kw: ["thickness"], spec: { unit: "mm", nameAr: "السُّمك" } },
  { kw: ["elongation"], spec: { unit: "%", nameAr: "نسبة الاستطالة", okMax: 2, warnMax: 3 } },
  { kw: ["speed", "rpm"], spec: { unit: "rpm", nameAr: "السرعة" } },
  // only a metered flow reading — "material flow is continuous" is a visual check
  { kw: ["flow rate", "flow meter"], spec: { unit: "m³/h", nameAr: "معدل التدفق" } },
  { kw: ["clearance", "backlash"], spec: { unit: "mm", nameAr: "الخلوص" } },
  { kw: ["alignment", "runout", "run-out"], spec: { unit: "mm", nameAr: "المحاذاة" } },
  { kw: ["tension"], spec: { unit: "N", nameAr: "الشد" } },
  { kw: ["oil level", "filling level", "fill level"], spec: { unit: "%", nameAr: "المستوى" } },
];

// ---------- graded (non-numeric) rules ----------
const three = (a: string, b: string, c: string): ScaleOption[] => [
  { label: a, verdict: OK },
  { label: b, verdict: ATT },
  { label: c, verdict: BAD },
];

const SCALE_RULES: ScaleRule[] = [
  {
    kw: ["leakage", "leak", "in-leakage", "leaks"],
    nameAr: "حالة التسريب",
    options: three("لا يوجد تسريب", "تسريب طفيف", "تسريب واضح"),
  },
  {
    kw: ["noise", "sound"],
    nameAr: "الصوت",
    options: three("صوت طبيعي", "صوت غير طبيعي خفيف", "صوت غير طبيعي واضح"),
  },
  {
    kw: ["wear", "worn", "corrosion", "erosion"],
    nameAr: "درجة التآكل/البِلى",
    options: three("لا يوجد تآكل", "تآكل خفيف", "تآكل شديد"),
  },
  {
    kw: ["tightening", "tightness", "bolt", "fastening", "fixation", "loose"],
    nameAr: "إحكام الربط",
    options: three("محكم", "ارتخاء بسيط", "ارتخاء/مسامير مفقودة"),
  },
  {
    kw: ["crack", "hole", "dent", "tear", "cut"],
    nameAr: "سلامة الجسم",
    options: three("سليم بدون شروخ", "شروخ/تشوّه بسيط", "شرخ أو ثقب واضح"),
  },
  {
    kw: ["dust emission", "emission"],
    nameAr: "انبعاث الأتربة",
    options: three("لا يوجد انبعاث", "انبعاث خفيف", "انبعاث كثيف"),
  },
  {
    kw: ["clean", "cleaning", "cleanliness"],
    nameAr: "النظافة",
    options: three("نظيف", "يحتاج تنظيف", "متسخ بشدة"),
  },
  {
    kw: ["grease", "lubric", "oil "],
    nameAr: "حالة التشحيم",
    options: three("تشحيم سليم", "يحتاج تزييت", "جاف / تسريب زيت"),
  },
  {
    kw: ["lighting", "guardrail", "emergency stop", "protection", "guard", "access", "ladder", "housing"],
    nameAr: "حالة الأمان",
    options: three("مطابق وآمن", "يحتاج إصلاح بسيط", "غير آمن / مفقود"),
  },
  {
    kw: ["missing", "liner"],
    nameAr: "اكتمال الأجزاء",
    options: three("مكتمل", "نقص بسيط", "أجزاء مفقودة"),
  },
  {
    kw: ["seal", "gasket"],
    nameAr: "حالة الحوائط المانعة",
    options: three("سليمة", "تلف بسيط", "تالفة"),
  },
  {
    kw: ["blockage", "block", "clog", "material flow", "continuous"],
    nameAr: "انسياب المادة",
    options: three("انسياب منتظم", "انسياب متقطّع", "انسداد"),
  },
  {
    kw: ["insulation", "isolation"],
    nameAr: "حالة العزل",
    options: three("عزل سليم", "تلف بسيط", "عزل تالف/مفقود"),
  },
  {
    kw: ["colour", "color", "visual aspect"],
    nameAr: "المظهر/اللون",
    options: three("طبيعي", "تغيّر بسيط", "تغيّر واضح"),
  },
  {
    kw: ["condensation", "water"],
    nameAr: "وجود مياه/تكاثف",
    options: three("جاف", "تكاثف بسيط", "مياه واضحة"),
  },
  {
    kw: ["adjustment", "regulator", "valve", "setting", "calibrat"],
    nameAr: "الضبط/المعايرة",
    options: three("مضبوط", "يحتاج ضبط", "خارج الضبط / لا يعمل"),
  },
  {
    kw: ["belt", "chain", "sprocket", "pulley", "roller", "coupling"],
    nameAr: "حالة نقل الحركة",
    options: three("سليمة", "بِلى بسيط", "تلف/انحراف واضح"),
  },
  {
    kw: ["vent", "ventilation", "negative pressure", "efficiency"],
    nameAr: "كفاءة التهوية",
    options: three("كفاءة جيدة", "كفاءة ضعيفة", "لا يوجد سحب"),
  },
  {
    kw: ["support", "structure", "foundation", "anchor"],
    nameAr: "حالة الحوامل/الهيكل",
    options: three("ثابت وسليم", "اهتزاز/ارتخاء بسيط", "تلف أو ارتخاء واضح"),
  },
  {
    kw: ["filter", "cartridge", "bag "],
    nameAr: "حالة الفلتر",
    options: three("نظيف وسليم", "يحتاج تنظيف", "مسدود/تالف"),
  },
  {
    kw: ["contact", "deflector", "scraper", "blade", "wire", "rope", "counter weight"],
    nameAr: "حالة التركيب/الأداء",
    options: three("سليم ويؤدي وظيفته", "يحتاج ضبط بسيط", "تالف / لا يؤدي وظيفته"),
  },
  // broad catch-all: any remaining "check the condition of …" item
  {
    kw: ["condition", "condtion", "check the", "check "],
    nameAr: "الحالة العامة",
    options: three("سليم", "يحتاج متابعة", "غير سليم"),
  },
];

export function inferMeasurement(label: string): MeasurementSpec {
  const l = ` ${label.toLowerCase()} `;

  // numeric wins — a reading is more precise than a grade
  for (const rule of NUMERIC_RULES) {
    if (rule.kw.some((k) => l.includes(k))) {
      const spec: MeasurementSpec = { kind: "numeric", ...rule.spec };
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

  for (const rule of SCALE_RULES) {
    if (rule.kw.some((k) => l.includes(k))) {
      return { kind: "scale", nameAr: rule.nameAr, options: rule.options };
    }
  }

  return { kind: "visual" };
}

export function verdictFor(
  value: number | null,
  spec: MeasurementSpec
): Enums<"checklist_result"> | null {
  if (value == null || Number.isNaN(value)) return null;
  if (spec.okMax == null && spec.okMin == null) return null;
  if (spec.okMin != null && value < spec.okMin) return BAD;
  if (spec.okMax != null) {
    if (value <= spec.okMax) return OK;
    if (spec.warnMax != null && value <= spec.warnMax) return ATT;
    return BAD;
  }
  return OK;
}

export function rangeHint(spec: MeasurementSpec): string | null {
  if (spec.okMax != null) return `الطبيعي ≤ ${spec.okMax} ${spec.unit ?? ""}`.trim();
  if (spec.okMin != null) return `الطبيعي ≥ ${spec.okMin} ${spec.unit ?? ""}`.trim();
  return null;
}
