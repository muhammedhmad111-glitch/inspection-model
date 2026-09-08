"use client";

import { useMemo, useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Enums } from "@/lib/supabase/types";
import { inferMeasurement } from "@/lib/measurement";
import {
  CHECKLIST_RESULT_LABELS_AR,
  CONDITION_LABELS_AR,
  PRIORITY_LABELS_AR,
} from "@/lib/constants";

export type ShareItem = {
  label: string;
  result: Enums<"checklist_result"> | null;
  measured_value: number | null;
  notes: string | null;
  /** Public URLs of the photos taken at this item. Optional: the daily report
   *  builds ShareItems from a query that does not join attachments. */
  photos?: string[] | null;
};

export type ShareFinding = {
  finding_code: string;
  finding_title: string;
  severity: Enums<"priority_level">;
};

export type ShareTask = {
  taskCode: string;
  equipment: string;
  equipmentCode: string | null;
  location: string | null;
  part: string | null;
  activity: string;
  completionDate: string | null;
  dueDate: string;
  condition: Enums<"equipment_condition"> | null;
  notes: string | null;
  inspector: string | null;
};

const RESULT_EMOJI: Record<Enums<"checklist_result">, string> = {
  OK: "✅",
  Attention: "⚠️",
  "Not OK": "❌",
  "Not Accessible": "🚫",
  "Not Applicable": "➖",
};

// Fixed order for the summary line, best result first.
const RESULT_ORDER: Enums<"checklist_result">[] = [
  "OK",
  "Attention",
  "Not OK",
  "Not Accessible",
  "Not Applicable",
];

// Results worth spelling out item-by-item in the message.
const FLAGGED: Enums<"checklist_result">[] = ["Attention", "Not OK", "Not Accessible"];

/**
 * An item earns a line of its own if its result is flagged, or if the inspector
 * bothered to write a note or take a photo of it. A note on a passing item is
 * usually the early warning — "بيسخن شوية" on a bearing that still reads OK — and
 * dropping it was throwing away the most useful sentence in the round. A photo is
 * the same signal without the typing.
 */
export function isNoteworthy(item: ShareItem): boolean {
  return Boolean(
    (item.result && FLAGGED.includes(item.result)) ||
      item.notes?.trim() ||
      item.photos?.length
  );
}

const MAX_LISTED = 12;
// Links are long and the whole report has to stay readable in a chat bubble, so
// only the first few shots of an item go in; the rest live on the task page.
const MAX_PHOTOS_PER_ITEM = 3;

const itemsWord = (n: number) =>
  n === 1 ? "بند" : n === 2 ? "بندان" : n <= 10 ? "بنود" : "بندًا";

/** Build the Arabic WhatsApp message for one completed inspection. */
export function buildWhatsappMessage(
  task: ShareTask,
  items: ShareItem[],
  findings: ShareFinding[]
): string {
  const L: string[] = [];
  L.push(`✅ تقرير فحص مكتمل — ${task.taskCode}`);
  L.push("");

  const equipmentLine = [task.equipment, task.location ?? task.equipmentCode]
    .filter(Boolean)
    .join(" · ");
  L.push(`🏭 المعدة: ${equipmentLine}`);
  if (task.part) L.push(`⚙️ الجزء: ${task.part}`);
  L.push(`🔧 النشاط: ${task.activity}`);
  L.push(`📅 تاريخ الإنهاء: ${(task.completionDate ?? task.dueDate).slice(0, 10)}`);
  if (task.inspector) L.push(`👷 المفتش: ${task.inspector}`);
  if (task.condition) L.push(`🩺 حالة المعدة: ${CONDITION_LABELS_AR[task.condition]}`);

  if (items.length) {
    const counts = new Map<Enums<"checklist_result">, number>();
    for (const i of items) {
      if (i.result) counts.set(i.result, (counts.get(i.result) ?? 0) + 1);
    }
    L.push("");
    L.push(`📋 النتائج (${items.length} ${itemsWord(items.length)}):`);
    L.push(
      RESULT_ORDER.filter((r) => counts.has(r))
        .map((r) => `${RESULT_EMOJI[r]} ${CHECKLIST_RESULT_LABELS_AR[r]} ${counts.get(r)}`)
        .join(" · ")
    );

    const photoCount = items.reduce((n, i) => n + (i.photos?.length ?? 0), 0);
    if (photoCount) L.push(`📷 صور مرفقة: ${photoCount}`);

    const flagged = items.filter(isNoteworthy);
    if (flagged.length) {
      L.push("");
      L.push("⚠️ بنود تحتاج انتباه:");
      for (const i of flagged.slice(0, MAX_LISTED)) {
        const unit = inferMeasurement(i.label).unit;
        const reading =
          i.measured_value != null ? `: ${i.measured_value}${unit ? ` ${unit}` : ""}` : "";
        const verdict = i.result ? ` — ${CHECKLIST_RESULT_LABELS_AR[i.result]}` : "";
        const note = i.notes?.trim() ? ` (${i.notes.trim()})` : "";
        L.push(`• ${i.label}${reading}${verdict}${note}`);
        // Each link on its own line, so WhatsApp keeps it clickable instead of
        // swallowing it into the sentence around it.
        const photos = i.photos ?? [];
        for (const url of photos.slice(0, MAX_PHOTOS_PER_ITEM)) L.push(`   📷 ${url}`);
        if (photos.length > MAX_PHOTOS_PER_ITEM) {
          L.push(`   📷 +${photos.length - MAX_PHOTOS_PER_ITEM} صور أخرى على النظام`);
        }
      }
      if (flagged.length > MAX_LISTED) {
        const rest = flagged.length - MAX_LISTED;
        L.push(`• ... و${rest} ${itemsWord(rest)} آخر`);
      }
    }
  }

  if (findings.length) {
    L.push("");
    L.push(`🔴 ملاحظات مسجلة (${findings.length}):`);
    for (const f of findings.slice(0, MAX_LISTED)) {
      L.push(`• [${PRIORITY_LABELS_AR[f.severity]}] ${f.finding_title} — ${f.finding_code}`);
    }
    if (findings.length > MAX_LISTED) {
      L.push(`• ... و${findings.length - MAX_LISTED} ملاحظة أخرى`);
    }
  }

  if (task.notes?.trim()) {
    L.push("");
    L.push(`📝 ملاحظات عامة: ${task.notes.trim()}`);
  }

  L.push("");
  L.push("— نظام CPIIS للتفتيش");
  return L.join("\n");
}

export function WhatsappShare({
  task,
  items,
  findings,
  open,
  onOpenChange,
}: {
  task: ShareTask;
  items: ShareItem[];
  findings: ShareFinding[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const defaultMessage = useMemo(
    () => buildWhatsappMessage(task, items, findings),
    [task, items, findings]
  );
  const text = message || defaultMessage;

  // wa.me wants digits only with the country code, no "+". A leading zero means
  // a local number — never strip it, that would silently dial someone else.
  const digits = phone.replace(/\D/g, "");
  const badPhone = digits !== "" && (digits.startsWith("0") || digits.length < 8);

  function send() {
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ التقرير");
    } catch {
      toast.error("تعذّر النسخ");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Refresh the draft each time it opens so later edits pick up new results.
        if (next) setMessage(defaultMessage);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إرسال تقرير الفحص على واتساب</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="wa-phone">رقم المستلم (اختياري — للأفراد فقط)</Label>
            <Input
              id="wa-phone"
              dir="ltr"
              inputMode="tel"
              placeholder="201001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {badPhone ? (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                الرقم لازم يبدأ بكود الدولة من غير صفر — مثال: 201001234567 بدل
                01001234567.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                <b>للجروبات:</b> سيب الخانة دي فاضية — الواتساب هيفتح قائمة
                الشاتات وتختار منها الجروب.
                <br />
                للشخص الواحد: اكتب رقمه بكود الدولة من غير + (مصر = 20).
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="wa-text">نص الرسالة</Label>
            <Textarea
              id="wa-text"
              rows={14}
              value={text}
              onChange={(e) => setMessage(e.target.value)}
              className="text-sm leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:gap-2">
          <Button variant="ghost" onClick={copy}>
            <Copy className="size-4" />
            نسخ
          </Button>
          <Button
            onClick={send}
            disabled={badPhone}
            className="bg-[#25D366] text-white hover:bg-[#1eb955]"
          >
            <MessageCircle className="size-4" />
            {digits ? "فتح واتساب" : "اختيار جروب أو شات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
