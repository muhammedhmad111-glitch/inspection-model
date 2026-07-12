import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { SectionsClient } from "./sections-client";

export default async function SectionsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [{ data: sections }, { data: areas }] = await Promise.all([
    supabase.from("sections").select("*").order("section_code"),
    supabase.from("areas").select("*").eq("active", true).order("area_name"),
  ]);

  return (
    <SectionsClient
      initialSections={sections ?? []}
      areas={areas ?? []}
      canWrite={profile?.canWriteMasterData ?? false}
    />
  );
}
