"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { DailyReportVideoProps } from "@/remotion/daily-report";

export function ReportVideoDownload({ data }: { data: DailyReportVideoProps }) {
  const [rendering, setRendering] = useState(false);

  async function render() {
    setRendering(true);
    try {
      const res = await fetch("/api/render-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const msg = await res
          .json()
          .then((b) => b?.error as string)
          .catch(() => null);
        toast.error(msg || "تعذّر توليد الفيديو");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Daily-Inspection-Report-${data.date}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل الفيديو ✅");
    } catch {
      toast.error("تعذّر توليد الفيديو");
    } finally {
      setRendering(false);
    }
  }

  return (
    <Button onClick={render} disabled={rendering} className="rounded-xl w-fit">
      {rendering ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {rendering ? "جارٍ توليد الفيديو…" : "تنزيل MP4"}
    </Button>
  );
}
