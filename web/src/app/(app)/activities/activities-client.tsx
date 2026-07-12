"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Enums, Tables } from "@/lib/supabase/types";
import { Constants } from "@/lib/supabase/types";
import {
  CATEGORY_LABELS_AR,
  FREQUENCY_BADGE_CLASS,
  FREQUENCY_LABELS_AR,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
  ROLE_LABELS_AR,
} from "@/lib/constants";

type Activity = Tables<"inspection_activities"> & {
  equipment_parts: {
    part_code: string;
    part_name: string;
    equipment: {
      equipment_id: string;
      equipment_code: string;
      equipment_name: string;
      functional_location: string | null;
    } | null;
  } | null;
};

const ALL = "__all__";

export function ActivitiesClient({
  initialActivities,
  canWrite,
}: {
  initialActivities: Activity[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [frequencyFilter, setFrequencyFilter] = useState(ALL);
  const [equipmentFilter, setEquipmentFilter] = useState(ALL);
  const [editing, setEditing] = useState<Activity | null>(null);

  const equipmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of initialActivities) {
      const eq = a.equipment_parts?.equipment;
      if (eq)
        map.set(
          eq.equipment_id,
          eq.functional_location
            ? `${eq.equipment_name} · ${eq.functional_location}`
            : eq.equipment_name
        );
    }
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1]));
  }, [initialActivities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialActivities.filter((a) => {
      if (categoryFilter !== ALL && a.inspection_category !== categoryFilter)
        return false;
      if (frequencyFilter !== ALL && a.frequency_type !== frequencyFilter)
        return false;
      if (
        equipmentFilter !== ALL &&
        a.equipment_parts?.equipment?.equipment_id !== equipmentFilter
      )
        return false;
      if (!q) return true;
      return (
        a.activity_code.toLowerCase().includes(q) ||
        a.activity_name.toLowerCase().includes(q) ||
        (a.equipment_parts?.part_name ?? "").toLowerCase().includes(q) ||
        (a.equipment_parts?.equipment?.equipment_name ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [initialActivities, search, categoryFilter, frequencyFilter, equipmentFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">أنشطة الفحص الدورية</h1>
        <p className="text-sm text-muted-foreground">
          {initialActivities.length} نشاط مرتبط بأجزاء المعدات — مصدر توليد المهام
        </p>
      </div>

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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الفئات</SelectItem>
            {Constants.public.Enums.inspection_category.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS_AR[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
          <SelectTrigger className="w-40">
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
        <span className="text-sm text-muted-foreground">
          {filtered.length} نتيجة
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>النشاط</TableHead>
              <TableHead>المعدة / الجزء</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead>التكرار</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>المسؤول</TableHead>
              <TableHead>الحالة</TableHead>
              {canWrite ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canWrite ? 8 : 7}
                  className="py-10 text-center text-muted-foreground"
                >
                  لا توجد أنشطة مطابقة
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a) => (
                <TableRow key={a.inspection_activity_id}>
                  <TableCell>
                    <div className="font-medium">{a.activity_name}</div>
                    <div className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {a.activity_code}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {a.equipment_parts?.equipment?.equipment_name ?? "—"}
                    </div>
                    {a.equipment_parts?.equipment?.functional_location ? (
                      <div className="font-mono text-xs text-muted-foreground" dir="ltr">
                        {a.equipment_parts.equipment.functional_location}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {CATEGORY_LABELS_AR[a.inspection_category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={FREQUENCY_BADGE_CLASS[a.frequency_type]}>
                      {FREQUENCY_LABELS_AR[a.frequency_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={PRIORITY_BADGE_CLASS[a.priority]}>
                      {PRIORITY_LABELS_AR[a.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {ROLE_LABELS_AR[a.responsible_role]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.active ? "default" : "secondary"}>
                      {a.active ? "نشط" : "موقوف"}
                    </Badge>
                  </TableCell>
                  {canWrite ? (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(a)}>
                            تعديل الجدولة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {canWrite ? (
        <ActivityEditDialog activity={editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
}

function ActivityEditDialog({
  activity,
  onClose,
}: {
  activity: Activity | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // key by activity id so state resets when a different row is opened
  return (
    <Dialog open={!!activity} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {activity ? (
          <ActivityEditForm
            key={activity.inspection_activity_id}
            activity={activity}
            submitting={submitting}
            onSubmit={async (payload) => {
              setSubmitting(true);
              const supabase = createClient();
              const { error } = await supabase
                .from("inspection_activities")
                .update(payload)
                .eq("inspection_activity_id", activity.inspection_activity_id);
              setSubmitting(false);
              if (error) {
                toast.error("حدث خطأ، حاول مرة أخرى");
                return;
              }
              toast.success("تم تحديث النشاط");
              onClose();
              router.refresh();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ActivityEditForm({
  activity,
  submitting,
  onSubmit,
}: {
  activity: Activity;
  submitting: boolean;
  onSubmit: (payload: {
    frequency_type: Enums<"frequency_type">;
    custom_interval_days: number | null;
    priority: Enums<"priority_level">;
    responsible_role: Enums<"app_user_role">;
    active: boolean;
  }) => Promise<void>;
}) {
  const [frequency, setFrequency] = useState<Enums<"frequency_type">>(
    activity.frequency_type
  );
  const [customDays, setCustomDays] = useState(
    activity.custom_interval_days?.toString() ?? ""
  );
  const [priority, setPriority] = useState<Enums<"priority_level">>(
    activity.priority
  );
  const [role, setRole] = useState<Enums<"app_user_role">>(
    activity.responsible_role
  );
  const [active, setActive] = useState(activity.active);

  return (
    <>
      <DialogHeader>
        <DialogTitle>تعديل جدولة النشاط</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-medium">{activity.activity_name}</p>
          <p className="font-mono text-xs text-muted-foreground" dir="ltr">
            {activity.activity_code}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>التكرار</Label>
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as Enums<"frequency_type">)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Constants.public.Enums.frequency_type.map((f) => (
                <SelectItem key={f} value={f}>
                  {FREQUENCY_LABELS_AR[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {frequency === "Custom" ? (
          <div className="flex flex-col gap-2">
            <Label>الفترة المخصصة (أيام)</Label>
            <Input
              type="number"
              dir="ltr"
              min={1}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label>الأولوية</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as Enums<"priority_level">)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Constants.public.Enums.priority_level.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS_AR[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>الدور المسؤول</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as Enums<"app_user_role">)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Constants.public.Enums.app_user_role.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS_AR[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-xl border p-3">
          <Label>نشط (يولّد مهام)</Label>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
        <DialogFooter>
          <Button
            disabled={
              submitting ||
              (frequency === "Custom" &&
                (!customDays || Number(customDays) < 1))
            }
            onClick={() =>
              onSubmit({
                frequency_type: frequency,
                custom_interval_days:
                  frequency === "Custom" ? Number(customDays) : null,
                priority,
                responsible_role: role,
                active,
              })
            }
          >
            حفظ التغييرات
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}
