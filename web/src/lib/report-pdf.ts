import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportData = {
  date: string; // YYYY-MM-DD
  preparedBy: string;
  note?: string;
  completed: {
    equipment: string;
    location: string | null;
    activity: string;
    condition: string | null;
  }[];
  findings: {
    severity: string;
    equipment: string | null;
    title: string;
    code: string;
  }[];
  actions: { title: string; status: string; target: string | null }[];
};

// Amreyah Cement identity
const NAVY: [number, number, number] = [37, 42, 94]; // #252A5E — brand navy
const INDIGO: [number, number, number] = [79, 70, 229]; // #4F46E5 — accent
const LIGHT: [number, number, number] = [237, 236, 251]; // #EDECFB — tint

/** Build a professional English PDF for the daily inspection report. */
export function buildReportPdf(d: ReportData): jsPDF {
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
  // AC logo tile (white rounded square with navy "AC")
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 28, 36, 36, 6, 6, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("AC", M + 18, 51, { align: "center" });
  // wordmark + title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("AMREYAH CEMENT", M + 48, 40);
  doc.setFontSize(20);
  doc.text("Daily Inspection Report", M + 48, 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Date: ${d.date}`, pageW - M, 32, { align: "right" });
  doc.text(`Prepared by: ${d.preparedBy || "-"}`, pageW - M, 48, { align: "right" });
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, pageW - M, 64, {
    align: "right",
  });

  y = 120;

  // ---- summary chips ----
  const chips: [string, string][] = [
    ["Completed Inspections", String(d.completed.length)],
    ["Open Findings", String(d.findings.length)],
    ["Open Maintenance", String(d.actions.length)],
  ];
  const chipW = (pageW - M * 2 - 20) / 3;
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

  // ---- optional note ----
  if (d.note && d.note.trim()) {
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(
      `Note: ${d.note.trim()}`,
      pageW - M * 2 - 20
    ) as string[];
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

  // ---- completed inspections ----
  section("Completed Inspections Today");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Equipment", "Location", "Activity", "Condition"]],
    body: d.completed.length
      ? d.completed.map((c) => [c.equipment, c.location ?? "-", c.activity, c.condition ?? "-"])
      : [["No completed inspections today.", "", "", ""]],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: 40 },
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 130 }, 3: { cellWidth: 70 } },
  });
  tableAfter();

  // ---- open findings ----
  section("Open Findings / Issues");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Severity", "Equipment", "Finding", "Code"]],
    body: d.findings.length
      ? d.findings.map((f) => [f.severity, f.equipment ?? "-", f.title, f.code])
      : [["", "No open findings.", "", ""]],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: 40 },
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 65 }, 3: { cellWidth: 75 } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const v = String(data.cell.raw);
        if (v === "Critical") data.cell.styles.textColor = [220, 38, 38];
        else if (v === "High") data.cell.styles.textColor = [234, 88, 12];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  tableAfter();

  // ---- open maintenance actions ----
  section("Open Maintenance Actions");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Action", "Status", "Target Date"]],
    body: d.actions.length
      ? d.actions.map((a) => [a.title, a.status, a.target ?? "-"])
      : [["No open maintenance actions.", "", ""]],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: 40 },
    alternateRowStyles: { fillColor: LIGHT },
    styles: { cellPadding: 5, overflow: "linebreak" },
    columnStyles: { 1: { cellWidth: 90 }, 2: { cellWidth: 90 } },
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
