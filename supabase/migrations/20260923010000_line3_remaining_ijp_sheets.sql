-- The last nine line-3 IJP sheets, and the machine one of them belongs to.
--
-- Seven folders were held back by the first import because their names resolved
-- to no line-3 equipment. Re-reading them shows three were misfiled rather than
-- orphaned — "K13.05 cooler Drag chain" holds sheets tagged F11.05, "K13.08
-- Cooler EP Fan" holds E11.28, "K13.13.14 Screw conveyor" holds F11.07 — and
-- their contents are already in the database under the correctly tagged
-- machines. Comparing each sheet's checklist by md5 against what is stored
-- proves it: 16 of the 25 distinct sheets are byte-identical to rows we have.
--
-- That leaves nine genuinely missing sheets:
--   * K12.04 "Primary air fan IJPs.xls"  -> L3-KLN-038 Primary fan (3 sheets)
--   * K13.13.14 one unmatched screw sheet -> L3-KLN-004 Screw conveyor (1)
--   * K11.04 "Precalsiner fan IJPs.xls"  -> a machine line 3 never had (5)
--
-- The precalciner fan is created here. It is not a guess: the workbook is named
-- for it, it carries its own five-sheet plan, and K11.04 sits unused between the
-- Dopol fan (K11.02) and the calciner (K11.03).
--
-- L3-KLN-038 is holding a borrowed cooler-fan plan from
-- 20260923000000_line3_reuse_generic_ijp_plans.sql. Its real IJP arrives below,
-- so the stand-in is removed first — a borrowed plan is only ever a placeholder
-- for the sheet the machine actually has.

insert into public.equipment (section_id, equipment_code, equipment_name, functional_location, criticality)
select s.section_id, 'L3-KLN-065', 'Precalciner fan', 'K11.04', 'High'
  from public.sections s
  join public.areas a on a.area_id = s.area_id
 where a.production_line = 3 and s.section_name = 'Preheater'
   and not exists (select 1 from public.equipment x where x.equipment_code = 'L3-KLN-065');

insert into public.equipment_parts (equipment_id, part_code, part_name, part_group)
select e.equipment_id, 'MAIN', e.equipment_name, 'الماكينة'
  from public.equipment e
 where e.equipment_code = 'L3-KLN-065'
   and not exists (select 1 from public.equipment_parts ep
                    where ep.equipment_id = e.equipment_id and ep.part_code = 'MAIN');

delete from public.inspection_activities ia
 using public.equipment_parts ep, public.equipment e
 where ia.equipment_part_id = ep.equipment_part_id
   and ep.equipment_id = e.equipment_id
   and e.equipment_code = 'L3-KLN-038';

insert into public.inspection_activities (
  equipment_part_id, activity_code, activity_name, inspection_category,
  frequency_type, custom_interval_days, priority, responsible_role,
  requires_shutdown, instructions, standard_checklist, start_date
) values
  ((select ep.equipment_part_id from public.equipment_parts ep
      join public.equipment e on e.equipment_id = ep.equipment_id
     where e.equipment_code = 'L3-KLN-004' and ep.part_code = 'MAIN'),
   'L3-KLN-004-SIS-1Y-2', 'Screw conveyor — alignment between the gear box and screw conveyor (1 year)', 'Alignment', 'Annual', null, 'Medium', 'Mechanical Engineer', true,
   'This inspection is carried out to : inspect the alignment between the gear box and screw conveyor based on specific checks under stoppage condition.',
   (select coalesce(jsonb_agg(jsonb_build_object('label', x)), '[]'::jsonb)
      from jsonb_array_elements_text('["Safety: Check condition of access, guardrails, housings, ladders, emergency stops", "Safety: Check lighting", "Measuring Procedure: Dismantel the Screw conveyor coupling covers.", "Measuring Procedure: Clean very well all the material or greas.", "Measuring Procedure: Measure the gap between the two half of coupling in 4 postion angular and radial.", "Measuring Procedure: Erect the coupling cover again and fix it."]'::jsonb) x), current_date),
  ((select ep.equipment_part_id from public.equipment_parts ep
      join public.equipment e on e.equipment_id = ep.equipment_id
     where e.equipment_code = 'L3-KLN-038' and ep.part_code = 'MAIN'),
   'L3-KLN-038-FLIR-1W', 'Primary fan — outer components of the primary air fan (1 week)', 'Visual', 'Weekly', null, 'Medium', 'Mechanical Engineer', false,
   'This inspection is carried out to : inspect all the outer components of the Primary air  fan based on visual checks and other simple controls while it is under normal operating condition.',
   (select coalesce(jsonb_agg(jsonb_build_object('label', x)), '[]'::jsonb)
      from jsonb_array_elements_text('["Safety: Check condition of access, guardrails, housings, ladders, emergency stops", "Safety: Check lighting", "Safety: Check earthing cables and connectors", "Safety: Check general condition of emergency stops", "Safety: Check protections for nips and moving parts", "Environment: Cleaning of the equipement and around.", "Environment: Condition of dust emission.", "Environment: Coupling.", "Environment: Check the abnormal noise.", "Environment: Review the coupling cover fixation between Motor and fan.", "Environment: Fan Casing & Base.", "Environment: Fan casing.", "Environment: Check abnormal noise.", "Environment: Check the condtion of worn-out.", "Environment: Check the condtion of crack or casing vibration.", "Environment: Check the condition of fastening.", "Environment: Check the fixation of protection screen of inlet cone.", "Environment: Fan Base.", "Environment: Check the base for Vibration.", "Environment: Check the steel structure fixation or cracks.", "Environment: Check the shock absorbal fixation.", "Environment: Fan Bearing", "Environment: Fixed Bearing - DE", "Environment: Check the bearing temprature by the hand piromter.", "Environment: Check the abnormal noise or sound.", "Environment: Check the oil leakage from bearing housing.", "Environment: Check visual if there is any vibration appearing.", "Environment: Free Bearing - NDE", "Environment: Check the bearing temprature by the hand piromter.", "Environment: Check the abnormal noise or sound.", "Environment: Check the oil leakage from bearing housing.", "Environment: Check visual if there is any vibration appearing.", "Environment: Outlet  duct", "Environment: Check the condtion of worn-out or falls air..", "Environment: Check the condition of outlet damper.", "Environment: Flex-Joint", "Environment: Check the condition of Flex-joint (cut , tear, wear)", "Environment: Check the material blockage in the joint.", "Environment: Check the condition of thilinser of the suction."]'::jsonb) x), current_date),
  ((select ep.equipment_part_id from public.equipment_parts ep
      join public.equipment e on e.equipment_id = ep.equipment_id
     where e.equipment_code = 'L3-KLN-038' and ep.part_code = 'MAIN'),
   'L3-KLN-038-FLIS-6M', 'Primary fan — outer components of the primary air fan (6 month)', 'Visual', 'Semi-Annual', null, 'Medium', 'Mechanical Engineer', true,
   'This inspection is carried out to : inspect all the outer components of the primary air fan based on visual checks and other simple controls while it is under Stoppage condition.',
   (select coalesce(jsonb_agg(jsonb_build_object('label', x)), '[]'::jsonb)
      from jsonb_array_elements_text('["Safety: Check condition of access, guardrails, housings, ladders, emergency stops", "Safety: Check lighting", "Safety: Check earthing cables and connectors", "Safety: Check general condition of emergency stops", "Safety: Check protections for nips and moving parts", "Environment: Cleaning of the equipement and around.", "Environment: Condition of dust emission.", "Environment: Coupling.", "Environment: Check the rubber element of coupling (wear, cutting, defected).", "Environment: Review the coupling cover fixation between Motor and fan.", "Environment: Fan Casing & Base.", "Environment: Fan casing.", "Environment: Check the inspection door (seals,bolt fixation,bolt missed).", "Environment: Check the casing internally condtion of worn-out.", "Environment: Check the condtion of crack.", "Environment: Check the condition of fastening.", "Environment: Check the fixation of protection screen of inlet cone.", "Environment: Fan Base.", "Environment: Check the steel structure fixation of the base.", "Environment: Check the steel structure cracks.", "Environment: Check the shock absorbal (fixation,cutting,lossness).", "Environment: Fan Bearing", "Environment: Fixed Bearing - DE", "Environment: Check the bearing housing seals and oil leakage.", "Environment: Check the bearing lubrication.", "Environment: Check the bearing housing integrity.", "Environment: Free Bearing - NDE", "Environment: Check the bearing housing seals and oil leakage.", "Environment: Check the bearing lubrication.", "Environment: Check the bearing housing integrity.", "Environment: Outlet  duct", "Environment: Check the condtion of worn-out or falls air..", "Environment: Check the condition of outlet damper.", "Environment: Flex-Joint", "Environment: Check the condition of Flex-joint (cut , tear, wear)", "Environment: Check the material blockage in the joint.", "Environment: Check and clean the thilinser of the suction."]'::jsonb) x), current_date),
  ((select ep.equipment_part_id from public.equipment_parts ep
      join public.equipment e on e.equipment_id = ep.equipment_id
     where e.equipment_code = 'L3-KLN-038' and ep.part_code = 'MAIN'),
   'L3-KLN-038-SIS-1Y', 'Primary fan — thickness of the fan blades (1 year)', 'Wear', 'Annual', null, 'Medium', 'Mechanical Engineer', true,
   'This inspection is carried out to : measure the fan blades while it is under stoppage condition.',
   (select coalesce(jsonb_agg(jsonb_build_object('label', x)), '[]'::jsonb)
      from jsonb_array_elements_text('["Safety: Check condition of access, guardrails, housings, ladders, emergency stops", "Safety: Check lighting.", "Measuring procedure: Disconnect the power supply of Fan.", "Measuring procedure: Open the inspection door of the fan casing.", "Measuring procedure: Clean very well impeller blades.", "Measuring procedure: Measure the thickness of the blades and record it.", "Measuring procedure: Close the inspection door of the fan casing.", "Measuring procedure: Fan Blade", "Day: Blade thickness", "Day: Alarm Value", "2016: bearings changed in aug.2013"]'::jsonb) x), current_date),
  ((select ep.equipment_part_id from public.equipment_parts ep
      join public.equipment e on e.equipment_id = ep.equipment_id
     where e.equipment_code = 'L3-KLN-065' and ep.part_code = 'MAIN'),
   'L3-KLN-065-FLIR-1W', 'Precalciner fan — outer components of the precalciner fan (1 week)', 'Visual', 'Weekly', null, 'Medium', 'Mechanical Engineer', false,
   'This inspection is carried out to : inspect all the outer components of the precalsiner fan based on visual checks and other simple controls while it is under normal operating condition.',
   (select coalesce(jsonb_agg(jsonb_build_object('label', x)), '[]'::jsonb)
      from jsonb_array_elements_text('["Safety: Check condition of access, guardrails, housings, ladders, emergency stops", "Safety: Check lighting", "Safety: Check earthing cables and connectors", "Safety: Check general condition of emergency stops", "Safety: Check protections for nips and moving parts", "Environment: Cleaning of the equipement and around.", "Environment: Condition of dust emission.", "Environment: Coupling.", "Environment: Check the abnormal noise.", "Environment: Review the coupling cover fixation between Motor and fan.", "Environment: Fan Casing & Base.", "Environment: Fan casing.", "Environment: Check abnormal noise.", "Environment: Check the condtion of worn-out.", "Environment: Check the condtion of crack or casing vibration.", "Environment: Check the condition of fastening.", "Environment: Check the fixation of protection screen of inlet cone.", "Environment: Fan Base.", "Environment: Check the base for Vibration.", "Environment: Check the steel structure fixation or cracks.", "Environment: Check the shock absorbal fixation.", "Environment: Fan Bearing", "Environment: Fixed Bearing - DE", "Environment: Check the bearing temprature by the hand piromter.", "Environment: Check the abnormal noise or sound.", "Environment: Check the grease leakage from bearing housing.", "Environment: Check visual if there is any vibration appearing.", "Environment: Free Bearing - NDE", "Environment: Check the bearing temprature by the hand piromter.", "Environment: Check the abnormal noise or sound.", "Environment: Check the grease leakage from bearing housing.", "Environment: Check visual if there is any vibration appearing.", "Environment: Outlet  duct", "Environment: Check the condtion of worn-out or falls air..", "Environment: Check the condition of outlet damper.", "Environment: Flex-Joint", "Environment: Check the condition of Flex-joint (cut , tear, wear)", "Environment: Check the material blockage in the joint."]'::jsonb) x), current_date),
  ((select ep.equipment_part_id from public.equipment_parts ep
      join public.equipment e on e.equipment_id = ep.equipment_id
     where e.equipment_code = 'L3-KLN-065' and ep.part_code = 'MAIN'),
   'L3-KLN-065-FLIS-6M', 'Precalciner fan — outer components of the precalciner fan (6 month)', 'Visual', 'Semi-Annual', null, 'Medium', 'Mechanical Engineer', true,
   'This inspection is carried out to : inspect all the outer components of the precalsiner fan based on visual checks and other simple controls while it is under Stoppage condition.',
   (select coalesce(jsonb_agg(jsonb_build_object('label', x)), '[]'::jsonb)
      from jsonb_array_elements_text('["Safety: Check condition of access, guardrails, housings, ladders, emergency stops", "Safety: Check lighting", "Safety: Check earthing cables and connectors", "Safety: Check general condition of emergency stops", "Safety: Check protections for nips and moving parts", "Environment: Cleaning of the equipement and around.", "Environment: Condition of dust emission.", "Environment: Coupling.", "Environment: Check the rubber element of coupling (wear, cutting, defected).", "Environment: Review the coupling cover fixation between Motor and fan.", "Environment: Fan Casing & Base.", "Environment: Fan casing.", "Environment: Check the inspection door (seals,bolt fixation,bolt missed).", "Environment: Check the casing internally condtion of worn-out.", "Environment: Check the condtion of crack.", "Environment: Check the condition of fastening.", "Environment: Check the fixation of protection screen of inlet cone.", "Environment: Fan Base.", "Environment: Check the steel structure fixation of the base.", "Environment: Check the steel structure cracks.", "Environment: Check the shock absorbal (fixation,cutting,lossness).", "Environment: Fan Bearing", "Environment: Fixed Bearing - DE", "Environment: Check the bearing housing seals and grease leakage.", "Environment: Check the bearing lubrication.", "Environment: Check the bearing housing integrity.", "Environment: Free Bearing - NDE", "Environment: Check the bearing housing seals and grease leakage.", "Environment: Check the bearing lubrication.", "Environment: Check the bearing housing integrity.", "Environment: Outlet  duct", "Environment: Check the condtion of worn-out or falls air..", "Environment: Check the condition of outlet damper.", "Environment: Flex-Joint", "Environment: Check the condition of Flex-joint (cut , tear, wear)", "Environment: Check the material blockage in the joint."]'::jsonb) x), current_date),
  ((select ep.equipment_part_id from public.equipment_parts ep
      join public.equipment e on e.equipment_id = ep.equipment_id
     where e.equipment_code = 'L3-KLN-065' and ep.part_code = 'MAIN'),
   'L3-KLN-065-SIS-1Y', 'Precalciner fan — thickness of the fan blades (1 year)', 'Wear', 'Annual', null, 'Medium', 'Mechanical Engineer', true,
   'This inspection is carried out to : measure the fan blades while it is under stoppage condition.',
   (select coalesce(jsonb_agg(jsonb_build_object('label', x)), '[]'::jsonb)
      from jsonb_array_elements_text('["Safety: Check condition of access, guardrails, housings, ladders, emergency stops", "Safety: Check lighting.", "Measuring procedure: Disconnect the power supply of Fan.", "Measuring procedure: Open the inspection door of the fan casing.", "Measuring procedure: Clean very well impeller blades.", "Measuring procedure: Measure the thickness of the blades and record it.", "Measuring procedure: Close the inspection door of the fan casing.", "Measuring procedure: Fan Blade", "Measuring procedure: Blade thickness", "Measuring procedure: Alarm Value"]'::jsonb) x), current_date),
  ((select ep.equipment_part_id from public.equipment_parts ep
      join public.equipment e on e.equipment_id = ep.equipment_id
     where e.equipment_code = 'L3-KLN-065' and ep.part_code = 'MAIN'),
   'L3-KLN-065-SIS-6M', 'Precalciner fan — clearance of the fixed and free bearings (6 month)', 'Vibration', 'Semi-Annual', null, 'High', 'Mechanical Engineer', true,
   'This inspection is carried out to : measure the Bearing clearanc of Fixed and free bearing while it is under stoppage condition.',
   (select coalesce(jsonb_agg(jsonb_build_object('label', x)), '[]'::jsonb)
      from jsonb_array_elements_text('["Safety: Check condition of access, guardrails, housings, ladders, emergency stops", "Safety: Check lighting.", "Measuring procedure: Disconnect the power supply of Fan.", "Measuring procedure: Open the bearing housing.", "Measuring procedure: Clean very well the grease.", "Measuring procedure: Measure the clearance of the bearing and record it.", "Measuring procedure: Reagrease the bearing and put the seals.", "Measuring procedure: Close the bearing housing.", "Measuring procedure: 22311 EAK", "Measuring procedure: 22311 EAK", "70: Alarm Value"]'::jsonb) x), current_date),
  ((select ep.equipment_part_id from public.equipment_parts ep
      join public.equipment e on e.equipment_id = ep.equipment_id
     where e.equipment_code = 'L3-KLN-065' and ep.part_code = 'MAIN'),
   'L3-KLN-065-SIS-6M-2', 'Precalciner fan — alignment between the motor and the fan (6 month)', 'Alignment', 'Semi-Annual', null, 'Medium', 'Mechanical Engineer', true,
   'This inspection is carried out to : Review the alignment between the Motor and fan while it is under stoppage condition.',
   (select coalesce(jsonb_agg(jsonb_build_object('label', x)), '[]'::jsonb)
      from jsonb_array_elements_text('["Safety: Check condition of access, guardrails, housings, ladders, emergency stops", "Safety: Check lighting", "Dismantel the protection cover of the coupling.", "Review the Alignment and record it.", "Erect the protection cover again."]'::jsonb) x), current_date);
