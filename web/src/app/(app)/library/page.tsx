import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { LibraryClient } from "./library-client";

export default async function LibraryPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: templates } = await supabase
    .from("inspection_activity_templates")
    .select("*")
    .order("activity_code");

  return (
    <LibraryClient
      initialTemplates={templates ?? []}
      canWrite={profile?.canWriteMasterData ?? false}
    />
  );
}
