import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { getActiveLine } from "@/lib/production-line-server";
import { AreasClient } from "./areas-client";

export default async function AreasPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const line = await getActiveLine();

  const { data: areas } = await supabase
    .from("areas")
    .select("*")
    .eq("production_line", line)
    .order("area_code");

  return (
    <AreasClient
      initialAreas={areas ?? []}
      line={line}
      canWrite={profile?.canWriteMasterData ?? false}
    />
  );
}
