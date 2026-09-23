import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import {
  ACTION_STATUS_LABELS_AR,
  ACTION_TYPE_LABELS_AR,
  CATEGORY_LABELS_AR,
  CONDITION_LABELS_AR,
  FINDING_STATUS_LABELS_AR,
  FINDING_TYPE_LABELS_AR,
  PRIORITY_LABELS_AR,
} from "@/lib/constants";
import { LINE_LABELS_AR } from "@/lib/production-line";
import { getActiveLine } from "@/lib/production-line-server";
import { VIA_EQUIPMENT_LINE_PATH, VIA_FINDING_LINE_PATH } from "@/lib/line-filter";
import { ReportsClient, type ReportDef } from "./reports-client";

type Rel<T> = T | T[] | null;
function one<T>(v: Rel<T>): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function eqLabel(
  v: Rel<{ equipment_name: string; functional_location?: string | null }>
): string {
  const e = one(v);
  if (!e) return "";
  return e.functional_location
    ? `${e.equipment_name} (${e.functional_location})`
    : e.equipment_name;
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const line = await getActiveLine();

  // Every report here is one line's report. Pooling both lines into a single
  // "overdue inspections" table would hand a manager a number for a plant that
  // nobody is accountable for.
  const [
    overdue,
    findings,
    history,
    ownActions,
    findingActions,
    completedForProd,
  ] = await Promise.all([
    supabase
      .from("inspection_tasks")
      .select(
        `task_code, due_date, priority, status,
         inspection_activities ( activity_name ),
         equipment!inner (
           equipment_name, functional_location,
           sections!inner ( areas!inner ( production_line ) )
         ),
         equipment_parts ( part_name ),
         profiles!assigned_user_id ( full_name )`
      )
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .eq("status", "Overdue")
      .order("due_date")
      .limit(1000),
    supabase
      .from("inspection_findings")
      .select(
        `finding_code, finding_title, severity, finding_type, status, created_at,
         equipment!inner (
           equipment_name, functional_location,
           sections!inner ( areas!inner ( production_line ) )
         )`
      )
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .neq("status", "Closed")
      .in("severity", ["Critical", "High"])
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("inspection_tasks")
      .select(
        `completion_date, condition_rating,
         inspection_activities ( activity_name, inspection_category ),
         equipment!inner (
           equipment_name, functional_location,
           sections!inner ( areas!inner ( production_line ) )
         ),
         profiles!completed_by ( full_name )`
      )
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .eq("status", "Completed")
      .order("completion_date", { ascending: false })
      .limit(1000),
    // An action knows its line from the machine it names, or — when it names
    // none — from the finding it was raised off. Asking only through the finding
    // would leave directly-raised work out of the maintenance report entirely,
    // so both routes are asked for and merged below.
    supabase
      .from("maintenance_actions")
      .select(
        `action_code, action_title, action_type, priority, responsible_department,
         target_date, status, sap_work_order, created_at,
         equipment!inner (
           equipment_name,
           sections!inner ( areas!inner ( production_line ) )
         )`
      )
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("maintenance_actions")
      .select(
        `action_code, action_title, action_type, priority, responsible_department,
         target_date, status, sap_work_order, created_at,
         inspection_findings!inner (
           equipment!inner (
             equipment_name,
             sections!inner ( areas!inner ( production_line ) )
           )
         )`
      )
      .is("equipment_id", null)
      .eq(VIA_FINDING_LINE_PATH, line)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("inspection_tasks")
      .select(
        `completion_date, profiles!completed_by ( full_name ),
         equipment!inner ( sections!inner ( areas!inner ( production_line ) ) )`
      )
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .eq("status", "Completed")
      .limit(5000),
  ]);

  // The two action queries are disjoint — the second only takes rows with no
  // equipment of their own — so merging cannot repeat one. Each is flattened to
  // the same shape first, since the machine sits in a different place in each.
  const actions = [
    ...(ownActions.data ?? []).map((a) => ({
      ...a,
      equipment_name: one<{ equipment_name: string }>(a.equipment)?.equipment_name ?? "",
    })),
    ...(findingActions.data ?? []).map((a) => ({
      ...a,
      equipment_name:
        one<{ equipment_name: string }>(
          one<{ equipment: Rel<{ equipment_name: string }> }>(a.inspection_findings)
            ?.equipment ?? null
        )?.equipment_name ?? "",
    })),
  ]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 1000);

  // inspector productivity aggregation
  const prodMap = new Map<string, { count: number; last: string }>();
  for (const r of completedForProd.data ?? []) {
    const name = one<{ full_name: string }>(r.profiles)?.full_name ?? "غير معروف";
    const cur = prodMap.get(name) ?? { count: 0, last: "" };
    cur.count += 1;
    const d = (r.completion_date ?? "").slice(0, 10);
    if (d > cur.last) cur.last = d;
    prodMap.set(name, cur);
  }

  const baseReports: ReportDef[] = [
    {
      id: "overdue",
      title: "تقرير الفحوصات المتأخرة",
      description: "المهام التي تجاوزت تاريخ استحقاقها ولم تُنفّذ",
      headers: ["كود المهمة", "المعدة", "الجزء", "النشاط", "تاريخ الاستحقاق", "الأولوية", "المفتش"],
      rows: (overdue.data ?? []).map((t) => [
        t.task_code,
        eqLabel(t.equipment),
        one<{ part_name: string }>(t.equipment_parts)?.part_name ?? "",
        one<{ activity_name: string }>(t.inspection_activities)?.activity_name ?? "",
        t.due_date,
        PRIORITY_LABELS_AR[t.priority as Enums<"priority_level">],
        one<{ full_name: string }>(t.profiles)?.full_name ?? "غير معيّن",
      ]),
    },
    {
      id: "critical-findings",
      title: "تقرير الملاحظات الحرجة",
      description: "الملاحظات المفتوحة ذات الخطورة العالية أو الحرجة",
      headers: ["الكود", "العنوان", "المعدة", "الخطورة", "النوع", "الحالة", "التاريخ"],
      rows: (findings.data ?? []).map((f) => [
        f.finding_code,
        f.finding_title,
        eqLabel(f.equipment),
        PRIORITY_LABELS_AR[f.severity as Enums<"priority_level">],
        FINDING_TYPE_LABELS_AR[f.finding_type as Enums<"finding_type">],
        FINDING_STATUS_LABELS_AR[f.status as Enums<"finding_status">],
        (f.created_at ?? "").slice(0, 10),
      ]),
    },
    {
      id: "equipment-history",
      title: "سجل فحص المعدات",
      description: "الفحوصات المكتملة مع حالة المعدة والمنفّذ",
      headers: ["المعدة", "النشاط", "الفئة", "تاريخ الإكمال", "حالة المعدة", "المنفّذ"],
      rows: (history.data ?? []).map((t) => [
        eqLabel(t.equipment),
        one<{ activity_name: string }>(t.inspection_activities)?.activity_name ?? "",
        (() => {
          const a = one<{ inspection_category: Enums<"inspection_category"> }>(
            t.inspection_activities
          );
          return a ? CATEGORY_LABELS_AR[a.inspection_category] : "";
        })(),
        (t.completion_date ?? "").slice(0, 10),
        t.condition_rating
          ? CONDITION_LABELS_AR[t.condition_rating as Enums<"equipment_condition">]
          : "",
        one<{ full_name: string }>(t.profiles)?.full_name ?? "",
      ]),
    },
    {
      id: "inspector-productivity",
      title: "تقرير إنتاجية المفتشين",
      description: "عدد الفحوصات المكتملة لكل مفتش",
      headers: ["المفتش", "عدد الفحوصات المكتملة", "آخر فحص"],
      rows: [...prodMap.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, v]) => [name, String(v.count), v.last]),
    },
    {
      id: "maintenance-actions",
      title: "تقرير إجراءات الصيانة",
      description: "إجراءات الصيانة الناتجة عن الملاحظات",
      headers: [
        "الكود",
        "أمر شغل SAP",
        "العنوان",
        "المعدة",
        "النوع",
        "الأولوية",
        "القسم",
        "المستهدف",
        "الحالة",
      ],
      rows: actions.map((a) => [
        a.action_code,
        a.sap_work_order ?? "",
        a.action_title,
        a.equipment_name,
        ACTION_TYPE_LABELS_AR[a.action_type as Enums<"action_type">],
        PRIORITY_LABELS_AR[a.priority as Enums<"priority_level">],
        a.responsible_department ?? "",
        a.target_date ?? "",
        ACTION_STATUS_LABELS_AR[a.status as Enums<"action_status">],
      ]),
    },
  ];

  // The line goes in the title, not just on the screen. These get exported to PDF
  // and forwarded on, and a detached table of overdue inspections that does not
  // say which line it is for is worse than no table.
  const reports: ReportDef[] = baseReports.map((r) => ({
    ...r,
    title: `${r.title} — ${LINE_LABELS_AR[line]}`,
  }));

  return <ReportsClient reports={reports} />;
}
