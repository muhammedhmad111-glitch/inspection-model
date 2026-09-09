"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, Loader2, PowerOff, Timer, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { PmReportSend } from "@/components/pm-report-send";
import {
  daysWaiting,
  pmEquipmentLabel,
  PM_REASON_LABELS_AR,
  type PmEquipment,
  type PmReportData,
} from "@/lib/pm-report";
import {
  ACTION_TYPE_LABELS_AR,
  CHECKLIST_RESULT_LABELS_AR,
  CONDITION_LABELS_AR,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
} from "@/lib/constants";
import type { Enums } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

function iso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  // Built from local parts on purpose: toISOString() shifts to UTC and can hand
  // back the previous day for anyone east of Greenwich.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Sunday that opens the week, `offset` weeks back from today. */
function weekStartISO(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  return iso(d);
}

/** The machine, always the same way: name, the number on it, then the code. */
function Where({ row }: { row: PmEquipment }) {
  return (
    <span className="text-sm text-muted-foreground" dir="auto">
      <span className="font-mono text-xs" dir="ltr">
        {pmEquipmentLabel(row)}
      </span>
      {row.part && row.part !== row.equipment ? ` · ${row.part}` : null}
      {row.section ? <span className="opacity-70">{` — ${row.section}`}</span> : null}
    </span>
  );
}

function Block({
  icon: Icon,
  title,
  subtitle,
  count,
  children,
}: {
  icon: typeof Wrench;
  title: string;
  subtitle: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {count}
          </Badge>
        </div>
        {count === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">لا يوجد</p>
        ) : (
          <div className="flex flex-col divide-y">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function PmClient({
  initialData,
  senderName,
}: {
  initialData: PmReportData;
  senderName: string;
}) {
  const [data, setData] = useState<PmReportData>(initialData);
  const [offset, setOffset] = useState("0");
  const [loading, setLoading] = useState(false);

  async function loadWeek(next: string) {
    setOffset(next);
    setLoading(true);
    const supabase = createClient();
    const { data: week, error } = await supabase.rpc("get_pm_report_data", {
      p_week_start: weekStartISO(Number(next)),
    });
    setLoading(false);
    if (error || !week) {
      toast.error("تعذّر تحميل بيانات الأسبوع");
      return;
    }
    setData(week as unknown as PmReportData);
  }

  // The shutdown block is the reason this page exists, so the two sources are
  // counted apart: planned work vs. work the running machine blocked.
  const shutdownSplit = useMemo(() => {
    let planned = 0;
    for (const i of data.shutdownItems) if (i.reason === "planned") planned++;
    return { planned, blocked: data.shutdownItems.length - planned };
  }, [data.shutdownItems]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الصيانة الوقائية الأسبوعية (PM)</h1>
          <p className="text-sm text-muted-foreground">
            كل اللي اتعمل في الوقفة: الفحوصات، إجراءات الصيانة، والبنود اللي محتاجة
            المعدة تكون واقفة
          </p>
        </div>
        <PmReportSend data={data} senderName={senderName} />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label>الأسبوع</Label>
          <Select value={offset} onValueChange={loadWeek} disabled={loading}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">هذا الأسبوع</SelectItem>
              <SelectItem value="-1">الأسبوع الماضي</SelectItem>
              <SelectItem value="-2">قبل أسبوعين</SelectItem>
              <SelectItem value="-3">قبل ٣ أسابيع</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="pb-2 font-mono text-xs text-muted-foreground" dir="ltr">
          {data.weekStart} → {data.weekEnd}
        </p>
        {loading ? <Loader2 className="mb-2 size-4 animate-spin text-muted-foreground" /> : null}
      </div>

      <Block
        icon={ClipboardCheck}
        title="الفحوصات اللي اتعملت"
        subtitle="المهام اللي اتقفلت في الأسبوع ده"
        count={data.completed.length}
      >
        {data.completed.map((c) => (
          <div key={c.taskCode} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
            <div className="min-w-0">
              <p className="font-medium" dir="auto">
                {c.activity ?? "فحص"}
              </p>
              <Where row={c} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {c.requiresShutdown ? (
                <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  <PowerOff className="size-3" />
                  وقف
                </Badge>
              ) : null}
              {c.condition ? (
                <Badge variant="outline">
                  {CONDITION_LABELS_AR[c.condition as Enums<"equipment_condition">]}
                </Badge>
              ) : null}
              <Badge
                variant="secondary"
                className={cn(c.flagged > 0 && "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300")}
              >
                {c.flagged} / {c.items} بند
              </Badge>
              {c.inspector ? (
                <span className="text-xs text-muted-foreground">{c.inspector}</span>
              ) : null}
            </div>
          </div>
        ))}
      </Block>

      <Block
        icon={Wrench}
        title="إجراءات الصيانة اللي اتعملت"
        subtitle="الإجراءات اللي اتقفلت أو اتحقق منها في الأسبوع ده"
        count={data.actions.length}
      >
        {data.actions.map((a) => (
          <div key={a.actionCode} className="flex flex-col gap-1 py-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium" dir="auto">
                {a.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="font-mono" dir="ltr">
                  {a.actionCode}
                </Badge>
                {a.sapWorkOrder ? (
                  <Badge
                    className="bg-indigo-100 font-mono text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                    dir="ltr"
                  >
                    SAP {a.sapWorkOrder}
                  </Badge>
                ) : null}
                <Badge variant="secondary">
                  {ACTION_TYPE_LABELS_AR[a.type as Enums<"action_type">]}
                </Badge>
              </div>
            </div>
            <Where row={a} />
            {a.note ? (
              <p className="text-sm" dir="auto">
                <span className="text-muted-foreground">ملاحظة الإكمال: </span>
                {a.note}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {[a.responsible ?? a.department, a.completedAt?.slice(0, 10)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        ))}
      </Block>

      <Block
        icon={PowerOff}
        title="بنود تفتيش والمعدة متوقفة"
        subtitle={`${shutdownSplit.planned} مخطط لها · ${shutdownSplit.blocked} المفتش مقدرش يوصلها`}
        count={data.shutdownItems.length}
      >
        {data.shutdownItems.map((i, idx) => (
          <div key={`${i.taskCode}-${idx}`} className="flex flex-col gap-1 py-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium" dir="auto">
                {i.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  className={cn(
                    "gap-1",
                    i.reason === "planned"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300"
                  )}
                >
                  <PowerOff className="size-3" />
                  {PM_REASON_LABELS_AR[i.reason]}
                </Badge>
                {i.result ? (
                  <Badge variant="outline">
                    {CHECKLIST_RESULT_LABELS_AR[i.result as Enums<"checklist_result">]}
                  </Badge>
                ) : null}
              </div>
            </div>
            <Where row={i} />
            {i.notes?.trim() ? (
              <p className="text-sm" dir="auto">
                <span className="text-muted-foreground">ملاحظة المفتش: </span>
                {i.notes.trim()}
              </p>
            ) : null}
          </div>
        ))}
      </Block>

      <Block
        icon={Timer}
        title="مستني الوقفة الجاية"
        subtitle="إجراءات صيانة متسجلة على إنها محتاجة إيقاف — دي خطة الوقفة الجاية"
        count={data.waitingShutdown.length}
      >
        {data.waitingShutdown.map((a) => (
          <div key={a.actionCode} className="flex flex-col gap-1 py-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium" dir="auto">
                {a.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge className={PRIORITY_BADGE_CLASS[a.priority as Enums<"priority_level">]}>
                  {PRIORITY_LABELS_AR[a.priority as Enums<"priority_level">]}
                </Badge>
                {a.sapWorkOrder ? (
                  <Badge
                    className="bg-indigo-100 font-mono text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                    dir="ltr"
                  >
                    SAP {a.sapWorkOrder}
                  </Badge>
                ) : null}
                {/* The wait, not the date it was raised: a job parked five weeks
                    ago is the one nobody remembers to put on the list. */}
                <Badge variant="outline">مستني {daysWaiting(a.waitingSince)} يوم</Badge>
              </div>
            </div>
            <Where row={a} />
            {a.targetDate ? (
              <p className="text-xs text-muted-foreground">
                الاستهداف:{" "}
                <span className="font-mono" dir="ltr">
                  {a.targetDate}
                </span>
              </p>
            ) : null}
          </div>
        ))}
      </Block>
    </div>
  );
}
