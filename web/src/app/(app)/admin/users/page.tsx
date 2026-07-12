import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "Super Admin") redirect("/");

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role, active, created_at")
    .order("full_name");

  return <UsersClient initialUsers={users ?? []} currentUserId={profile.id} />;
}
