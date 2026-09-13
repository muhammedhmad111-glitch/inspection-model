import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  // The filter options come from master data, not from the loaded tasks. The list
  // is a window onto thousands of rows, so deriving the options from whatever page
  // happened to load would hide the very equipment you are filtering for — which is
  // how the yearly inspections went missing in the first place.
  const [{ data: profiles }, { data: equipment }, { data: sections }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").eq("active", true),
    supabase
      .from("equipment")
      .select("equipment_id, equipment_name, equipment_code, functional_location")
      .eq("active", true)
      .order("equipment_name"),
    supabase
      .from("sections")
      .select("section_id, section_name, areas ( area_name )")
      .order("section_name"),
  ]);

  return (
    <TasksClient
      profiles={profiles ?? []}
      equipmentOptions={equipment ?? []}
      sectionOptions={sections ?? []}
      currentUserId={profile?.id ?? ""}
      canManage={profile?.canWriteMasterData ?? false}
    />
  );
}
