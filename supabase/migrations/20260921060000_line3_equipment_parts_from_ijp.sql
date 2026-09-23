-- Line 3 machine parts, imported from the plant's IJP workbooks.
--
-- Shape follows line 1 exactly: one MAIN part per machine, which is what the
-- inspection activities in 20260921050000_line3_inspection_plans_from_ijp.sql
-- hang off. Line 3's IJP sheets describe the machine as a whole rather than
-- naming sub-assemblies, so MAIN is the only part there is to record.
--
-- Only the 26 machines whose IJP folder resolves to a line-3 functional
-- location are here. Seven more folders describe equipment the master data does
-- not have yet and are held back rather than guessed at.

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select e.equipment_id, 'MAIN', e.equipment_name, 'الماكينة'
  from public.equipment e
 where e.equipment_code in (
   'L3-BP-001', 'L3-BP-009', 'L3-BP-011', 'L3-KLN-004', 'L3-KLN-007', 'L3-KLN-020', 'L3-KLN-026', 'L3-KLN-035', 'L3-KLN-039', 'L3-KLN-041', 'L3-KLN-043', 'L3-KLN-046', 'L3-RM-002', 'L3-RM-003', 'L3-RM-009', 'L3-RM-014', 'L3-RM-018', 'L3-RM-019', 'L3-RM-025', 'L3-RM-029', 'L3-RM-030', 'L3-RM-032', 'L3-RM-033', 'L3-RM-037', 'L3-RM-043', 'L3-RM-052'
 );
