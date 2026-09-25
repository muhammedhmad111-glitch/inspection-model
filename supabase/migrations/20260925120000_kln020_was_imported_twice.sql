-- L3-KLN-020, the kiln feed bucket elevator, carries its IJP workbook twice.
--
-- Fingerprinting the checklists turns up plans that match byte for byte, but a
-- matching fingerprint on its own proves nothing: the drive drum and the driven
-- drum of an elevator get the same seven checks, and the girth gear is measured
-- cold and hot off one list. Those are two real inspections that happen to read
-- alike, not one inspection entered twice.
--
-- What settles it here is the count against the sibling elevators. L3-KLN-007
-- and L3-KLN-026 are the same machine and each carries 6 semi-annual plans /
-- 101 items and 1 weekly / 57. L3-KLN-020 carries 12 / 202 and 2 / 114 —
-- exactly double, and the two halves have the same multiset of fingerprints as
-- one sibling's whole set. One half is also named off the second page of the
-- workbook (".07 FLIS- 6 month"), which is how the same sheet got read twice.
--
-- So the half whose names match the siblings stays, and KLN-020 ends up reading
-- exactly like the other two elevators. None of the dropped plans has a
-- completed task, a checklist entry or a finding; their tasks cascade.
--
-- Left alone deliberately: L3-KLN-007 / L3-KLN-026 "SIS -Drive" vs "SIS -1
-- Driven" (two drums), L3-KLN-035 girth gear cold vs hot, and L3-RM-019, which
-- matches two genuinely different workbooks and is the owner's call.

-- 1) Drop the second copy. The survivors are the ones the siblings also have.
delete from public.inspection_activities a
using public.equipment_parts ep, public.equipment e
where a.equipment_part_id = ep.equipment_part_id
  and ep.equipment_id = e.equipment_id
  and e.equipment_code = 'L3-KLN-020'
  and a.activity_code in (
    'L3-KLN-020-SIS-6M',    -- "Drive drum bearings" = kept SIS-6M-7  "SIS -Drive"
    'L3-KLN-020-SIS-6M-2',  -- "Driven drum"         = kept SIS-6M-6  "SIS -1 Driven"
    'L3-KLN-020-SIS-6M-3',  -- "Joint"               = kept SIS-6M-9
    'L3-KLN-020-SIS-6M-4',  -- ".07 - SIS -6 month"  = kept SIS-6M-8
    'L3-KLN-020-SIS-6M-5',  -- ".07-SIS - 6 month"   = kept SIS-6M-10
    'L3-KLN-020-FLIS-6M',   -- ".07 FLIS- 6 month"   = kept FLIS-6M-2
    'L3-KLN-020-FLIR-1W'    -- ".07 FLIR- 1 week"    = kept FLIR-1W-2
  );

-- 2) Close the gaps the delete left, so the codes read like L3-KLN-026's.
--    Every target code was just freed above, so the unique key never collides.
update public.inspection_activities a
set activity_code = m.new_code
from public.equipment_parts ep, public.equipment e,
     (values
        ('L3-KLN-020-SIS-6M-6',  'L3-KLN-020-SIS-6M'),
        ('L3-KLN-020-SIS-6M-7',  'L3-KLN-020-SIS-6M-2'),
        ('L3-KLN-020-SIS-6M-8',  'L3-KLN-020-SIS-6M-3'),
        ('L3-KLN-020-SIS-6M-9',  'L3-KLN-020-SIS-6M-4'),
        ('L3-KLN-020-SIS-6M-10', 'L3-KLN-020-SIS-6M-5'),
        ('L3-KLN-020-FLIS-6M-2', 'L3-KLN-020-FLIS-6M'),
        ('L3-KLN-020-FLIR-1W-2', 'L3-KLN-020-FLIR-1W')
     ) as m(old_code, new_code)
where a.equipment_part_id = ep.equipment_part_id
  and ep.equipment_id = e.equipment_id
  and e.equipment_code = 'L3-KLN-020'
  and a.activity_code = m.old_code;

-- 3) The kiln's quarterly girth-gear temperature sheet landed twice under the
--    same name and the same nine checks. Unlike the cold/hot pair next to it,
--    there is nothing to tell the two apart, because they are one sheet.
delete from public.inspection_activities a
using public.equipment_parts ep, public.equipment e
where a.equipment_part_id = ep.equipment_part_id
  and ep.equipment_id = e.equipment_id
  and e.equipment_code = 'L3-KLN-035'
  and a.activity_code = 'L3-KLN-035-SIS-3M-2';
