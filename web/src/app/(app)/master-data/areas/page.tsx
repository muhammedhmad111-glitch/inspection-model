import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { AreasClient } from "./areas-client";

export default async function AreasPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: areas } = await supabase
    .from("areas")
    .select("*")
    .order("area_code");

  return (
    <AreasClient
      initialAreas={areas ?? []}
      canWrite={profile?.canWriteMasterData ?? false}
    />
  );
}
