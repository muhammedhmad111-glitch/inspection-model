import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { FindingsClient } from "./findings-client";

export default async function FindingsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [{ data: findings }, { data: profiles }, { data: equipment }] = await Promise.all([
    supabase
      .from("inspection_findings")
      .select(
        `*,
         equipment ( equipment_name, functional_location ),
         equipment_parts ( part_name ),
         inspection_tasks ( task_code ),
         maintenance_actions ( action_id, action_code, status )`
      )
      .order("created_at", { ascending: false })
      .limit(400),
    supabase.from("profiles").select("id, full_name, role").eq("active", true),
    // Raising a finding outside an inspection means naming the equipment yourself.
    supabase
      .from("equipment")
      .select(
        `equipment_id, equipment_name, functional_location,
         equipment_parts ( equipment_part_id, part_name )`
      )
      .eq("active", true)
      .order("equipment_name"),
  ]);

  return (
    <FindingsClient
      initialFindings={findings ?? []}
      profiles={profiles ?? []}
      equipment={equipment ?? []}
      canManage={profile?.canManageFindings ?? false}
    />
  );
}
