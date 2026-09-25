import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { getActiveLine } from "@/lib/production-line-server";
import { ActivitiesClient } from "./activities-client";

export default async function ActivitiesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const line = await getActiveLine();

  // An activity hangs off an equipment part, so its line sits four tables up:
  // part → equipment → section → area.
  const { data: activities } = await supabase
    .from("inspection_activities")
    .select(
      `*,
       equipment_parts!inner (
         part_code, part_name,
         equipment!inner (
           equipment_id, equipment_code, equipment_name, functional_location,
           sections!inner ( areas!inner ( production_line ) )
         )
       )`
    )
    .eq("equipment_parts.equipment.sections.areas.production_line", line)
    .order("activity_code");

  return (
    <ActivitiesClient
      initialActivities={activities ?? []}
      canWrite={profile?.canWriteMasterData ?? false}
      line={line}
    />
  );
}
