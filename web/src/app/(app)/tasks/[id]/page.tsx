import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExecutionClient } from "./execution-client";

// Only same-origin app paths, so `?from=` can never bounce the user off-site.
function safeBackHref(from: string | string[] | undefined) {
  if (typeof from !== "string") return "/tasks";
  if (!from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) {
    return "/tasks";
  }
  return from;
}

export default async function TaskExecutionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  const [{ data: task }, { data: items }, { data: findings }] = await Promise.all([
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
    // Findings raised during this inspection — included in the WhatsApp report.
    supabase
      .from("inspection_findings")
      .select("finding_code, finding_title, severity")
      .eq("inspection_task_id", id)
      .order("created_at"),
  ]);

  if (!task) notFound();

  const inspectorId = task.completed_by ?? task.assigned_user_id;
  const { data: inspector } = inspectorId
    ? await supabase.from("profiles").select("full_name").eq("id", inspectorId).single()
    : { data: null };

  return (
    <ExecutionClient
      task={task}
      initialItems={items ?? []}
      findings={findings ?? []}
      inspectorName={inspector?.full_name ?? null}
      backHref={safeBackHref(from)}
    />
  );
}
