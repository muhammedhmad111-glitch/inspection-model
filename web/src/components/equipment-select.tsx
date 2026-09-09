"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { equipmentFull } from "@/lib/equipment-ref";

export type EquipmentOption = {
  equipment_id: string;
  equipment_name: string;
  equipment_code: string;
  functional_location: string | null;
  sections: { section_name: string } | null;
  equipment_parts: { equipment_part_id: string; part_name: string }[];
};

/**
 * Picks an equipment and the part on it. Most equipment carries a single part, so
 * the part list only appears when there is an actual choice to make — otherwise it
 * is selected along with the equipment.
 */
export function EquipmentSelect({
  equipment,
  equipmentId,
  partId,
  onChange,
}: {
  equipment: EquipmentOption[];
  equipmentId: string;
  partId: string;
  onChange: (next: { equipmentId: string; partId: string }) => void;
}) {
  const selected = equipment.find((e) => e.equipment_id === equipmentId);
  const parts = selected?.equipment_parts ?? [];

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>المعدة</Label>
        <Select
          value={equipmentId}
          onValueChange={(id) => {
            const next = equipment.find((e) => e.equipment_id === id);
            const only = next?.equipment_parts.length === 1
              ? next.equipment_parts[0].equipment_part_id
              : "";
            onChange({ equipmentId: id, partId: only });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر المعدة..." />
          </SelectTrigger>
          <SelectContent>
            {equipment.map((e) => (
              <SelectItem key={e.equipment_id} value={e.equipment_id}>
                {/* Never the bare name: this plant runs a dozen machines called
                    "Belt conveyor" and picking the wrong one files the action
                    against equipment nobody inspected. */}
                {equipmentFull(e)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {parts.length > 1 ? (
        <div className="flex flex-col gap-2">
          <Label>الجزء</Label>
          <Select
            value={partId}
            onValueChange={(id) => onChange({ equipmentId, partId: id })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الجزء..." />
            </SelectTrigger>
            <SelectContent>
              {parts.map((p) => (
                <SelectItem key={p.equipment_part_id} value={p.equipment_part_id}>
                  {p.part_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </>
  );
}
