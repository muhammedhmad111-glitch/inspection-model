import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { AuditClient, type AuditRow } from "./audit-client";

type Rel<T> = T | T[] | null;
function one<T>(v: Rel<T>): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function AuditPage() {
  const profile = await getCurrentProfile();
  if (!profile?.canViewAudit) redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select(`*, profiles ( full_name )`)
    .order("changed_at", { ascending: false })
    .limit(300);

  const rows: AuditRow[] = (data ?? []).map((r) => ({
    audit_id: r.audit_id,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    action_type: r.action_type,
    changed_at: r.changed_at,
    changed_by_name: one<{ full_name: string }>(r.profiles)?.full_name ?? "النظام",
    old_value: r.old_value,
    new_value: r.new_value,
  }));

  return <AuditClient rows={rows} />;
}
