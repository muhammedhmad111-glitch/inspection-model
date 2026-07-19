"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Gauge,
  ShieldCheck,
  Timer,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Donut, HBars, RingGauge, Sparkline, TrendLines, VBars } from "@/components/charts";
import type { Enums } from "@/lib/supabase/types";
import {
  ACTION_STATUS_LABELS_AR,
  CONDITION_LABELS_AR,
  PRIORITY_LABELS_AR,
  TASK_STATUS_LABELS_AR,
} from "@/lib/constants";

export type DashboardData = {
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

export type AnalyticsData = {
  reliability: {
    criticality_risk: { label: string; value: number }[];
    health: { healthy: number; attention: number; critical: number };
    top_problem_equipment: { label: string; value: number }[];
    poor_condition_trend: { month: string; value: number }[];
  };
  maintenance: {
    backlog_open: number;
    backlog_overdue: number;
    mttr_days: number;
    avg_open_age_days: number;
    by_status: { label: string; value: number }[];
    trend: { month: string; created: number; completed: number }[];
  };
  compliance: {
    schedule_compliance_pct: number;
    coverage_pct: number;
    by_area: { label: string; total: number; completed: number; overdue: number }[];
    by_inspector: { label: string; completed: number; on_time_pct: number }[];
  };
  overview_extra: {
    findings_trend: { month: string; raised: number; closed: number }[];
    completed_this_month: number;
    completed_prev_month: number;
    mttr_finding_days: number;
    avg_open_finding_age_days: number;
  };
};

const CONDITION_COLORS: Record<Enums<"equipment_condition">, string> = {
  Excellent: "#10b981",
  Good: "#22c55e",
  Fair: "#f59e0b",
  Poor: "#fb923c",
  Critical: "#ef4444",
};
const STATUS_COLORS: Record<Enums<"task_status">, string> = {
  Scheduled: "#94a3b8",
  Upcoming: "#6366f1",
  "In Progress": "#4f46e5",
  Completed: "#10b981",
  Overdue: "#ef4444",
  Delayed: "#f59e0b",
  Cancelled: "#cbd5e1",
  Skipped: "#fb923c",
};

const MONTH_NAMES_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const monthLabel = (ym: string) => MONTH_NAMES_AR[Number(ym.split("-")[1]) - 1] ?? ym;

const toneClass: Record<string, string> = {
  indigo: "bg-primary/10 text-primary",
  violet: "bg-brand-pink/15 text-brand-pink",
  red: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "indigo",
  spark,
  delta,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof toneClass;
  spark?: number[];
  delta?: number | null;
}) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`flex size-11 items-center justify-center rounded-2xl ${toneClass[tone]}`}>
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-3xl font-bold">{value}</div>
            {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
            {delta != null ? (
              <p
                className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                  delta >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(delta)} عن الشهر السابق
              </p>
            ) : null}
          </div>
          {spark && spark.length > 1 ? (
            <Sparkline data={spark} color="var(--primary)" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DashboardTabs({
  d,
  a,
}: {
  d: DashboardData;
  a: AnalyticsData;
}) {
  const [tab, setTab] = useState("overview");

  const headlinePills = [
    { label: "إجمالي المهام", value: d.headline.total_tasks },
    { label: "مفتوحة", value: d.headline.open },
    { label: "مكتملة", value: d.headline.completed },
    { label: "قيد التنفيذ", value: d.headline.in_progress },
  ];

  const trendMonths = a.overview_extra.findings_trend.map((m) => monthLabel(m.month));
  const completedSpark = d.monthly_trend.map((m) => m.completed);
  const completedDelta =
    a.overview_extra.completed_this_month - a.overview_extra.completed_prev_month;

  const statusSegments = (Object.keys(d.status_counts) as Enums<"task_status">[])
    .map((s) => ({ label: TASK_STATUS_LABELS_AR[s], value: d.status_counts[s] ?? 0, color: STATUS_COLORS[s] }))
    .filter((s) => s.value > 0);

  const conditionSegments = (Object.keys(d.condition_distribution) as Enums<"equipment_condition">[])
    .map((c) => ({ label: CONDITION_LABELS_AR[c], value: d.condition_distribution[c] ?? 0, color: CONDITION_COLORS[c] }))
    .filter((c) => c.value > 0);

  const trendBars = d.monthly_trend.map((m) => ({ label: monthLabel(m.month), value: m.completed }));
  const workloadBars = d.inspector_workload.map((w) => ({ label: w.name, value: w.open_count }));
  const equipmentBars = a.reliability.top_problem_equipment;
  const criticalityBars = a.reliability.criticality_risk.map((r) => ({
    label: PRIORITY_LABELS_AR[r.label as Enums<"priority_level">] ?? r.label,
    value: r.value,
  }));
  const conditionTrendBars = a.reliability.poor_condition_trend.map((m) => ({ label: monthLabel(m.month), value: m.value }));

  const health = a.reliability.health;
  const healthCards = [
    { label: "معدات سليمة", value: health.healthy, icon: ShieldCheck, tone: "green" as const },
    { label: "تحتاج متابعة", value: health.attention, icon: AlertTriangle, tone: "amber" as const },
    { label: "حالة حرجة", value: health.critical, icon: AlertTriangle, tone: "red" as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* hero */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-brand-purple to-brand-purple-strong p-7 text-white shadow-xl shadow-brand-navy/20">
        <p className="text-sm font-medium text-white/70">AMREYAH CEMENT · لوحة القيادة</p>
        <h1 className="mt-1 text-2xl font-bold">مؤشرات أداء الفحص والصيانة</h1>
        <div className="mt-5 flex flex-wrap gap-3">
          {headlinePills.map((p) => (
            <div key={p.label} className="rounded-2xl bg-white/10 px-4 py-2 backdrop-blur">
              <div className="text-2xl font-bold">{p.value}</div>
              <div className="text-xs text-white/70">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl">نظرة عامة</TabsTrigger>
          <TabsTrigger value="reliability" className="rounded-xl">موثوقية المعدات</TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-xl">أداء الصيانة</TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-xl">الامتثال والتغطية</TabsTrigger>
        </TabsList>

        {/* ---------- OVERVIEW ---------- */}
        <TabsContent value="overview" className="mt-5 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="المهام المتأخرة" value={d.headline.overdue} sub={`${d.kpis.overdue_rate}% من المفتوحة`} icon={ClipboardList} tone="red" />
            <StatCard label="الملاحظات الحرجة" value={d.findings.critical_open} sub={`${d.findings.open} ملاحظة مفتوحة`} icon={AlertTriangle} tone="violet" />
            <StatCard label="إجراءات صيانة مفتوحة" value={d.actions.open} sub={`${d.actions.overdue} متأخرة`} icon={Wrench} tone="indigo" />
            <StatCard label="الفحوصات المكتملة (الشهر)" value={a.overview_extra.completed_this_month} icon={CheckCircle2} tone="green" spark={completedSpark} delta={completedDelta} />
          </div>

          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <StatCard label="الامتثال للجدولة" value={`${a.compliance.schedule_compliance_pct}%`} icon={CalendarCheck} tone="indigo" />
            <StatCard label="تغطية الفحص (90 يوم)" value={`${a.compliance.coverage_pct}%`} icon={Gauge} tone="green" />
            <StatCard label="متوسط إغلاق الملاحظة" value={`${a.overview_extra.mttr_finding_days} يوم`} icon={Timer} tone="amber" />
            <StatCard label="عمر الملاحظات المفتوحة" value={`${a.overview_extra.avg_open_finding_age_days} يوم`} icon={Clock} tone="violet" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <SectionCard title="الملاحظات: مُسجَّلة مقابل مُغلَقة (6 أشهر)">
              <TrendLines
                labels={trendMonths}
                series={[
                  { name: "مُسجَّلة", color: "#fb7185", data: a.overview_extra.findings_trend.map((m) => m.raised) },
                  { name: "مُغلَقة", color: "#10b981", data: a.overview_extra.findings_trend.map((m) => m.closed) },
                ]}
              />
            </SectionCard>
            <SectionCard title="توزيع حالات المهام">
              {statusSegments.length ? <Donut segments={statusSegments} /> : <Empty />}
            </SectionCard>
            <SectionCard title="اتجاه الفحوصات المكتملة">
              <VBars data={trendBars} color="var(--primary)" />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <SectionCard title="نسبة الامتثال">
              <div className="flex flex-col items-center gap-4">
                <RingGauge value={d.kpis.compliance_pct} label="امتثال" color="var(--primary)" />
                <div className="grid w-full grid-cols-2 gap-3 text-center">
                  <MiniStat value={`${d.kpis.completion_rate}%`} label="معدل الإنجاز" />
                  <MiniStat value={`${d.kpis.overdue_rate}%`} label="معدل التأخر" />
                </div>
              </div>
            </SectionCard>
            <SectionCard title="حِمل المفتشين (مهام مفتوحة)">
              <HBars data={workloadBars} color="var(--primary)" emptyText="لا توجد مهام معيّنة" />
            </SectionCard>
          </div>
        </TabsContent>

        {/* ---------- RELIABILITY ---------- */}
        <TabsContent value="reliability" className="mt-5 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {healthCards.map((h) => (
              <StatCard key={h.label} label={h.label} value={h.value} icon={h.icon} tone={h.tone} sub="من إجمالي المعدات النشطة" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <SectionCard title="المخاطر حسب أهمية المعدة (ملاحظات مفتوحة)">
              <HBars data={criticalityBars} color="#ef4444" emptyText="لا توجد ملاحظات مفتوحة" />
            </SectionCard>
            <SectionCard title="توزيع حالة المعدات المفحوصة">
              {conditionSegments.length ? <Donut segments={conditionSegments} /> : <Empty text="لا توجد فحوصات مكتملة بعد" />}
            </SectionCard>
            <SectionCard title="أكثر المعدات ملاحظات">
              <HBars data={equipmentBars} color="var(--brand-pink)" emptyText="لا توجد ملاحظات" />
            </SectionCard>
            <SectionCard title="اتجاه الحالات الضعيفة/الحرجة (6 أشهر)">
              <VBars data={conditionTrendBars} color="#fb923c" />
            </SectionCard>
          </div>
        </TabsContent>

        {/* ---------- MAINTENANCE ---------- */}
        <TabsContent value="maintenance" className="mt-5 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <StatCard label="مخزون العمل المفتوح" value={a.maintenance.backlog_open} icon={ClipboardList} tone="indigo" />
            <StatCard label="إجراءات متأخرة" value={a.maintenance.backlog_overdue} icon={AlertTriangle} tone="red" />
            <StatCard label="متوسط زمن الإصلاح (MTTR)" value={`${a.maintenance.mttr_days} يوم`} icon={Timer} tone="amber" />
            <StatCard label="عمر الإجراءات المفتوحة" value={`${a.maintenance.avg_open_age_days} يوم`} icon={Clock} tone="violet" />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <SectionCard title="معدل إغلاق الإجراءات">
              <div className="flex flex-col items-center gap-4">
                <RingGauge value={d.kpis.action_closure_rate} label="إغلاق" color="var(--primary)" />
                <div className="grid w-full grid-cols-2 gap-3 text-center">
                  <MiniStat value={a.maintenance.backlog_open} label="مفتوحة" />
                  <MiniStat value={a.maintenance.backlog_overdue} label="متأخرة" />
                </div>
              </div>
            </SectionCard>
            <SectionCard title="الإجراءات حسب الحالة">
              <HBars
                data={a.maintenance.by_status.map((s) => ({
                  label: ACTION_STATUS_LABELS_AR[s.label as Enums<"action_status">] ?? s.label,
                  value: s.value,
                }))}
                color="var(--primary)"
                emptyText="لا توجد إجراءات"
              />
            </SectionCard>
            <SectionCard title="الإجراءات: مُنشأة مقابل مُنجزة (6 أشهر)">
              <TrendLines
                labels={a.maintenance.trend.map((m) => monthLabel(m.month))}
                series={[
                  { name: "مُنشأة", color: "#6366f1", data: a.maintenance.trend.map((m) => m.created) },
                  { name: "مُنجزة", color: "#10b981", data: a.maintenance.trend.map((m) => m.completed) },
                ]}
              />
            </SectionCard>
          </div>
        </TabsContent>

        {/* ---------- COMPLIANCE ---------- */}
        <TabsContent value="compliance" className="mt-5 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <SectionCard title="الامتثال للجدولة">
              <div className="flex flex-col items-center gap-2">
                <RingGauge value={a.compliance.schedule_compliance_pct} label="في الموعد" color="var(--primary)" />
                <p className="text-xs text-muted-foreground">نسبة الفحوصات المكتملة في موعدها</p>
              </div>
            </SectionCard>
            <SectionCard title="تغطية الفحص (آخر 90 يوم)">
              <div className="flex flex-col items-center gap-2">
                <RingGauge value={a.compliance.coverage_pct} label="تغطية" color="#10b981" />
                <p className="text-xs text-muted-foreground">نسبة المعدات التي تم فحصها</p>
              </div>
            </SectionCard>
            <SectionCard title="أداء المفتشين">
              {a.compliance.by_inspector.length ? (
                <ul className="flex flex-col gap-3">
                  {a.compliance.by_inspector.map((ins) => (
                    <li key={ins.label} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{ins.label}</span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="text-muted-foreground">{ins.completed} مكتملة</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {ins.on_time_pct}% في الموعد
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty text="لا يوجد إنجاز بعد" />
              )}
            </SectionCard>
          </div>

          <SectionCard title="الإنجاز حسب المنطقة">
            {a.compliance.by_area.length ? (
              <div className="flex flex-col gap-4">
                {a.compliance.by_area.map((ar) => {
                  const pct = ar.total ? Math.round((ar.completed / ar.total) * 100) : 0;
                  return (
                    <div key={ar.label} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{ar.label}</span>
                        <span className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{ar.completed}/{ar.total} مكتملة</span>
                          <span className="text-red-600">{ar.overdue} متأخرة</span>
                          <span className="font-semibold text-primary">{pct}%</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty />
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-muted p-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Empty({ text = "لا توجد بيانات" }: { text?: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}
