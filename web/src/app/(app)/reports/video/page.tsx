import { createClient } from "@/lib/supabase/server";
import { ReportVideoPlayer } from "@/components/report-video-player";
import { ReportVideoDownload } from "@/components/report-video-download";
import type { DailyReportVideoProps } from "@/remotion/daily-report";

export default async function ReportVideoPage() {
  const supabase = await createClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  const startOfDay = `${todayISO}T00:00:00`;

  const [completed, findings, actions] = await Promise.all([
    supabase
      .from("inspection_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "Completed")
      .gte("completion_date", startOfDay),
    supabase
      .from("inspection_findings")
      .select("*", { count: "exact", head: true })
      .neq("status", "Closed"),
    supabase
      .from("maintenance_actions")
      .select("*", { count: "exact", head: true })
      .not("status", "in", "(Completed,Verified,Cancelled)"),
  ]);

  const data: DailyReportVideoProps = {
    date: todayISO,
    preparedBy: "Inspection Team",
    completedCount: completed.count ?? 0,
    findingsCount: findings.count ?? 0,
    actionsCount: actions.count ?? 0,
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">فيديو التقرير اليومي</h1>
        <p className="text-sm text-muted-foreground">
          معاينة متحركة لملخّص فحوصات اليوم — {todayISO}
        </p>
      </div>
      <ReportVideoPlayer data={data} />
      <ReportVideoDownload data={data} />
    </div>
  );
}
