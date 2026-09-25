-- An inspection plan hangs off an equipment_part, never off the equipment row
-- itself. 70 line-3 machines have no part at all, so they cannot carry a plan
-- even once their IJP sheet arrives — the import would have nowhere to attach
-- and would fail or, worse, quietly skip them. Line 1 has none of these: all
-- 133 of its machines already carry one.
--
-- Every part in the table today follows one shape — part_code 'MAIN', the
-- machine's own name, group 'الماكينة', inspectable — so these follow it too
-- rather than inventing a second convention. Criticality is inherited from the
-- machine instead of hardcoded to the 'Medium' default, so the field means
-- something the day someone starts grading machines.
--
-- This creates the place to hang a plan, not the plan. All 70 stay without an
-- inspection until a real IJP sheet names them; see the note on -GEN
-- placeholders for why an invented plan is worse than none.

insert into public.equipment_parts (
  equipment_id, part_code, part_name, part_group, criticality, inspectable, active
)
select e.equipment_id, 'MAIN', e.equipment_name, 'الماكينة', e.criticality, true, true
from public.equipment e
where not exists (
  select 1 from public.equipment_parts ep where ep.equipment_id = e.equipment_id
);
