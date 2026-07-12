import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { EquipmentClient } from "./equipment-client";

export default async function EquipmentPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [{ data: equipment }, { data: sections }, { data: areas }] =
    await Promise.all([
      supabase.from("equipment").select("*").order("equipment_code"),
      supabase.from("sections").select("*").eq("active", true).order("section_name"),
      supabase.from("areas").select("*").eq("active", true).order("area_name"),
    ]);

  return (
    <EquipmentClient
      initialEquipment={equipment ?? []}
      sections={sections ?? []}
      areas={areas ?? []}
      canWrite={profile?.canWriteMasterData ?? false}
    />
  );
}
