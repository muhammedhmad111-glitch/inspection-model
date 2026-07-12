"use client";

import { useMemo, useState } from "react";
import { Copy, FileDown, Loader2, Mail, Send } from "lucide-react";
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
import type { ReportData } from "@/lib/report-pdf";
import { ROLE_LABELS_AR } from "@/lib/constants";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(d: ReportData): string {
  const chip = (label: string, val: number) =>
    `<td style="padding:12px;background:#f3f0fa;border-radius:8px;text-align:center">
       <div style="font-size:22px;font-weight:bold;color:#631cbe">${val}</div>
       <div style="font-size:11px;color:#666">${label}</div></td>`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:600px;margin:auto">
    <div style="background:#631cbe;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
      <div style="font-size:12px;opacity:.8;letter-spacing:.5px">CIMPOR AMREYAH</div>
      <div style="font-size:22px;font-weight:bold">Daily Inspection Report</div>
      <div style="font-size:12px;opacity:.85;margin-top:2px">${escapeHtml(d.date)}</div>
    </div>
    <div style="border:1px solid #eee;border-top:0;padding:22px;border-radius:0 0 12px 12px">
      <p style="margin:0 0 14px">Prepared by: <b>${escapeHtml(d.preparedBy || "-")}</b></p>
      ${
        d.note
          ? `<p style="background:#fff9e6;padding:10px 12px;border-radius:8px;font-size:13px;margin:0 0 14px">${escapeHtml(
              d.note
            )}</p>`
          : ""
      }
      <table style="width:100%;border-spacing:8px;margin:0 -8px 14px"><tr>
        ${chip("Completed", d.completed.length)}
        ${chip("Open Findings", d.findings.length)}
        ${chip("Open Maintenance", d.actions.length)}
      </tr></table>
      <p style="font-size:14px">Please find the detailed inspection report attached as a PDF.</p>
      <p style="color:#999;font-size:12px;margin-top:18px;border-top:1px solid #eee;padding-top:12px">
        Sent automatically from CPIIS — Inspection Management System
      </p>
    </div>
  </div>`;
}

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
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
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
        .limit(60),
      supabase
        .from("maintenance_actions")
        .select(`action_title, status, target_date`)
        .not("status", "in", "(Completed,Verified,Cancelled)")
        .order("created_at", { ascending: false })
        .limit(60),
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

  const subject = `Daily Inspection Report — ${todayISO}`;

  // English report data used for both the PDF and the email body
  const reportData: ReportData | null = useMemo(() => {
    if (!data) return null;
    return {
      date: todayISO,
      preparedBy: senderName,
      note: note.trim() || undefined,
      completed: data.completed.map((t) => ({
        equipment: t.equipment?.equipment_name ?? "Equipment",
        location: t.equipment?.functional_location ?? null,
        activity: t.inspection_activities?.activity_name ?? "Inspection",
        condition: t.condition_rating ?? null,
      })),
      findings: data.findings.map((f) => ({
        severity: f.severity,
        equipment: f.equipment?.equipment_name ?? null,
        title: f.finding_title,
        code: f.finding_code,
      })),
      actions: data.actions.map((a) => ({
        title: a.action_title,
        status: a.status,
        target: a.target_date,
      })),
    };
  }, [data, note, senderName, todayISO]);

  // English plain-text body for the email
  const body = useMemo(() => {
    if (!reportData) return "";
    const L: string[] = [];
    L.push(subject);
    L.push(`Prepared by: ${reportData.preparedBy || "-"}`);
    if (reportData.note) {
      L.push("");
      L.push(`Note: ${reportData.note}`);
    }

    L.push("");
    L.push(`Completed Inspections Today (${reportData.completed.length}):`);
    if (reportData.completed.length) {
      reportData.completed.slice(0, 25).forEach((t) => {
        const loc = t.location ? ` (${t.location})` : "";
        const cond = t.condition ? ` — Condition: ${t.condition}` : "";
        L.push(`- ${t.equipment}${loc}: ${t.activity}${cond}`);
      });
      if (reportData.completed.length > 25)
        L.push(`... and ${reportData.completed.length - 25} more`);
    } else {
      L.push("- None");
    }

    L.push("");
    L.push(`Open Findings / Issues (${reportData.findings.length}):`);
    if (reportData.findings.length) {
      reportData.findings.slice(0, 25).forEach((f) => {
        const eq = f.equipment ? `${f.equipment}: ` : "";
        L.push(`- [${f.severity}] ${eq}${f.title} (${f.code})`);
      });
      if (reportData.findings.length > 25)
        L.push(`... and ${reportData.findings.length - 25} more`);
    } else {
      L.push("- None");
    }

    L.push("");
    L.push(`Open Maintenance Actions (${reportData.actions.length}):`);
    if (reportData.actions.length) {
      reportData.actions.slice(0, 25).forEach((a) => {
        const target = a.target ? ` (Target: ${a.target})` : "";
        L.push(`- ${a.title} — ${a.status}${target}`);
      });
      if (reportData.actions.length > 25)
        L.push(`... and ${reportData.actions.length - 25} more`);
    } else {
      L.push("- None");
    }

    L.push("");
    L.push("The detailed PDF report is attached.");
    L.push("— Sent from CPIIS Inspection Management System");
    return L.join("\r\n");
  }, [reportData, subject]);

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

  async function downloadPdf(): Promise<boolean> {
    if (!reportData) return false;
    setGenerating(true);
    try {
      const { buildReportPdf } = await import("@/lib/report-pdf");
      const doc = buildReportPdf(reportData);
      doc.save(`Daily-Inspection-Report-${todayISO}.pdf`);
      return true;
    } catch {
      toast.error("Failed to generate PDF");
      return false;
    } finally {
      setGenerating(false);
    }
  }

  async function onlyPdf() {
    const ok = await downloadPdf();
    if (ok) toast.success("PDF report downloaded");
  }

  async function sendAuto() {
    if (!reportData) return;
    if (allEmails.length === 0) {
      toast.error("اختر مستلمًا واحدًا على الأقل أو أضف إيميل");
      return;
    }
    setSending(true);
    try {
      const { buildReportPdf } = await import("@/lib/report-pdf");
      const doc = buildReportPdf(reportData);
      const pdfBase64 = doc.output("datauristring").split("base64,")[1];
      const supabase = createClient();
      const { data: res, error } = await supabase.functions.invoke("send-report", {
        body: {
          to: allEmails,
          subject,
          text: body,
          html: buildEmailHtml(reportData),
          filename: `Daily-Inspection-Report-${todayISO}.pdf`,
          pdfBase64,
        },
      });
      if (error) {
        let msg = "تعذّر إرسال الإيميل";
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const b = await ctx.json();
            if (b?.error) msg = b.error;
          }
        } catch {
          // keep generic message
        }
        toast.error(msg);
        return;
      }
      if (res && (res as { error?: string }).error) {
        toast.error((res as { error?: string }).error as string);
        return;
      }
      toast.success(`تم إرسال التقرير إلى ${allEmails.length} مستلم ✅`);
      setOpen(false);
    } catch {
      toast.error("تعذّر توليد أو إرسال التقرير");
    } finally {
      setSending(false);
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Report copied");
    } catch {
      toast.error("Copy failed");
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
          <DialogTitle>تقرير التفتيش اليومي (PDF إنجليزي)</DialogTitle>
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
              <Label htmlFor="note">Note (English, optional)</Label>
              <Textarea
                id="note"
                dir="ltr"
                rows={2}
                placeholder="Any note to add at the top of the report..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Email preview</Label>
              <Textarea
                readOnly
                dir="ltr"
                rows={8}
                value={body}
                className="font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2 sm:gap-2">
          <Button variant="ghost" onClick={copyReport} disabled={loading || !data}>
            <Copy className="size-4" />
            نسخ
          </Button>
          <Button
            variant="outline"
            onClick={onlyPdf}
            disabled={loading || !data || generating}
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            تنزيل PDF
          </Button>
          <Button
            onClick={sendAuto}
            disabled={loading || !data || sending || allEmails.length === 0}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            إرسال تلقائي ({allEmails.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
