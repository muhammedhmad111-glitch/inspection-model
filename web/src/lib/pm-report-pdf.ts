import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  daysWaiting,
  pmEquipmentLabel,
  PM_REASON_LABELS_EN,
  type PmReportData,
} from "@/lib/pm-report";

export type PmPdfData = PmReportData & { preparedBy: string; note?: string };

// jsPDF's built-in fonts only carry WinAnsi, so an Arabic note comes out as a row
// of broken boxes. Same honest marker the daily report uses.
const WIN_ANSI = /^[\x20-\x7e -ÿ–—''""•€]*$/;

function pdfSafe(text: string | null | undefined): string {
  if (!text) return "-";
  const t = text.trim();
  if (!t) return "-";
  return WIN_ANSI.test(t) ? t : "[non-Latin text - see email body]";
}

const NAVY: [number, number, number] = [37, 42, 94];
const LIGHT: [number, number, number] = [237, 236, 251];
const AMBER: [number, number, number] = [180, 83, 9];

/** Build the English weekly PM (shutdown) report PDF. */
export function buildPmReportPdf(d: PmPdfData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = 0;

  const ensure = (need: number) => {
    if (y + need > pageH - 55) {
      doc.addPage();
      y = 55;
    }
  };

  // ---- header bar ----
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 92, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 28, 36, 36, 6, 6, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("AC", M + 18, 51, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("AMREYAH CEMENT", M + 48, 40);
  doc.setFontSize(20);
  doc.text("Weekly PM Report", M + 48, 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Week: ${d.weekStart} to ${d.weekEnd}`, pageW - M, 32, { align: "right" });
  doc.text(`Prepared by: ${d.preparedBy || "-"}`, pageW - M, 48, { align: "right" });
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, pageW - M, 64, {
    align: "right",
  });

  y = 120;

  // ---- summary chips ----
  const chips: [string, string][] = [
    ["Inspections completed", String(d.completed.length)],
    ["Maintenance done", String(d.actions.length)],
    ["Shutdown checks", String(d.shutdownItems.length)],
    ["Waiting for next stop", String(d.waitingShutdown.length)],
  ];
  const chipW = (pageW - M * 2 - 30) / 4;
  chips.forEach((c, i) => {
    const x = M + i * (chipW + 10);
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, y, chipW, 48, 6, 6, "F");
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text(c[1], x + 12, y + 30);
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(c[0], x + 12, y + 42);
  });
  y += 72;

  if (d.note && d.note.trim()) {
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(
      `Note: ${pdfSafe(d.note)}`,
      pageW - M * 2 - 20
    ) as string[];
    const nh = 16 + lines.length * 12;
    ensure(nh + 10);
    doc.setFillColor(255, 249, 230);
    doc.roundedRect(M, y, pageW - M * 2, nh, 6, 6, "F");
    doc.setTextColor(120, 90, 10);
    doc.setFont("helvetica", "normal");
    doc.text(lines, M + 10, y + 18);
    y += nh + 16;
  }

  const section = (title: string) => {
    ensure(48);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, M, y);
    y += 8;
  };

  const tableAfter = () => {
    // @ts-expect-error jspdf-autotable augments the doc at runtime
    y = doc.lastAutoTable.finalY + 24;
  };

  const head = { fillColor: NAVY, textColor: 255, fontSize: 9 } as const;
  const body = { fontSize: 8, textColor: 40 } as const;

  // ---- 1. what was inspected ----
  section("Inspections Completed This Week");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Section", "Equipment", "Activity", "Inspector", "Condition", "Flagged"]],
    body: d.completed.length
      ? d.completed.map((c) => [
          c.section ?? "-",
          pmEquipmentLabel(c),
          pdfSafe(c.activity),
          c.inspector ?? "-",
          c.condition ?? "-",
          `${c.flagged} / ${c.items}`,
        ])
      : [["No inspections completed in this window.", "", "", "", "", ""]],
    headStyles: head,
    bodyStyles: body,
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 105 },
      3: { cellWidth: 65 },
      4: { cellWidth: 48 },
      5: { cellWidth: 45, halign: "center" },
    },
    didParseCell: (data) => {
      // The flagged count is the column a manager scans first.
      if (data.section === "body" && data.column.index === 5) {
        if (!String(data.cell.raw).startsWith("0 ")) {
          data.cell.styles.textColor = [234, 88, 12];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });
  tableAfter();

  // ---- 2. what maintenance actually did ----
  section("Maintenance Work Carried Out");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Equipment", "Section", "Work done", "SAP WO", "By", "Closed"]],
    body: d.actions.length
      ? d.actions.map((a) => [
          pmEquipmentLabel(a),
          a.section ?? "-",
          // The completion note is the only place the fitter says what he actually
          // found, so it rides along with the title rather than being dropped.
          a.note ? `${pdfSafe(a.title)}\n${pdfSafe(a.note)}` : pdfSafe(a.title),
          a.sapWorkOrder ?? "-",
          a.responsible ?? a.department ?? "-",
          a.completedAt ? a.completedAt.slice(0, 10) : "-",
        ])
      : [["No maintenance actions were closed in this window.", "", "", "", "", ""]],
    headStyles: head,
    bodyStyles: body,
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 70 },
      3: { cellWidth: 58 },
      4: { cellWidth: 62 },
      5: { cellWidth: 52 },
    },
  });
  tableAfter();

  // ---- 3. the reason this report exists ----
  section("Checks Requiring the Equipment Stopped");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Equipment", "Check", "Why", "Result", "Inspector note"]],
    body: d.shutdownItems.length
      ? d.shutdownItems.map((i) => [
          pmEquipmentLabel(i),
          pdfSafe(i.label),
          PM_REASON_LABELS_EN[i.reason],
          i.result ?? "-",
          pdfSafe(i.notes),
        ])
      : [["", "Nothing was recorded as needing a shutdown this week.", "", "", ""]],
    headStyles: head,
    bodyStyles: body,
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 95 },
      2: { cellWidth: 88 },
      3: { cellWidth: 62 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        data.cell.styles.textColor = AMBER;
      }
    },
  });
  tableAfter();

  // ---- 4. the plan for the next stop ----
  section("Queued for the Next Shutdown");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Priority", "Equipment", "Work", "SAP WO", "Target", "Waiting"]],
    body: d.waitingShutdown.length
      ? d.waitingShutdown.map((a) => [
          a.priority,
          pmEquipmentLabel(a),
          pdfSafe(a.title),
          a.sapWorkOrder ?? "-",
          a.targetDate ?? "-",
          `${daysWaiting(a.waitingSince)} d`,
        ])
      : [["", "Nothing is waiting on a shutdown.", "", "", "", ""]],
    headStyles: head,
    bodyStyles: body,
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 100 },
      3: { cellWidth: 58 },
      4: { cellWidth: 55 },
      5: { cellWidth: 48, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const v = String(data.cell.raw);
        if (v === "Critical") data.cell.styles.textColor = [220, 38, 38];
        else if (v === "High") data.cell.styles.textColor = [234, 88, 12];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ---- footer on every page ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(225, 225, 225);
    doc.line(M, pageH - 34, pageW - M, pageH - 34);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by CPIIS — Inspection Management System", M, pageH - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageW - M, pageH - 20, { align: "right" });
  }

  return doc;
}
