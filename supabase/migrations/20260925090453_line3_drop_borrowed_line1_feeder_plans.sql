-- Line 3's aprons, weigh feeders and bucket elevator were given line-1 IJP sheets
-- by 20260923000000_line3_reuse_generic_ijp_plans.sql. The owner's judgement on
-- 2026-09-25 is that the two lines' machines differ enough that a borrowed line-1
-- sheet misdescribes them, so those plans come off.
--
-- Deliberately KEPT, by the same decision:
--   * the 10 screw conveyors (BP-005, BP-017) and 10 air slides (KLN-003,
--     KLN-009, RM-029, RM-052) — a screw is a screw, an air slide is an air slide.
--   * the 23 machines that borrowed from a line-3 donor; those are line 3's own
--     sheets applied to sibling line-3 machines, never line 1's.
--
-- 8 machines, 36 activities. Their scheduled tasks cascade (545 of them, all
-- Scheduled/Upcoming bar one empty In Progress); no finding hangs off any of them,
-- which matters because inspection_findings restricts rather than cascades.
-- These machines are left with no plan at all until their real line-3 IJP arrives.

with plan_source(target, template) as (values
  ('L3-RM-012','RM-015'),('L3-RM-017','RM-015'),('L3-RM-022','RM-015'),
  ('L3-RM-023','RM-017'),('L3-RM-024','RM-017'),
  ('L3-AF-004','RM-017'),('L3-AF-010','RM-017'),
  ('L3-BP-014','RM-025')
), doomed as (
  -- Re-derive exactly what the reuse migration created: the target's code in
  -- front of the donor's IJP sheet reference.
  select ia.inspection_activity_id
  from plan_source ps
  join public.equipment te on te.equipment_code = ps.target
  join public.equipment_parts tp on tp.equipment_id = te.equipment_id and tp.part_code = 'MAIN'
  join public.equipment se on se.equipment_code = ps.template
  join public.equipment_parts sp on sp.equipment_id = se.equipment_id and sp.part_code = 'MAIN'
  join public.inspection_activities src on src.equipment_part_id = sp.equipment_part_id
  join public.inspection_activities ia
    on ia.equipment_part_id = tp.equipment_part_id
   and ia.activity_code = te.equipment_code || substr(src.activity_code, length(se.equipment_code) + 1)
)
delete from public.inspection_activities a
using doomed d
where a.inspection_activity_id = d.inspection_activity_id;
