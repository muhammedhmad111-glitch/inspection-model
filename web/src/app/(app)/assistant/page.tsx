import { createClient } from "@/lib/supabase/server";
import { AssistantClient } from "./assistant-client";

export default async function AssistantPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("kb_documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "ready");

  return <AssistantClient hasDocuments={(count ?? 0) > 0} />;
}
