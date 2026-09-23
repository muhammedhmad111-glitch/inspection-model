import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { getActiveLine } from "@/lib/production-line-server";
import { EquipmentClient } from "./equipment-client";

export default async function EquipmentPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const line = await getActiveLine();

  // Walk the tree down from the line: areas → their sections → their equipment.
  // Each step also feeds a filter dropdown, so nothing here is a wasted query.
  const { data: areas } = await supabase
    .from("areas")
    .select("*")
    .eq("production_line", line)
    .eq("active", true)
    .order("area_name");

  const areaIds = (areas ?? []).map((a) => a.area_id);
  const { data: sections } = areaIds.length
    ? await supabase
        .from("sections")
        .select("*")
        .in("area_id", areaIds)
        .eq("active", true)
        .order("section_name")
    : { data: [] };

  const sectionIds = (sections ?? []).map((s) => s.section_id);
  const { data: equipment } = sectionIds.length
    ? await supabase
        .from("equipment")
        .select("*")
        .in("section_id", sectionIds)
        .order("equipment_code")
    : { data: [] };

  return (
    <EquipmentClient
      initialEquipment={equipment ?? []}
      sections={sections ?? []}
      areas={areas ?? []}
      line={line}
      canWrite={profile?.canWriteMasterData ?? false}
    />
  );
}
