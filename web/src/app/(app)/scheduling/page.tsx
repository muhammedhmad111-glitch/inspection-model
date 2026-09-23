import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { getActiveLine } from "@/lib/production-line-server";
import { VIA_EQUIPMENT_LINE_EMBED, VIA_EQUIPMENT_LINE_PATH } from "@/lib/line-filter";
import { SchedulingClient } from "./scheduling-client";

export default async function SchedulingPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const line = await getActiveLine();

  // The four headline counts have to answer for the same line as the list under
  // them, so each one carries the filter too.
  const countForStatus = (status?: "Overdue" | "Upcoming" | "Completed") => {
    const q = supabase
      .from("inspection_tasks")
      .select(VIA_EQUIPMENT_LINE_EMBED, { count: "exact", head: true })
      .eq(VIA_EQUIPMENT_LINE_PATH, line);
    return status ? q.eq("status", status) : q;
  };

  const [{ data: tasks }, ...counts] = await Promise.all([
    supabase
      .from("inspection_tasks")
      .select(
        `inspection_task_id, task_code, scheduled_date, due_date, status, priority,
         recurrence_cycle,
         inspection_activities ( activity_name, frequency_type ),
         equipment!inner (
           equipment_name, functional_location,
           sections!inner ( areas!inner ( production_line ) )
         ),
         equipment_parts ( part_name )`
      )
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .in("status", ["Scheduled", "Upcoming", "Overdue", "In Progress"])
      .order("due_date")
      .limit(400),
    countForStatus(),
    countForStatus("Overdue"),
    countForStatus("Upcoming"),
    countForStatus("Completed"),
  ]);

  return (
    <SchedulingClient
      initialTasks={tasks ?? []}
      stats={{
        total: counts[0].count ?? 0,
        overdue: counts[1].count ?? 0,
        upcoming: counts[2].count ?? 0,
        completed: counts[3].count ?? 0,
      }}
      line={line}
      canGenerate={profile?.canWriteMasterData ?? false}
    />
  );
}
