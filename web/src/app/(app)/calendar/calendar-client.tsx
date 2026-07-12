"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
  TASK_STATUS_BADGE_CLASS,
  TASK_STATUS_LABELS_AR,
} from "@/lib/constants";

type TaskLite = {
  inspection_task_id: string;
  due_date: string;
  status: Enums<"task_status">;
  priority: Enums<"priority_level">;
  assigned_user_id: string | null;
  inspection_activities: { activity_name: string } | null;
  equipment: { equipment_name: string; functional_location: string | null } | null;
};

const ALL = "__all__";
const WEEKDAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
// column index with Saturday as first column
const colOf = (dow: number) => (dow + 1) % 7;

export function CalendarClient({
  profiles,
}: {
  profiles: { id: string; full_name: string }[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [inspector, setInspector] = useState(ALL);
  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const supabase = createClient();
      const start = ymd(year, month, 1);
      const end = ymd(year, month, new Date(year, month + 1, 0).getDate());
      const { data } = await supabase
        .from("inspection_tasks")
        .select(
          `inspection_task_id, due_date, status, priority, assigned_user_id,
           inspection_activities ( activity_name ),
           equipment ( equipment_name, functional_location )`
        )
        .gte("due_date", start)
        .lte("due_date", end)
        .limit(2000);
      if (active) {
        setTasks((data ?? []) as TaskLite[]);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [year, month]);

  const visible = useMemo(
    () =>
      inspector === ALL
        ? tasks
        : tasks.filter((t) => t.assigned_user_id === inspector),
    [tasks, inspector]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, TaskLite[]>();
    for (const t of visible) {
      const arr = map.get(t.due_date) ?? [];
      arr.push(t);
      map.set(t.due_date, arr);
    }
    return map;
  }, [visible]);

  // build 6-week grid
  const firstDow = new Date(year, month, 1).getDay();
  const startCol = colOf(firstDow);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startCol; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  function shift(delta: number) {
    setSelectedDay(null);
    const m = month + delta;
    if (m < 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else if (m > 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth(m);
    }
  }

  const selectedTasks = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">تقويم الفحوصات</h1>
          <p className="text-sm text-muted-foreground">
            المهام حسب تاريخ الاستحقاق — {visible.length} مهمة في الشهر
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={inspector} onValueChange={setInspector}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>كل المفتشين</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => shift(-1)}>
              <ChevronRight className="size-4" />
            </Button>
            <span className="min-w-32 text-center text-sm font-semibold">
              {MONTHS[month]} {year}
            </span>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => shift(1)}>
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm">
        <CardContent className="p-3 sm:p-5">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          <div className={cn("mt-1 grid grid-cols-7 gap-1.5", loading && "opacity-50")}>
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const ds = ymd(year, month, d);
              const items = byDay.get(ds) ?? [];
              const hasOverdue = items.some((t) => t.status === "Overdue");
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDay;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(items.length ? ds : null)}
                  className={cn(
                    "flex min-h-16 flex-col items-center gap-1 rounded-2xl border p-1.5 text-sm transition-colors sm:min-h-20",
                    items.length ? "hover:border-primary" : "cursor-default",
                    isSelected ? "border-primary bg-primary/5" : "border-transparent bg-muted/40",
                    isToday && "ring-2 ring-primary/40"
                  )}
                >
                  <span className={cn("font-semibold", isToday && "text-primary")}>{d}</span>
                  {items.length ? (
                    <span
                      className={cn(
                        "mt-auto rounded-full px-2 py-0.5 text-[11px] font-bold",
                        hasOverdue
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      {items.length}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDay ? (
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="flex flex-col gap-2 pt-5">
            <p className="font-semibold">
              مهام يوم <span className="font-mono" dir="ltr">{selectedDay}</span> ({selectedTasks.length})
            </p>
            {selectedTasks.map((t) => (
              <Link
                key={t.inspection_task_id}
                href={`/tasks/${t.inspection_task_id}`}
                className="flex items-center justify-between gap-2 rounded-2xl bg-muted/50 px-4 py-2.5 text-sm hover:bg-muted"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {t.inspection_activities?.activity_name ?? "فحص"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.equipment?.equipment_name}
                    {t.equipment?.functional_location ? (
                      <span className="font-mono" dir="ltr"> · {t.equipment.functional_location}</span>
                    ) : null}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Badge className={PRIORITY_BADGE_CLASS[t.priority]}>
                    {PRIORITY_LABELS_AR[t.priority]}
                  </Badge>
                  <Badge className={TASK_STATUS_BADGE_CLASS[t.status]}>
                    {TASK_STATUS_LABELS_AR[t.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
