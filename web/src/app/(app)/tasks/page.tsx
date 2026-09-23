import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { getActiveLine } from "@/lib/production-line-server";
import { EQUIPMENT_LINE_PATH } from "@/lib/line-filter";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const line = await getActiveLine();

  // The filter options come from master data, not from the loaded tasks. The list
  // is a window onto thousands of rows, so deriving the options from whatever page
  // happened to load would hide the very equipment you are filtering for — which is
  // how the yearly inspections went missing in the first place.
  const [{ data: profiles }, { data: equipment }, { data: sections }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").eq("active", true),
    supabase
      .from("equipment")
      .select(
        `equipment_id, equipment_name, equipment_code, functional_location,
         sections!inner ( areas!inner ( production_line ) )`
      )
      .eq(EQUIPMENT_LINE_PATH, line)
      .eq("active", true)
      .order("equipment_name"),
    supabase
      .from("sections")
      .select("section_id, section_name, areas!inner ( area_name, production_line )")
      .eq("areas.production_line", line)
      .order("section_name"),
  ]);

  return (
    <TasksClient
      profiles={profiles ?? []}
      equipmentOptions={equipment ?? []}
      sectionOptions={sections ?? []}
      currentUserId={profile?.id ?? ""}
      line={line}
      canManage={profile?.canWriteMasterData ?? false}
    />
  );
}
