/**
 * Nothing but `areas` records a production line, so filtering a task or a finding
 * by line means reaching three tables up: task → equipment → section → area.
 *
 * PostgREST will filter on an embedded resource, but only when every hop of the
 * embed is an inner join — an outer join would keep the row and just null the
 * embed, which is exactly the leak we are trying to close. So each select below
 * spells out `!inner` the whole way down, and the matching dotted path travels
 * with it.
 */

/** For queries on `equipment` itself. */
export const EQUIPMENT_LINE_EMBED =
  "sections!inner ( areas!inner ( production_line ) )";
export const EQUIPMENT_LINE_PATH = "sections.areas.production_line";

/** For queries on anything that points at equipment — tasks, findings, actions. */
export const VIA_EQUIPMENT_LINE_EMBED = `equipment!inner ( ${EQUIPMENT_LINE_EMBED} )`;
export const VIA_EQUIPMENT_LINE_PATH = `equipment.${EQUIPMENT_LINE_PATH}`;

/**
 * A maintenance action may name no equipment of its own — when it was raised off
 * a finding, the machine is the finding's. So the action's line has to be read
 * one hop further out.
 */
export const VIA_FINDING_LINE_EMBED = `inspection_findings!inner ( ${VIA_EQUIPMENT_LINE_EMBED} )`;
export const VIA_FINDING_LINE_PATH = `inspection_findings.${VIA_EQUIPMENT_LINE_PATH}`;
