import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { getActiveLine } from "@/lib/production-line-server";
import { EQUIPMENT_LINE_PATH, VIA_EQUIPMENT_LINE_PATH } from "@/lib/line-filter";
import { FindingsClient } from "./findings-client";

export default async function FindingsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const line = await getActiveLine();

  const [{ data: findings }, { data: profiles }, { data: equipment }, { data: notes }] =
    await Promise.all([
      supabase
        .from("inspection_findings")
        .select(
          `*,
         equipment!inner (
           equipment_name, equipment_code, functional_location,
           sections!inner ( section_name, areas!inner ( production_line ) )
         ),
         equipment_parts ( part_name ),
         inspection_tasks ( task_code ),
         maintenance_actions ( action_id, action_code, status, sap_work_order )`
        )
        .eq(VIA_EQUIPMENT_LINE_PATH, line)
        .order("created_at", { ascending: false })
        .limit(400),
      supabase.from("profiles").select("id, full_name, role").eq("active", true),
      // Raising a finding outside an inspection means naming the equipment yourself.
      supabase
        .from("equipment")
        .select(
          `equipment_id, equipment_name, equipment_code, functional_location,
         sections!inner ( section_name, areas!inner ( production_line ) ),
         equipment_parts ( equipment_part_id, part_name )`
        )
        .eq(EQUIPMENT_LINE_PATH, line)
        .eq("active", true)
        .order("equipment_name"),
      // Checklist notes nobody has decided on yet — the view already drops the ones
      // that were dismissed or already turned into a finding.
      supabase
        .from("pending_checklist_notes")
        .select("*")
        .eq("production_line", line)
        .order("noted_at", { ascending: false })
        .limit(200),
    ]);

  return (
    <FindingsClient
      initialFindings={findings ?? []}
      profiles={profiles ?? []}
      equipment={equipment ?? []}
      pendingNotes={notes ?? []}
      canManage={profile?.canManageFindings ?? false}
      line={line}
    />
  );
}
