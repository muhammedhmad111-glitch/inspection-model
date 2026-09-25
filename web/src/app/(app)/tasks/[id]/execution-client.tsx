"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Enums, Tables } from "@/lib/supabase/types";
import { Constants } from "@/lib/supabase/types";
import { Attachments } from "@/components/attachments";
import { ChecklistPhotos } from "@/components/checklist-photos";
import {
  attachmentUrl,
  deleteAttachment,
  type Attachment,
} from "@/lib/attachments";
import {
  WhatsappShare,
  isNoteworthy,
  type ShareFinding,
} from "@/components/whatsapp-share";
import { EquipmentRefText } from "@/components/equipment-ref";
import type { EquipmentRef } from "@/lib/equipment-ref";
import { cn } from "@/lib/utils";
import { inferMeasurement, rangeHint, verdictFor } from "@/lib/measurement";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABELS_AR,
  CHECKLIST_RESULT_ACTIVE_CLASS,
  CHECKLIST_RESULT_LABELS_AR,
  FINDING_TYPE_LABELS_AR,
  CONDITION_BADGE_CLASS,
  CONDITION_LABELS_AR,
  FREQUENCY_BADGE_CLASS,
  FREQUENCY_LABELS_AR,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
  TASK_STATUS_BADGE_CLASS,
  TASK_STATUS_LABELS_AR,
} from "@/lib/constants";

type Task = Tables<"inspection_tasks"> & {
  inspection_activities: {
    activity_name: string;
    activity_code: string;
    inspection_category: Enums<"inspection_category">;
    frequency_type: Enums<"frequency_type">;
    standard_checklist: Tables<"inspection_activities">["standard_checklist"];
    acceptance_criteria: string | null;
    failure_criteria: string | null;
  } | null;
  equipment: EquipmentRef;
  equipment_parts: { part_name: string; part_code: string } | null;
};

type Item = Tables<"inspection_task_checklist_items">;

const RESULT_OPTIONS = Constants.public.Enums.checklist_result;

export function ExecutionClient({
  task,
  initialItems,
  initialPhotos,
  findings,
  inspectorName,
  backHref,
  labelsAr,
}: {
  task: Task;
  initialItems: Item[];
  initialPhotos: Attachment[];
  findings: ShareFinding[];
  inspectorName: string | null;
  backHref: string;
  /** Arabic wording by normalised English label, for the items on this round.
   *  Partial by design: an item with no entry yet simply reads in English. */
  labelsAr: Record<string, string>;
}) {
  const router = useRouter();
  const cameFromCalendar = backHref.startsWith("/calendar");
  const [items, setItems] = useState<Item[]>(initialItems);
  const [photos, setPhotos] = useState<Attachment[]>(initialPhotos);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [condition, setCondition] = useState<Enums<"equipment_condition"> | null>(null);
  const [finalNotes, setFinalNotes] = useState("");
  const [findingOpen, setFindingOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  // Set when the share sheet was opened straight after completing, so closing
  // it takes the inspector back to the list they came from.
  const [returnOnShareClose, setReturnOnShareClose] = useState(false);

  const isClosed = ["Completed", "Cancelled", "Skipped"].includes(task.status);
  // Photos stay open after the round is signed off, unlike the results: evidence
  // often gets added while writing up the report, and it changes no verdict.
  const canAttach = !["Cancelled", "Skipped"].includes(task.status);
  const isStarted = task.status === "In Progress" || items.length > 0;
  const doneCount = items.filter((i) => i.result !== null).length;
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const plannedCount = useMemo(() => {
    const cl = task.inspection_activities?.standard_checklist;
    return Array.isArray(cl) ? cl.length : 0;
  }, [task]);

  const photosByItem = useMemo(() => {
    const map = new Map<string, Attachment[]>();
    for (const p of photos) {
      const arr = map.get(p.entity_id) ?? [];
      arr.push(p);
      map.set(p.entity_id, arr);
    }
    return map;
  }, [photos]);

  // The checklist as the summary card and the WhatsApp report want it: each item
  // carrying the public URLs of its own photos, and its Arabic wording if one
  // has been written. `label` is left untouched — it is what tells the report
  // which items carry a reading.
  const shareItems = useMemo(
    () =>
      items.map((i) => ({
        ...i,
        label_ar: i.label_norm ? labelsAr[i.label_norm] ?? null : null,
        photos: (photosByItem.get(i.id) ?? []).map((p) => attachmentUrl(p.storage_path)),
      })),
    [items, photosByItem, labelsAr]
  );

  // Everything the inspector flagged, wrote about or photographed, in one place —
  // otherwise the one item that matters is buried among thirty cards saying "سليم".
  const noteworthy = useMemo(() => shareItems.filter(isNoteworthy), [shareItems]);

  async function removePhoto(att: Attachment) {
    const prev = photos;
    setPhotos((cur) => cur.filter((p) => p.attachment_id !== att.attachment_id));
    if (!(await deleteAttachment(att))) {
      setPhotos(prev);
      toast.error("فشل حذف الصورة");
    }
  }

  async function start() {
    setStarting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("start_inspection_task", {
      p_task_id: task.inspection_task_id,
    });
    if (error) {
      setStarting(false);
      toast.error("فشل بدء الفحص: " + error.message);
      return;
    }
    const { data } = await supabase
      .from("inspection_task_checklist_items")
      .select("*")
      .eq("inspection_task_id", task.inspection_task_id)
      .order("sort_order");
    setItems(data ?? []);
    setStarting(false);
    toast.success("تم بدء الفحص");
    router.refresh();
  }

  async function setResult(item: Item, result: Enums<"checklist_result">) {
    const prev = items;
    setItems((cur) =>
      cur.map((i) => (i.id === item.id ? { ...i, result } : i))
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("inspection_task_checklist_items")
      .update({ result })
      .eq("id", item.id);
    if (error) {
      setItems(prev);
      toast.error("فشل حفظ النتيجة");
    }
  }

  async function saveNotes(item: Item, value: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("inspection_task_checklist_items")
      .update({ notes: value || null })
      .eq("id", item.id);
    if (error) toast.error("فشل الحفظ");
  }

  // Save a measurement + auto-apply the healthy/attention/out-of-range verdict.
  async function saveMeasured(item: Item, value: string) {
    const num = value === "" ? null : Number(value);
    const spec = inferMeasurement(item.label);
    const verdict = num == null ? null : verdictFor(num, spec);
    setItems((cur) =>
      cur.map((i) =>
        i.id === item.id
          ? { ...i, measured_value: num, ...(verdict ? { result: verdict } : {}) }
          : i
      )
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("inspection_task_checklist_items")
      .update({ measured_value: num, ...(verdict ? { result: verdict } : {}) })
      .eq("id", item.id);
    if (error) toast.error("فشل حفظ القراءة");
  }

  async function complete() {
    if (!condition) return;
    setCompleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("complete_inspection_task", {
      p_task_id: task.inspection_task_id,
      p_condition: condition,
      p_notes: finalNotes || null,
    });
    setCompleting(false);
    if (error) {
      toast.error(
        error.message.includes("CHECKLIST_INCOMPLETE")
          ? "أكمل جميع بنود الفحص أولاً"
          : "فشل إنهاء الفحص: " + error.message
      );
      return;
    }
    setCompleteOpen(false);
    toast.success("تم إنهاء الفحص وتوليد الدورة التالية");
    router.refresh();
    // Offer to send the report first; closing the sheet returns to the list.
    setReturnOnShareClose(true);
    setShareOpen(true);
  }

  function closeShare(next: boolean) {
    setShareOpen(next);
    if (!next && returnOnShareClose) {
      setReturnOnShareClose(false);
      router.push(backHref);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link
        href={backHref}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        {cameFromCalendar ? "عودة للتقويم" : "عودة للمهام"}
      </Link>

      {/* header card */}
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold">
                {task.inspection_activities?.activity_name ?? "مهمة فحص"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <EquipmentRefText
                  equipment={task.equipment}
                  part={task.equipment_parts?.part_name}
                />
              </p>
            </div>
            <Badge className={TASK_STATUS_BADGE_CLASS[task.status]}>
              {TASK_STATUS_LABELS_AR[task.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {task.inspection_activities ? (
              <>
                <Badge variant="secondary">
                  {CATEGORY_LABELS_AR[task.inspection_activities.inspection_category]}
                </Badge>
                <Badge
                  className={FREQUENCY_BADGE_CLASS[task.inspection_activities.frequency_type]}
                >
                  {FREQUENCY_LABELS_AR[task.inspection_activities.frequency_type]}
                </Badge>
              </>
            ) : null}
            <Badge className={PRIORITY_BADGE_CLASS[task.priority]}>
              {PRIORITY_LABELS_AR[task.priority]}
            </Badge>
            {task.condition_rating ? (
              <Badge className={CONDITION_BADGE_CLASS[task.condition_rating]}>
                حالة المعدة: {CONDITION_LABELS_AR[task.condition_rating]}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              الاستحقاق: <span className="font-mono" dir="ltr">{task.due_date}</span>
            </span>
            <span>
              الدورة: <span className="font-mono">{task.recurrence_cycle}</span>
            </span>
            <span>
              الكود: <span className="font-mono" dir="ltr">{task.task_code}</span>
            </span>
          </div>

          {isStarted && !isClosed ? (
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>التقدم</span>
                <span>
                  {doneCount} / {items.length}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-brand-purple to-brand-pink transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {!isStarted && !isClosed ? (
            <Button onClick={start} disabled={starting} size="lg" className="rounded-2xl">
              {starting ? <Loader2 className="animate-spin" /> : <Play />}
              بدء الفحص ({plannedCount} بند)
            </Button>
          ) : null}

          {isStarted ? (
            <Button
              variant="outline"
              className="rounded-2xl border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40"
              onClick={() => setFindingOpen(true)}
            >
              <AlertTriangle className="size-4" />
              تسجيل ملاحظة
            </Button>
          ) : null}

          {task.status === "Completed" ? (
            <Button
              className="rounded-2xl bg-[#25D366] text-white hover:bg-[#1eb955]"
              onClick={() => setShareOpen(true)}
            >
              <MessageCircle className="size-4" />
              إرسال الفحص على واتساب
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* summary of what the round actually turned up */}
      {noteworthy.length > 0 ? (
        <Card className="rounded-3xl border-0 bg-amber-50/70 shadow-sm dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-3 pt-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-700 dark:text-amber-400" />
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                ملخص البنود المحتاجة انتباه ({noteworthy.length} من {items.length})
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {noteworthy.map((i) => {
                const unit = inferMeasurement(i.label).unit;
                return (
                  <div key={i.id} className="rounded-2xl bg-background/80 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium" dir="auto">
                        {i.label_ar ?? i.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {i.measured_value != null ? (
                          <Badge variant="outline" className="font-mono" dir="ltr">
                            {i.measured_value}
                            {unit ? ` ${unit}` : ""}
                          </Badge>
                        ) : null}
                        {i.result ? (
                          <Badge className={CHECKLIST_RESULT_ACTIVE_CLASS[i.result]}>
                            {CHECKLIST_RESULT_LABELS_AR[i.result]}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    {i.notes?.trim() ? (
                      <p className="mt-1 text-sm text-muted-foreground" dir="auto">
                        {i.notes.trim()}
                      </p>
                    ) : null}
                    {i.photos.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {i.photos.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt=""
                              className="size-14 rounded-xl border object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              الملاحظات دي بتظهر كمان في صفحة الملاحظات وفي التقرير اليومي، والصور
              بتتبعت مع تقرير الواتساب.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* attachments */}
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardContent className="pt-5">
          <Attachments
            entityType="task"
            entityId={task.inspection_task_id}
            canEdit={canAttach}
          />
        </CardContent>
      </Card>

      {/* checklist */}
      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              labelAr={item.label_norm ? labelsAr[item.label_norm] ?? null : null}
              idx={idx}
              isClosed={isClosed}
              photos={photosByItem.get(item.id) ?? []}
              canAttach={canAttach}
              onAddPhotos={(rows) => setPhotos((cur) => [...cur, ...rows])}
              onRemovePhoto={removePhoto}
              onSetResult={setResult}
              onSaveMeasured={saveMeasured}
              onSaveNotes={saveNotes}
            />
          ))}

          {!isClosed ? (
            <Button
              size="lg"
              className="rounded-2xl"
              disabled={doneCount < items.length}
              onClick={() => setCompleteOpen(true)}
            >
              <CheckCircle2 />
              {doneCount < items.length
                ? `أكمل البنود المتبقية (${items.length - doneCount})`
                : "إنهاء الفحص"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {task.notes ? (
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="pt-5 text-sm">
            <p className="mb-1 font-semibold">ملاحظات الفحص</p>
            <p className="text-muted-foreground" dir="auto">
              {task.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* finding dialog */}
      <FindingDialog
        open={findingOpen}
        onOpenChange={setFindingOpen}
        task={task}
      />

      {/* whatsapp report sheet */}
      <WhatsappShare
        open={shareOpen}
        onOpenChange={closeShare}
        items={shareItems}
        findings={findings}
        task={{
          taskCode: task.task_code,
          equipment: task.equipment,
          part: task.equipment_parts?.part_name ?? null,
          activity: task.inspection_activities?.activity_name ?? "فحص",
          completionDate: task.completion_date,
          dueDate: task.due_date,
          condition: task.condition_rating,
          notes: task.notes,
          inspector: inspectorName,
        }}
      />

      {/* completion dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إنهاء الفحص</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm font-medium">حالة المعدة العامة</p>
              <div className="flex flex-wrap gap-2">
                {Constants.public.Enums.equipment_condition.map((c) => (
                  <Button
                    key={c}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-xl",
                      condition === c &&
                        "border-primary bg-primary text-primary-foreground hover:bg-primary"
                    )}
                    onClick={() => setCondition(c)}
                  >
                    {CONDITION_LABELS_AR[c]}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">ملاحظات عامة (اختياري)</p>
              <Textarea
                rows={3}
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={complete} disabled={!condition || completing}>
                {completing ? <Loader2 className="animate-spin" /> : null}
                تأكيد الإنهاء
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemCard({
  item,
  labelAr,
  idx,
  isClosed,
  photos,
  canAttach,
  onAddPhotos,
  onRemovePhoto,
  onSetResult,
  onSaveMeasured,
  onSaveNotes,
}: {
  item: Item;
  /** Null until this sentence has been translated; the card then reads English. */
  labelAr: string | null;
  idx: number;
  isClosed: boolean;
  photos: Attachment[];
  canAttach: boolean;
  onAddPhotos: (rows: Attachment[]) => void;
  onRemovePhoto: (att: Attachment) => void;
  onSetResult: (item: Item, r: Enums<"checklist_result">) => void;
  onSaveMeasured: (item: Item, value: string) => void;
  onSaveNotes: (item: Item, value: string) => void;
}) {
  const spec = useMemo(() => inferMeasurement(item.label), [item.label]);
  const [measured, setMeasured] = useState(
    item.measured_value != null ? String(item.measured_value) : ""
  );
  const liveVerdict =
    spec.kind === "numeric" && measured !== "" && !Number.isNaN(Number(measured))
      ? verdictFor(Number(measured), spec)
      : null;
  const hint = rangeHint(spec);

  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex flex-col gap-1">
          <p className="font-medium" dir={labelAr ? "rtl" : "ltr"}>
            <span className="text-muted-foreground">{idx + 1}.</span>{" "}
            {labelAr ?? item.label}
          </p>
          {/* The sheet's own wording, kept under the translation rather than
              replaced by it: it is what is written in the IJP binder and on the
              machine, and it is how a wrong translation gets spotted. */}
          {labelAr ? (
            <p className="text-xs leading-snug text-muted-foreground" dir="ltr">
              {item.label}
            </p>
          ) : null}
        </div>

        {spec.kind === "numeric" ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <Label className="text-sm">
                {spec.nameAr ?? "القياس"}{" "}
                {spec.unit ? (
                  <span className="text-muted-foreground">({spec.unit})</span>
                ) : null}
              </Label>
              {hint ? (
                <span className="text-xs text-muted-foreground">{hint}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  inputMode="decimal"
                  dir="ltr"
                  placeholder="أدخل القراءة"
                  value={measured}
                  disabled={isClosed}
                  onChange={(e) => setMeasured(e.target.value)}
                  onBlur={(e) => onSaveMeasured(item, e.target.value)}
                  className={spec.unit ? "pr-12" : undefined}
                />
                {spec.unit ? (
                  <span
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-foreground"
                    dir="ltr"
                  >
                    {spec.unit}
                  </span>
                ) : null}
              </div>
              {liveVerdict ? (
                <Badge className={CHECKLIST_RESULT_ACTIVE_CLASS[liveVerdict]}>
                  {CHECKLIST_RESULT_LABELS_AR[liveVerdict]}
                </Badge>
              ) : null}
            </div>
          </div>
        ) : null}

        {spec.kind === "scale" && spec.options ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-3">
            <Label className="text-sm">{spec.nameAr}</Label>
            <div className="flex flex-wrap gap-2">
              {spec.options.map((opt) => (
                <Button
                  key={opt.label}
                  variant="outline"
                  size="sm"
                  disabled={isClosed}
                  className={cn(
                    "min-h-9 rounded-xl",
                    item.result === opt.verdict &&
                      CHECKLIST_RESULT_ACTIVE_CLASS[opt.verdict]
                  )}
                  onClick={() => onSetResult(item, opt.verdict)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {/* generic result buttons — the fallback, and always available to override */}
        <div className="flex flex-wrap gap-2">
          {RESULT_OPTIONS.map((r) => (
            <Button
              key={r}
              variant="outline"
              size="sm"
              disabled={isClosed}
              className={cn(
                "min-h-9 rounded-xl",
                spec.kind !== "visual" && "text-xs",
                item.result === r && CHECKLIST_RESULT_ACTIVE_CLASS[r]
              )}
              onClick={() => onSetResult(item, r)}
            >
              {CHECKLIST_RESULT_LABELS_AR[r]}
            </Button>
          ))}
        </div>

        <Input
          placeholder="ملاحظات (اختياري)"
          defaultValue={item.notes ?? ""}
          disabled={isClosed}
          onBlur={(e) => onSaveNotes(item, e.target.value)}
        />

        <ChecklistPhotos
          itemId={item.id}
          photos={photos}
          canEdit={canAttach}
          onAdded={onAddPhotos}
          onRemove={onRemovePhoto}
        />
      </CardContent>
    </Card>
  );
}

function FindingDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [findingType, setFindingType] = useState<Enums<"finding_type">>("Mechanical");
  const [severity, setSeverity] = useState<Enums<"priority_level">>("Medium");
  const [recommended, setRecommended] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("inspection_findings").insert({
      inspection_task_id: task.inspection_task_id,
      equipment_id: task.equipment_id,
      equipment_part_id: task.equipment_part_id,
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
    setTitle("");
    setDescription("");
    setRecommended("");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تسجيل ملاحظة فحص</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
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
            <Button onClick={submit} disabled={submitting || !title.trim()}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              تسجيل الملاحظة
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
