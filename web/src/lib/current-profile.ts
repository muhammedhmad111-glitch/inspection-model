import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: permsData } = await supabase.rpc("my_permissions");
  const permissions = (permsData ?? []) as string[];
  const has = (key: string) => permissions.includes(key);

  return {
    ...profile,
    email: user.email ?? "",
    permissions,
    isSuperAdmin: profile.role === "Super Admin",
    // capability flags used across the app
    canWriteMasterData: has("master_data"),
    canWriteMaintenance: has("maintenance"),
    canManageFindings: has("findings"),
    canEscalate: has("escalate"),
    canViewReports: has("reports"),
    canViewAudit: has("audit"),
    isAdmin: profile.role === "Super Admin",
  };
}
