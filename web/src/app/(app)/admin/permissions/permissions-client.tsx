"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Enums, Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { ASSIGNABLE_ROLES, PERMISSION_LABELS_AR, ROLE_LABELS_AR } from "@/lib/constants";

type Permission = Tables<"permissions">;
type RolePermission = Tables<"role_permissions">;

// user management is inherently the super admin's; not part of the editable matrix
const HIDDEN_PERMS = new Set(["users"]);

// roles shown in the matrix (Super Admin always has everything)
const MATRIX_ROLES = ASSIGNABLE_ROLES.filter((r) => r !== "Super Admin");

const key = (role: string, perm: string) => `${role}::${perm}`;

export function PermissionsClient({
  permissions,
  initialRolePermissions,
}: {
  permissions: Permission[];
  initialRolePermissions: RolePermission[];
}) {
  const router = useRouter();
  const cols = permissions.filter((p) => !HIDDEN_PERMS.has(p.permission_key));
  const [granted, setGranted] = useState<Set<string>>(
    () => new Set(initialRolePermissions.map((rp) => key(rp.role, rp.permission_key)))
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(role: Enums<"app_user_role">, perm: string) {
    const k = key(role, perm);
    const has = granted.has(k);
    setBusy(k);
    const next = new Set(granted);
    if (has) next.delete(k);
    else next.add(k);
    setGranted(next);

    const supabase = createClient();
    const { error } = has
      ? await supabase
          .from("role_permissions")
          .delete()
          .eq("role", role)
          .eq("permission_key", perm)
      : await supabase.from("role_permissions").insert({ role, permission_key: perm });

    setBusy(null);
    if (error) {
      // revert
      const revert = new Set(granted);
      setGranted(revert);
      toast.error("فشل تحديث الصلاحية");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">الأدوار والصلاحيات</h1>
          <p className="text-sm text-muted-foreground">
            حدّد صلاحيات كل دور — التغييرات تُطبَّق فورًا على النظام
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm">
        <CardContent className="overflow-x-auto p-3 sm:p-5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky right-0 bg-card p-2 text-right font-semibold">
                  الدور
                </th>
                {cols.map((p) => (
                  <th
                    key={p.permission_key}
                    className="min-w-28 p-2 text-center align-bottom font-medium text-muted-foreground"
                  >
                    <span className="block text-xs leading-tight">
                      {PERMISSION_LABELS_AR[p.permission_key] ?? p.permission_key}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Super Admin: always all */}
              <tr className="border-t">
                <td className="sticky right-0 bg-card p-2 font-semibold">
                  {ROLE_LABELS_AR["Super Admin"]}
                </td>
                {cols.map((p) => (
                  <td key={p.permission_key} className="p-2 text-center">
                    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Check className="size-4" />
                    </span>
                  </td>
                ))}
              </tr>
              {MATRIX_ROLES.map((role) => (
                <tr key={role} className="border-t">
                  <td className="sticky right-0 bg-card p-2 font-medium">
                    {ROLE_LABELS_AR[role]}
                  </td>
                  {cols.map((p) => {
                    const k = key(role, p.permission_key);
                    const on = granted.has(k);
                    return (
                      <td key={p.permission_key} className="p-2 text-center">
                        <button
                          disabled={busy === k}
                          onClick={() => toggle(role, p.permission_key)}
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-lg border transition-colors",
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background text-transparent hover:border-primary/50"
                          )}
                          title={PERMISSION_LABELS_AR[p.permission_key]}
                        >
                          <Check className="size-4" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {cols.map((p) => (
          <Badge key={p.permission_key} variant="secondary" className="font-normal">
            {PERMISSION_LABELS_AR[p.permission_key] ?? p.permission_key}
          </Badge>
        ))}
      </div>
    </div>
  );
}
