"use client";

import { useMemo, useState } from "react";
import { FileDown, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { ExtraRecipients } from "@/components/extra-recipients";
import { PLACEHOLDER_DOMAIN, useExtraRecipients } from "@/lib/report-recipients";
import { ROLE_LABELS_AR } from "@/lib/constants";
import {
  daysWaiting,
  pmEquipmentLabel,
  PM_REASON_LABELS_EN,
  type PmReportData,
} from "@/lib/pm-report";
import { cn } from "@/lib/utils";
import type { ProductionLine } from "@/lib/production-line";

type Recipient = {
  id: string;
  full_name: string;
  role: Enums<"app_user_role">;
  email: string;
  is_manager: boolean;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HTML_LIST_LIMIT = 20;

function tableHtml(
  title: string,
  headers: string[],
  rows: string[][],
  total: number
): string {
  if (rows.length === 0) return "";
  const more =
    total > rows.length
      ? `<tr><td colspan="${headers.length}" style="padding:6px 8px;font-size:11px;color:#888">
           ... and ${total - rows.length} more in the attached PDF</td></tr>`
      : "";
  return `
    <div style="font-size:14px;font-weight:bold;color:#252a5e;margin:18px 0 6px">
      ${escapeHtml(title)} (${total})
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#252a5e;color:#fff">
        ${headers
          .map((h) => `<td style="padding:6px 8px;font-size:11px">${escapeHtml(h)}</td>`)
          .join("")}
      </tr>
      ${rows
        .map(
          (r) =>
            `<tr>${r
              .map(
                (c) =>
                  `<td dir="auto" style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;color:#333">${escapeHtml(
                    c
                  )}</td>`
              )
              .join("")}</tr>`
        )
        .join("")}
      ${more}
    </table>`;
}

function buildEmailHtml(d: PmReportData, preparedBy: string, note: string): string {
  const chip = (label: string, val: number) =>
    `<td style="padding:12px;background:#f3f0fa;border-radius:8px;text-align:center">
       <div style="font-size:22px;font-weight:bold;color:#252a5e">${val}</div>
       <div style="font-size:11px;color:#666">${label}</div></td>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:640px;margin:auto">
    <div style="background:#252a5e;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
      <div style="font-size:12px;opacity:.8;letter-spacing:.5px">AMREYAH CEMENT</div>
      <div style="font-size:22px;font-weight:bold">Weekly PM Report</div>
      <div style="font-size:12px;opacity:.85;margin-top:2px">${escapeHtml(
        d.weekStart
      )} → ${escapeHtml(d.weekEnd)}</div>
    </div>
    <div style="border:1px solid #eee;border-top:0;padding:22px;border-radius:0 0 12px 12px">
      <p style="margin:0 0 14px">Prepared by: <b>${escapeHtml(preparedBy || "-")}</b></p>
      ${
        note.trim()
          ? `<p dir="auto" style="background:#fff9e6;padding:10px 12px;border-radius:8px;font-size:13px;margin:0 0 14px">${escapeHtml(
              note.trim()
            )}</p>`
          : ""
      }
      <table style="width:100%;border-spacing:8px;margin:0 -8px 8px"><tr>
        ${chip("Inspections", d.completed.length)}
        ${chip("Maintenance done", d.actions.length)}
        ${chip("Shutdown checks", d.shutdownItems.length)}
        ${chip("Queued for next stop", d.waitingShutdown.length)}
      </tr></table>

      ${tableHtml(
        "Maintenance Work Carried Out",
        ["Equipment / Section", "Work done", "SAP WO"],
        d.actions
          .slice(0, HTML_LIST_LIMIT)
          .map((a) => [
            a.section ? `${pmEquipmentLabel(a)} — ${a.section}` : pmEquipmentLabel(a),
            a.note ? `${a.title} — ${a.note}` : a.title,
            a.sapWorkOrder ?? "-",
          ]),
        d.actions.length
      )}

      ${tableHtml(
        "Checks Requiring the Equipment Stopped",
        ["Equipment", "Check", "Why", "Inspector note"],
        d.shutdownItems
          .slice(0, HTML_LIST_LIMIT)
          .map((i) => [
            pmEquipmentLabel(i),
            i.label,
            PM_REASON_LABELS_EN[i.reason],
            i.notes?.trim() || "-",
          ]),
        d.shutdownItems.length
      )}

      ${tableHtml(
        "Queued for the Next Shutdown",
        ["Priority", "Equipment", "Work", "Waiting"],
        d.waitingShutdown
          .slice(0, HTML_LIST_LIMIT)
          .map((a) => [
            a.priority,
            pmEquipmentLabel(a),
            a.title,
            `${daysWaiting(a.waitingSince)} days`,
          ]),
        d.waitingShutdown.length
      )}

      <p style="font-size:14px;margin-top:18px">
        The full PM report is attached as a PDF.
      </p>
      <p style="color:#999;font-size:12px;margin-top:18px;border-top:1px solid #eee;padding-top:12px">
        Sent automatically from CPIIS — Inspection Management System
      </p>
    </div>
  </div>`;
}

/**
 * Sends the PM report on its own. Deliberately not folded into the daily or the
 * weekly send: the shutdown report goes to the maintenance side of the plant and
 * on its own schedule, and merging them would mean one of the two always going to
 * people who did not ask for it.
 */
export function PmReportSend({
  data,
  senderName,
  line,
}: {
  data: PmReportData;
  senderName: string;
  line: ProductionLine;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { extras, add: addExtra, forget: forgetExtra } = useExtraRecipients();
  const [note, setNote] = useState("");

  // Line in both the filename and the subject: the two lines' PM reports land in
  // the same inbox in the same hour, and one overwriting the other on disk is a
  // week of shutdown work lost.
  const filename = `Weekly-PM-Report-Line${line}-${data.weekStart}.pdf`;
  const subject = `Weekly PM Report — Line ${line} — ${data.weekStart} to ${data.weekEnd}`;

  async function loadRecipients() {
    setLoading(true);
    const supabase = createClient();
    const { data: rec } = await supabase.rpc("get_report_recipients");
    const recs = (rec ?? []) as Recipient[];
    setRecipients(recs);
    setSelected(
      new Set(
        recs
          .filter((r) => r.is_manager && r.email && !r.email.endsWith(PLACEHOLDER_DOMAIN))
          .map((r) => r.email)
      )
    );
    setLoading(false);
  }

  const body = useMemo(() => {
    const L: string[] = [];
    L.push(subject);
    L.push(`Prepared by: ${senderName || "-"}`);
    if (note.trim()) {
      L.push("");
      L.push(`Note: ${note.trim()}`);
    }

    L.push("");
    L.push(`Inspections completed (${data.completed.length}):`);
    data.completed.slice(0, 25).forEach((c) => {
      L.push(
        `- ${pmEquipmentLabel(c)}${c.section ? ` [${c.section}]` : ""}: ${
          c.activity ?? "Inspection"
        } — ${c.flagged}/${c.items} items flagged`
      );
    });
    if (data.completed.length > 25) L.push(`... and ${data.completed.length - 25} more`);

    L.push("");
    L.push(`Maintenance work carried out (${data.actions.length}):`);
    if (data.actions.length) {
      data.actions.slice(0, 25).forEach((a) => {
        const wo = a.sapWorkOrder ? ` (SAP ${a.sapWorkOrder})` : "";
        const what = a.note ? `${a.title} — ${a.note}` : a.title;
        L.push(`- ${pmEquipmentLabel(a)}: ${what}${wo}`);
      });
      if (data.actions.length > 25) L.push(`... and ${data.actions.length - 25} more`);
    } else {
      L.push("- None closed in this window");
    }

    L.push("");
    L.push(`Checks requiring the equipment stopped (${data.shutdownItems.length}):`);
    if (data.shutdownItems.length) {
      data.shutdownItems.slice(0, 25).forEach((i) => {
        const n = i.notes?.trim() ? ` — "${i.notes.trim()}"` : "";
        L.push(
          `- ${pmEquipmentLabel(i)}: ${i.label} [${PM_REASON_LABELS_EN[i.reason]}]${n}`
        );
      });
      if (data.shutdownItems.length > 25)
        L.push(`... and ${data.shutdownItems.length - 25} more`);
    } else {
      L.push("- None recorded");
    }

    L.push("");
    L.push(`Queued for the next shutdown (${data.waitingShutdown.length}):`);
    if (data.waitingShutdown.length) {
      data.waitingShutdown.slice(0, 25).forEach((a) => {
        L.push(
          `- [${a.priority}] ${pmEquipmentLabel(a)}: ${a.title} — waiting ${daysWaiting(
            a.waitingSince
          )} days`
        );
      });
      if (data.waitingShutdown.length > 25)
        L.push(`... and ${data.waitingShutdown.length - 25} more`);
    } else {
      L.push("- Nothing waiting on a shutdown");
    }

    L.push("");
    L.push("The detailed PM report is attached as a PDF.");
    L.push("— Sent from CPIIS Inspection Management System");
    return L.join("\r\n");
  }, [data, note, senderName, subject]);

  const reachable = recipients.filter((r) => !r.email.endsWith(PLACEHOLDER_DOMAIN));
  const selectable = [
    ...new Set([...reachable.map((r) => r.email), ...extras.map((e) => e.email)]),
  ];
  // Intersect rather than read `selected` straight: an address that was ticked and
  // then removed from the list must not still be mailed.
  const allEmails = selectable.filter((e) => selected.has(e));

  function toggle(email: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  async function addExtras(emails: string[]) {
    let unsaved = 0;
    for (const email of emails) {
      if ((await addExtra(email)) === "unsaved") unsaved++;
    }
    setSelected((cur) => new Set([...cur, ...emails]));
    if (unsaved) {
      toast.warning("الإيميلات هتتبعت دلوقتي بس مش هتتحفظ — محتاج صلاحية التقارير");
    }
  }

  async function forgetExtras(email: string) {
    if (!(await forgetExtra(email))) {
      toast.error("مش مسموح لك تحذف من القائمة");
      return;
    }
    setSelected((cur) => {
      const next = new Set(cur);
      next.delete(email);
      return next;
    });
  }

  async function downloadPdf() {
    setGenerating(true);
    try {
      const { buildPmReportPdf } = await import("@/lib/pm-report-pdf");
      buildPmReportPdf({ ...data, preparedBy: senderName, note }).save(filename);
      toast.success("تم تنزيل الـ PDF ✅");
    } catch {
      toast.error("تعذّر توليد الـ PDF");
    } finally {
      setGenerating(false);
    }
  }

  async function send() {
    if (allEmails.length === 0) {
      toast.error("اختر مستلمًا واحدًا على الأقل أو أضف إيميل");
      return;
    }
    setSending(true);
    try {
      const { buildPmReportPdf } = await import("@/lib/pm-report-pdf");
      const doc = buildPmReportPdf({ ...data, preparedBy: senderName, note });
      const pdfBase64 = doc.output("datauristring").split("base64,")[1];

      const supabase = createClient();
      const { data: res, error } = await supabase.functions.invoke("send-report", {
        body: {
          to: allEmails,
          subject,
          text: body,
          html: buildEmailHtml(data, senderName, note),
          filename,
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
      toast.success(`تم إرسال تقرير الـ PM إلى ${allEmails.length} مستلم ✅`);
      setOpen(false);
    } catch {
      toast.error("تعذّر توليد أو إرسال التقرير");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="rounded-xl" onClick={downloadPdf} disabled={generating}>
        {generating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileDown className="size-4" />
        )}
        تنزيل PDF
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next && recipients.length === 0) loadRecipients();
        }}
      >
        <DialogTrigger asChild>
          <Button className="rounded-xl">
            <Mail className="size-4" />
            إرسال بالإيميل
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>إرسال تقرير الـ PM الأسبوعي (PDF إنجليزي)</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground" dir="ltr">
                {data.weekStart} → {data.weekEnd}
              </p>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>
                    المستلمون ({allEmails.length} من {selectable.length})
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg px-2 text-xs"
                      onClick={() => setSelected(new Set(selectable))}
                    >
                      الكل
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-lg px-2 text-xs"
                      onClick={() => setSelected(new Set())}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
                {recipients.length ? (
                  <div className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-xl border p-2">
                    {recipients.map((r) => {
                      const isPlaceholder = r.email.endsWith(PLACEHOLDER_DOMAIN);
                      return (
                        <label
                          key={r.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-2 py-1.5",
                            isPlaceholder
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer hover:bg-muted"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={selected.has(r.email)}
                            disabled={isPlaceholder}
                            onChange={() => toggle(r.email)}
                          />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">
                              {r.full_name}
                              <span className="text-xs font-normal text-muted-foreground">
                                {" · "}
                                {ROLE_LABELS_AR[r.role]}
                              </span>
                            </span>
                            <span
                              className="truncate font-mono text-xs text-muted-foreground"
                              dir="ltr"
                            >
                              {r.email}
                              {isPlaceholder ? " — إيميل غير حقيقي" : ""}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا يوجد مستخدمون نشطون بعد</p>
                )}
              </div>

              <ExtraRecipients
                idPrefix="pm"
                extras={extras}
                selected={selected}
                onToggle={toggle}
                onAdd={addExtras}
                onForget={forgetExtras}
              />

              <div className="flex flex-col gap-2">
                <Label htmlFor="pm-note">ملاحظة على التقرير (اختياري)</Label>
                <Textarea
                  id="pm-note"
                  rows={2}
                  placeholder="أي ملاحظة تظهر أعلى التقرير..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>معاينة الإيميل</Label>
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

          <DialogFooter>
            <Button onClick={send} disabled={loading || sending || allEmails.length === 0}>
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              إرسال ({allEmails.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
