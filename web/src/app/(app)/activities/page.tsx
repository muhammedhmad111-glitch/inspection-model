import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { ActivitiesClient } from "./activities-client";

export default async function ActivitiesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: activities } = await supabase
    .from("inspection_activities")
    .select(
      `*,
       equipment_parts (
         part_code, part_name,
         equipment ( equipment_id, equipment_code, equipment_name, functional_location )
       )`
    )
    .order("activity_code");

  return (
    <ActivitiesClient
      initialActivities={activities ?? []}
      canWrite={profile?.canWriteMasterData ?? false}
    />
  );
}
