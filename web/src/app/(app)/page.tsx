import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Donut, HBars, RingGauge, VBars } from "@/components/charts";
import type { Enums } from "@/lib/supabase/types";
import {
  CONDITION_LABELS_AR,
  FINDING_STATUS_LABELS_AR,
  PRIORITY_LABELS_AR,
  TASK_STATUS_LABELS_AR,
} from "@/lib/constants";

type DashboardData = {
  headline: {
    total_tasks: number;
    completed: number;
    overdue: number;
    in_progress: number;
    upcoming: number;
    scheduled: number;
    open: number;
  };
  kpis: {
    compliance_pct: number;
    completion_rate: number;
    overdue_rate: number;
    action_closure_rate: number;
  };
  status_counts: Partial<Record<Enums<"task_status">, number>>;
  findings: {
    total: number;
    open: number;
    critical_open: number;
    by_severity: Partial<Record<Enums<"priority_level">, number>>;
  };
  actions: { total: number; open: number; overdue: number };
  inspector_workload: { name: string; open_count: number }[];
  top_equipment_findings: { name: string; count: number }[];
  monthly_trend: { month: string; completed: number; generated: number }[];
  condition_distribution: Partial<Record<Enums<"equipment_condition">, number>>;
};

const STATUS_COLORS: Record<Enums<"task_status">, string> = {
  Scheduled: "#94a3b8",
  Upcoming: "#3b82f6",
  "In Progress": "#7c3aed",
  Completed: "#10b981",
  Overdue: "#ef4444",
  Delayed: "#f59e0b",
  Cancelled: "#cbd5e1",
  Skipped: "#fb923c",
};

const SEVERITY_COLORS: Record<Enums<"priority_level">, string> = {
  Low: "#94a3b8",
  Medium: "#3b82f6",
  High: "#f59e0b",
  Critical: "#ef4444",
};

const CONDITION_COLORS: Record<Enums<"equipment_condition">, string> = {
  Excellent: "#10b981",
  Good: "#22c55e",
  Fair: "#f59e0b",
  Poor: "#fb923c",
  Critical: "#ef4444",
};

const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function monthLabel(ym: string) {
  const m = Number(ym.split("-")[1]);
  return MONTH_NAMES_AR[m - 1] ?? ym;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_dashboard_data");
  const d = data as unknown as DashboardData;

  const headlinePills = [
    { label: "إجمالي المهام", value: d.headline.total_tasks },
    { label: "مفتوحة", value: d.headline.open },
    { label: "مكتملة", value: d.headline.completed },
    { label: "قيد التنفيذ", value: d.headline.in_progress },
  ];

  const kpiTiles = [
    {
      label: "المهام المتأخرة",
      value: d.headline.overdue,
      sub: `${d.kpis.overdue_rate}% من المفتوحة`,
      icon: ClipboardList,
      tone: "red",
    },
    {
      label: "الملاحظات الحرجة",
      value: d.findings.critical_open,
      sub: `${d.findings.open} ملاحظة مفتوحة`,
      icon: AlertTriangle,
      tone: "pink",
    },
    {
      label: "إجراءات صيانة مفتوحة",
      value: d.actions.open,
      sub: `${d.actions.overdue} متأخرة`,
      icon: Wrench,
      tone: "purple",
    },
    {
      label: "معدل الإنجاز",
      value: `${d.kpis.completion_rate}%`,
      sub: `${d.headline.completed} من ${d.headline.total_tasks}`,
      icon: CheckCircle2,
      tone: "green",
    },
  ] as const;

  const toneClass: Record<string, string> = {
    purple: "bg-primary/10 text-primary",
    pink: "bg-brand-pink/15 text-brand-pink",
    red: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  };

  const statusSegments = (Object.keys(d.status_counts) as Enums<"task_status">[])
    .map((s) => ({
      label: TASK_STATUS_LABELS_AR[s],
      value: d.status_counts[s] ?? 0,
      color: STATUS_COLORS[s],
    }))
    .filter((s) => s.value > 0);

  const severityBars = (["Critical", "High", "Medium", "Low"] as const)
    .map((s) => ({ label: PRIORITY_LABELS_AR[s], value: d.findings.by_severity[s] ?? 0 }))
    .filter((s) => s.value > 0);

  const conditionSegments = (Object.keys(d.condition_distribution) as Enums<"equipment_condition">[])
    .map((c) => ({
      label: CONDITION_LABELS_AR[c],
      value: d.condition_distribution[c] ?? 0,
      color: CONDITION_COLORS[c],
    }))
    .filter((c) => c.value > 0);

  const trendBars = d.monthly_trend.map((m) => ({
    label: monthLabel(m.month),
    value: m.completed,
  }));

  const workloadBars = d.inspector_workload.map((w) => ({
    label: w.name,
    value: w.open_count,
  }));

  const equipmentBars = d.top_equipment_findings.map((e) => ({
    label: e.name,
    value: e.count,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* hero */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-brand-purple to-brand-purple-strong p-7 text-white shadow-xl shadow-primary/20">
        <p className="text-sm font-medium text-white/70">CPIIS · لوحة القيادة</p>
        <h1 className="mt-1 text-2xl font-bold">مؤشرات أداء الفحص والصيانة</h1>
        <div className="mt-5 flex flex-wrap gap-3">
          {headlinePills.map((p) => (
            <div
              key={p.label}
              className="rounded-2xl bg-white/10 px-4 py-2 backdrop-blur"
            >
              <div className="text-2xl font-bold">{p.value}</div>
              <div className="text-xs text-white/70">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiTiles.map((t) => (
          <Card key={t.label} className="rounded-3xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.label}
              </CardTitle>
              <div className={`flex size-11 items-center justify-center rounded-2xl ${toneClass[t.tone]}`}>
                <t.icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{t.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{t.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* compliance + status + trend */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">نسبة الامتثال</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <RingGauge value={d.kpis.compliance_pct} label="امتثال" />
            <div className="grid w-full grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-muted p-3">
                <div className="text-lg font-bold">{d.kpis.completion_rate}%</div>
                <div className="text-xs text-muted-foreground">معدل الإنجاز</div>
              </div>
              <div className="rounded-2xl bg-muted p-3">
                <div className="text-lg font-bold">{d.kpis.overdue_rate}%</div>
                <div className="text-xs text-muted-foreground">معدل التأخر</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">توزيع حالات المهام</CardTitle>
          </CardHeader>
          <CardContent>
            {statusSegments.length ? (
              <Donut segments={statusSegments} />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">اتجاه الفحوصات المكتملة (٦ أشهر)</CardTitle>
          </CardHeader>
          <CardContent>
            <VBars data={trendBars} color="var(--brand-pink)" />
          </CardContent>
        </Card>
      </div>

      {/* findings + workload + equipment */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">الملاحظات حسب الخطورة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {severityBars.length ? (
                severityBars.map((s) => (
                  <div key={s.label} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-semibold">{s.value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.value / Math.max(1, ...severityBars.map((x) => x.value))) * 100}%`,
                          backgroundColor:
                            SEVERITY_COLORS[
                              (["Critical", "High", "Medium", "Low"] as const).find(
                                (k) => PRIORITY_LABELS_AR[k] === s.label
                              ) ?? "Medium"
                            ],
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  لا توجد ملاحظات
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">حِمل المفتشين (مهام مفتوحة)</CardTitle>
          </CardHeader>
          <CardContent>
            <HBars data={workloadBars} emptyText="لا توجد مهام معيّنة" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">أكثر المعدات ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <HBars data={equipmentBars} color="var(--brand-pink)" emptyText="لا توجد ملاحظات" />
          </CardContent>
        </Card>
      </div>

      {/* condition + actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">توزيع حالة المعدات المفحوصة</CardTitle>
          </CardHeader>
          <CardContent>
            {conditionSegments.length ? (
              <Donut segments={conditionSegments} />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد فحوصات مكتملة بعد
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">إغلاق إجراءات الصيانة</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <RingGauge
              value={d.kpis.action_closure_rate}
              color="var(--brand-pink)"
              label="إغلاق"
            />
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-2xl font-bold">{d.actions.total}</div>
                <div className="text-xs text-muted-foreground">إجمالي الإجراءات</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{d.actions.open}</div>
                <div className="text-xs text-muted-foreground">
                  مفتوحة ({d.actions.overdue} متأخرة)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
