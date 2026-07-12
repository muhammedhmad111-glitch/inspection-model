import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    supabase
      .from("inspection_tasks")
      .select(
        `inspection_task_id, task_code, scheduled_date, due_date, status, priority,
         recurrence_cycle, assigned_user_id, condition_rating, completion_date,
         inspection_activities ( activity_name, inspection_category, frequency_type ),
         equipment ( equipment_id, equipment_name, functional_location ),
         equipment_parts ( part_name )`
      )
      .order("due_date")
      .limit(600),
    supabase.from("profiles").select("id, full_name, role").eq("active", true),
  ]);

  return (
    <TasksClient
      initialTasks={tasks ?? []}
      profiles={profiles ?? []}
      currentUserId={profile?.id ?? ""}
      canManage={profile?.canWriteMasterData ?? false}
    />
  );
}
