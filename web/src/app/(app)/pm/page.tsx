import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import type { PmReportData } from "@/lib/pm-report";
import { PmClient } from "./pm-client";

export default async function PmPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  // No argument means "the week containing today"; the client asks for older ones.
  const { data } = await supabase.rpc("get_pm_report_data", {});

  return (
    <PmClient
      initialData={data as unknown as PmReportData}
      senderName={profile?.full_name ?? ""}
    />
  );
}
