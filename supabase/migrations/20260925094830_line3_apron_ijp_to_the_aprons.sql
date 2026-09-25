-- The "Apron Feeder IJPs" sheet names its machine in its own header:
-- 1200-16-31-10-E11-04 APRON FEEDER (MIXTURE). E11.04 is L3-RM-017, the Mix
-- apron. It was imported onto L3-RM-018, the Mix weigh feeder at E11.05 — the
-- next functional location along.
--
-- The checklist gives it away independently of the header: it asks for Pans,
-- Chain, Rollers and Drive/Driven sprocket, which are apron-feeder parts. A
-- weigh belt feeder has a belt and load cells and none of those, so an inspector
-- standing at E11.05 was being asked to examine things that are not there, while
-- the apron itself had no plan at all.
--
-- So the plan moves to the three aprons: L3-RM-017, which the sheet actually
-- names, and the Additives and HG aprons, which are the same kind of machine on
-- the same line. The rows are copied from L3-RM-018 rather than re-read from the
-- workbook, so the checklists stay byte-identical to what was already reviewed.
--
-- The owner's ruling is that the Mix weigh feeder is not an apron type, so it
-- keeps nothing and waits for its own sheet. Its 67 scheduled tasks cascade;
-- none carried a finding, which would have blocked the delete outright.

-- 1) Copy onto the aprons. Code and name swap their leading equipment identity,
--    exactly as 20260923000000 did, and start counting from today.
insert into public.inspection_activities (
  equipment_part_id, activity_code, activity_name, inspection_category,
  frequency_type, custom_interval_days, priority, responsible_role,
  requires_shutdown, instructions, standard_checklist, start_date
)
select
  tp.equipment_part_id,
  te.equipment_code || substr(src.activity_code, length('L3-RM-018') + 1),
  te.equipment_name || ' — ' || substr(src.activity_name, position(' — ' in src.activity_name) + 3),
  src.inspection_category, src.frequency_type, src.custom_interval_days,
  src.priority, src.responsible_role, src.requires_shutdown, src.instructions,
  src.standard_checklist, current_date
from public.inspection_activities src
join public.equipment se on se.equipment_code = 'L3-RM-018'
join public.equipment_parts sp
  on sp.equipment_id = se.equipment_id and sp.part_code = 'MAIN'
 and sp.equipment_part_id = src.equipment_part_id
join public.equipment te on te.equipment_code in ('L3-RM-017','L3-RM-012','L3-RM-022')
join public.equipment_parts tp
  on tp.equipment_id = te.equipment_id and tp.part_code = 'MAIN'
where position(' — ' in src.activity_name) > 0
  and not exists (
    select 1 from public.inspection_activities x
    where x.equipment_part_id = tp.equipment_part_id
      and x.activity_code =
          te.equipment_code || substr(src.activity_code, length('L3-RM-018') + 1)
  );

-- 2) Take it off the weigh feeder it never described.
delete from public.inspection_activities a
using public.equipment_parts ep, public.equipment e
where a.equipment_part_id = ep.equipment_part_id
  and ep.equipment_id = e.equipment_id
  and e.equipment_code = 'L3-RM-018';
