import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { ActionsClient } from "./actions-client";

export default async function ActionsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [{ data: actions }, { data: profiles }, { data: equipment }, { data: findings }] =
    await Promise.all([
      supabase
        .from("maintenance_actions")
        .select(
          `*,
           inspection_findings (
             finding_code, finding_title, severity,
             equipment (
               equipment_name, equipment_code, functional_location,
               sections ( section_name )
             ),
             equipment_parts ( part_name )
           ),
           equipment (
             equipment_name, equipment_code, functional_location,
             sections ( section_name )
           ),
           equipment_parts ( part_name ),
           responsible:profiles!maintenance_actions_responsible_person_fkey ( full_name ),
           verifier:profiles!maintenance_actions_verified_by_fkey ( full_name )`
        )
        .order("created_at", { ascending: false })
        .limit(400),
      supabase.from("profiles").select("id, full_name, role").eq("active", true),
      // An action raised here names its own equipment instead of borrowing one.
      supabase
        .from("equipment")
        .select(
          `equipment_id, equipment_name, equipment_code, functional_location,
           sections ( section_name ),
           equipment_parts ( equipment_part_id, part_name )`
        )
        .eq("active", true)
        .order("equipment_name"),
      // Still offered as an optional link, so the finding → action chain survives.
      supabase
        .from("inspection_findings")
        .select(
          `finding_id, finding_code, finding_title, severity,
           equipment (
             equipment_name, equipment_code, functional_location,
             sections ( section_name )
           )`
        )
        .neq("status", "Closed")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  return (
    <ActionsClient
      initialActions={actions ?? []}
      profiles={profiles ?? []}
      equipment={equipment ?? []}
      openFindings={findings ?? []}
      canManage={profile?.canWriteMaintenance ?? false}
    />
  );
}
