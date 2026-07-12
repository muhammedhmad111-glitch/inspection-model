import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { ActionsClient } from "./actions-client";

export default async function ActionsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: actions } = await supabase
    .from("maintenance_actions")
    .select(
      `*,
       inspection_findings (
         finding_code, finding_title, severity,
         equipment ( equipment_name ),
         equipment_parts ( part_name )
       ),
       responsible:profiles!maintenance_actions_responsible_person_fkey ( full_name ),
       verifier:profiles!maintenance_actions_verified_by_fkey ( full_name )`
    )
    .order("created_at", { ascending: false })
    .limit(400);

  return (
    <ActionsClient
      initialActions={actions ?? []}
      canManage={profile?.canWriteMaintenance ?? false}
    />
  );
}
