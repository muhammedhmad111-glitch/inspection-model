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
  TASK_STATUS_LABELS_AR,
} from "@/lib/constants";
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

  const [overdue, findings, history, actions, completedForProd] = await Promise.all([
    supabase
      .from("inspection_tasks")
      .select(
        `task_code, due_date, priority, status,
         inspection_activities ( activity_name ),
         equipment ( equipment_name, functional_location ),
         equipment_parts ( part_name ),
         profiles!assigned_user_id ( full_name )`
      )
      .eq("status", "Overdue")
      .order("due_date")
      .limit(1000),
    supabase
      .from("inspection_findings")
      .select(
        `finding_code, finding_title, severity, finding_type, status, created_at,
         equipment ( equipment_name, functional_location )`
      )
      .neq("status", "Closed")
      .in("severity", ["Critical", "High"])
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("inspection_tasks")
      .select(
        `completion_date, condition_rating,
         inspection_activities ( activity_name, inspection_category ),
         equipment ( equipment_name, functional_location ),
         profiles!completed_by ( full_name )`
      )
      .eq("status", "Completed")
      .order("completion_date", { ascending: false })
      .limit(1000),
    supabase
      .from("maintenance_actions")
      .select(
        `action_code, action_title, action_type, priority, responsible_department,
         target_date, status,
         inspection_findings ( equipment ( equipment_name ) )`
      )
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("inspection_tasks")
      .select(`completion_date, profiles!completed_by ( full_name )`)
      .eq("status", "Completed")
      .limit(5000),
  ]);

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

  const reports: ReportDef[] = [
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
      headers: ["الكود", "العنوان", "المعدة", "النوع", "الأولوية", "القسم", "المستهدف", "الحالة"],
      rows: (actions.data ?? []).map((a) => [
        a.action_code,
        a.action_title,
        one<{ equipment: Rel<{ equipment_name: string }> }>(a.inspection_findings)
          ? one<{ equipment_name: string }>(
              one<{ equipment: Rel<{ equipment_name: string }> }>(a.inspection_findings)!
                .equipment
            )?.equipment_name ?? ""
          : "",
        ACTION_TYPE_LABELS_AR[a.action_type as Enums<"action_type">],
        PRIORITY_LABELS_AR[a.priority as Enums<"priority_level">],
        a.responsible_department ?? "",
        a.target_date ?? "",
        ACTION_STATUS_LABELS_AR[a.status as Enums<"action_status">],
      ]),
    },
  ];

  return <ReportsClient reports={reports} />;
}
