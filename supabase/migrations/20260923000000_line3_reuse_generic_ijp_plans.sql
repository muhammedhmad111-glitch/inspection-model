-- Line 3 came with IJP folders for its big machines only — the kiln, the mills,
-- the fans, the reclaimer. The ordinary conveying gear arrived with no plan at
-- all: 121 of its 147 machines had nothing to inspect.
--
-- A screw conveyor is a screw conveyor, though. Where line 1 (or an already
-- imported line-3 machine) has a real IJP sheet for the same kind of equipment,
-- this migration copies that plan onto the bare line-3 machine and renames it
-- for its new owner — the code takes the target's equipment code, the name
-- takes the target's equipment name, and the checklist rides along untouched.
--
-- Deliberately NOT copied:
--   * the 20 line-3 filters. Every line-1 filter plan is a `-GEN` placeholder
--     ("فحص عام"), not IJP; the only real filter sheets belong to EP1/EP2, which
--     are electrostatic precipitators and share no parts with a bag filter.
--   * gates, valves, dampers and hoppers — same reason, placeholder plans only.
--   * one-off machines with no analogue on either line (disk screen, moving
--     floor, vecobelt drive, magnetic separator, sampler, heat exchanger).
--
-- Safe to re-run: activity codes are unique per part, and every insert here
-- skips a code that already exists.

-- The pairing. Left column is the line-3 machine that needs a plan, right is
-- the machine whose IJP sheet it borrows. `L3-` templates are line-3 natives
-- imported from its own IJP and are preferred when they exist, because they
-- describe this line's actual make of equipment.
create temporary table plan_source (target text primary key, template text not null);
insert into plan_source (target, template) values
  -- Screw conveyors — line 1's "Screw conveyor M14" is the canonical sheet;
  -- the screw under the conditioning tower borrows from its opposite number.
  ('L3-AF-001','BP-005'), ('L3-AF-002','BP-005'), ('L3-AF-007','BP-005'),
  ('L3-AF-008','BP-005'), ('L3-BP-013','BP-005'), ('L3-BP-015','BP-005'),
  ('L3-KLN-006','BP-005'), ('L3-KLN-011','BP-005'), ('L3-RM-045','BP-005'),
  ('L3-BP-003','BP-017'),

  -- Drag chains — line 1 has only a placeholder, but line 3's own east drag
  -- chain came in with a full sheet.
  ('L3-AF-003','L3-RM-052'), ('L3-KLN-055','L3-RM-052'), ('L3-KLN-056','L3-RM-052'),
  ('L3-KLN-057','L3-RM-052'), ('L3-KLN-058','L3-RM-052'), ('L3-KLN-059','L3-RM-052'),
  ('L3-KLN-060','L3-RM-052'), ('L3-RM-054','L3-RM-052'),

  -- Rotary feeders — again a line-3 native beats line 1's placeholder.
  ('L3-BP-012','L3-RM-029'), ('L3-KLN-029','L3-RM-029'), ('L3-RM-036','L3-RM-029'),
  ('L3-RM-053','L3-RM-029'), ('L3-RM-055','L3-RM-029'),

  -- Bucket elevator.
  ('L3-BP-014','RM-025'),

  -- Air slides — matched to the line-1 slide in the same duty where one exists
  -- (after an elevator, over a silo, fine slides under cyclones).
  ('L3-KLN-001','RM-029'), ('L3-KLN-010','RM-052'),
  ('L3-KLN-009','KLN-009'), ('L3-KLN-022','KLN-009'),
  ('L3-KLN-002','KLN-003'), ('L3-KLN-013','KLN-003'), ('L3-KLN-016','KLN-003'),
  ('L3-KLN-018','KLN-003'), ('L3-KLN-024','KLN-003'), ('L3-KLN-028','KLN-003'),

  -- Aprons and weigh feeders.
  ('L3-RM-012','RM-015'), ('L3-RM-017','RM-015'), ('L3-RM-022','RM-015'),
  ('L3-RM-023','RM-017'), ('L3-RM-024','RM-017'),
  ('L3-AF-004','RM-017'), ('L3-AF-010','RM-017'),

  -- Conveyors — the clinker pans copy line 3's own clinker conveyor, the
  -- vecobelt copies a line-3 belt.
  ('L3-KLN-052','L3-KLN-043'), ('L3-KLN-053','L3-KLN-043'), ('L3-KLN-054','L3-KLN-043'),
  ('L3-AF-006','L3-RM-003'),

  -- Process fans — line 3's cooler-fan sheet is the fullest generic fan plan
  -- either line has (visual running, visual stopped, bearings, impeller wear,
  -- motor/fan alignment).
  ('L3-KLN-036','L3-KLN-041'), ('L3-KLN-037','L3-KLN-041'),
  ('L3-KLN-038','L3-KLN-041'), ('L3-KLN-064','L3-KLN-041'),
  ('L3-KLN-062','L3-KLN-041'), ('L3-RM-051','L3-KLN-041');

-- Activities hang off a part, not off the equipment, so a target with no part
-- record needs its MAIN one first. Same shape the IJP import used.
insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select e.equipment_id, 'MAIN', e.equipment_name, 'الماكينة'
from public.equipment e
join plan_source ps on ps.target = e.equipment_code
where not exists (
  select 1 from public.equipment_parts ep
  where ep.equipment_id = e.equipment_id and ep.part_code = 'MAIN'
);

-- The copy. Two rewrites happen here and nothing else:
--   code  — the template's equipment code at the front is swapped for the
--           target's, keeping the IJP sheet reference that follows it.
--   name  — everything before the em dash is the machine's name, so only that
--           leading part is replaced.
insert into public.inspection_activities (
  equipment_part_id, activity_code, activity_name, inspection_category,
  frequency_type, custom_interval_days, priority, responsible_role,
  requires_shutdown, instructions, standard_checklist, start_date
)
select
  tp.equipment_part_id,
  te.equipment_code || substr(src.activity_code, length(se.equipment_code) + 1),
  te.equipment_name || ' — ' || substr(src.activity_name, position(' — ' in src.activity_name) + 3),
  src.inspection_category, src.frequency_type, src.custom_interval_days,
  src.priority, src.responsible_role, src.requires_shutdown, src.instructions,
  src.standard_checklist,
  current_date
from plan_source ps
join public.equipment te on te.equipment_code = ps.target
join public.equipment_parts tp
  on tp.equipment_id = te.equipment_id and tp.part_code = 'MAIN'
join public.equipment se on se.equipment_code = ps.template
join public.equipment_parts sp
  on sp.equipment_id = se.equipment_id and sp.part_code = 'MAIN'
join public.inspection_activities src on src.equipment_part_id = sp.equipment_part_id
-- `-GEN` rows are the hand-made "فحص عام" stand-ins, not IJP; never propagate them.
where src.activity_code not like '%-GEN'
  and position(' — ' in src.activity_name) > 0
  and not exists (
    select 1 from public.inspection_activities x
    where x.equipment_part_id = tp.equipment_part_id
      and x.activity_code =
          te.equipment_code || substr(src.activity_code, length(se.equipment_code) + 1)
  );

drop table plan_source;
