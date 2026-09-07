"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Play, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  groupBySection,
  sectionOf,
  sectionsWord,
  type SectionRef,
} from "@/lib/sections";
import { cn } from "@/lib/utils";
import { DailyReportButton } from "@/components/daily-report-button";
import { WeeklyReportButton } from "@/components/weekly-report-button";
import {
  CATEGORY_LABELS_AR,
  CONDITION_BADGE_CLASS,
  CONDITION_LABELS_AR,
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
  assigned_user_id: string | null;
  condition_rating: Enums<"equipment_condition"> | null;
  completion_date: string | null;
  inspection_activities: {
    activity_name: string;
    inspection_category: Enums<"inspection_category">;
    frequency_type: Enums<"frequency_type">;
  } | null;
  equipment: {
    equipment_id: string;
    equipment_name: string;
    functional_location: string | null;
    sections: SectionRef;
  } | null;
  equipment_parts: { part_name: string } | null;
};

type ProfileOption = { id: string; full_name: string; role: string };

const ALL = "__all__";
const UNASSIGNED = "__none__";

type Tab = "open" | "mine" | "overdue" | "completed";

export function TasksClient({
  initialTasks,
  profiles,
  currentUserId,
  canManage,
}: {
  initialTasks: TaskRow[];
  profiles: ProfileOption[];
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState(ALL);
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [sectionFilter, setSectionFilter] = useState(ALL);
  const [assigning, setAssigning] = useState<string | null>(null);
  // Sections start open; collapsing is for hiding the ones you are not working today.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p.full_name])),
    [profiles]
  );

  const equipmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of initialTasks) {
      if (t.equipment)
        map.set(
          t.equipment.equipment_id,
          t.equipment.functional_location
            ? `${t.equipment.equipment_name} · ${t.equipment.functional_location}`
            : t.equipment.equipment_name
        );
    }
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1]));
  }, [initialTasks]);

  const sectionOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of initialTasks) {
      const s = sectionOf(t);
      map.set(s.id, s.area ? `${s.name} · ${s.area}` : s.name);
    }
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1], "ar"));
  }, [initialTasks]);

  const counts = useMemo(() => {
    const open = initialTasks.filter((t) =>
      ["Scheduled", "Upcoming", "In Progress", "Overdue"].includes(t.status)
    );
    return {
      open: open.length,
      mine: open.filter((t) => t.assigned_user_id === currentUserId).length,
      overdue: initialTasks.filter((t) => t.status === "Overdue").length,
      completed: initialTasks.filter((t) => t.status === "Completed").length,
    };
  }, [initialTasks, currentUserId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialTasks.filter((t) => {
      if (tab === "open" && !["Scheduled", "Upcoming", "In Progress", "Overdue"].includes(t.status))
        return false;
      if (tab === "mine") {
        if (t.assigned_user_id !== currentUserId) return false;
        if (!["Scheduled", "Upcoming", "In Progress", "Overdue"].includes(t.status)) return false;
      }
      if (tab === "overdue" && t.status !== "Overdue") return false;
      if (tab === "completed" && t.status !== "Completed") return false;
      if (equipmentFilter !== ALL && t.equipment?.equipment_id !== equipmentFilter)
        return false;
      if (sectionFilter !== ALL && sectionOf(t).id !== sectionFilter) return false;
      if (priorityFilter !== ALL && t.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        t.task_code.toLowerCase().includes(q) ||
        (t.inspection_activities?.activity_name ?? "").toLowerCase().includes(q) ||
        (t.equipment?.equipment_name ?? "").toLowerCase().includes(q) ||
        (t.equipment_parts?.part_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [
    initialTasks,
    tab,
    search,
    equipmentFilter,
    sectionFilter,
    priorityFilter,
    currentUserId,
  ]);

  // The 200-row cap is applied before grouping, otherwise a section header would
  // advertise a count that the rows underneath it do not add up to.
  const groups = useMemo(() => groupBySection(filtered.slice(0, 200)), [filtered]);

  function toggleSection(id: string) {
    setCollapsed((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function assign(taskId: string, userId: string) {
    setAssigning(taskId);
    const supabase = createClient();
    const { error } = await supabase
      .from("inspection_tasks")
      .update({ assigned_user_id: userId === UNASSIGNED ? null : userId })
      .eq("inspection_task_id", taskId);
    setAssigning(null);
    if (error) {
      toast.error("فشل تعيين المفتش");
      return;
    }
    toast.success("تم تحديث التعيين");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">مهام الفحص</h1>
          <p className="text-sm text-muted-foreground">
            قائمة أعمال المفتشين — بدء وتنفيذ الفحوصات
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DailyReportButton senderName={profileById.get(currentUserId) ?? ""} />
          <WeeklyReportButton senderName={profileById.get(currentUserId) ?? ""} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="h-auto flex-wrap rounded-2xl">
          <TabsTrigger value="open" className="rounded-xl">
            المفتوحة ({counts.open})
          </TabsTrigger>
          <TabsTrigger value="mine" className="rounded-xl">
            مهامي ({counts.mine})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="rounded-xl">
            المتأخرة ({counts.overdue})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl">
            المكتملة ({counts.completed})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الأقسام</SelectItem>
            {sectionOptions.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل المعدات</SelectItem>
            {equipmentOptions.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الأولويات</SelectItem>
            {(["Critical", "High", "Medium", "Low"] as const).map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS_AR[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} مهمة في {groups.length} {sectionsWord(groups.length)}
        </span>
        {collapsed.size > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xl"
            onClick={() => setCollapsed(new Set())}
          >
            فتح كل الأقسام
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm">
        {/* Table brings its own .scroll-x container — no extra wrapper needed. */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>النشاط</TableHead>
              <TableHead>المعدة / الجزء</TableHead>
              <TableHead>التكرار</TableHead>
              <TableHead>الاستحقاق</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>{tab === "completed" ? "حالة المعدة" : "المفتش"}</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  لا توجد مهام مطابقة
                </TableCell>
              </TableRow>
            ) : (
              groups.map((g) => (
                <Fragment key={g.id}>
                  <TableRow
                    className="cursor-pointer bg-muted/60 hover:bg-muted"
                    onClick={() => toggleSection(g.id)}
                  >
                    <TableCell colSpan={8} className="py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <ChevronDown
                          className={cn(
                            "size-4 text-muted-foreground transition-transform",
                            collapsed.has(g.id) && "-rotate-90"
                          )}
                        />
                        <span className="font-semibold">{g.name}</span>
                        {g.area ? (
                          <span className="text-xs text-muted-foreground">{g.area}</span>
                        ) : null}
                        <Badge variant="secondary">{g.tasks.length}</Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {collapsed.has(g.id)
                    ? null
                    : g.tasks.map((t) => (
                        <TaskTableRow
                          key={t.inspection_task_id}
                          t={t}
                          tab={tab}
                          canManage={canManage}
                          profiles={profiles}
                          profileById={profileById}
                          assigning={assigning}
                          onAssign={assign}
                          onOpen={(id) => router.push(`/tasks/${id}`)}
                        />
                      ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** One task row. Pulled out so the section grouping above stays readable. */
function TaskTableRow({
  t,
  tab,
  canManage,
  profiles,
  profileById,
  assigning,
  onAssign,
  onOpen,
}: {
  t: TaskRow;
  tab: Tab;
  canManage: boolean;
  profiles: ProfileOption[];
  profileById: Map<string, string>;
  assigning: string | null;
  onAssign: (taskId: string, userId: string) => void;
  onOpen: (taskId: string) => void;
}) {
  return (
    <TableRow
      // The action button sits in the last column, which is off-screen
      // on narrow viewports — opening from anywhere on the row means
      // nobody has to scroll sideways to reach it.
      onClick={() => onOpen(t.inspection_task_id)}
      className={cn(
        "cursor-pointer",
        t.status === "Overdue" && "bg-red-50/60 dark:bg-red-950/20"
      )}
    >
      <TableCell>
        <div className="font-medium">
          {t.inspection_activities?.activity_name ?? "—"}
        </div>
        <div className="text-xs text-muted-foreground">
          {t.inspection_activities
            ? CATEGORY_LABELS_AR[t.inspection_activities.inspection_category]
            : ""}
          {" · "}
          <span className="font-mono" dir="ltr">
            {t.task_code}
          </span>
        </div>
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
          t.status === "Overdue" &&
            "font-bold text-red-600 dark:text-red-400"
        )}
        dir="ltr"
      >
        {t.due_date}
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
      {/* Assigning an inspector must not open the task. */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        {tab === "completed" ? (
          t.condition_rating ? (
            <Badge className={CONDITION_BADGE_CLASS[t.condition_rating]}>
              {CONDITION_LABELS_AR[t.condition_rating]}
            </Badge>
          ) : (
            "—"
          )
        ) : canManage ? (
          <Select
            value={t.assigned_user_id ?? UNASSIGNED}
            onValueChange={(v) => onAssign(t.inspection_task_id, v)}
            disabled={assigning === t.inspection_task_id}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>غير معيّن</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <UserRound className="size-3.5" />
            {t.assigned_user_id
              ? profileById.get(t.assigned_user_id) ?? "—"
              : "غير معيّن"}
          </span>
        )}
      </TableCell>
      <TableCell>
        {t.status !== "Completed" &&
        t.status !== "Cancelled" &&
        t.status !== "Skipped" ? (
          <Button asChild size="sm" className="rounded-xl">
            <Link href={`/tasks/${t.inspection_task_id}`}>
              <Play className="size-3.5" />
              {t.status === "In Progress" ? "متابعة" : "بدء الفحص"}
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="ghost" className="rounded-xl">
            <Link href={`/tasks/${t.inspection_task_id}`}>عرض</Link>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
