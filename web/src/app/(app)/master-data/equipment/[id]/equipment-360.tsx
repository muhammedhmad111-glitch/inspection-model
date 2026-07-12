import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import {
  CATEGORY_LABELS_AR,
  CONDITION_BADGE_CLASS,
  CONDITION_LABELS_AR,
  FINDING_STATUS_BADGE_CLASS,
  FINDING_STATUS_LABELS_AR,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
  ACTION_STATUS_BADGE_CLASS,
  ACTION_STATUS_LABELS_AR,
  TASK_STATUS_BADGE_CLASS,
  TASK_STATUS_LABELS_AR,
} from "@/lib/constants";

const CONDITION_DOT: Record<Enums<"equipment_condition">, string> = {
  Excellent: "#10b981",
  Good: "#22c55e",
  Fair: "#f59e0b",
  Poor: "#fb923c",
  Critical: "#ef4444",
};

type TaskLite = {
  inspection_task_id: string;
  status: Enums<"task_status">;
  due_date: string;
  scheduled_date: string;
  completion_date: string | null;
  condition_rating: Enums<"equipment_condition"> | null;
  inspection_activities: {
    activity_name: string;
    inspection_category: Enums<"inspection_category">;
  } | null;
};

type FindingLite = {
  finding_id: string;
  finding_code: string;
  finding_title: string;
  severity: Enums<"priority_level">;
  status: Enums<"finding_status">;
  created_at: string;
  maintenance_actions: {
    action_id: string;
    action_title: string;
    status: Enums<"action_status">;
    target_date: string | null;
  }[];
};

export async function Equipment360({ equipmentId }: { equipmentId: string }) {
  const supabase = await createClient();

  const [{ data: tasksRaw }, { data: findingsRaw }] = await Promise.all([
    supabase
      .from("inspection_tasks")
      .select(
        `inspection_task_id, status, due_date, scheduled_date, completion_date,
         condition_rating, inspection_activities ( activity_name, inspection_category )`
      )
      .eq("equipment_id", equipmentId)
      .order("due_date"),
    supabase
      .from("inspection_findings")
      .select(
        `finding_id, finding_code, finding_title, severity, status, created_at,
         maintenance_actions ( action_id, action_title, status, target_date )`
      )
      .eq("equipment_id", equipmentId)
      .order("created_at", { ascending: false }),
  ]);

  const tasks = (tasksRaw ?? []) as TaskLite[];
  const findings = (findingsRaw ?? []) as FindingLite[];

  const openStatuses: Enums<"task_status">[] = [
    "Scheduled",
    "Upcoming",
    "In Progress",
    "Overdue",
  ];
  const upcoming = tasks.filter((t) => ["Scheduled", "Upcoming"].includes(t.status)).length;
  const overdue = tasks.filter((t) => t.status === "Overdue").length;
  const completed = tasks.filter((t) => t.status === "Completed");

  const nextDue = tasks
    .filter((t) => openStatuses.includes(t.status))
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  const completedSorted = [...completed].sort((a, b) =>
    (a.completion_date ?? "").localeCompare(b.completion_date ?? "")
  );
  const lastInspection = completedSorted[completedSorted.length - 1];

  const conditionTrend = completedSorted
    .filter((t) => t.condition_rating)
    .slice(-10);

  const openFindings = findings.filter((f) => f.status !== "Closed");
  const openActions = findings
    .flatMap((f) => f.maintenance_actions ?? [])
    .filter((a) => !["Completed", "Verified", "Cancelled"].includes(a.status));

  const timeline = [...tasks]
    .filter((t) => t.completion_date || t.status === "In Progress")
    .sort((a, b) =>
      (b.completion_date ?? b.scheduled_date).localeCompare(
        a.completion_date ?? a.scheduled_date
      )
    )
    .slice(0, 8);

  const summary = [
    { label: "قادمة", value: upcoming, icon: CalendarClock, tone: "purple" },
    { label: "متأخرة", value: overdue, icon: Clock, tone: "red" },
    { label: "مكتملة", value: completed.length, icon: CheckCircle2, tone: "green" },
    { label: "ملاحظات مفتوحة", value: openFindings.length, icon: AlertTriangle, tone: "pink" },
  ] as const;

  const toneClass: Record<string, string> = {
    purple: "bg-primary/10 text-primary",
    pink: "bg-brand-pink/15 text-brand-pink",
    red: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold">نظرة 360° على الفحص</h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="rounded-3xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div className={`flex size-10 items-center justify-center rounded-2xl ${toneClass[s.tone]}`}>
                <s.icon className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* next / last + condition trend */}
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">الحالة الزمنية</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الفحص القادم</span>
              {nextDue ? (
                <span className="flex items-center gap-2">
                  <span className="font-mono" dir="ltr">{nextDue.due_date}</span>
                  <Badge className={TASK_STATUS_BADGE_CLASS[nextDue.status]}>
                    {TASK_STATUS_LABELS_AR[nextDue.status]}
                  </Badge>
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">آخر فحص مكتمل</span>
              {lastInspection ? (
                <span className="flex items-center gap-2">
                  <span className="font-mono" dir="ltr">
                    {lastInspection.completion_date?.slice(0, 10)}
                  </span>
                  {lastInspection.condition_rating ? (
                    <Badge className={CONDITION_BADGE_CLASS[lastInspection.condition_rating]}>
                      {CONDITION_LABELS_AR[lastInspection.condition_rating]}
                    </Badge>
                  ) : null}
                </span>
              ) : (
                <span className="text-muted-foreground">لم يتم بعد</span>
              )}
            </div>
            <div>
              <p className="mb-2 text-muted-foreground">اتجاه الحالة</p>
              {conditionTrend.length ? (
                <div className="flex items-center gap-1.5">
                  {conditionTrend.map((t) => (
                    <span
                      key={t.inspection_task_id}
                      className="size-5 rounded-full"
                      style={{ backgroundColor: CONDITION_DOT[t.condition_rating!] }}
                      title={`${t.completion_date?.slice(0, 10)} · ${CONDITION_LABELS_AR[t.condition_rating!]}`}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">لا يوجد تاريخ حالة بعد</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* timeline */}
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">آخر أحداث الفحص</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length ? (
              <ol className="flex flex-col gap-3">
                {timeline.map((t) => (
                  <li key={t.inspection_task_id} className="flex items-start gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">
                        {t.inspection_activities?.activity_name ?? "فحص"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.inspection_activities
                          ? CATEGORY_LABELS_AR[t.inspection_activities.inspection_category]
                          : ""}
                        {" · "}
                        <span className="font-mono" dir="ltr">
                          {(t.completion_date ?? t.scheduled_date).slice(0, 10)}
                        </span>
                      </span>
                    </div>
                    <Badge className={TASK_STATUS_BADGE_CLASS[t.status]}>
                      {TASK_STATUS_LABELS_AR[t.status]}
                    </Badge>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد أحداث فحص بعد
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* active findings */}
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">الملاحظات النشطة</CardTitle>
            <Link href="/findings" className="text-xs text-primary hover:underline">
              الكل
            </Link>
          </CardHeader>
          <CardContent>
            {openFindings.length ? (
              <ul className="flex flex-col gap-3">
                {openFindings.slice(0, 6).map((f) => (
                  <li key={f.finding_id} className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{f.finding_title}</span>
                      <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                        {f.finding_code}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Badge className={PRIORITY_BADGE_CLASS[f.severity]}>
                        {PRIORITY_LABELS_AR[f.severity]}
                      </Badge>
                      <Badge className={FINDING_STATUS_BADGE_CLASS[f.status]}>
                        {FINDING_STATUS_LABELS_AR[f.status]}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد ملاحظات نشطة
              </p>
            )}
          </CardContent>
        </Card>

        {/* open actions */}
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">إجراءات الصيانة المفتوحة</CardTitle>
            <Link href="/actions" className="text-xs text-primary hover:underline">
              الكل
            </Link>
          </CardHeader>
          <CardContent>
            {openActions.length ? (
              <ul className="flex flex-col gap-3">
                {openActions.slice(0, 6).map((a) => (
                  <li key={a.action_id} className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{a.action_title}</span>
                      {a.target_date ? (
                        <span className="text-xs text-muted-foreground">
                          مستهدف: <span className="font-mono" dir="ltr">{a.target_date}</span>
                        </span>
                      ) : null}
                    </div>
                    <Badge className={ACTION_STATUS_BADGE_CLASS[a.status]}>
                      {ACTION_STATUS_LABELS_AR[a.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد إجراءات مفتوحة
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
