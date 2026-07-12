import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { SchedulingClient } from "./scheduling-client";

export default async function SchedulingPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [{ data: tasks }, ...counts] = await Promise.all([
    supabase
      .from("inspection_tasks")
      .select(
        `inspection_task_id, task_code, scheduled_date, due_date, status, priority,
         recurrence_cycle,
         inspection_activities ( activity_name, frequency_type ),
         equipment ( equipment_name, functional_location ),
         equipment_parts ( part_name )`
      )
      .in("status", ["Scheduled", "Upcoming", "Overdue", "In Progress"])
      .order("due_date")
      .limit(400),
    supabase
      .from("inspection_tasks")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("inspection_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "Overdue"),
    supabase
      .from("inspection_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "Upcoming"),
    supabase
      .from("inspection_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "Completed"),
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
      canGenerate={profile?.canWriteMasterData ?? false}
    />
  );
}
