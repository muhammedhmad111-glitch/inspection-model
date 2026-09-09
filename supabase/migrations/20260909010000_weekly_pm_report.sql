-- The weekly PM: the stop where the plant is actually opened up. Its report is a
-- different document from the daily and the weekly ones and goes to a different
-- audience, so it gets its own section, its own PDF and its own send.
--
-- What makes it a PM report rather than a summary is the third block: the checks
-- that can only be done with the machine standing still. Those come from two
-- places and the system knew neither of them until now.

-- 1. The check the engineer already knows needs a stop — decided once, in master
--    data, not retyped every week.
alter table public.inspection_activities
  add column if not exists requires_shutdown boolean not null default false;

comment on column public.inspection_activities.requires_shutdown is
  'This inspection can only be carried out with the equipment stopped. Drives the weekly PM report.';

-- Templates seed new activities, so the flag has to survive the copy.
alter table public.inspection_activity_templates
  add column if not exists requires_shutdown boolean not null default false;

comment on column public.inspection_activity_templates.requires_shutdown is
  'Default for requires_shutdown on activities created from this template.';

-- The PM report reads the flagged activities on their own every week.
create index if not exists inspection_activities_requires_shutdown_idx
  on public.inspection_activities (requires_shutdown)
  where requires_shutdown;

-- 2. The check nobody planned for but the inspector could not reach because the
--    machine was running. "Not Accessible" written on a Tuesday round is exactly
--    the work the Friday stop exists for, and it used to die inside the task.

create or replace function public.get_pm_report_data(p_week_start date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_start date;
  v_end date;          -- exclusive
  v_completed jsonb;
  v_actions jsonb;
  v_shutdown jsonb;
  v_waiting jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authorized to read PM report data';
  end if;

  -- Same Sunday -> Saturday week as the weekly report, so the two documents
  -- cannot disagree about which day a job landed on.
  v_start := coalesce(p_week_start, current_date);
  v_start := v_start - extract(dow from v_start)::int;
  v_end := v_start + 7;

  -- Every inspection actually closed out in the window.
  select coalesce(jsonb_agg(x order by section nulls last, completed_at), '[]'::jsonb)
    into v_completed
    from (
      select jsonb_build_object(
               'taskCode', t.task_code,
               'equipment', e.equipment_name,
               'equipmentCode', e.equipment_code,
               'location', e.functional_location,
               'section', s.section_name,
               'part', ep.part_name,
               'activity', ia.activity_name,
               'category', ia.inspection_category,
               'requiresShutdown', coalesce(ia.requires_shutdown, false),
               'completedAt', t.completion_date,
               'inspector', p.full_name,
               'condition', t.condition_rating,
               'items', (select count(*) from inspection_task_checklist_items ci
                          where ci.inspection_task_id = t.inspection_task_id),
               'flagged', (select count(*) from inspection_task_checklist_items ci
                            where ci.inspection_task_id = t.inspection_task_id
                              and (ci.result in ('Attention', 'Not OK', 'Not Accessible')
                                   or btrim(coalesce(ci.notes, '')) <> ''))
             ) as x,
             s.section_name as section,
             t.completion_date as completed_at
        from inspection_tasks t
        left join equipment e on e.equipment_id = t.equipment_id
        left join sections s on s.section_id = e.section_id
        left join equipment_parts ep on ep.equipment_part_id = t.equipment_part_id
        left join inspection_activities ia
               on ia.inspection_activity_id = t.inspection_activity_id
        left join profiles p on p.id = coalesce(t.completed_by, t.assigned_user_id)
       where t.status = 'Completed'
         and t.completion_date >= v_start
         and t.completion_date < v_end
       order by s.section_name nulls last, t.completion_date
       limit 400
    ) y;

  -- The maintenance side of the same window: what was closed, and with which SAP
  -- work order, because that is the number the planner is asked about afterwards.
  select coalesce(jsonb_agg(x order by section nulls last, completed_at), '[]'::jsonb)
    into v_actions
    from (
      select jsonb_build_object(
               'actionCode', a.action_code,
               'title', a.action_title,
               'type', a.action_type,
               'priority', a.priority,
               'status', a.status,
               'sapWorkOrder', a.sap_work_order,
               'equipment', e.equipment_name,
               'equipmentCode', e.equipment_code,
               'location', e.functional_location,
               'section', s.section_name,
               'part', ep.part_name,
               'responsible', pr.full_name,
               'department', a.responsible_department,
               'completedAt', a.completion_date,
               'note', a.completion_note,
               'findingCode', f.finding_code
             ) as x,
             s.section_name as section,
             a.completion_date as completed_at
        from maintenance_actions a
        left join inspection_findings f on f.finding_id = a.finding_id
        -- An action raised from a finding leaves its own equipment_id null; the
        -- machine is only reachable through the finding.
        left join equipment e
               on e.equipment_id = coalesce(a.equipment_id, f.equipment_id)
        left join sections s on s.section_id = e.section_id
        left join equipment_parts ep
               on ep.equipment_part_id = coalesce(a.equipment_part_id, f.equipment_part_id)
        left join profiles pr on pr.id = a.responsible_person
       where a.status in ('Completed', 'Verified')
         and a.completion_date >= v_start
         and a.completion_date < v_end
       order by s.section_name nulls last, a.completion_date
       limit 400
    ) y;

  -- The heart of the PM report: checks that only happen with the machine stopped.
  -- Two sources, one list — 'planned' is what master data says needs a stop,
  -- 'blocked' is what the inspector could not reach because it was still running.
  select coalesce(jsonb_agg(x order by section nulls last, task_code), '[]'::jsonb)
    into v_shutdown
    from (
      select jsonb_build_object(
               'reason', case when coalesce(ia.requires_shutdown, false)
                              then 'planned' else 'blocked' end,
               'label', ci.label,
               'result', ci.result,
               'measured', ci.measured_value,
               'notes', ci.notes,
               'taskCode', t.task_code,
               'activity', ia.activity_name,
               'equipment', e.equipment_name,
               'equipmentCode', e.equipment_code,
               'location', e.functional_location,
               'section', s.section_name,
               'part', ep.part_name,
               'inspector', p.full_name,
               'completedAt', t.completion_date
             ) as x,
             s.section_name as section,
             t.task_code
        from inspection_task_checklist_items ci
        join inspection_tasks t on t.inspection_task_id = ci.inspection_task_id
        left join equipment e on e.equipment_id = t.equipment_id
        left join sections s on s.section_id = e.section_id
        left join equipment_parts ep on ep.equipment_part_id = t.equipment_part_id
        left join inspection_activities ia
               on ia.inspection_activity_id = t.inspection_activity_id
        left join profiles p on p.id = coalesce(t.completed_by, t.assigned_user_id)
       where t.status = 'Completed'
         and t.completion_date >= v_start
         and t.completion_date < v_end
         and (coalesce(ia.requires_shutdown, false) or ci.result = 'Not Accessible')
       order by s.section_name nulls last, t.task_code
       limit 400
    ) y;

  -- Not this week's work: what is queued for the next stop. The whole backlog,
  -- because a job parked three weeks ago is the one most likely to be forgotten.
  select coalesce(jsonb_agg(x order by sev desc, created_at), '[]'::jsonb)
    into v_waiting
    from (
      select jsonb_build_object(
               'actionCode', a.action_code,
               'title', a.action_title,
               'type', a.action_type,
               'priority', a.priority,
               'sapWorkOrder', a.sap_work_order,
               'equipment', e.equipment_name,
               'equipmentCode', e.equipment_code,
               'location', e.functional_location,
               'section', s.section_name,
               'part', ep.part_name,
               'responsible', pr.full_name,
               'targetDate', a.target_date,
               'waitingSince', a.created_at
             ) as x,
             a.priority as sev,
             a.created_at
        from maintenance_actions a
        left join inspection_findings f on f.finding_id = a.finding_id
        left join equipment e
               on e.equipment_id = coalesce(a.equipment_id, f.equipment_id)
        left join sections s on s.section_id = e.section_id
        left join equipment_parts ep
               on ep.equipment_part_id = coalesce(a.equipment_part_id, f.equipment_part_id)
        left join profiles pr on pr.id = a.responsible_person
       where a.status = 'Waiting Shutdown'
       order by a.priority desc, a.created_at
       limit 200
    ) y;

  return jsonb_build_object(
    'weekStart', v_start,
    'weekEnd', v_end - 1,
    'completed', v_completed,
    'actions', v_actions,
    'shutdownItems', v_shutdown,
    'waitingShutdown', v_waiting
  );
end;
$$;

revoke execute on function public.get_pm_report_data(date) from public, anon;
grant execute on function public.get_pm_report_data(date) to authenticated;
