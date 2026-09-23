-- The weekly summary counted an action as belonging to no line whenever its own
-- equipment_id was null. That reads as "unattached work", but it is not: an
-- action raised off a finding always leaves its own equipment_id null and takes
-- the machine from the finding. Every one of those was therefore counted on both
-- lines' weekly reports — a line-3 manager reading line-1 maintenance numbers.
--
-- v_act resolves the machine the way get_pm_report_data already does, with
-- coalesce(action.equipment, finding.equipment), so only an action attached to
-- neither stays on every report.

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
  v_act uuid[];
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

  -- The machine an action answers for is its own when it names one, and the
  -- finding's when it does not — an action raised off a finding leaves its own
  -- equipment_id null, but it is no less part of that line's week. Only an
  -- action attached to neither belongs to no line, and that one stays on every
  -- report rather than vanishing from all of them.
  select coalesce(array_agg(a.action_id), '{}')
    into v_act
    from maintenance_actions a
    left join inspection_findings f on f.finding_id = a.finding_id
   where coalesce(a.equipment_id, f.equipment_id) is null
      or coalesce(a.equipment_id, f.equipment_id) = any(v_eq);

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
                        and action_id = any(v_act)),
      'closedActions', (select count(*) from maintenance_actions
                         where completion_date >= v_start and completion_date < v_end
                           and action_id = any(v_act)),
      'openFindings', (select count(*) from inspection_findings
                        where status <> 'Closed' and equipment_id = any(v_eq)),
      'openActions', (select count(*) from maintenance_actions
                       where status not in ('Completed', 'Verified', 'Cancelled')
                         and action_id = any(v_act)),
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
                        and action_id = any(v_act))
    ),
    'bySection', v_by_section,
    'byArea', v_by_area,
    'topFindings', v_top,
    'openBySeverity', v_severity
  );
end;
$$;
