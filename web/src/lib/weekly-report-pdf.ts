import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { WeeklyReportVideoProps } from "@/remotion/weekly-report";

// The video and the PDF read the same payload, so a new metric only has to be
// added to the RPC once.
export type WeeklyReportData = WeeklyReportVideoProps & { note?: string };

const NAVY: [number, number, number] = [37, 42, 94];
const LIGHT: [number, number, number] = [237, 236, 251];

function delta(now: number, before: number): string {
  const diff = now - before;
  if (diff === 0) return "no change";
  return `${diff > 0 ? "+" : "-"}${Math.abs(diff)}`;
}

/** Build the English weekly inspection report PDF. */
export function buildWeeklyReportPdf(d: WeeklyReportData): jsPDF {
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
  doc.text("Weekly Inspection Report", M + 48, 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Week: ${d.weekStart} to ${d.weekEnd}`, pageW - M, 32, { align: "right" });
  doc.text(`Prepared by: ${d.preparedBy || "-"}`, pageW - M, 48, { align: "right" });
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, pageW - M, 64, {
    align: "right",
  });

  y = 120;

  // ---- summary chips ----
  const chips: [string, string, string][] = [
    ["Inspections completed", String(d.totals.completed), delta(d.totals.completed, d.previous.completed)],
    ["New findings", String(d.totals.newFindings), delta(d.totals.newFindings, d.previous.newFindings)],
    ["New actions", String(d.totals.newActions), delta(d.totals.newActions, d.previous.newActions)],
    ["Overdue inspections", String(d.totals.overdueTasks), ""],
  ];
  const chipW = (pageW - M * 2 - 30) / 4;
  chips.forEach((c, i) => {
    const x = M + i * (chipW + 10);
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, y, chipW, 54, 6, 6, "F");
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text(c[1], x + 12, y + 28);
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(c[0], x + 12, y + 40);
    if (c[2]) doc.text(`${c[2]} vs last week`, x + 12, y + 49);
  });
  y += 78;

  if (d.note && d.note.trim()) {
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(`Note: ${d.note.trim()}`, pageW - M * 2 - 20) as string[];
    const nh = 16 + noteLines.length * 12;
    ensure(nh + 10);
    doc.setFillColor(255, 249, 230);
    doc.roundedRect(M, y, pageW - M * 2, nh, 6, 6, "F");
    doc.setTextColor(120, 90, 10);
    doc.setFont("helvetica", "normal");
    doc.text(noteLines, M + 10, y + 18);
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

  // ---- week over week ----
  section("Week Over Week");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Metric", "This week", "Last week", "Change"]],
    body: [
      ["Inspections completed", d.totals.completed, d.previous.completed, delta(d.totals.completed, d.previous.completed)],
      ["New findings raised", d.totals.newFindings, d.previous.newFindings, delta(d.totals.newFindings, d.previous.newFindings)],
      ["Maintenance actions opened", d.totals.newActions, d.previous.newActions, delta(d.totals.newActions, d.previous.newActions)],
      ["Maintenance actions closed", d.totals.closedActions, "-", "-"],
    ].map((r) => r.map(String)),
    headStyles: head,
    bodyStyles: body,
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: { 1: { cellWidth: 80 }, 2: { cellWidth: 80 }, 3: { cellWidth: 80 } },
  });
  tableAfter();

  // ---- still open ----
  section("Outstanding Workload");
  const sev = d.openBySeverity ?? {};
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Open findings", "Critical", "High", "Medium", "Low", "Open actions", "Overdue"]],
    body: [
      [
        d.totals.openFindings,
        sev.Critical ?? 0,
        sev.High ?? 0,
        sev.Medium ?? 0,
        sev.Low ?? 0,
        d.totals.openActions,
        d.totals.overdueTasks,
      ].map(String),
    ],
    headStyles: head,
    bodyStyles: { ...body, fontSize: 10, halign: "center" },
    styles: { cellPadding: 5 },
  });
  tableAfter();

  // ---- by section ----
  section("Activity by Section");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Section", "Inspections completed", "Findings raised"]],
    body: d.bySection.length
      ? d.bySection.map((s) => [s.name, String(s.completed), String(s.findings)])
      : [["No activity recorded this week.", "", ""]],
    headStyles: head,
    bodyStyles: body,
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: { 1: { cellWidth: 130 }, 2: { cellWidth: 110 } },
  });
  tableAfter();

  // ---- by area ----
  section("Activity by Area");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Area", "Inspections completed", "Findings raised"]],
    body: d.byArea.length
      ? d.byArea.map((a) => [a.name, String(a.completed), String(a.findings)])
      : [["No activity recorded this week.", "", ""]],
    headStyles: head,
    bodyStyles: body,
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: { 1: { cellWidth: 130 }, 2: { cellWidth: 110 } },
  });
  tableAfter();

  // ---- top findings ----
  section("Highest Severity Open Findings");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Severity", "Equipment", "Section", "Finding", "Code"]],
    body: d.topFindings.length
      ? d.topFindings.map((f) => [
          f.severity,
          f.equipment ?? "-",
          f.section ?? "-",
          f.title,
          f.code,
        ])
      : [["", "", "", "No open findings.", ""]],
    headStyles: head,
    bodyStyles: body,
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 55 }, 4: { cellWidth: 70 } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const v = String(data.cell.raw);
        if (v === "Critical") data.cell.styles.textColor = [220, 38, 38];
        else if (v === "High") data.cell.styles.textColor = [234, 88, 12];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

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
