"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CheckCircle2, Hash, Plus, Search } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment-select";
import { EquipmentRefText } from "@/components/equipment-ref";
import { equipmentLabel, type EquipmentRef } from "@/lib/equipment-ref";
import { LINE_LABELS_AR, type ProductionLine } from "@/lib/production-line";
import {
  ACTION_STATUS_BADGE_CLASS,
  ACTION_STATUS_LABELS_AR,
  ACTION_TYPE_LABELS_AR,
  DEPARTMENTS_AR,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
  WORK_ORDER_PATTERN,
} from "@/lib/constants";

type ActionRow = Tables<"maintenance_actions"> & {
  inspection_findings: {
    finding_code: string;
    finding_title: string;
    severity: Enums<"priority_level">;
    equipment: EquipmentRef;
    equipment_parts: { part_name: string } | null;
  } | null;
  // Set instead of the finding when the action was raised straight on the equipment.
  equipment: EquipmentRef;
  equipment_parts: { part_name: string } | null;
  responsible: { full_name: string } | null;
  verifier: { full_name: string } | null;
};

/**
 * An action raised from a finding leaves its own equipment_id null — the machine
 * is only reachable through the finding. Every read of it has to go through here.
 */
const actionEquipment = (a: ActionRow): EquipmentRef =>
  a.inspection_findings?.equipment ?? a.equipment;

const actionPart = (a: ActionRow): string | null =>
  a.inspection_findings?.equipment_parts?.part_name ?? a.equipment_parts?.part_name ?? null;

type ProfileOption = { id: string; full_name: string; role: string };

type FindingOption = {
  finding_id: string;
  finding_code: string;
  finding_title: string;
  severity: Enums<"priority_level">;
  equipment: EquipmentRef;
};

const ALL = "__all__";
const NO_FINDING = "__none__";

// forward-only workflow transitions
const NEXT_STATUS: Partial<Record<Enums<"action_status">, Enums<"action_status">[]>> = {
  Open: ["Planned", "In Progress", "Waiting Shutdown", "Cancelled"],
  Planned: ["In Progress", "Waiting Shutdown", "Cancelled"],
  "In Progress": ["Waiting Shutdown", "Completed", "Cancelled"],
  "Waiting Shutdown": ["In Progress", "Completed", "Cancelled"],
};

export function ActionsClient({
  initialActions,
  profiles,
  equipment,
  openFindings,
  canManage,
  line,
}: {
  initialActions: ActionRow[];
  profiles: ProfileOption[];
  equipment: EquipmentOption[];
  openFindings: FindingOption[];
  canManage: boolean;
  line: ProductionLine;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [completing, setCompleting] = useState<ActionRow | null>(null);
  const [linkingWorkOrder, setLinkingWorkOrder] = useState<ActionRow | null>(null);
  const [creating, setCreating] = useState(false);

  const isOverdue = (a: ActionRow) =>
    a.target_date &&
    !["Completed", "Verified", "Cancelled"].includes(a.status) &&
    a.target_date < new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialActions.filter((a) => {
      if (statusFilter !== ALL && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.action_code.toLowerCase().includes(q) ||
        a.action_title.toLowerCase().includes(q) ||
        // Planners quote the SAP number, not ours, so it has to be searchable.
        (a.sap_work_order ?? "").toLowerCase().includes(q) ||
        (a.inspection_findings?.finding_code ?? "").toLowerCase().includes(q) ||
        // The name, the register code and the number on the frame all match: a
        // fitter searches "B06.04", a planner searches "RM-007".
        equipmentLabel(actionEquipment(a), "").toLowerCase().includes(q)
      );
    });
  }, [initialActions, search, statusFilter]);

  async function setStatus(action: ActionRow, status: Enums<"action_status">) {
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_actions")
      .update({ status })
      .eq("action_id", action.action_id);
    if (error) {
      toast.error("فشل تحديث الحالة");
      return;
    }
    toast.success("تم تحديث حالة الإجراء");
    router.refresh();
  }

  async function verify(action: ActionRow) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("maintenance_actions")
      .update({
        status: "Verified",
        verified_by: userData.user?.id ?? null,
        verified_at: new Date().toISOString(),
      })
      .eq("action_id", action.action_id);
    if (error) {
      toast.error("فشل التحقق");
      return;
    }
    toast.success("تم التحقق من الإجراء");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">إجراءات الصيانة</h1>
          <p className="text-sm text-muted-foreground">
            الإجراءات المتولدة من ملاحظات الفحص ومتابعة تنفيذها حتى التحقق ·{" "}
            {LINE_LABELS_AR[line]}
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            إجراء جديد
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الحالات</SelectItem>
            {Constants.public.Enums.action_status.map((s) => (
              <SelectItem key={s} value={s}>
                {ACTION_STATUS_LABELS_AR[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} إجراء</span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="py-10 text-center text-muted-foreground">
              لا توجد إجراءات — أنشئها من صفحة الملاحظات، أو اضغط &quot;إجراء
              جديد&quot; لتسجيل إجراء على معدة مباشرة
            </CardContent>
          </Card>
        ) : (
          filtered.map((a) => (
            <Card
              key={a.action_id}
              className={cn(
                "rounded-3xl border-0 shadow-sm",
                isOverdue(a) && "ring-1 ring-red-300 dark:ring-red-800"
              )}
            >
              <CardContent className="flex flex-col gap-3 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.action_title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      <EquipmentRefText
                        equipment={actionEquipment(a)}
                        part={actionPart(a)}
                      />
                      {a.inspection_findings ? (
                        <>
                          {" · من الملاحظة "}
                          <span className="font-mono text-xs" dir="ltr">
                            {a.inspection_findings.finding_code}
                          </span>
                        </>
                      ) : (
                        " · إجراء مباشر"
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="font-mono" dir="ltr">
                      {a.action_code}
                    </Badge>
                    {a.sap_work_order ? (
                      <Badge
                        className="gap-1 bg-indigo-100 font-mono text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                        dir="ltr"
                      >
                        <Hash className="size-3" />
                        SAP {a.sap_work_order}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary">{ACTION_TYPE_LABELS_AR[a.action_type]}</Badge>
                    <Badge className={PRIORITY_BADGE_CLASS[a.priority]}>
                      {PRIORITY_LABELS_AR[a.priority]}
                    </Badge>
                    <Badge className={ACTION_STATUS_BADGE_CLASS[a.status]}>
                      {ACTION_STATUS_LABELS_AR[a.status]}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  {a.responsible_department ? <span>القسم: {a.responsible_department}</span> : null}
                  {a.responsible ? <span>المسؤول: {a.responsible.full_name}</span> : null}
                  {a.target_date ? (
                    <span className={cn(isOverdue(a) && "font-bold text-red-600 dark:text-red-400")}>
                      الاستهداف: <span className="font-mono" dir="ltr">{a.target_date}</span>
                      {isOverdue(a) ? " (متأخر)" : ""}
                    </span>
                  ) : null}
                  {a.verification_required ? <span>يتطلب تحقق</span> : null}
                  {a.verifier ? <span>تحقق بواسطة: {a.verifier.full_name}</span> : null}
                </div>

                {a.completion_note ? (
                  <p className="text-sm">
                    <span className="font-medium">ملاحظة الإكمال: </span>
                    <span className="text-muted-foreground" dir="auto">
                      {a.completion_note}
                    </span>
                  </p>
                ) : null}

                {canManage && a.status !== "Cancelled" ? (
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    {a.status !== "Verified" ? (
                      <>
                        {(NEXT_STATUS[a.status] ?? [])
                          .filter((s) => s !== "Completed")
                          .map((s) => (
                            <Button
                              key={s}
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setStatus(a, s)}
                            >
                              {ACTION_STATUS_LABELS_AR[s]}
                            </Button>
                          ))}
                        {(NEXT_STATUS[a.status] ?? []).includes("Completed") ? (
                          <Button
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setCompleting(a)}
                          >
                            <CheckCircle2 className="size-3.5" />
                            إكمال
                          </Button>
                        ) : null}
                        {a.status === "Completed" ? (
                          <Button size="sm" className="rounded-xl" onClick={() => verify(a)}>
                            <BadgeCheck className="size-3.5" />
                            تحقق وإقفال
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                    {/* The planner usually raises the order days after the action, so
                        this stays reachable at every stage, not only at creation. */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl"
                      onClick={() => setLinkingWorkOrder(a)}
                    >
                      <Hash className="size-3.5" />
                      {a.sap_work_order ? "تعديل أمر الشغل" : "ربط أمر شغل SAP"}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CompleteActionDialog
        action={completing}
        onClose={() => setCompleting(null)}
      />

      <WorkOrderDialog
        action={linkingWorkOrder}
        onClose={() => setLinkingWorkOrder(null)}
      />

      <NewActionDialog
        open={creating}
        profiles={profiles}
        equipment={equipment}
        openFindings={openFindings}
        onClose={() => setCreating(false)}
      />
    </div>
  );
}

/**
 * Raise a maintenance action without going through a finding first. Linking one is
 * still offered — picking it fills in the equipment, since that is where the
 * equipment came from before actions carried their own.
 */
function NewActionDialog({
  open,
  profiles,
  equipment,
  openFindings,
  onClose,
}: {
  open: boolean;
  profiles: ProfileOption[];
  equipment: EquipmentOption[];
  openFindings: FindingOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [findingId, setFindingId] = useState(NO_FINDING);
  const [equipmentId, setEquipmentId] = useState("");
  const [partId, setPartId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState<Enums<"action_type">>("Corrective");
  const [priority, setPriority] = useState<Enums<"priority_level">>("Medium");
  const [department, setDepartment] = useState<string>(DEPARTMENTS_AR[0]);
  const [person, setPerson] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [workOrder, setWorkOrder] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const linked = findingId !== NO_FINDING;
  const workOrderValid = !workOrder.trim() || WORK_ORDER_PATTERN.test(workOrder.trim());

  function reset() {
    setFindingId(NO_FINDING);
    setEquipmentId("");
    setPartId("");
    setTitle("");
    setDescription("");
    setActionType("Corrective");
    setPriority("Medium");
    setDepartment(DEPARTMENTS_AR[0]);
    setPerson("");
    setTargetDate("");
    setWorkOrder("");
    setNeedsVerification(false);
  }

  async function submit() {
    setSubmitting(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("maintenance_actions").insert({
      finding_id: linked ? findingId : null,
      // The finding already carries the equipment; only a standalone action needs it.
      equipment_id: linked ? null : equipmentId,
      equipment_part_id: linked ? null : partId,
      action_title: title.trim(),
      action_description: description.trim() || null,
      action_type: actionType,
      priority,
      responsible_department: department,
      responsible_person: person || null,
      target_date: targetDate || null,
      sap_work_order: workOrder.trim() || null,
      verification_required: needsVerification,
      created_by: userData.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("فشل إنشاء الإجراء: " + error.message);
      return;
    }
    toast.success("تم إنشاء إجراء الصيانة");
    reset();
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إجراء صيانة جديد</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>مرتبط بملاحظة</Label>
            <Select
              value={findingId}
              onValueChange={(v) => {
                setFindingId(v);
                if (v !== NO_FINDING) {
                  setEquipmentId("");
                  setPartId("");
                  const f = openFindings.find((o) => o.finding_id === v);
                  if (f) {
                    setPriority(f.severity);
                    if (!title.trim()) setTitle(f.finding_title);
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_FINDING}>بدون ملاحظة — إجراء مباشر</SelectItem>
                {openFindings.map((f) => (
                  <SelectItem key={f.finding_id} value={f.finding_id}>
                    {f.finding_code} · {f.finding_title}
                    {f.equipment ? ` · ${equipmentLabel(f.equipment)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {linked ? null : (
            <EquipmentSelect
              equipment={equipment}
              equipmentId={equipmentId}
              partId={partId}
              onChange={(next) => {
                setEquipmentId(next.equipmentId);
                setPartId(next.partId);
              }}
            />
          )}

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
              onClick={submit}
              disabled={
                submitting ||
                !title.trim() ||
                !workOrderValid ||
                (!linked && (!equipmentId || !partId))
              }
            >
              إنشاء الإجراء
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Attach — or correct — the SAP PM order number on an action that already exists.
 * Clearing the field unlinks it, which is the way back out of a typo.
 */
function WorkOrderDialog({
  action,
  onClose,
}: {
  action: ActionRow | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {action ? (
          // Keyed so the field is remounted per action and starts on the number
          // that action already carries, instead of an empty box that would wipe it.
          <WorkOrderForm key={action.action_id} action={action} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function WorkOrderForm({
  action,
  onClose,
}: {
  action: ActionRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(action.sap_work_order ?? "");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = value.trim();
  const valid = !trimmed || WORK_ORDER_PATTERN.test(trimmed);

  async function submit() {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_actions")
      .update({ sap_work_order: trimmed || null })
      .eq("action_id", action.action_id);
    setSubmitting(false);
    if (error) {
      toast.error("فشل حفظ رقم أمر الشغل");
      return;
    }
    toast.success(trimmed ? "تم ربط أمر الشغل" : "تم إلغاء ربط أمر الشغل");
    onClose();
    router.refresh();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>أمر الشغل في SAP — {action.action_code}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>رقم أمر الشغل</Label>
          <Input
            dir="ltr"
            inputMode="numeric"
            className="font-mono"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="مثال: 4000123456"
          />
          <p
            className={cn(
              "text-xs",
              valid ? "text-muted-foreground" : "text-red-600 dark:text-red-400"
            )}
          >
            {valid
              ? "اتركه فاضي لو عايز تشيل الربط"
              : "أرقام وحروف إنجليزية وشرطات فقط"}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting || !valid}>
            حفظ
          </Button>
        </DialogFooter>
      </div>
    </>
  );
}

function CompleteActionDialog({
  action,
  onClose,
}: {
  action: ActionRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!action) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_actions")
      .update({
        status: "Completed",
        completion_note: note.trim() || null,
        completion_date: new Date().toISOString(),
      })
      .eq("action_id", action.action_id);
    setSubmitting(false);
    if (error) {
      toast.error("فشل إكمال الإجراء");
      return;
    }
    toast.success("تم إكمال الإجراء");
    setNote("");
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إكمال الإجراء {action?.action_code}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>ملاحظة الإكمال</Label>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ما الذي تم عمله؟"
            />
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={submitting}>
              تأكيد الإكمال
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
