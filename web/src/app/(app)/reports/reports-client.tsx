"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ReportDef = {
  id: string;
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
};

function toCsv(headers: string[], rows: string[][]): string {
  const esc = (v: string) => {
    const s = v ?? "";
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))];
  // UTF-8 BOM (U+FEFF) so Excel renders Arabic correctly
  const BOM = String.fromCharCode(0xfeff);
  return BOM + lines.join("\r\n");
}

function download(report: ReportDef) {
  const csv = toCsv(report.headers, report.rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${report.id}-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ReportsClient({ reports }: { reports: ReportDef[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-brand-purple to-brand-purple-strong p-7 text-white shadow-xl shadow-primary/20">
        <p className="text-sm font-medium text-white/70">CPIIS · التقارير</p>
        <h1 className="mt-1 text-2xl font-bold">التقارير والتصدير</h1>
        <p className="mt-1 text-sm text-white/75">
          تصدير بيانات الفحص والصيانة بصيغة CSV متوافقة مع Excel
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.id} className="rounded-3xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                </div>
              </div>
              <Badge variant="secondary">{r.rows.length}</Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                onClick={() => download(r)}
                disabled={r.rows.length === 0}
                className="rounded-xl"
              >
                <Download className="size-4" />
                تصدير CSV
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
                disabled={r.rows.length === 0}
              >
                {openId === r.id ? "إخفاء المعاينة" : "معاينة"}
              </Button>
            </CardContent>
            {openId === r.id ? (
              <CardContent>
                <div className="overflow-x-auto rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {r.headers.map((h) => (
                          <TableHead key={h} className="whitespace-nowrap">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {r.rows.slice(0, 20).map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j} className="whitespace-nowrap">
                              {cell || "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {r.rows.length > 20 ? (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    عرض أول ٢٠ صف من {r.rows.length} — التصدير يشمل الكل
                  </p>
                ) : null}
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
