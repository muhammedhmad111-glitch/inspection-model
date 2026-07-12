import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { PermissionsClient } from "./permissions-client";

export default async function PermissionsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.isSuperAdmin) redirect("/");

  const supabase = await createClient();
  const [{ data: perms }, { data: rolePerms }] = await Promise.all([
    supabase.from("permissions").select("*").order("sort_order"),
    supabase.from("role_permissions").select("*"),
  ]);

  return (
    <PermissionsClient
      permissions={perms ?? []}
      initialRolePermissions={rolePerms ?? []}
    />
  );
}
