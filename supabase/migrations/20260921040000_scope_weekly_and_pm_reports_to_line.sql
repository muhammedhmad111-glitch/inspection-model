-- The weekly summary and the weekly PM report are documents that get emailed and
-- filed. With two production lines each one is sent twice in the same week, to the
-- same managers, so they have to be two different documents — not one document
-- with both plants' numbers added together.
--
-- v_eq is the line's equipment, resolved once up front. When p_line is null it
-- holds every machine in the plant, so the same `= any(v_eq)` covers the
-- both-lines case without a second code path.
--
-- Actions are the exception: one raised without a finding has no equipment and so
-- no line, and stays on both reports rather than vanishing from each.
--
-- Dropped rather than replaced, because a defaulted second parameter alongside the
-- old one-parameter function makes every existing call ambiguous.

drop function if exists public.get_weekly_report_data(date);
drop function if exists public.get_pm_report_data(date);

create or replace function public.get_weekly_report_data(
  p_week_start date default null,
  p_line smallint default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_start date;
  v_end date;          -- exclusive
  v_prev_start date;
  v_eq uuid[];
  v_by_section jsonb;
  v_by_area jsonb;
  v_top jsonb;
  v_severity jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authorized to read report data';
  end if;

  -- Weeks run Sunday → Saturday. The plant works Sun–Thu, so anchoring on Sunday
  -- keeps a whole workweek inside one report instead of splitting it in two.
  v_start := coalesce(p_week_start, current_date);
  v_start := v_start - extract(dow from v_start)::int;
  v_end := v_start + 7;
  v_prev_start := v_start - 7;

  select coalesce(array_agg(e.equipment_id), '{}')
    into v_eq
    from equipment e
    join sections s on s.section_id = e.section_id
    join areas a on a.area_id = s.area_id
   where p_line is null or a.production_line = p_line;

  select coalesce(
           jsonb_agg(
             jsonb_build_object('name', name, 'completed', completed, 'findings', findings)
             order by completed desc, findings desc
           ),
           '[]'::jsonb
         )
    into v_by_section
    from (
      select s.section_name as name,
             count(distinct tk.inspection_task_id) as completed,
             count(distinct fd.finding_id) as findings
        from sections s
        join equipment e on e.section_id = s.section_id
        left join inspection_tasks tk
               on tk.equipment_id = e.equipment_id
              and tk.status = 'Completed'
              and tk.completion_date >= v_start
              and tk.completion_date < v_end
        left join inspection_findings fd
               on fd.equipment_id = e.equipment_id
              and fd.created_at >= v_start
              and fd.created_at < v_end
       where e.equipment_id = any(v_eq)
       group by s.section_id, s.section_name
      having count(distinct tk.inspection_task_id) > 0
          or count(distinct fd.finding_id) > 0
       order by 2 desc, 3 desc
       limit 8
    ) x;

  select coalesce(
           jsonb_agg(
             jsonb_build_object('name', name, 'completed', completed, 'findings', findings)
             order by completed desc, findings desc
           ),
           '[]'::jsonb
         )
    into v_by_area
    from (
      select ar.area_name as name,
             count(distinct tk.inspection_task_id) as completed,
             count(distinct fd.finding_id) as findings
        from areas ar
        join sections s on s.area_id = ar.area_id
        join equipment e on e.section_id = s.section_id
        left join inspection_tasks tk
               on tk.equipment_id = e.equipment_id
              and tk.status = 'Completed'
              and tk.completion_date >= v_start
              and tk.completion_date < v_end
        left join inspection_findings fd
               on fd.equipment_id = e.equipment_id
              and fd.created_at >= v_start
              and fd.created_at < v_end
       where p_line is null or ar.production_line = p_line
       group by ar.area_id, ar.area_name
      having count(distinct tk.inspection_task_id) > 0
          or count(distinct fd.finding_id) > 0
       order by 2 desc, 3 desc
       limit 6
    ) x;

  -- The whole open backlog, not just this week's: management acts on the worst
  -- outstanding finding regardless of when someone happened to raise it.
  select coalesce(
           jsonb_agg(
             jsonb_build_object('code', code, 'title', title, 'severity', severity,
                                'equipment', equipment, 'section', section)
             order by sev desc, created_at desc
           ),
           '[]'::jsonb
         )
    into v_top
    from (
      select f.finding_code as code,
             f.finding_title as title,
             f.severity::text as severity,
             f.severity as sev,
             f.created_at,
             e.equipment_name as equipment,
             s.section_name as section
        from inspection_findings f
        left join equipment e on e.equipment_id = f.equipment_id
        left join sections s on s.section_id = e.section_id
       where f.status <> 'Closed'
         and f.equipment_id = any(v_eq)
       order by f.severity desc, f.created_at desc
       limit 5
    ) x;

  select coalesce(jsonb_object_agg(severity, n), '{}'::jsonb)
    into v_severity
    from (
      select severity::text as severity, count(*) as n
        from inspection_findings
       where status <> 'Closed'
         and equipment_id = any(v_eq)
       group by 1
    ) x;

  return jsonb_build_object(
    'weekStart', v_start,
    'weekEnd', v_end - 1,
    'line', p_line,
    'totals', jsonb_build_object(
      'completed', (select count(*) from inspection_tasks
                     where status = 'Completed'
                       and completion_date >= v_start and completion_date < v_end
                       and equipment_id = any(v_eq)),
      'newFindings', (select count(*) from inspection_findings
                       where created_at >= v_start and created_at < v_end
                         and equipment_id = any(v_eq)),
      'newActions', (select count(*) from maintenance_actions
                      where created_at >= v_start and created_at < v_end
                        and (equipment_id is null or equipment_id = any(v_eq))),
      'closedActions', (select count(*) from maintenance_actions
                         where completion_date >= v_start and completion_date < v_end
                           and (equipment_id is null or equipment_id = any(v_eq))),
      'openFindings', (select count(*) from inspection_findings
                        where status <> 'Closed' and equipment_id = any(v_eq)),
      'openActions', (select count(*) from maintenance_actions
                       where status not in ('Completed', 'Verified', 'Cancelled')
                         and (equipment_id is null or equipment_id = any(v_eq))),
      'overdueTasks', (select count(*) from inspection_tasks
                        where status = 'Overdue' and equipment_id = any(v_eq))
    ),
    'previous', jsonb_build_object(
      'completed', (select count(*) from inspection_tasks
                     where status = 'Completed'
                       and completion_date >= v_prev_start and completion_date < v_start
                       and equipment_id = any(v_eq)),
      'newFindings', (select count(*) from inspection_findings
                       where created_at >= v_prev_start and created_at < v_start
                         and equipment_id = any(v_eq)),
      'newActions', (select count(*) from maintenance_actions
                      where created_at >= v_prev_start and created_at < v_start
                        and (equipment_id is null or equipment_id = any(v_eq)))
    ),
    'bySection', v_by_section,
    'byArea', v_by_area,
    'topFindings', v_top,
    'openBySeverity', v_severity
  );
end;
$$;

create or replace function public.get_pm_report_data(
  p_week_start date default null,
  p_line smallint default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_start date;
  v_end date;          -- exclusive
  v_eq uuid[];
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

  select coalesce(array_agg(e.equipment_id), '{}')
    into v_eq
    from equipment e
    join sections s on s.section_id = e.section_id
    join areas a on a.area_id = s.area_id
   where p_line is null or a.production_line = p_line;

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
         and t.equipment_id = any(v_eq)
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
         and (coalesce(a.equipment_id, f.equipment_id) is null
              or coalesce(a.equipment_id, f.equipment_id) = any(v_eq))
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
         and t.equipment_id = any(v_eq)
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
         and (coalesce(a.equipment_id, f.equipment_id) is null
              or coalesce(a.equipment_id, f.equipment_id) = any(v_eq))
       order by a.priority desc, a.created_at
       limit 200
    ) y;

  return jsonb_build_object(
    'weekStart', v_start,
    'weekEnd', v_end - 1,
    'line', p_line,
    'completed', v_completed,
    'actions', v_actions,
    'shutdownItems', v_shutdown,
    'waitingShutdown', v_waiting
  );
end;
$$;

revoke execute on function public.get_weekly_report_data(date, smallint) from public, anon;
grant execute on function public.get_weekly_report_data(date, smallint) to authenticated;

revoke execute on function public.get_pm_report_data(date, smallint) from public, anon;
grant execute on function public.get_pm_report_data(date, smallint) to authenticated;
