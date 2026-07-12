import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <NotificationsClient
      initial={data ?? []}
      canEscalate={profile?.canEscalate ?? false}
    />
  );
}
