import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { getActiveLine } from "@/lib/production-line-server";
import { SectionsClient } from "./sections-client";

export default async function SectionsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const line = await getActiveLine();

  // Sections carry no line of their own; they inherit the one on their area.
  // Fetching the line's areas first keeps the section rows plain `Tables<"sections">`
  // instead of dragging an embedded area object through the whole client.
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
        .order("section_code")
    : { data: [] };

  return (
    <SectionsClient
      initialSections={sections ?? []}
      areas={areas ?? []}
      line={line}
      canWrite={profile?.canWriteMasterData ?? false}
    />
  );
}
