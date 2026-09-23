"use client";

import { useMemo, useState } from "react";
import { Copy, FileDown, Loader2, Mail, Send } from "lucide-react";
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
import { issueCount, type ReportData } from "@/lib/report-pdf";
import { isNoteworthy } from "@/components/whatsapp-share";
import { ExtraRecipients } from "@/components/extra-recipients";
import { PLACEHOLDER_DOMAIN, useExtraRecipients } from "@/lib/report-recipients";
import { inferMeasurement } from "@/lib/measurement";
import {
  equipmentLabel,
  equipmentSection,
  equipmentTags,
  type EquipmentRef,
} from "@/lib/equipment-ref";
import { ROLE_LABELS_AR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { VIA_EQUIPMENT_LINE_PATH, VIA_FINDING_LINE_PATH } from "@/lib/line-filter";
import type { ProductionLine } from "@/lib/production-line";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The flagged items, inline in the email body. A manager reading on a phone should
 * get the substance without having to open the PDF attachment first.
 */
function issuesTableHtml(d: ReportData): string {
  const rows = d.completed.flatMap((c) =>
    c.issues.map((i) => {
      const bits = [i.reading, i.result].filter(Boolean).join(" · ");
      return `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px">
          <b>${escapeHtml(c.equipment)}</b>
          ${c.tags ? `<span style="color:#888;font-size:11px"> ${escapeHtml(c.tags)}</span>` : ""}
          <br>
          <span style="color:#555">${escapeHtml(i.label)}</span>
          ${bits ? `<br><span style="color:#ea580c;font-size:11px">${escapeHtml(bits)}</span>` : ""}
        </td>
        <!-- dir=auto because this is the inspector's own words: Arabic as often as
             English, and the email body is the one place it survives intact. -->
        <td dir="auto" style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;color:#333">
          ${i.note ? escapeHtml(i.note) : "-"}
        </td>
      </tr>`;
    })
  );
  if (rows.length === 0) return "";
  return `
    <div style="font-size:13px;font-weight:bold;color:#252a5e;margin:0 0 6px">
      Checklist Items Needing Attention (${rows.length})
    </div>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px">
      <tr style="background:#252a5e;color:#fff">
        <td style="padding:6px 8px;font-size:11px">Equipment / Item</td>
        <td style="padding:6px 8px;font-size:11px">Inspector Note</td>
      </tr>
      ${rows.join("")}
    </table>`;
}

// The email body is where most managers stop reading, so the two backlog lists
// carry the machine and the section with them rather than pointing at the PDF.
const HTML_LIST_LIMIT = 15;

function backlogTableHtml(
  title: string,
  headers: [string, string, string],
  rows: [string, string, string][],
  total: number
): string {
  if (rows.length === 0) return "";
  const more =
    total > rows.length
      ? `<tr><td colspan="3" style="padding:6px 8px;font-size:11px;color:#888">
           ... and ${total - rows.length} more in the attached PDF</td></tr>`
      : "";
  return `
    <div style="font-size:13px;font-weight:bold;color:#252a5e;margin:0 0 6px">
      ${escapeHtml(title)} (${total})
    </div>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px">
      <tr style="background:#252a5e;color:#fff">
        ${headers.map((h) => `<td style="padding:6px 8px;font-size:11px">${escapeHtml(h)}</td>`).join("")}
      </tr>
      ${rows
        .map(
          (r) => `<tr>${r
            .map(
              (cell) =>
                `<td dir="auto" style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;color:#333">${escapeHtml(
                  cell
                )}</td>`
            )
            .join("")}</tr>`
        )
        .join("")}
      ${more}
    </table>`;
}

function buildEmailHtml(d: ReportData): string {
  const chip = (label: string, val: number) =>
    `<td style="padding:12px;background:#f3f0fa;border-radius:8px;text-align:center">
       <div style="font-size:22px;font-weight:bold;color:#252a5e">${val}</div>
       <div style="font-size:11px;color:#666">${label}</div></td>`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:600px;margin:auto">
    <div style="background:#252a5e;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
      <div style="font-size:12px;opacity:.8;letter-spacing:.5px">AMREYAH CEMENT</div>
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
        ${chip("Items Flagged", issueCount(d))}
        ${chip("Open Findings", d.findings.length)}
        ${chip("Open Maintenance", d.actions.length)}
      </tr></table>
      ${issuesTableHtml(d)}
      ${backlogTableHtml(
        "Open Findings",
        ["Equipment / Section", "Finding", "Severity"],
        d.findings
          .slice(0, HTML_LIST_LIMIT)
          .map((f) => [
            f.section ? `${f.equipment} — ${f.section}` : f.equipment,
            `${f.title} (${f.code})`,
            f.severity,
          ]),
        d.findings.length
      )}
      ${backlogTableHtml(
        "Open Maintenance Actions",
        ["Equipment / Section", "Action", "Status"],
        d.actions
          .slice(0, HTML_LIST_LIMIT)
          .map((a) => [
            a.section ? `${a.equipment} — ${a.section}` : a.equipment,
            a.target ? `${a.title} (target ${a.target})` : a.title,
            a.status,
          ]),
        d.actions.length
      )}
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
  is_manager: boolean;
};
type CompletedRow = {
  task_code: string;
  completion_date: string | null;
  condition_rating: Enums<"equipment_condition"> | null;
  completed_by: string | null;
  assigned_user_id: string | null;
  inspection_activities: { activity_name: string } | null;
  equipment: EquipmentRef;
  inspection_task_checklist_items: {
    label: string;
    result: Enums<"checklist_result"> | null;
    measured_value: number | null;
    notes: string | null;
    sort_order: number;
  }[];
};
type FindingRow = {
  finding_code: string;
  finding_title: string;
  severity: Enums<"priority_level">;
  equipment: EquipmentRef;
};
type ActionRow = {
  action_title: string;
  status: Enums<"action_status">;
  target_date: string | null;
  // An action raised from a finding has no equipment_id of its own; the machine is
  // only reachable through the finding it came from.
  equipment: EquipmentRef;
  inspection_findings: { equipment: EquipmentRef } | null;
};

export function DailyReportButton({
  senderName,
  line,
}: {
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
  const [data, setData] = useState<{
    completed: CompletedRow[];
    findings: FindingRow[];
    actions: ActionRow[];
    nameById: Map<string, string>;
  } | null>(null);

  const todayISO = new Date().toISOString().slice(0, 10);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const startOfDay = `${todayISO}T00:00:00`;
    const [rec, comp, finds, ownActs, findingActs, profs] = await Promise.all([
      supabase.rpc("get_report_recipients"),
      supabase
        .from("inspection_tasks")
        .select(
          `task_code, completion_date, condition_rating, completed_by, assigned_user_id,
           inspection_activities ( activity_name ),
           equipment!inner (
             equipment_name, equipment_code, functional_location,
             sections!inner ( section_name, areas!inner ( production_line ) )
           ),
           inspection_task_checklist_items ( label, result, measured_value, notes, sort_order )`
        )
        .eq(VIA_EQUIPMENT_LINE_PATH, line)
        .eq("status", "Completed")
        .gte("completion_date", startOfDay)
        .order("completion_date", { ascending: false }),
      supabase
        .from("inspection_findings")
        .select(
          `finding_code, finding_title, severity,
           equipment!inner (
             equipment_name, equipment_code, functional_location,
             sections!inner ( section_name, areas!inner ( production_line ) )
           )`
        )
        .eq(VIA_EQUIPMENT_LINE_PATH, line)
        .neq("status", "Closed")
        .order("created_at", { ascending: false })
        .limit(60),
      // An action either names its own machine or borrows the one on the finding
      // it came from. Asking for only one of the two would leave whole categories
      // of open work out of the report, so both are fetched and merged.
      supabase
        .from("maintenance_actions")
        .select(
          `action_title, status, target_date, created_at,
           equipment!inner (
             equipment_name, equipment_code, functional_location,
             sections!inner ( section_name, areas!inner ( production_line ) )
           ),
           inspection_findings (
             equipment ( equipment_name, equipment_code, functional_location, sections ( section_name ) )
           )`
        )
        .eq(VIA_EQUIPMENT_LINE_PATH, line)
        .not("status", "in", "(Completed,Verified,Cancelled)")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("maintenance_actions")
        .select(
          `action_title, status, target_date, created_at,
           equipment (
             equipment_name, equipment_code, functional_location,
             sections ( section_name )
           ),
           inspection_findings!inner (
             equipment!inner (
               equipment_name, equipment_code, functional_location,
               sections!inner ( section_name, areas!inner ( production_line ) )
             )
           )`
        )
        .is("equipment_id", null)
        .eq(VIA_FINDING_LINE_PATH, line)
        .not("status", "in", "(Completed,Verified,Cancelled)")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase.from("profiles").select("id, full_name"),
    ]);

    // Disjoint by construction — the second bucket only takes rows the first
    // cannot match — so the merge cannot repeat an action.
    const acts = [...(ownActs.data ?? []), ...(findingActs.data ?? [])]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 60);

    const recs = (rec.data ?? []) as Recipient[];
    setRecipients(recs);
    // default to managers with a real address; "الكل" adds everyone else
    setSelected(
      new Set(
        recs
          .filter((r) => r.is_manager && r.email && !r.email.endsWith(PLACEHOLDER_DOMAIN))
          .map((r) => r.email)
      )
    );
    setData({
      completed: (comp.data ?? []) as unknown as CompletedRow[],
      findings: (finds.data ?? []) as unknown as FindingRow[],
      actions: acts as unknown as ActionRow[],
      nameById: new Map((profs.data ?? []).map((p) => [p.id, p.full_name])),
    });
    setLoading(false);
  }

  // The line goes in the subject: the two lines send a report each on the same
  // day to the same managers, and an inbox with two identical subjects is a
  // report nobody can file.
  const subject = `Daily Inspection Report — Line ${line} — ${todayISO}`;

  // English report data used for both the PDF and the email body
  const reportData: ReportData | null = useMemo(() => {
    if (!data) return null;
    return {
      date: todayISO,
      preparedBy: senderName,
      note: note.trim() || undefined,
      completed: data.completed.map((t) => {
        const inspectorId = t.completed_by ?? t.assigned_user_id;
        return {
          section: equipmentSection(t.equipment) ?? "Unassigned",
          equipment: t.equipment?.equipment_name ?? "Equipment",
          tags: equipmentTags(t.equipment).join(" · "),
          activity: t.inspection_activities?.activity_name ?? "Inspection",
          condition: t.condition_rating ?? null,
          taskCode: t.task_code,
          inspector: inspectorId ? data.nameById.get(inspectorId) ?? null : null,
          issues: [...t.inspection_task_checklist_items]
            .sort((a, b) => a.sort_order - b.sort_order)
            .filter(isNoteworthy)
            .map((i) => {
              const unit = inferMeasurement(i.label).unit;
              return {
                label: i.label,
                result: i.result,
                reading:
                  i.measured_value != null
                    ? `${i.measured_value}${unit ? ` ${unit}` : ""}`
                    : null,
                note: i.notes?.trim() || null,
              };
            }),
        };
      }),
      findings: data.findings.map((f) => ({
        severity: f.severity,
        equipment: equipmentLabel(f.equipment, "-"),
        section: equipmentSection(f.equipment),
        title: f.finding_title,
        code: f.finding_code,
      })),
      actions: data.actions.map((a) => {
        const eq = a.inspection_findings?.equipment ?? a.equipment;
        return {
          title: a.action_title,
          equipment: equipmentLabel(eq, "-"),
          section: equipmentSection(eq),
          status: a.status,
          target: a.target_date,
        };
      }),
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
      // Grouped by section so the reader can tell at a glance which part of the
      // plant was covered today and which was not touched at all.
      const bySection = new Map<string, typeof reportData.completed>();
      for (const t of reportData.completed) {
        bySection.set(t.section, [...(bySection.get(t.section) ?? []), t]);
      }
      for (const [sectionName, rows] of [...bySection].sort((a, b) =>
        a[0].localeCompare(b[0])
      )) {
        L.push("");
        L.push(`  ${sectionName} (${rows.length}):`);
        for (const t of rows) {
          const loc = t.tags ? ` (${t.tags})` : "";
          const cond = t.condition ? ` — Condition: ${t.condition}` : "";
          const who = t.inspector ? ` — by ${t.inspector}` : "";
          L.push(`  - ${t.equipment}${loc}: ${t.activity}${cond}${who}`);
          for (const i of t.issues) {
            const verdict = i.result ? ` [${i.result}]` : "";
            const reading = i.reading ? ` = ${i.reading}` : "";
            const note = i.note ? ` — "${i.note}"` : "";
            L.push(`      * ${i.label}${reading}${verdict}${note}`);
          }
        }
      }
    } else {
      L.push("- None");
    }

    L.push("");
    L.push(`Checklist Items Needing Attention: ${issueCount(reportData)}`);

    L.push("");
    L.push(`Open Findings / Issues (${reportData.findings.length}):`);
    if (reportData.findings.length) {
      reportData.findings.slice(0, 25).forEach((f) => {
        const where = f.section ? ` [${f.section}]` : "";
        L.push(`- [${f.severity}] ${f.equipment}${where}: ${f.title} (${f.code})`);
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
        const where = a.section ? ` [${a.section}]` : "";
        L.push(`- ${a.equipment}${where}: ${a.title} — ${a.status}${target}`);
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

  // users whose address can actually receive mail (placeholder domain can't)
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>المستلمون ({allEmails.length} من {selectable.length})</Label>
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
                      setSelected(
                        new Set(reachable.filter((r) => r.is_manager).map((r) => r.email))
                      )
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
              idPrefix="daily"
              extras={extras}
              selected={selected}
              onToggle={toggle}
              onAdd={addExtras}
              onForget={forgetExtras}
            />

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
