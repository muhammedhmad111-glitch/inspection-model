import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExecutionClient } from "./execution-client";

export default async function TaskExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: task }, { data: items }] = await Promise.all([
    supabase
      .from("inspection_tasks")
      .select(
        `*,
         inspection_activities (
           activity_name, activity_code, inspection_category, frequency_type,
           standard_checklist, acceptance_criteria, failure_criteria
         ),
         equipment ( equipment_name, equipment_code, functional_location ),
         equipment_parts ( part_name, part_code )`
      )
      .eq("inspection_task_id", id)
      .single(),
    supabase
      .from("inspection_task_checklist_items")
      .select("*")
      .eq("inspection_task_id", id)
      .order("sort_order"),
  ]);

  if (!task) notFound();

  return <ExecutionClient task={task} initialItems={items ?? []} />;
}
