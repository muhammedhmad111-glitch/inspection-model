"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import {
  FREQUENCY_BADGE_CLASS,
  FREQUENCY_LABELS_AR,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
  TASK_STATUS_BADGE_CLASS,
  TASK_STATUS_LABELS_AR,
} from "@/lib/constants";

type TaskRow = {
  inspection_task_id: string;
  task_code: string;
  scheduled_date: string;
  due_date: string;
  status: Enums<"task_status">;
  priority: Enums<"priority_level">;
  recurrence_cycle: number;
  inspection_activities: {
    activity_name: string;
    frequency_type: Enums<"frequency_type">;
  } | null;
  equipment: { equipment_name: string; functional_location: string | null } | null;
  equipment_parts: { part_name: string } | null;
};

const ALL = "__all__";
const OPEN_STATUSES: Enums<"task_status">[] = [
  "Overdue",
  "Upcoming",
  "In Progress",
  "Scheduled",
];

export function SchedulingClient({
  initialTasks,
  stats,
  canGenerate,
}: {
  initialTasks: TaskRow[];
  stats: { total: number; overdue: number; upcoming: number; completed: number };
  canGenerate: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialTasks.filter((t) => {
      if (statusFilter !== ALL && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.task_code.toLowerCase().includes(q) ||
        (t.inspection_activities?.activity_name ?? "").toLowerCase().includes(q) ||
        (t.equipment?.equipment_name ?? "").toLowerCase().includes(q) ||
        (t.equipment_parts?.part_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialTasks, search, statusFilter]);

  async function generate() {
    setGenerating(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("generate_inspection_tasks", {
      p_horizon_days: 30,
    });
    setGenerating(false);
    if (error) {
      toast.error("فشل توليد الجدولة: " + error.message);
      return;
    }
    toast.success(
      data && data > 0
        ? `تم توليد ${data} مهمة جديدة`
        : "الجدولة محدثة بالفعل — لا مهام جديدة"
    );
    router.refresh();
  }

  const statCards = [
    { label: "إجمالي المهام", value: stats.total, icon: ListChecks, tone: "purple" },
    { label: "قادمة (٣ أيام)", value: stats.upcoming, icon: CalendarClock, tone: "pink" },
    { label: "متأخرة", value: stats.overdue, icon: AlertTriangle, tone: "red" },
    { label: "مكتملة", value: stats.completed, icon: CheckCircle2, tone: "green" },
  ] as const;

  const toneClass: Record<string, string> = {
    purple: "bg-primary/10 text-primary",
    pink: "bg-brand-pink/15 text-brand-pink",
    red: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">جدولة الفحوصات</h1>
          <p className="text-sm text-muted-foreground">
            محرك التوليد التلقائي للمهام الدورية — أفق ٣٠ يوم
          </p>
        </div>
        {canGenerate ? (
          <Button onClick={generate} disabled={generating}>
            <RefreshCw className={cn("size-4", generating && "animate-spin")} />
            توليد الجدولة
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="rounded-3xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div
                className={`flex size-11 items-center justify-center rounded-2xl ${toneClass[s.tone]}`}
              >
                <s.icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالكود أو المعدة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الحالات المفتوحة</SelectItem>
            {OPEN_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {TASK_STATUS_LABELS_AR[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} مهمة</span>
      </div>

      <div className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>النشاط</TableHead>
              <TableHead>المعدة / الجزء</TableHead>
              <TableHead>التكرار</TableHead>
              <TableHead>تاريخ الاستحقاق</TableHead>
              <TableHead>الدورة</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  لا توجد مهام — اضغط &quot;توليد الجدولة&quot; لإنشاء المهام من الأنشطة النشطة
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow
                  key={t.inspection_task_id}
                  className={cn(t.status === "Overdue" && "bg-red-50/60 dark:bg-red-950/20")}
                >
                  <TableCell className="font-mono text-xs" dir="ltr">
                    {t.task_code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {t.inspection_activities?.activity_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{t.equipment?.equipment_name ?? "—"}</div>
                    {t.equipment?.functional_location ? (
                      <div className="font-mono text-xs text-muted-foreground" dir="ltr">
                        {t.equipment.functional_location}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {t.inspection_activities ? (
                      <Badge
                        className={
                          FREQUENCY_BADGE_CLASS[t.inspection_activities.frequency_type]
                        }
                      >
                        {FREQUENCY_LABELS_AR[t.inspection_activities.frequency_type]}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-mono text-sm",
                      t.status === "Overdue" && "font-bold text-red-600 dark:text-red-400"
                    )}
                    dir="ltr"
                  >
                    {t.due_date}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {t.recurrence_cycle}
                  </TableCell>
                  <TableCell>
                    <Badge className={PRIORITY_BADGE_CLASS[t.priority]}>
                      {PRIORITY_LABELS_AR[t.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={TASK_STATUS_BADGE_CLASS[t.status]}>
                      {TASK_STATUS_LABELS_AR[t.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
