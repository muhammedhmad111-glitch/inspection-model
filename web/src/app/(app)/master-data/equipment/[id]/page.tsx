import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { EquipmentDetailClient } from "./equipment-detail-client";
import { Equipment360 } from "./equipment-360";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: equipment } = await supabase
    .from("equipment")
    .select("*, sections(*, areas(*))")
    .eq("equipment_id", id)
    .single();

  if (!equipment) notFound();

  const { data: parts } = await supabase
    .from("equipment_parts")
    .select("*")
    .eq("equipment_id", id)
    .order("part_group")
    .order("part_code");

  return (
    <div className="flex flex-col gap-8">
      <EquipmentDetailClient
        equipment={equipment}
        initialParts={parts ?? []}
        canWrite={profile?.canWriteMasterData ?? false}
      />
      <Equipment360 equipmentId={id} />
    </div>
  );
}
