import { createClient } from "@/lib/supabase/server";
import { LINE_LABELS_AR } from "@/lib/production-line";
import { getActiveLine } from "@/lib/production-line-server";
import {
  VIA_EQUIPMENT_LINE_EMBED,
  VIA_EQUIPMENT_LINE_PATH,
  VIA_FINDING_LINE_EMBED,
  VIA_FINDING_LINE_PATH,
} from "@/lib/line-filter";
import { ReportVideoPlayer } from "@/components/report-video-player";
import { ReportVideoDownload } from "@/components/report-video-download";
import type { DailyReportVideoProps } from "@/remotion/daily-report";

export default async function ReportVideoPage() {
  const supabase = await createClient();
  const line = await getActiveLine();
  const todayISO = new Date().toISOString().slice(0, 10);
  const startOfDay = `${todayISO}T00:00:00`;

  const [completed, findings, ownActions, findingActions] = await Promise.all([
    supabase
      .from("inspection_tasks")
      .select(VIA_EQUIPMENT_LINE_EMBED, { count: "exact", head: true })
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .eq("status", "Completed")
      .gte("completion_date", startOfDay),
    supabase
      .from("inspection_findings")
      .select(VIA_EQUIPMENT_LINE_EMBED, { count: "exact", head: true })
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .neq("status", "Closed"),
    // An action knows its line either from the machine it names or, when it
    // names none, from the finding it was raised off. Counting one route alone
    // would under-report the open work, so both are counted and added.
    supabase
      .from("maintenance_actions")
      .select(VIA_EQUIPMENT_LINE_EMBED, { count: "exact", head: true })
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .not("status", "in", "(Completed,Verified,Cancelled)"),
    supabase
      .from("maintenance_actions")
      .select(VIA_FINDING_LINE_EMBED, { count: "exact", head: true })
      .is("equipment_id", null)
      .eq(VIA_FINDING_LINE_PATH, line)
      .not("status", "in", "(Completed,Verified,Cancelled)"),
  ]);

  const data: DailyReportVideoProps = {
    date: todayISO,
    preparedBy: "Inspection Team",
    completedCount: completed.count ?? 0,
    findingsCount: findings.count ?? 0,
    actionsCount: (ownActions.count ?? 0) + (findingActions.count ?? 0),
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">فيديو التقرير اليومي</h1>
        <p className="text-sm text-muted-foreground">
          معاينة متحركة لملخّص فحوصات اليوم — {LINE_LABELS_AR[line]} · {todayISO}
        </p>
      </div>
      <ReportVideoPlayer data={data} />
      <ReportVideoDownload data={data} />
    </div>
  );
}
