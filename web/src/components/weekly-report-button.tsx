"use client";

import { useMemo, useState } from "react";
import { CalendarRange, FileDown, Film, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Player } from "@remotion/player";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/types";
import { ExtraRecipients } from "@/components/extra-recipients";
import { PLACEHOLDER_DOMAIN, useExtraRecipients } from "@/lib/report-recipients";
import { ROLE_LABELS_AR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  WeeklyReportVideo,
  WEEKLY_REPORT_DURATION,
  WEEKLY_FPS,
  WEEKLY_WIDTH,
  WEEKLY_HEIGHT,
  weeklyFindingWhere,
  type WeeklyReportVideoProps,
} from "@/remotion/weekly-report";

type Recipient = {
  id: string;
  full_name: string;
  role: Enums<"app_user_role">;
  email: string;
  is_manager: boolean;
};

/** What get_weekly_report_data returns — the sender's name is added client-side. */
type WeeklyPayload = Omit<WeeklyReportVideoProps, "preparedBy">;


function iso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  // Built from local parts on purpose: toISOString() shifts to UTC and can hand
  // back the previous day for anyone east of Greenwich.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Sunday that opens the week, `offset` weeks back from today. */
function weekStartISO(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  return iso(d);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sign(now: number, before: number): string {
  const diff = now - before;
  if (diff === 0) return "no change";
  return `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}`;
}

function buildEmailHtml(d: WeeklyReportVideoProps, note: string, videoUrl: string | null): string {
  const chip = (label: string, val: number, sub: string) =>
    `<td style="padding:14px 10px;background:#f3f0fa;border-radius:8px;text-align:center;vertical-align:top">
       <div style="font-size:26px;font-weight:bold;color:#252a5e">${val}</div>
       <div style="font-size:11px;color:#666;margin-top:4px">${label}</div>
       <div style="font-size:10px;color:#8a8a8a;margin-top:3px">${sub}</div></td>`;

  const findingRows = d.topFindings
    .map(
      (f) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;font-weight:bold;color:${
          f.severity === "Critical" ? "#dc2626" : f.severity === "High" ? "#ea580c" : "#b45309"
        }">${escapeHtml(f.severity)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:12px">${escapeHtml(
          f.title
        )}<div style="color:#888;font-size:11px;margin-top:2px">${escapeHtml(
          weeklyFindingWhere(f)
        )}</div></td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;color:#666">${escapeHtml(
          f.code
        )}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:640px;margin:auto">
    <div style="background:#252a5e;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
      <div style="font-size:12px;opacity:.8;letter-spacing:.5px">AMREYAH CEMENT</div>
      <div style="font-size:22px;font-weight:bold">Weekly Inspection Report</div>
      <div style="font-size:12px;opacity:.85;margin-top:2px">${escapeHtml(
        d.weekStart
      )} → ${escapeHtml(d.weekEnd)}</div>
    </div>
    <div style="border:1px solid #eee;border-top:0;padding:22px;border-radius:0 0 12px 12px">
      <p style="margin:0 0 14px">Prepared by: <b>${escapeHtml(d.preparedBy || "-")}</b></p>
      ${
        note.trim()
          ? `<p style="background:#fff9e6;padding:10px 12px;border-radius:8px;font-size:13px;margin:0 0 14px">${escapeHtml(
              note.trim()
            )}</p>`
          : ""
      }
      <table style="width:100%;border-spacing:6px;margin:0 -6px 16px"><tr>
        ${chip("Inspections completed", d.totals.completed, sign(d.totals.completed, d.previous.completed) + " vs last week")}
        ${chip("New findings", d.totals.newFindings, sign(d.totals.newFindings, d.previous.newFindings) + " vs last week")}
        ${chip("New actions", d.totals.newActions, sign(d.totals.newActions, d.previous.newActions) + " vs last week")}
        ${chip("Overdue inspections", d.totals.overdueTasks, "still outstanding")}
      </tr></table>

      ${
        videoUrl
          ? `<div style="text-align:center;margin:22px 0">
               <a href="${escapeHtml(videoUrl)}"
                  style="display:inline-block;background:#252a5e;color:#fff;text-decoration:none;
                         padding:14px 28px;border-radius:10px;font-size:15px;font-weight:bold">
                 ▶ Watch the weekly summary video
               </a>
               <div style="font-size:11px;color:#999;margin-top:8px">Link valid for 90 days</div>
             </div>`
          : ""
      }

      ${
        findingRows
          ? `<div style="font-size:14px;font-weight:bold;color:#252a5e;margin:18px 0 8px">
               Highest severity open findings
             </div>
             <table style="width:100%;border-collapse:collapse">${findingRows}</table>`
          : ""
      }

      <p style="font-size:13px;margin-top:18px">
        ${d.totals.openFindings} findings and ${d.totals.openActions} maintenance actions remain open.
        Full detail is in the attached PDF.
      </p>
      <p style="color:#999;font-size:12px;margin-top:18px;border-top:1px solid #eee;padding-top:12px">
        Sent automatically from CPIIS — Inspection Management System
      </p>
    </div>
  </div>`;
}

export function WeeklyReportButton({ senderName }: { senderName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [offset, setOffset] = useState("0");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { extras, add: addExtra, forget: forgetExtra } = useExtraRecipients();
  const [note, setNote] = useState("");
  const [payload, setPayload] = useState<WeeklyPayload | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const reportData: WeeklyReportVideoProps | null = useMemo(
    () => (payload ? { ...payload, preparedBy: senderName } : null),
    [payload, senderName]
  );

  async function loadWeek(nextOffset: string, withRecipients: boolean) {
    setLoading(true);
    // A render belongs to one week; switching weeks throws the old link away.
    setVideoUrl(null);
    const supabase = createClient();
    const weekStart = weekStartISO(Number(nextOffset));
    const [rec, week] = await Promise.all([
      withRecipients ? supabase.rpc("get_report_recipients") : Promise.resolve(null),
      supabase.rpc("get_weekly_report_data", { p_week_start: weekStart }),
    ]);

    if (rec) {
      const recs = (rec.data ?? []) as Recipient[];
      setRecipients(recs);
      setSelected(
        new Set(
          recs
            .filter((r) => r.is_manager && r.email && !r.email.endsWith(PLACEHOLDER_DOMAIN))
            .map((r) => r.email)
        )
      );
    }
    if (week.error) {
      toast.error("تعذّر تحميل بيانات الأسبوع");
    } else {
      setPayload(week.data as unknown as WeeklyPayload);
    }
    setLoading(false);
  }

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

  // A freshly added address is what the user is about to send to — tick it for them.
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

  const subject = reportData
    ? `Weekly Inspection Report — ${reportData.weekStart} to ${reportData.weekEnd}`
    : "Weekly Inspection Report";

  const body = useMemo(() => {
    if (!reportData) return "";
    const L: string[] = [];
    L.push(subject);
    L.push(`Prepared by: ${reportData.preparedBy || "-"}`);
    if (note.trim()) {
      L.push("");
      L.push(`Note: ${note.trim()}`);
    }
    L.push("");
    L.push("This week:");
    L.push(
      `- Inspections completed: ${reportData.totals.completed} (last week ${reportData.previous.completed})`
    );
    L.push(
      `- New findings: ${reportData.totals.newFindings} (last week ${reportData.previous.newFindings})`
    );
    L.push(
      `- New maintenance actions: ${reportData.totals.newActions} (last week ${reportData.previous.newActions})`
    );
    L.push(`- Actions closed: ${reportData.totals.closedActions}`);
    L.push("");
    L.push(
      `Still open: ${reportData.totals.openFindings} findings, ${reportData.totals.openActions} actions, ${reportData.totals.overdueTasks} overdue inspections.`
    );

    if (reportData.bySection.length) {
      L.push("");
      L.push("By section:");
      reportData.bySection.forEach((s) =>
        L.push(`- ${s.name}: ${s.completed} inspections, ${s.findings} findings`)
      );
    }
    if (reportData.topFindings.length) {
      L.push("");
      L.push("Highest severity open findings:");
      reportData.topFindings.forEach((f) =>
        L.push(
          `- [${f.severity}] ${weeklyFindingWhere(f)}: ${f.title} (${f.code})`
        )
      );
    }
    if (videoUrl) {
      L.push("");
      L.push(`Weekly summary video (valid 90 days): ${videoUrl}`);
    }
    L.push("");
    L.push("The detailed PDF report is attached.");
    L.push("— Sent from CPIIS Inspection Management System");
    return L.join("\r\n");
  }, [reportData, subject, note, videoUrl]);

  /** Renders the video server-side and keeps the signed link. Returns it, or null. */
  async function renderVideo(): Promise<string | null> {
    if (!reportData) return null;
    setRendering(true);
    try {
      const res = await fetch("/api/render-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });
      const json = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (!res.ok || !json?.url) {
        toast.error(json?.error || "تعذّر توليد الفيديو");
        return null;
      }
      setVideoUrl(json.url);
      return json.url;
    } catch {
      toast.error("تعذّر توليد الفيديو");
      return null;
    } finally {
      setRendering(false);
    }
  }

  async function downloadPdf() {
    if (!reportData) return;
    setGenerating(true);
    try {
      const { buildWeeklyReportPdf } = await import("@/lib/weekly-report-pdf");
      buildWeeklyReportPdf({ ...reportData, note }).save(
        `Weekly-Inspection-Report-${reportData.weekStart}.pdf`
      );
      toast.success("تم تنزيل PDF ✅");
    } catch {
      toast.error("تعذّر توليد الـ PDF");
    } finally {
      setGenerating(false);
    }
  }

  async function send() {
    if (!reportData) return;
    if (allEmails.length === 0) {
      toast.error("اختر مستلمًا واحدًا على الأقل أو أضف إيميل");
      return;
    }
    setSending(true);
    try {
      // Render on demand, but never let a failed render block the report itself —
      // the numbers matter more than the animation.
      const link = videoUrl ?? (await renderVideo());
      if (!link) toast.warning("هيتبعت من غير فيديو");

      const { buildWeeklyReportPdf } = await import("@/lib/weekly-report-pdf");
      const doc = buildWeeklyReportPdf({ ...reportData, note });
      const pdfBase64 = doc.output("datauristring").split("base64,")[1];

      const supabase = createClient();
      const { data: res, error } = await supabase.functions.invoke("send-report", {
        body: {
          to: allEmails,
          subject,
          text: body,
          html: buildEmailHtml(reportData, note, link),
          filename: `Weekly-Inspection-Report-${reportData.weekStart}.pdf`,
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
      toast.success(`تم إرسال التقرير الأسبوعي إلى ${allEmails.length} مستلم ✅`);
      setOpen(false);
    } catch {
      toast.error("تعذّر توليد أو إرسال التقرير");
    } finally {
      setSending(false);
    }
  }

  const busy = rendering || sending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && !payload) loadWeek(offset, true);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          <CalendarRange className="size-4" />
          تقرير أسبوعي
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>التقرير الأسبوعي (PDF إنجليزي + فيديو)</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>الأسبوع</Label>
              <Select
                value={offset}
                onValueChange={(v) => {
                  setOffset(v);
                  loadWeek(v, false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">هذا الأسبوع</SelectItem>
                  <SelectItem value="-1">الأسبوع الماضي</SelectItem>
                  <SelectItem value="-2">قبل أسبوعين</SelectItem>
                </SelectContent>
              </Select>
              {reportData ? (
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {reportData.weekStart} → {reportData.weekEnd} ·{" "}
                  {reportData.totals.completed} فحص · {reportData.totals.newFindings} ملاحظة
                  جديدة
                </p>
              ) : null}
            </div>

            {reportData ? (
              <div className="flex flex-col gap-2">
                <Label>معاينة الفيديو</Label>
                <Player
                  component={WeeklyReportVideo}
                  inputProps={reportData}
                  durationInFrames={WEEKLY_REPORT_DURATION}
                  fps={WEEKLY_FPS}
                  compositionWidth={WEEKLY_WIDTH}
                  compositionHeight={WEEKLY_HEIGHT}
                  controls
                  loop
                  style={{
                    width: "100%",
                    aspectRatio: `${WEEKLY_WIDTH} / ${WEEKLY_HEIGHT}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                />
                {videoUrl ? (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline"
                    dir="ltr"
                  >
                    الفيديو جاهز — افتح الرابط
                  </a>
                ) : null}
              </div>
            ) : null}

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
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-lg px-2 text-xs"
                    onClick={() =>
                      setSelected(new Set(reachable.filter((r) => r.is_manager).map((r) => r.email)))
                    }
                  >
                    المديرون فقط
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
                <div className="flex max-h-44 flex-col gap-1 overflow-y-auto rounded-xl border p-2">
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
                          <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                            {r.full_name}
                            <span className="text-xs font-normal text-muted-foreground">
                              · {ROLE_LABELS_AR[r.role]}
                            </span>
                            {r.is_manager ? (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                إدارة
                              </span>
                            ) : null}
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
              idPrefix="weekly"
              extras={extras}
              selected={selected}
              onToggle={toggle}
              onAdd={addExtras}
              onForget={forgetExtras}
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="weekly-note">Note (English, optional)</Label>
              <Textarea
                id="weekly-note"
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
          <Button
            variant="ghost"
            onClick={renderVideo}
            disabled={loading || !payload || busy}
          >
            {rendering ? <Loader2 className="size-4 animate-spin" /> : <Film className="size-4" />}
            {rendering ? "جارٍ توليد الفيديو…" : "توليد الفيديو"}
          </Button>
          <Button
            variant="outline"
            onClick={downloadPdf}
            disabled={loading || !payload || generating}
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            تنزيل PDF
          </Button>
          <Button onClick={send} disabled={loading || !payload || busy || allEmails.length === 0}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            إرسال ({allEmails.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
