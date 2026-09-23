import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { getActiveLine } from "@/lib/production-line-server";
import {
  EQUIPMENT_LINE_PATH,
  VIA_EQUIPMENT_LINE_PATH,
  VIA_FINDING_LINE_PATH,
} from "@/lib/line-filter";
import { ActionsClient } from "./actions-client";

/**
 * An action reaches its production line one of two ways: it names a machine
 * itself, or it was raised off a finding and borrows that finding's machine.
 * Filtering on the first alone would hide every action raised from a finding —
 * which today is nearly all of them — so each route is asked for separately and
 * the answers are merged.
 *
 * `!inner` has to sit on whichever hop is being filtered, which is the only
 * reason the two selects differ.
 */
const BY_OWN_EQUIPMENT = `*,
   inspection_findings (
     finding_code, finding_title, severity,
     equipment ( equipment_name, equipment_code, functional_location, sections ( section_name ) ),
     equipment_parts ( part_name )
   ),
   equipment!inner (
     equipment_name, equipment_code, functional_location,
     sections!inner ( section_name, areas!inner ( production_line ) )
   ),
   equipment_parts ( part_name ),
   responsible:profiles!maintenance_actions_responsible_person_fkey ( full_name ),
   verifier:profiles!maintenance_actions_verified_by_fkey ( full_name )`;

const BY_FINDING_EQUIPMENT = `*,
   inspection_findings!inner (
     finding_code, finding_title, severity,
     equipment!inner (
       equipment_name, equipment_code, functional_location,
       sections!inner ( section_name, areas!inner ( production_line ) )
     ),
     equipment_parts ( part_name )
   ),
   equipment ( equipment_name, equipment_code, functional_location, sections ( section_name ) ),
   equipment_parts ( part_name ),
   responsible:profiles!maintenance_actions_responsible_person_fkey ( full_name ),
   verifier:profiles!maintenance_actions_verified_by_fkey ( full_name )`;

/** Attached to no machine at all, so no line owns it — it stays on every line. */
const UNATTACHED = `*,
   inspection_findings (
     finding_code, finding_title, severity,
     equipment ( equipment_name, equipment_code, functional_location, sections ( section_name ) ),
     equipment_parts ( part_name )
   ),
   equipment ( equipment_name, equipment_code, functional_location, sections ( section_name ) ),
   equipment_parts ( part_name ),
   responsible:profiles!maintenance_actions_responsible_person_fkey ( full_name ),
   verifier:profiles!maintenance_actions_verified_by_fkey ( full_name )`;

export default async function ActionsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const line = await getActiveLine();

  const [
    { data: ownEquipment },
    { data: viaFinding },
    { data: unattached },
    { data: profiles },
    { data: equipment },
    { data: findings },
  ] = await Promise.all([
    supabase
      .from("maintenance_actions")
      .select(BY_OWN_EQUIPMENT)
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("maintenance_actions")
      .select(BY_FINDING_EQUIPMENT)
      .is("equipment_id", null)
      .eq(VIA_FINDING_LINE_PATH, line)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("maintenance_actions")
      .select(UNATTACHED)
      .is("equipment_id", null)
      .is("finding_id", null)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase.from("profiles").select("id, full_name, role").eq("active", true),
    // An action raised here names its own equipment instead of borrowing one.
    supabase
      .from("equipment")
      .select(
        `equipment_id, equipment_name, equipment_code, functional_location,
         sections!inner ( section_name, areas!inner ( production_line ) ),
         equipment_parts ( equipment_part_id, part_name )`
      )
      .eq(EQUIPMENT_LINE_PATH, line)
      .eq("active", true)
      .order("equipment_name"),
    // Still offered as an optional link, so the finding → action chain survives.
    supabase
      .from("inspection_findings")
      .select(
        `finding_id, finding_code, finding_title, severity,
         equipment!inner (
           equipment_name, equipment_code, functional_location,
           sections!inner ( section_name, areas!inner ( production_line ) )
         )`
      )
      .eq(VIA_EQUIPMENT_LINE_PATH, line)
      .neq("status", "Closed")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // The three buckets are disjoint by construction — each narrows on a column
  // the others exclude — so merging cannot double-count.
  const actions = [...(ownEquipment ?? []), ...(viaFinding ?? []), ...(unattached ?? [])]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 400);

  return (
    <ActionsClient
      initialActions={actions}
      profiles={profiles ?? []}
      equipment={equipment ?? []}
      openFindings={findings ?? []}
      canManage={profile?.canWriteMaintenance ?? false}
    />
  );
}
