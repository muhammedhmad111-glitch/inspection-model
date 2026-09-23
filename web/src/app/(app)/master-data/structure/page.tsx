import { createClient } from "@/lib/supabase/server";
import { PRODUCTION_LINES, type ProductionLine } from "@/lib/production-line";
import { StructureClient, type LineTree } from "./structure-client";

/**
 * The one page that shows both lines side by side.
 *
 * Everywhere else in the app a line is a mode — you pick one in the topbar and
 * the whole screen answers for it. That is right for doing work, and wrong for
 * understanding the plant: to see that line 3 is a second Kiln and a second Raw
 * mills rather than more of line 1, you have to see them next to each other. So
 * this page ignores the active line and reads both, and the tabs here change
 * nothing outside this page.
 *
 * Areas, sections and equipment arrive in a single nested read — 7 areas, 20
 * sections and 281 machines, small enough that three round trips would cost
 * more than the rows do.
 */
export default async function StructurePage() {
  const supabase = await createClient();

  // Plain embeds, not `!inner`: an area with no sections yet, or a section with
  // no equipment, is exactly what someone opening this page needs to notice.
  const { data: areas } = await supabase
    .from("areas")
    .select(
      `area_id, area_code, area_name, description, active, production_line,
       sections (
         section_id, section_code, section_name, active,
         equipment (
           equipment_id, equipment_code, equipment_name, functional_location, active
         )
       )`
    )
    .order("production_line")
    .order("area_code");

  const byLine: LineTree[] = PRODUCTION_LINES.map((line) => {
    const lineAreas = (areas ?? [])
      .filter((a) => a.production_line === line)
      .map((a) => ({
        ...a,
        sections: [...a.sections]
          .sort((x, y) => x.section_code.localeCompare(y.section_code))
          .map((s) => ({
            ...s,
            equipment: [...s.equipment].sort((x, y) =>
              x.equipment_code.localeCompare(y.equipment_code)
            ),
          })),
      }));

    return {
      line: line as ProductionLine,
      areas: lineAreas,
      counts: {
        areas: lineAreas.length,
        sections: lineAreas.reduce((n, a) => n + a.sections.length, 0),
        equipment: lineAreas.reduce(
          (n, a) => n + a.sections.reduce((m, s) => m + s.equipment.length, 0),
          0
        ),
      },
    };
  });

  return <StructureClient lines={byLine} />;
}
