-- The findings page filters everything it shows to the active production line.
-- Tables can be filtered through an embedded !inner join, but this view has no
-- relationships PostgREST can traverse, so it carries the line as a plain column
-- and the client filters on it directly.
--
-- production_line is appended last because `create or replace view` can only add
-- columns at the end — inserting it beside section_name, where it belongs, would
-- mean dropping the view and with it its grants.

create or replace view public.pending_checklist_notes as
 SELECT ci.id AS checklist_item_id,
    ci.inspection_task_id,
    ci.label,
    ci.notes,
    ci.result,
    ci.measured_value,
    ci.updated_at AS noted_at,
    t.task_code,
    t.status AS task_status,
    t.due_date,
    t.equipment_id,
    t.equipment_part_id,
    e.equipment_name,
    e.equipment_code,
    e.functional_location,
    s.section_name,
    ep.part_name,
    ia.activity_name,
    p.full_name AS inspector_name,
    a.production_line
   FROM inspection_task_checklist_items ci
     JOIN inspection_tasks t ON t.inspection_task_id = ci.inspection_task_id
     JOIN equipment e ON e.equipment_id = t.equipment_id
     LEFT JOIN sections s ON s.section_id = e.section_id
     LEFT JOIN areas a ON a.area_id = s.area_id
     LEFT JOIN equipment_parts ep ON ep.equipment_part_id = t.equipment_part_id
     LEFT JOIN inspection_activities ia ON ia.inspection_activity_id = t.inspection_activity_id
     LEFT JOIN profiles p ON p.id = COALESCE(t.completed_by, t.assigned_user_id)
  WHERE ci.notes IS NOT NULL AND btrim(ci.notes) <> ''::text AND ci.note_dismissed_at IS NULL AND NOT (EXISTS ( SELECT 1
           FROM inspection_findings f
          WHERE f.checklist_item_id = ci.id));
