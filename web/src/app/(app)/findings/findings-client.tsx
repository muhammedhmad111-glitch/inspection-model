"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Plus, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Attachments } from "@/components/attachments";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment-select";
import {
  ACTION_STATUS_LABELS_AR,
  ACTION_TYPE_LABELS_AR,
  DEPARTMENTS_AR,
  FINDING_STATUS_BADGE_CLASS,
  FINDING_STATUS_LABELS_AR,
  FINDING_TYPE_LABELS_AR,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
  WORK_ORDER_PATTERN,
} from "@/lib/constants";

type Finding = Tables<"inspection_findings"> & {
  equipment: { equipment_name: string; functional_location: string | null } | null;
  equipment_parts: { part_name: string } | null;
  inspection_tasks: { task_code: string } | null;
  maintenance_actions: {
    action_id: string;
    action_code: string;
    status: Enums<"action_status">;
    sap_work_order: string | null;
  }[];
};

type ProfileOption = { id: string; full_name: string; role: string };

const ALL = "__all__";

export function FindingsClient({
  initialFindings,
  profiles,
  equipment,
  canManage,
}: {
  initialFindings: Finding[];
  profiles: ProfileOption[];
  equipment: EquipmentOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [actionFor, setActionFor] = useState<Finding | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialFindings.filter((f) => {
      if (severityFilter !== ALL && f.severity !== severityFilter) return false;
      if (statusFilter !== ALL && f.status !== statusFilter) return false;
      if (typeFilter !== ALL && f.finding_type !== typeFilter) return false;
      if (!q) return true;
      return (
        f.finding_code.toLowerCase().includes(q) ||
        f.finding_title.toLowerCase().includes(q) ||
        (f.equipment?.equipment_name ?? "").toLowerCase().includes(q) ||
        (f.equipment_parts?.part_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialFindings, search, severityFilter, statusFilter, typeFilter]);

  async function setStatus(finding: Finding, status: Enums<"finding_status">) {
    const supabase = createClient();
    const { error } = await supabase
      .from("inspection_findings")
      .update({ status })
      .eq("finding_id", finding.finding_id);
    if (error) {
      toast.error("فشل تحديث الحالة");
      return;
    }
    toast.success("تم تحديث حالة الملاحظة");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ملاحظات الفحص</h1>
          <p className="text-sm text-muted-foreground">
            النتائج غير المطابقة المسجلة أثناء الفحوصات وقرارات التعامل معها
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            ملاحظة جديدة
          </Button>
        ) : null}
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
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الخطورات</SelectItem>
            {(["Critical", "High", "Medium", "Low"] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {PRIORITY_LABELS_AR[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الأنواع</SelectItem>
            {Constants.public.Enums.finding_type.map((t) => (
              <SelectItem key={t} value={t}>
                {FINDING_TYPE_LABELS_AR[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الحالات</SelectItem>
            {Constants.public.Enums.finding_status.map((s) => (
              <SelectItem key={s} value={s}>
                {FINDING_STATUS_LABELS_AR[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} ملاحظة</span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="py-10 text-center text-muted-foreground">
              لا توجد ملاحظات — سجّلها من صفحة تنفيذ الفحص، أو اضغط &quot;ملاحظة
              جديدة&quot; لتسجيل ملاحظة على معدة مباشرة
            </CardContent>
          </Card>
        ) : (
          filtered.map((f) => (
            <Card key={f.finding_id} className="rounded-3xl border-0 shadow-sm">
              <CardContent className="flex flex-col gap-3 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{f.finding_title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {f.equipment?.equipment_name}
                      {f.equipment?.functional_location ? (
                        <span className="font-mono" dir="ltr"> · {f.equipment.functional_location}</span>
                      ) : null}
                      {" · "}
                      <span className="font-mono text-xs" dir="ltr">
                        {f.finding_code}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={PRIORITY_BADGE_CLASS[f.severity]}>
                      {PRIORITY_LABELS_AR[f.severity]}
                    </Badge>
                    <Badge variant="secondary">
                      {FINDING_TYPE_LABELS_AR[f.finding_type]}
                    </Badge>
                    <Badge className={FINDING_STATUS_BADGE_CLASS[f.status]}>
                      {FINDING_STATUS_LABELS_AR[f.status]}
                    </Badge>
                  </div>
                </div>

                {f.finding_description ? (
                  <p className="text-sm text-muted-foreground" dir="auto">
                    {f.finding_description}
                  </p>
                ) : null}
                {f.recommended_action ? (
                  <p className="text-sm">
                    <span className="font-medium">الإجراء الموصى به: </span>
                    <span className="text-muted-foreground" dir="auto">
                      {f.recommended_action}
                    </span>
                  </p>
                ) : null}

                {f.maintenance_actions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">الإجراءات:</span>
                    {f.maintenance_actions.map((a) => (
                      <Badge key={a.action_id} variant="outline" className="font-mono" dir="ltr">
                        {a.action_code} · {ACTION_STATUS_LABELS_AR[a.status]}
                        {a.sap_work_order ? ` · SAP ${a.sap_work_order}` : ""}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {canManage && f.status !== "Closed" ? (
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    <Button size="sm" className="rounded-xl" onClick={() => setActionFor(f)}>
                      <Wrench className="size-3.5" />
                      إنشاء إجراء صيانة
                    </Button>
                    {f.status !== "Monitoring" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setStatus(f, "Monitoring")}
                      >
                        وضع تحت المراقبة
                      </Button>
                    ) : null}
                    {f.status !== "Escalated" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setStatus(f, "Escalated")}
                      >
                        تصعيد
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setStatus(f, "Closed")}
                    >
                      إغلاق كملاحظة
                    </Button>
                  </div>
                ) : null}

                <FindingAttachmentsToggle findingId={f.finding_id} />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateActionDialog
        finding={actionFor}
        profiles={profiles}
        onClose={() => setActionFor(null)}
      />

      <NewFindingDialog
        open={creating}
        equipment={equipment}
        onClose={() => setCreating(false)}
      />
    </div>
  );
}

/** Raise a finding straight against a piece of equipment, with no inspection behind it. */
function NewFindingDialog({
  open,
  equipment,
  onClose,
}: {
  open: boolean;
  equipment: EquipmentOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [equipmentId, setEquipmentId] = useState("");
  const [partId, setPartId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [findingType, setFindingType] = useState<Enums<"finding_type">>("Mechanical");
  const [severity, setSeverity] = useState<Enums<"priority_level">>("Medium");
  const [recommended, setRecommended] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setEquipmentId("");
    setPartId("");
    setTitle("");
    setDescription("");
    setFindingType("Mechanical");
    setSeverity("Medium");
    setRecommended("");
  }

  async function submit() {
    setSubmitting(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("inspection_findings").insert({
      // No task: this was spotted outside a scheduled inspection.
      inspection_task_id: null,
      equipment_id: equipmentId,
      equipment_part_id: partId,
      finding_title: title.trim(),
      finding_description: description.trim() || null,
      finding_type: findingType,
      severity,
      recommended_action: recommended.trim() || null,
      created_by: userData.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("فشل تسجيل الملاحظة: " + error.message);
      return;
    }
    toast.success("تم تسجيل الملاحظة");
    reset();
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تسجيل ملاحظة جديدة</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <EquipmentSelect
            equipment={equipment}
            equipmentId={equipmentId}
            partId={partId}
            onChange={(next) => {
              setEquipmentId(next.equipmentId);
              setPartId(next.partId);
            }}
          />
          <div className="flex flex-col gap-2">
            <Label>عنوان الملاحظة</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>النوع</Label>
              <Select
                value={findingType}
                onValueChange={(v) => setFindingType(v as Enums<"finding_type">)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.finding_type.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FINDING_TYPE_LABELS_AR[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>الخطورة</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as Enums<"priority_level">)}
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
          </div>
          <div className="flex flex-col gap-2">
            <Label>الوصف</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>الإجراء الموصى به</Label>
            <Textarea
              rows={2}
              value={recommended}
              onChange={(e) => setRecommended(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={submit}
              disabled={submitting || !title.trim() || !equipmentId || !partId}
            >
              تسجيل الملاحظة
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateActionDialog({
  finding,
  profiles,
  onClose,
}: {
  finding: Finding | null;
  profiles: ProfileOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={!!finding} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {finding ? (
          <ActionForm
            key={finding.finding_id}
            finding={finding}
            profiles={profiles}
            submitting={submitting}
            onSubmit={async (payload) => {
              setSubmitting(true);
              const supabase = createClient();
              const { data: userData } = await supabase.auth.getUser();
              const { error } = await supabase.from("maintenance_actions").insert({
                ...payload,
                finding_id: finding.finding_id,
                created_by: userData.user?.id ?? null,
              });
              setSubmitting(false);
              if (error) {
                toast.error("فشل إنشاء الإجراء: " + error.message);
                return;
              }
              toast.success("تم إنشاء إجراء الصيانة");
              onClose();
              router.refresh();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ActionForm({
  finding,
  profiles,
  submitting,
  onSubmit,
}: {
  finding: Finding;
  profiles: ProfileOption[];
  submitting: boolean;
  onSubmit: (payload: {
    action_title: string;
    action_description: string | null;
    action_type: Enums<"action_type">;
    priority: Enums<"priority_level">;
    responsible_department: string | null;
    responsible_person: string | null;
    target_date: string | null;
    sap_work_order: string | null;
    verification_required: boolean;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(finding.recommended_action ?? finding.finding_title);
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState<Enums<"action_type">>("Corrective");
  const [priority, setPriority] = useState<Enums<"priority_level">>(finding.severity);
  const [department, setDepartment] = useState<string>(DEPARTMENTS_AR[0]);
  const [person, setPerson] = useState<string>("");
  const [targetDate, setTargetDate] = useState("");
  const [workOrder, setWorkOrder] = useState("");
  const [needsVerification, setNeedsVerification] = useState(
    finding.severity === "Critical" || finding.severity === "High"
  );

  const workOrderValid = !workOrder.trim() || WORK_ORDER_PATTERN.test(workOrder.trim());

  return (
    <>
      <DialogHeader>
        <DialogTitle>إجراء صيانة من الملاحظة {finding.finding_code}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>عنوان الإجراء</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>الوصف</Label>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>نوع الإجراء</Label>
            <Select
              value={actionType}
              onValueChange={(v) => setActionType(v as Enums<"action_type">)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Constants.public.Enums.action_type.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ACTION_TYPE_LABELS_AR[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>القسم المسؤول</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS_AR.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>الشخص المسؤول</Label>
            <Select value={person} onValueChange={setPerson}>
              <SelectTrigger>
                <SelectValue placeholder="اختر..." />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>التاريخ المستهدف</Label>
            <Input
              type="date"
              dir="ltr"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>رقم أمر الشغل في SAP</Label>
            <Input
              dir="ltr"
              inputMode="numeric"
              placeholder="اختياري"
              className="font-mono"
              value={workOrder}
              onChange={(e) => setWorkOrder(e.target.value)}
            />
            {workOrderValid ? null : (
              <p className="text-xs text-red-600 dark:text-red-400">
                أرقام وحروف إنجليزية وشرطات فقط
              </p>
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={needsVerification}
            onChange={(e) => setNeedsVerification(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          يتطلب تحقق بعد الإكمال
        </label>
        <DialogFooter>
          <Button
            disabled={submitting || !title.trim() || !workOrderValid}
            onClick={() =>
              onSubmit({
                action_title: title.trim(),
                action_description: description.trim() || null,
                action_type: actionType,
                priority,
                responsible_department: department,
                responsible_person: person || null,
                target_date: targetDate || null,
                sap_work_order: workOrder.trim() || null,
                verification_required: needsVerification,
              })
            }
          >
            إنشاء الإجراء
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}

function FindingAttachmentsToggle({ findingId }: { findingId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t pt-3">
      {open ? (
        <Attachments entityType="finding" entityId={findingId} canEdit />
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="size-3.5" />
          الصور والمرفقات
        </button>
      )}
    </div>
  );
}
