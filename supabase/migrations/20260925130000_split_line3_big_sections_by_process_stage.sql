-- Four line-3 sections each hold a whole run of the plant, so "Raw materials"
-- covers everything from the stockpile reclaimer to the mill feed weigh
-- feeders — 28 machines in one bucket, which is a filter nobody can narrow and
-- a report line nobody can act on.
--
-- Line 3's functional locations are clean and sequential, unlike line 1's
-- (B01, RM1, RM2, and 23 machines with no location at all), and their leading
-- group is the process stage: C11 the stockpile, D11 limestone handling, D12
-- additives, E11 dosing then the mill, F11 the raw meal silo, G11 the mixing
-- chamber, H11 kiln feed, K13 the cooler, L11/L54 clinker transport. So the
-- split follows the location, which means it follows the plant rather than an
-- opinion about it.
--
-- Only equipment moves; nothing is deleted. Plans and tasks hang off equipment,
-- not sections, so they travel with their machine and no schedule changes. The
-- old sections stay in place and keep the machines of their first stage, so
-- every section code already in a report still resolves.

-- ---------------------------------------------------------------- Raw mills
-- RM3-SEC01 "Raw materials" (28) keeps the stockpile and sheds three stages.
insert into public.sections (area_id, section_code, section_name)
select a.area_id, v.code, v.name
from public.areas a,
     (values
        ('RM3-SEC04', 'Limestone handling'),
        ('RM3-SEC05', 'Additives handling'),
        ('RM3-SEC06', 'Raw mill feed and dosing')
     ) as v(code, name)
where a.area_code = 'RM3'
  and not exists (select 1 from public.sections s where s.section_code = v.code);

update public.equipment e
set section_id = s.section_id
from public.sections s, public.sections old
where old.section_code = 'RM3-SEC01' and e.section_id = old.section_id
  and s.section_code = case
        when e.functional_location like 'D11%' then 'RM3-SEC04'
        when e.functional_location like 'D12%' then 'RM3-SEC05'
        when e.functional_location like 'E11%' then 'RM3-SEC06'
      end;

update public.sections set section_name = 'Stockpile and reclaimer'
where section_code = 'RM3-SEC01';

-- ------------------------------------------------------- Homo silo and feed
-- KLN3-SEC01 (32) is three stages in a row: silo, mixing chamber, kiln feed.
insert into public.sections (area_id, section_code, section_name)
select a.area_id, v.code, v.name
from public.areas a,
     (values
        ('KLN3-SEC07', 'Mixing chamber'),
        ('KLN3-SEC08', 'Kiln feed')
     ) as v(code, name)
where a.area_code = 'KLN3'
  and not exists (select 1 from public.sections s where s.section_code = v.code);

update public.equipment e
set section_id = s.section_id
from public.sections s, public.sections old
where old.section_code = 'KLN3-SEC01' and e.section_id = old.section_id
  and s.section_code = case
        when e.functional_location like 'G11%' then 'KLN3-SEC07'
        when e.functional_location like 'H11%' then 'KLN3-SEC08'
      end;

update public.sections set section_name = 'Raw meal silo'
where section_code = 'KLN3-SEC01';

-- ------------------------------------------------------------------ Cooler
-- KLN3-SEC04 (16) is the cooler itself plus the clinker line out of it.
insert into public.sections (area_id, section_code, section_name)
select a.area_id, v.code, v.name
from public.areas a,
     (values
        ('KLN3-SEC09', 'Clinker transport'),
        ('KLN3-SEC10', 'Clinker to storage')
     ) as v(code, name)
where a.area_code = 'KLN3'
  and not exists (select 1 from public.sections s where s.section_code = v.code);

update public.equipment e
set section_id = s.section_id
from public.sections s, public.sections old
where old.section_code = 'KLN3-SEC04' and e.section_id = old.section_id
  and s.section_code = case
        when e.functional_location like 'L11%' then 'KLN3-SEC09'
        when e.functional_location like 'L54%'
          or e.functional_location like 'L56%' then 'KLN3-SEC10'
      end;

-- -------------------------------------------------------------- Raw mill
-- RM3-SEC02 (21) keeps the mill; the valve run to the silo is its own stage.
insert into public.sections (area_id, section_code, section_name)
select a.area_id, 'RM3-SEC07', 'Mill outlet to silo'
from public.areas a
where a.area_code = 'RM3'
  and not exists (select 1 from public.sections s where s.section_code = 'RM3-SEC07');

update public.equipment e
set section_id = s.section_id
from public.sections s, public.sections old
where old.section_code = 'RM3-SEC02' and e.section_id = old.section_id
  and e.functional_location like 'F11%'
  and s.section_code = 'RM3-SEC07';

-- L3-BP-001's location was typed 'k14.01' in lower case, which is the only
-- reason it did not group with the other seventeen bypass machines above.
update public.equipment
set functional_location = upper(functional_location)
where functional_location ~ '^[a-z]';
