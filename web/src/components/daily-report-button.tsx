"use client";

import { useMemo, useState } from "react";
import { Copy, Loader2, Mail, Send } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/types";
import {
  ACTION_STATUS_LABELS_AR,
  CONDITION_LABELS_AR,
  PRIORITY_LABELS_AR,
  ROLE_LABELS_AR,
} from "@/lib/constants";

type Recipient = {
  id: string;
  full_name: string;
  role: Enums<"app_user_role">;
  email: string;
};
type CompletedRow = {
  completion_date: string | null;
  condition_rating: Enums<"equipment_condition"> | null;
  inspection_activities: { activity_name: string } | null;
  equipment: { equipment_name: string; functional_location: string | null } | null;
};
type FindingRow = {
  finding_code: string;
  finding_title: string;
  severity: Enums<"priority_level">;
  equipment: { equipment_name: string } | null;
};
type ActionRow = {
  action_title: string;
  status: Enums<"action_status">;
  target_date: string | null;
};

const PLACEHOLDER_DOMAIN = "@cimpor-amreyah.local";

export function DailyReportButton({ senderName }: { senderName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manual, setManual] = useState("");
  const [note, setNote] = useState("");
  const [data, setData] = useState<{
    completed: CompletedRow[];
    findings: FindingRow[];
    actions: ActionRow[];
  } | null>(null);

  const todayISO = new Date().toISOString().slice(0, 10);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const startOfDay = `${todayISO}T00:00:00`;
    const [rec, comp, finds, acts] = await Promise.all([
      supabase.rpc("get_report_recipients"),
      supabase
        .from("inspection_tasks")
        .select(
          `completion_date, condition_rating,
           inspection_activities ( activity_name ),
           equipment ( equipment_name, functional_location )`
        )
        .eq("status", "Completed")
        .gte("completion_date", startOfDay)
        .order("completion_date", { ascending: false }),
      supabase
        .from("inspection_findings")
        .select(`finding_code, finding_title, severity, equipment ( equipment_name )`)
        .neq("status", "Closed")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("maintenance_actions")
        .select(`action_title, status, target_date`)
        .not("status", "in", "(Completed,Verified,Cancelled)")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const recs = (rec.data ?? []) as Recipient[];
    setRecipients(recs);
    setSelected(
      new Set(
        recs
          .filter((r) => r.email && !r.email.endsWith(PLACEHOLDER_DOMAIN))
          .map((r) => r.email)
      )
    );
    setData({
      completed: (comp.data ?? []) as unknown as CompletedRow[],
      findings: (finds.data ?? []) as unknown as FindingRow[],
      actions: (acts.data ?? []) as unknown as ActionRow[],
    });
    setLoading(false);
  }

  const subject = `تقرير التفتيش اليومي — ${todayISO}`;

  const body = useMemo(() => {
    if (!data) return "";
    const L: string[] = [];
    L.push(subject);
    L.push(`المُعِدّ: ${senderName || "—"}`);
    if (note.trim()) {
      L.push("");
      L.push(`ملاحظة عامة: ${note.trim()}`);
    }

    L.push("");
    L.push(`■ التاسكات المنفّذة اليوم (${data.completed.length}):`);
    if (data.completed.length) {
      data.completed.slice(0, 25).forEach((t) => {
        const eq = t.equipment
          ? t.equipment.functional_location
            ? `${t.equipment.equipment_name} (${t.equipment.functional_location})`
            : t.equipment.equipment_name
          : "معدة";
        const cond = t.condition_rating
          ? ` — الحالة: ${CONDITION_LABELS_AR[t.condition_rating]}`
          : "";
        L.push(`• ${eq}: ${t.inspection_activities?.activity_name ?? "فحص"}${cond}`);
      });
      if (data.completed.length > 25) L.push(`… و${data.completed.length - 25} أخرى`);
    } else {
      L.push("• لا يوجد");
    }

    L.push("");
    L.push(`■ الملاحظات / المشاكل المفتوحة (${data.findings.length}):`);
    if (data.findings.length) {
      data.findings.slice(0, 25).forEach((f) => {
        const eq = f.equipment?.equipment_name ? `${f.equipment.equipment_name}: ` : "";
        L.push(`• [${PRIORITY_LABELS_AR[f.severity]}] ${eq}${f.finding_title} (${f.finding_code})`);
      });
      if (data.findings.length > 25) L.push(`… و${data.findings.length - 25} أخرى`);
    } else {
      L.push("• لا يوجد");
    }

    L.push("");
    L.push(`■ إجراءات الصيانة المفتوحة (${data.actions.length}):`);
    if (data.actions.length) {
      data.actions.slice(0, 25).forEach((a) => {
        const target = a.target_date ? ` (مستهدف: ${a.target_date})` : "";
        L.push(`• ${a.action_title} — ${ACTION_STATUS_LABELS_AR[a.status]}${target}`);
      });
      if (data.actions.length > 25) L.push(`… و${data.actions.length - 25} أخرى`);
    } else {
      L.push("• لا يوجد");
    }

    L.push("");
    L.push("— أُرسل من نظام CPIIS لإدارة التفتيش");
    return L.join("\r\n");
  }, [data, note, senderName, subject]);

  const manualEmails = manual
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes("@"));

  const allEmails = [...new Set([...selected, ...manualEmails])];

  function toggle(email: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function send() {
    if (allEmails.length === 0) {
      toast.error("اختر مستلمًا واحدًا على الأقل أو أضف إيميل");
      return;
    }
    const url = `mailto:${allEmails.join(",")}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    toast.success("تم فتح بريدك بالتقرير جاهزًا");
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("تم نسخ التقرير");
    } catch {
      toast.error("تعذّر النسخ");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && !data) load();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          <Mail className="size-4" />
          إرسال تقرير يومي
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تقرير التفتيش اليومي</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>المستلمون (مديرون)</Label>
              {recipients.length ? (
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-xl border p-2">
                  {recipients.map((r) => {
                    const isPlaceholder = r.email.endsWith(PLACEHOLDER_DOMAIN);
                    return (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={selected.has(r.email)}
                          onChange={() => toggle(r.email)}
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">
                            {r.full_name}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              · {ROLE_LABELS_AR[r.role]}
                            </span>
                          </span>
                          <span
                            className="truncate font-mono text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {r.email}
                            {isPlaceholder ? " (غير حقيقي)" : ""}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا يوجد مديرون مسجّلون بعد</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="manual">إيميلات إضافية (اختياري)</Label>
              <Input
                id="manual"
                dir="ltr"
                placeholder="name@example.com, other@example.com"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="note">ملاحظة عامة (اختياري)</Label>
              <Textarea
                id="note"
                rows={2}
                placeholder="أي ملاحظة تحب تضيفها لأول التقرير..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>معاينة التقرير</Label>
              <Textarea
                readOnly
                rows={8}
                value={body}
                className="font-mono text-xs leading-relaxed"
                dir="rtl"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={copyReport} disabled={loading || !data}>
            <Copy className="size-4" />
            نسخ
          </Button>
          <Button onClick={send} disabled={loading || !data || allEmails.length === 0}>
            <Send className="size-4" />
            فتح البريد ({allEmails.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
