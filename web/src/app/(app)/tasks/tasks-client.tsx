"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
import { Constants, type Enums } from "@/lib/supabase/types";
import { groupBySection, sectionsWord, type SectionRef } from "@/lib/sections";
import { equipmentLabel, equipmentTags, type EquipmentRef } from "@/lib/equipment-ref";
import { cn } from "@/lib/utils";
import { VIA_EQUIPMENT_LINE_PATH } from "@/lib/line-filter";
import { LINE_LABELS_AR, type ProductionLine } from "@/lib/production-line";
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
  equipment: (EquipmentRef & { equipment_id: string; sections: SectionRef }) | null;
  equipment_parts: { part_name: string } | null;
};

type ProfileOption = { id: string; full_name: string; role: string };
type EquipmentOption = {
  equipment_id: string;
  equipment_name: string;
  equipment_code: string | null;
  functional_location: string | null;
};
type SectionOption = {
  section_id: string;
  section_name: string;
  areas: { area_name: string } | null;
};

const ALL = "__all__";
const UNASSIGNED = "__none__";

type Tab = "open" | "mine" | "overdue" | "completed";

const OPEN_STATUSES: Enums<"task_status">[] = [
  "Scheduled",
  "Upcoming",
  "In Progress",
  "Overdue",
];

const TAB_STATUSES: Record<Tab, Enums<"task_status">[]> = {
  open: OPEN_STATUSES,
  mine: OPEN_STATUSES,
  overdue: ["Overdue"],
  completed: ["Completed"],
};

// `!inner` on every embed so a filter on the activity's frequency, the equipment's
// section or the area's production line drops the parent task instead of just
// blanking the embed.
const TASK_SELECT = `inspection_task_id, task_code, scheduled_date, due_date, status, priority,
   recurrence_cycle, assigned_user_id, condition_rating, completion_date,
   inspection_activities!inner ( activity_name, inspection_category, frequency_type ),
   equipment!inner (
     equipment_id, equipment_name, equipment_code, functional_location,
     sections!inner ( section_id, section_name, areas!inner ( area_name, production_line ) )
   ),
   equipment_parts ( part_name )`;

// One screenful of scrolling is plenty; past this the answer is a tighter filter,
// not a longer page. The header says how many matched so the cap is never silent.
const ROW_LIMIT = 500;

export function TasksClient({
  profiles,
  equipmentOptions,
  sectionOptions,
  currentUserId,
  line,
  canManage,
}: {
  profiles: ProfileOption[];
  equipmentOptions: EquipmentOption[];
  sectionOptions: SectionOption[];
  currentUserId: string;
  line: ProductionLine;
  canManage: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState(ALL);
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [sectionFilter, setSectionFilter] = useState(ALL);
  const [frequencyFilter, setFrequencyFilter] = useState(ALL);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [matched, setMatched] = useState(0);
  const [counts, setCounts] = useState({ open: 0, mine: 0, overdue: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  // Sections start open; collapsing is for hiding the ones you are not working today.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p.full_name])),
    [profiles]
  );

  // Every filter except the search box runs in the database. Filtering a fixed
  // page of rows in the browser meant anything scheduled past that page — the
  // quarterly, half-yearly and yearly rounds — could not be reached at all.
  const buildQuery = useCallback(
    (statuses: Enums<"task_status">[], mineOnly: boolean, head: boolean) => {
      const supabase = createClient();
      let q = supabase
        .from("inspection_tasks")
        .select(TASK_SELECT, { count: "exact", head })
        .eq(VIA_EQUIPMENT_LINE_PATH, line)
        .in("status", statuses);
      if (mineOnly) q = q.eq("assigned_user_id", currentUserId);
      if (equipmentFilter !== ALL) q = q.eq("equipment_id", equipmentFilter);
      if (sectionFilter !== ALL) q = q.eq("equipment.section_id", sectionFilter);
      if (priorityFilter !== ALL)
        q = q.eq("priority", priorityFilter as Enums<"priority_level">);
      if (frequencyFilter !== ALL)
        q = q.eq(
          "inspection_activities.frequency_type",
          frequencyFilter as Enums<"frequency_type">
        );
      return q;
    },
    [
      currentUserId,
      line,
      equipmentFilter,
      sectionFilter,
      priorityFilter,
      frequencyFilter,
    ]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [rows, open, mine, overdue, completed] = await Promise.all([
        buildQuery(TAB_STATUSES[tab], tab === "mine", false)
          .order("due_date")
          .limit(ROW_LIMIT),
        buildQuery(OPEN_STATUSES, false, true),
        buildQuery(OPEN_STATUSES, true, true),
        buildQuery(["Overdue"], false, true),
        buildQuery(["Completed"], false, true),
      ]);
      if (!active) return;
      setTasks((rows.data ?? []) as unknown as TaskRow[]);
      setMatched(rows.count ?? 0);
      setCounts({
        open: open.count ?? 0,
        mine: mine.count ?? 0,
        overdue: overdue.count ?? 0,
        completed: completed.count ?? 0,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [buildQuery, tab, reloadKey]);

  // Search refines what the filters already loaded — it is a way to find a row on
  // the page, not a way to reach one that is not on it.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.task_code.toLowerCase().includes(q) ||
        (t.inspection_activities?.activity_name ?? "").toLowerCase().includes(q) ||
        // The numbers too: a fitter searches "B06.04", a planner "RM-007".
        equipmentLabel(t.equipment, "").toLowerCase().includes(q) ||
        (t.equipment_parts?.part_name ?? "").toLowerCase().includes(q)
    );
  }, [tasks, search]);

  const groups = useMemo(() => groupBySection(filtered), [filtered]);

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
    // The rows come from the client query, not from the server render, so a
    // router refresh would leave the table showing the old inspector.
    setReloadKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">مهام الفحص</h1>
          <p className="text-sm text-muted-foreground">
            قائمة أعمال المفتشين — بدء وتنفيذ الفحوصات · {LINE_LABELS_AR[line]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DailyReportButton
            senderName={profileById.get(currentUserId) ?? ""}
            line={line}
          />
          <WeeklyReportButton
            senderName={profileById.get(currentUserId) ?? ""}
            line={line}
          />
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
            {sectionOptions.map((s) => (
              <SelectItem key={s.section_id} value={s.section_id}>
                {s.areas ? `${s.section_name} · ${s.areas.area_name}` : s.section_name}
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
            {equipmentOptions.map((e) => (
              <SelectItem key={e.equipment_id} value={e.equipment_id}>
                {equipmentLabel(e)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* The long cycles live months out, past any page of the schedule —
            picking one here asks the database for them directly. */}
        <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل التكرارات</SelectItem>
            {Constants.public.Enums.frequency_type.map((f) => (
              <SelectItem key={f} value={f}>
                {FREQUENCY_LABELS_AR[f]}
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
          {loading
            ? "جارِ التحميل…"
            : matched > filtered.length
              ? `عرض ${filtered.length} من ${matched} مهمة مطابقة`
              : `${filtered.length} مهمة في ${groups.length} ${sectionsWord(groups.length)}`}
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
                  {loading ? "جارِ التحميل…" : "لا توجد مهام مطابقة"}
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
        {equipmentTags(t.equipment).length ? (
          <div className="font-mono text-xs text-muted-foreground" dir="ltr">
            {equipmentTags(t.equipment).join(" · ")}
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
