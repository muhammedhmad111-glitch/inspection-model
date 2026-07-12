-- Phase 1 seed data, generated from inspection model.xlsx
-- Do not hand-edit; re-run scripts/import_equipment.py instead.

insert into public.areas (area_code, area_name, description) values
  ('RAW-GRINDING', 'Raw Materials & Grinding', 'Imported from inspection model.xlsx (IJP source data)')
on conflict (area_code) do nothing;

insert into public.sections (area_id, section_code, section_name, description)
select area_id, 'RAW-MILL-CIRCUIT', 'Raw Mill Circuit', 'Raw meal grinding circuit equipment'
from public.areas where area_code = 'RAW-GRINDING'
on conflict (area_id, section_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'BRIDGE-RECLAIMER', 'BRIDGE RECLAIMER', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SAFETY-ENVIRONMENT', 'Safety  & Environment', null
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SAFETY', 'Safety', 'Safety  & Environment'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ENVIRONMENT', 'Environment', 'Safety  & Environment'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT', 'Drive Unit.', null
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HYD-COUPLING-BETWEEN-MOTOR-AND-GEAR-BOX', 'Hyd-Coupling between Motor and Gear Box.', 'Drive Unit.'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'MAIN-GEAR-BOX', 'Main Gear Box.', 'Drive Unit.'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHAIN-SCRAPER', 'Chain scraper', null
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BUCKETS', 'Buckets', 'Chain scraper'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHAIN', 'Chain', 'Chain scraper'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SPROCKET', 'Sprocket', null
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-SPROCKET', 'Drive sprocket', 'Sprocket'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVEN-SPROCKET', 'Driven sprocket', 'Sprocket'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'TRAVELLING-DRIVE', 'Travelling drive.', null
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT-2', 'Drive unit.', 'Travelling drive.'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DISCHARGE-CHUTE', 'Discharge chute', null
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FACE-RAKER', 'Face raker.', null
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'RAKE', 'Rake', 'Face raker.'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FACE-RAKER-DRIVE', 'Face raker drive.', null
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHAIN-2', 'Chain', 'Face raker drive.'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT-3', 'Drive unit.', 'Face raker drive.'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FOUR-TWO-WHEEL-BOGIE', 'Four &two wheel bogie.', 'Face raker drive.'
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure.', null
from public.equipment where equipment_code = 'BRIDGE-RECLAIMER'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'BELT-CONVEYOR-D1101', 'BELT CONVEYOR D1101', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNITF63-F91H10F63-F9F63-G91', 'Drive UnitF63:F91H10F63:F9F63:G91', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX', 'Gear Box.', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HYDRAULIC-COUPLING', 'Hydraulic Coupling', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FEEDING-POINT', 'Feeding Point', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT-SCRAPERS-AND-ROLLERS', 'Belt, scrapers and Rollers', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT', 'Belt', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SCRAPERS', 'Scrapers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLERS', 'Rollers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM', 'Drive Drum', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM-2', 'Drive drum', 'Drive Drum'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVEN-DRUM', 'Driven drum', 'Drive Drum'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVE-SIDE', 'Snub drum at drive side', 'Drive Drum'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVEN-SIDE', 'Snub drum at driven side', 'Drive Drum'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHUTE', 'Chute', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Chute'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-CHUTE', 'Outlet chute', 'Chute'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1101'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'BELT-CONVEYOR-D1119', 'BELT CONVEYOR D1119', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNITF63-F91H10F63-F9F63-G91', 'Drive UnitF63:F91H10F63:F9F63:G91', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX', 'Gear Box.', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HYDRAULIC-COUPLING', 'Hydraulic Coupling', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FEEDING-POINT', 'Feeding Point', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT-SCRAPERS-AND-ROLLERS', 'Belt, scrapers and Rollers', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT', 'Belt', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SCRAPERS', 'Scrapers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLERS', 'Rollers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM', 'Drive Drum', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM-2', 'Drive drum', 'Drive Drum'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVEN-DRUM', 'Driven drum', 'Drive Drum'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVE-SIDE', 'Snub drum at drive side', 'Drive Drum'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVEN-SIDE', 'Snub drum at driven side', 'Drive Drum'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHUTE', 'Chute', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Chute'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-CHUTE', 'Outlet chute', 'Chute'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'BELT-CONVEYOR-D1119'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'D12-06-BELT-CONVEYOR', 'D12.06 Belt conveyor', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNITF63-F91H10F63-F9F63-G91', 'Drive UnitF63:F91H10F63:F9F63:G91', null
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX', 'Gear Box.', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HYDRAULIC-COUPLING', 'Hydraulic Coupling', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FEEDING-POINT', 'Feeding Point', null
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT-SCRAPERS-AND-ROLLERS', 'Belt, scrapers and Rollers', null
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT', 'Belt', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SCRAPERS', 'Scrapers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLERS', 'Rollers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM', 'Drive Drum', null
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM-2', 'Drive drum', 'Drive Drum'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVEN-DRUM', 'Driven drum', 'Drive Drum'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVE-SIDE', 'Snub drum at drive side', 'Drive Drum'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVEN-SIDE', 'Snub drum at driven side', 'Drive Drum'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHUTE', 'Chute', null
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Chute'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-CHUTE', 'Outlet chute', 'Chute'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'D12-06-BELT-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'D12-11-BELT-CONVEYOR-REVERSIBLE', 'D12.11 Belt conveyor reversible', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNITF63-F91H10F63-F9F63-G91', 'Drive UnitF63:F91H10F63:F9F63:G91', null
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX', 'Gear Box.', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HYDRAULIC-COUPLING', 'Hydraulic Coupling', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FEEDING-POINT', 'Feeding Point', null
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT-SCRAPERS-AND-ROLLERS', 'Belt, scrapers and Rollers', null
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT', 'Belt', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SCRAPERS', 'Scrapers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLERS', 'Rollers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM', 'Drive Drum', null
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM-2', 'Drive drum', 'Drive Drum'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVEN-DRUM', 'Driven drum', 'Drive Drum'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVE-SIDE', 'Snub drum at drive side', 'Drive Drum'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVEN-SIDE', 'Snub drum at driven side', 'Drive Drum'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHUTE', 'Chute', null
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Chute'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-CHUTE', 'Outlet chute', 'Chute'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'D12-11-BELT-CONVEYOR-REVERSIBLE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'APRON-ANVEYOR', 'Apron anveyor', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT', 'Drive Unit', null
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX-GEARD-MOTOR', 'Gear Box.(Geard Motor).', 'Drive Unit'
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FEEDING-POINT', 'Feeding Point', null
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'APRON', 'Apron', null
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'PANS', 'Pans', 'Apron'
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHAIN', 'Chain', 'Apron'
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLERS', 'Rollers', 'Apron'
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SPROCKET', 'Sprocket', null
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-SPROCKET', 'Drive sprocket', 'Sprocket'
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVEN-SPROCKET', 'Driven sprocket', 'Sprocket'
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHUTE', 'Chute', null
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Chute'
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-CHUTE', 'Outlet chute', 'Chute'
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'APRON-ANVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'E11-12-BELT-CONVEYOR-COLLECTIVE', 'E11.12 Belt conveyor collective', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNITF63-F91H10F63-F9F63-G91', 'Drive UnitF63:F91H10F63:F9F63:G91', null
from public.equipment where equipment_code = 'E11-12-BELT-CONVEYOR-COLLECTIVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX', 'Gear Box.', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'E11-12-BELT-CONVEYOR-COLLECTIVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HYDRAULIC-COUPLING', 'Hydraulic Coupling', 'Drive UnitF63:F91H10F63:F9F63:G91'
from public.equipment where equipment_code = 'E11-12-BELT-CONVEYOR-COLLECTIVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FEEDING-POINT', 'Feeding Point', null
from public.equipment where equipment_code = 'E11-12-BELT-CONVEYOR-COLLECTIVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT-SCRAPERS-AND-ROLLERS', 'Belt, scrapers and Rollers', null
from public.equipment where equipment_code = 'E11-12-BELT-CONVEYOR-COLLECTIVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT', 'Belt', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'E11-12-BELT-CONVEYOR-COLLECTIVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SCRAPERS', 'Scrapers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'E11-12-BELT-CONVEYOR-COLLECTIVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLERS', 'Rollers', 'Belt, scrapers and Rollers'
from public.equipment where equipment_code = 'E11-12-BELT-CONVEYOR-COLLECTIVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'UNSPECIFIED-8', 'Unnamed Equipment #8', false
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM', 'Drive Drum', null
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM-2', 'Drive drum', 'Drive Drum'
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVEN-DRUM', 'Driven drum', 'Drive Drum'
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVE-SIDE', 'Snub drum at drive side', 'Drive Drum'
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SNUB-DRUM-AT-DRIVEN-SIDE', 'Snub drum at driven side', 'Drive Drum'
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHUTE', 'Chute', null
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Chute'
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-CHUTE', 'Outlet chute', 'Chute'
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'UNSPECIFIED-8'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'ROTARY-VALVE', 'Rotary Valve', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT', 'Drive Unit', null
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX', 'Gear Box.', 'Drive Unit'
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROTARY', 'Rotary', null
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROTARY-CASING', 'Rotary Casing.', 'Rotary'
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROTAY-BEARING-DE', 'Rotay Bearing. DE', 'Rotary'
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROTAY-BEARING-NDE', 'Rotay Bearing. NDE', 'Rotary'
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHUTE', 'Chute', null
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Chute'
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-CHUTE', 'Outlet chute', 'Chute'
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'ROTARY-VALVE'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'ROLLER-MILL', 'ROLLER MILL', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLER-MILLF65-G91H10F65F65-G91', 'Roller MillF65:G91H10F65F65:G91', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'MILL-CASING', 'Mill Casing.', 'Roller MillF65:G91H10F65F65:G91'
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLER-PAIR-A-B-NORTH-SIDE', 'Roller pair (A,B) --- north side.', 'Roller MillF65:G91H10F65F65:G91'
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLER-PAIR-C-D-SOUTH-SIDE', 'Roller pair (C,D) --- south side..', 'Roller MillF65:G91H10F65F65:G91'
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'TABLE', 'Table.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ROLLER-MILL', 'Roller Mill.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HOT-GAS-DUCT', 'Hot gas duct.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CONFINNING-AIR-SYSTEM', 'Confinning air system.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FAN-CASING', 'Fan casing.', 'Confinning air system.'
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CONFINNING-AIR-PIPES', 'Confinning air pipes.', 'Confinning air system.'
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT', 'Drive Unit.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'AUX-GEAR-BOX', 'Aux-Gear Box', 'Drive Unit.'
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CLUTCH-COUPLING-UZWN', 'Clutch coupling (UZWN).', 'Drive Unit.'
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'PENUMATIC-CYLINDER', 'Penumatic Cylinder.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'COUPLING-BETWEEN-MAIN-MOTOR-AND-SEC-GEARBOX', 'Coupling between Main Motor and Sec gearbox', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SEC-GEAR-BOX', 'Sec Gear Box', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'LUBRICATION-CIRCUIT-OF-SEC-GEARBOX', 'Lubrication circuit of sec gearbox.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'COUPLING-BETWEEN-SEC-GEARBOX-AND-MAIN-GEARBOX', 'Coupling between Sec gearbox and Main Gearbox.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'MAIN-GEARBOX', 'Main Gearbox.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'LUBRICATION-CIRCUIT-OF-MAIN-GEARBOX', 'Lubrication circuit of Main gearbox.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HYDRAULIC-SYSTEM-OF-ROLLER-MILL', 'Hydraulic system of Roller Mill.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'WATER-INJECTION', 'Water injection.', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'ROLLER-MILL'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'ROLLER-MILL-DYNAMIC-SEPARATOR', 'ROLLER MILL DYNAMIC SEPARATOR', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT-F62-G95F62-X9F62-G96', 'Drive Unit.F62:G95F62:X9F62:G96', null
from public.equipment where equipment_code = 'ROLLER-MILL-DYNAMIC-SEPARATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'COUPLING', 'Coupling.', 'Drive Unit.F62:G95F62:X9F62:G96'
from public.equipment where equipment_code = 'ROLLER-MILL-DYNAMIC-SEPARATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX', 'Gear Box', 'Drive Unit.F62:G95F62:X9F62:G96'
from public.equipment where equipment_code = 'ROLLER-MILL-DYNAMIC-SEPARATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'LUBRICATION-CIRCUIT-OF-GEARBOX', 'Lubrication circuit of gearbox.', 'Drive Unit.F62:G95F62:X9F62:G96'
from public.equipment where equipment_code = 'ROLLER-MILL-DYNAMIC-SEPARATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CARDAN-SHAFT', 'Cardan Shaft', 'Drive Unit.F62:G95F62:X9F62:G96'
from public.equipment where equipment_code = 'ROLLER-MILL-DYNAMIC-SEPARATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DYNAMIC-SEPARATOR-SEPOL', 'Dynamic Separator(SEPOL).', null
from public.equipment where equipment_code = 'ROLLER-MILL-DYNAMIC-SEPARATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CASING-ROOF', 'Casing & Roof', 'Dynamic Separator(SEPOL).'
from public.equipment where equipment_code = 'ROLLER-MILL-DYNAMIC-SEPARATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-HOT-GAS-DUCT', 'Outlet Hot gas duct.', 'Dynamic Separator(SEPOL).'
from public.equipment where equipment_code = 'ROLLER-MILL-DYNAMIC-SEPARATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'ROLLER-MILL-DYNAMIC-SEPARATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'CHAIN-BUCKET-ELEVATOR', 'CHAIN BUCKET ELEVATOR', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT', 'Drive Unit', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'AUX-GEAR-BOX', 'Aux-Gear box', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HYDRAULIC-COUPLING', 'Hydraulic Coupling', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'MAIN-GEAR-BOX', 'Main Gear Box.', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-COUPLING', 'Gear Coupling', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FEEDING-POINT', 'Feeding Point', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Feeding Point'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FLEX-JOINT', 'Flex-Joint', 'Feeding Point'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ELEVATORF92-G128', 'ElevatorF92:G128', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CASING', 'Casing', 'ElevatorF92:G128'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHAIN', 'Chain', 'ElevatorF92:G128'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BUCKETS', 'Buckets', 'ElevatorF92:G128'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SPROCKET', 'Sprocket', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-SPROCKET', 'Drive sprocket', 'Sprocket'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVEN-SPROCKET', 'Driven sprocket', 'Sprocket'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DISCHARGE-POINT', 'Discharge Point', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DISCHARGE-CHUTE', 'Discharge chute', 'Discharge Point'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'RECIRCULATION-CHUTE', 'Recirculation Chute', 'Discharge Point'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'CHAIN-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'MILL-FAN-EXAUST-FAN', 'Mill Fan (Exaust fan)', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'COUPLING-F60-G90', 'Coupling.+F60:G90', null
from public.equipment where equipment_code = 'MILL-FAN-EXAUST-FAN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FAN-CASING', 'Fan casing', null
from public.equipment where equipment_code = 'MILL-FAN-EXAUST-FAN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FAN-BEARING', 'Fan Bearing', null
from public.equipment where equipment_code = 'MILL-FAN-EXAUST-FAN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FIXED-BEARING-DE', 'Fixed Bearing - DE', 'Fan Bearing'
from public.equipment where equipment_code = 'MILL-FAN-EXAUST-FAN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FIXED-BEARING-NDE', 'Fixed Bearing - NDE', 'Fan Bearing'
from public.equipment where equipment_code = 'MILL-FAN-EXAUST-FAN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DUCTS', 'Ducts', null
from public.equipment where equipment_code = 'MILL-FAN-EXAUST-FAN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-DUCT', 'Inlet duct', 'Ducts'
from public.equipment where equipment_code = 'MILL-FAN-EXAUST-FAN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-DUCT-2', 'Inlet duct', 'Ducts'
from public.equipment where equipment_code = 'MILL-FAN-EXAUST-FAN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FLEX-JOINT', 'Flex-Joint', 'Ducts'
from public.equipment where equipment_code = 'MILL-FAN-EXAUST-FAN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'CHAIN-CONVEYOR-DRAG-CHAIN', 'Chain Conveyor (Drag Chain).', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT', 'Drive Unit', null
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX-GEARD-MOTOR', 'Gear Box.(Geard Motor).', 'Drive Unit'
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHAIN-CONVEYOR-DRAG-CHAIN', 'Chain Conveyor (Drag Chain).', null
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CASING', 'Casing.', 'Chain Conveyor (Drag Chain).'
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHAIN', 'Chain', 'Chain Conveyor (Drag Chain).'
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SPROCKET', 'Sprocket', null
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-SPROCKET-1-BIG', 'Drive sprocket 1 (big)', 'Sprocket'
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-SPROCKET-2-AUX-SMALL', 'Drive sprocket 2 .Aux-(small).', 'Sprocket'
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHUTE', 'Chute', null
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Chute'
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-CHUTE', 'Outlet chute', 'Chute'
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'CHAIN-CONVEYOR-DRAG-CHAIN'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'SCREW-CONVEYOR', 'SCREW CONVEYOR', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT', 'Drive Unit', null
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'GEAR-BOX', 'Gear Box.', 'Drive Unit'
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'COUPLING', 'Coupling', 'Drive Unit'
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SCREW-CONVEYOR', 'Screw conveyor', null
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CASING', 'Casing.', 'Screw conveyor'
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'SCREW', 'Screw', 'Screw conveyor'
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CHUTE', 'Chute', null
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Chute'
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'OUTLET-CHUTE', 'Outlet chute', 'Chute'
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'SCREW-CONVEYOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment (section_id, equipment_code, equipment_name, active)
select section_id, 'BELT-BUCKET-ELEVATOR', 'Belt BUCKET ELEVATOR', true
from public.sections where section_code = 'RAW-MILL-CIRCUIT'
on conflict (equipment_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-UNIT', 'Drive Unit', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'AUX-GEAR-BOX', 'Aux-Gear box', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'HYDRAULIC-COUPLING', 'Hydraulic Coupling', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'MAIN-GEAR-BOX', 'Main Gear Box.', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FLEXACIER-COUPLING', 'Flexacier - Coupling', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FEEDING-POINT', 'Feeding Point', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'INLET-CHUTE', 'Inlet chute', 'Feeding Point'
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'FLEX-JOINT', 'Flex-Joint', 'Feeding Point'
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'ELEVATOR', 'Elevator', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'CASING', 'Casing', 'Elevator'
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'BELT', 'Belt', 'Elevator'
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRUM', 'Drum', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVE-DRUM', 'Drive Drum', 'Drum'
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DRIVEN-DRUM', 'Driven Drum', 'Drum'
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DISCHARGE-POINT', 'Discharge Point', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'DISCHARGE-CHUTE', 'Discharge chute', 'Discharge Point'
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'RECIRCULATION-CHUTE', 'Recirculation Chute', 'Discharge Point'
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTURE', 'Structure', null
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select equipment_id, 'STRUCTRE', 'Structre', 'Structure'
from public.equipment where equipment_code = 'BELT-BUCKET-ELEVATOR'
on conflict (equipment_id, part_code) do nothing;
