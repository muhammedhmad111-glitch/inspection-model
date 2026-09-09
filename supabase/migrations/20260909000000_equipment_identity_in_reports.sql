-- "الإجراء ده على أنهي معدة؟" — a maintenance action, a finding or a checklist note
-- that only carries an equipment *name* is not enough to act on. The plant has
-- fourteen screw conveyors; the fitter walks up to the one stencilled SC 27 and the
-- planner searches SAP for BP-018. Both numbers, and the section the machine sits
-- in, now travel with the name everywhere the data leaves this table.

-- The pending-notes list is the one place a manager decides whether a note becomes
-- a finding, and it was showing the equipment name alone. Dropped rather than
-- replaced so the two new columns can sit next to the ones they belong with.
drop view if exists public.pending_checklist_notes;

create view public.pending_checklist_notes
with (security_invoker = true) as
select
  ci.id as checklist_item_id,
  ci.inspection_task_id,
  ci.label,
  ci.notes,
  ci.result,
  ci.measured_value,
  ci.updated_at as noted_at,
  t.task_code,
  t.status as task_status,
  t.due_date,
  t.equipment_id,
  t.equipment_part_id,
  e.equipment_name,
  e.equipment_code,
  e.functional_location,
  s.section_name,
  ep.part_name,
  ia.activity_name,
  p.full_name as inspector_name
from public.inspection_task_checklist_items ci
join public.inspection_tasks t on t.inspection_task_id = ci.inspection_task_id
join public.equipment e on e.equipment_id = t.equipment_id
left join public.sections s on s.section_id = e.section_id
left join public.equipment_parts ep on ep.equipment_part_id = t.equipment_part_id
left join public.inspection_activities ia
  on ia.inspection_activity_id = t.inspection_activity_id
left join public.profiles p on p.id = coalesce(t.completed_by, t.assigned_user_id)
where ci.notes is not null
  and btrim(ci.notes) <> ''
  and ci.note_dismissed_at is null
  and not exists (
    select 1 from public.inspection_findings f where f.checklist_item_id = ci.id
  );

comment on view public.pending_checklist_notes is
  'Checklist item notes that are neither dismissed nor already promoted to a finding.';

revoke all on public.pending_checklist_notes from public, anon;
grant select on public.pending_checklist_notes to authenticated;

-- The weekly report's top findings already named the section. They now carry the
-- equipment numbers too, so the PDF row is enough to raise a work order from.
create or replace function public.get_weekly_report_data(p_week_start date default null)
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
  v_by_section jsonb;
  v_by_area jsonb;
  v_top jsonb;
  v_severity jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authorized to read report data';
  end if;

  -- Weeks run Sunday -> Saturday. The plant works Sun-Thu, so anchoring on Sunday
  -- keeps a whole workweek inside one report instead of splitting it in two.
  v_start := coalesce(p_week_start, current_date);
  v_start := v_start - extract(dow from v_start)::int;
  v_end := v_start + 7;
  v_prev_start := v_start - 7;

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
                                'equipment', equipment, 'equipmentCode', equipment_code,
                                'location', location, 'section', section)
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
             e.equipment_code as equipment_code,
             e.functional_location as location,
             s.section_name as section
        from inspection_findings f
        left join equipment e on e.equipment_id = f.equipment_id
        left join sections s on s.section_id = e.section_id
       where f.status <> 'Closed'
       order by f.severity desc, f.created_at desc
       limit 5
    ) x;

  select coalesce(jsonb_object_agg(severity, n), '{}'::jsonb)
    into v_severity
    from (
      select severity::text as severity, count(*) as n
        from inspection_findings
       where status <> 'Closed'
       group by 1
    ) x;

  return jsonb_build_object(
    'weekStart', v_start,
    'weekEnd', v_end - 1,
    'totals', jsonb_build_object(
      'completed', (select count(*) from inspection_tasks
                     where status = 'Completed'
                       and completion_date >= v_start and completion_date < v_end),
      'newFindings', (select count(*) from inspection_findings
                       where created_at >= v_start and created_at < v_end),
      'newActions', (select count(*) from maintenance_actions
                      where created_at >= v_start and created_at < v_end),
      'closedActions', (select count(*) from maintenance_actions
                         where completion_date >= v_start and completion_date < v_end),
      'openFindings', (select count(*) from inspection_findings where status <> 'Closed'),
      'openActions', (select count(*) from maintenance_actions
                       where status not in ('Completed', 'Verified', 'Cancelled')),
      'overdueTasks', (select count(*) from inspection_tasks where status = 'Overdue')
    ),
    'previous', jsonb_build_object(
      'completed', (select count(*) from inspection_tasks
                     where status = 'Completed'
                       and completion_date >= v_prev_start and completion_date < v_start),
      'newFindings', (select count(*) from inspection_findings
                       where created_at >= v_prev_start and created_at < v_start),
      'newActions', (select count(*) from maintenance_actions
                      where created_at >= v_prev_start and created_at < v_start)
    ),
    'bySection', v_by_section,
    'byArea', v_by_area,
    'topFindings', v_top,
    'openBySeverity', v_severity
  );
end;
$$;

revoke execute on function public.get_weekly_report_data(date) from public, anon;
grant execute on function public.get_weekly_report_data(date) to authenticated;
