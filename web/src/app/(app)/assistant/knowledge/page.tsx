import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { KnowledgeClient } from "./knowledge-client";

export default async function KnowledgePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: docs } = await supabase
    .from("kb_documents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <KnowledgeClient
      initialDocs={docs ?? []}
      canManage={profile?.canWriteMasterData ?? false}
    />
  );
}
