-- The dashboard and the analytics tab each answer "how are we doing?" in one
-- round trip. With two production lines that question has two answers, so both
-- functions now take the line and scope every count to it.
--
-- p_line is nullable and means "both lines" — a plant-wide view nobody asks for
-- today, but it keeps the old call signature working and gives the plant manager
-- somewhere to go later.
--
-- Actions with no equipment (most of them: standalone work raised without a
-- finding) belong to no line. They stay visible on both rather than vanishing
-- from every screen the moment a line is selected.
--
-- Dropped rather than replaced: adding a defaulted parameter would leave the old
-- zero-argument function in place and make every existing no-arg call ambiguous.

drop function if exists public.get_dashboard_data();
drop function if exists public.get_analytics_data();

create or replace function public.get_dashboard_data(p_line smallint default null)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  with eq as (
    select e.equipment_id, e.equipment_name, e.active
    from public.equipment e
    join public.sections s on s.section_id = e.section_id
    join public.areas a on a.area_id = s.area_id
    where p_line is null or a.production_line = p_line
  ),
  t as (
    select tk.* from public.inspection_tasks tk
    where tk.equipment_id in (select equipment_id from eq)
  ),
  fnd as (
    select f.* from public.inspection_findings f
    where f.equipment_id in (select equipment_id from eq)
  ),
  act as (
    select m.* from public.maintenance_actions m
    where m.equipment_id is null
       or m.equipment_id in (select equipment_id from eq)
  ),
  open_tasks as (
    select * from t where status in ('Scheduled','Upcoming','Overdue','In Progress')
  ),
  due as (select * from t where due_date <= current_date)
  select jsonb_build_object(
    'headline', jsonb_build_object(
      'total_tasks',   (select count(*) from t),
      'completed',     (select count(*) from t where status = 'Completed'),
      'overdue',       (select count(*) from t where status = 'Overdue'),
      'in_progress',   (select count(*) from t where status = 'In Progress'),
      'upcoming',      (select count(*) from t where status = 'Upcoming'),
      'scheduled',     (select count(*) from t where status = 'Scheduled'),
      'open',          (select count(*) from open_tasks)
    ),
    'kpis', jsonb_build_object(
      'compliance_pct', (
        select case when count(*) = 0 then 100
          else round(100.0 * count(*) filter (where status = 'Completed') / count(*), 1) end
        from due
      ),
      'completion_rate', (
        select case when count(*) = 0 then 0
          else round(100.0 * count(*) filter (where status = 'Completed') / count(*), 1) end
        from t
      ),
      'overdue_rate', (
        select case when count(*) = 0 then 0
          else round(100.0 * count(*) filter (where status = 'Overdue') / count(*), 1) end
        from open_tasks
      ),
      'action_closure_rate', (
        select case when count(*) = 0 then 0
          else round(100.0 * count(*) filter (where status in ('Completed','Verified')) / count(*), 1) end
        from act
      )
    ),
    'status_counts', (
      select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb)
      from (select status, count(*) cnt from t group by status) s
    ),
    'findings', jsonb_build_object(
      'total',        (select count(*) from fnd),
      'open',         (select count(*) from fnd where status <> 'Closed'),
      'critical_open',(select count(*) from fnd where status <> 'Closed' and severity = 'Critical'),
      'by_severity',  (
        select coalesce(jsonb_object_agg(severity, cnt), '{}'::jsonb)
        from (
          select severity, count(*) cnt from fnd
          where status <> 'Closed' group by severity
        ) s
      )
    ),
    'actions', jsonb_build_object(
      'total', (select count(*) from act),
      'open',  (select count(*) from act
                where status not in ('Completed','Verified','Cancelled')),
      'overdue',(select count(*) from act
                where status not in ('Completed','Verified','Cancelled')
                  and target_date is not null and target_date < current_date)
    ),
    'inspector_workload', (
      select coalesce(jsonb_agg(row_to_json(w)), '[]'::jsonb) from (
        select p.full_name as name, count(*) as open_count
        from open_tasks ot
        join public.profiles p on p.id = ot.assigned_user_id
        group by p.full_name
        order by open_count desc
        limit 6
      ) w
    ),
    'top_equipment_findings', (
      select coalesce(jsonb_agg(row_to_json(e)), '[]'::jsonb) from (
        select x.equipment_name as name, count(*) as count
        from fnd f
        join eq x on x.equipment_id = f.equipment_id
        group by x.equipment_name
        order by count desc
        limit 6
      ) e
    ),
    'monthly_trend', (
      select coalesce(jsonb_agg(row_to_json(m) order by m.month_start), '[]'::jsonb) from (
        select
          to_char(g.month_start, 'YYYY-MM') as month,
          g.month_start,
          (select count(*) from t
             where t.status = 'Completed'
               and date_trunc('month', t.completion_date) = g.month_start) as completed,
          (select count(*) from t
             where date_trunc('month', t.created_at) = g.month_start) as generated
        from generate_series(
          date_trunc('month', current_date) - interval '5 month',
          date_trunc('month', current_date),
          interval '1 month'
        ) as g(month_start)
      ) m
    ),
    'condition_distribution', (
      select coalesce(jsonb_object_agg(condition_rating, cnt), '{}'::jsonb)
      from (
        select condition_rating, count(*) cnt from t
        where condition_rating is not null group by condition_rating
      ) c
    )
  );
$function$;

create or replace function public.get_analytics_data(p_line smallint default null)
returns json
language sql
stable security definer
set search_path to 'public'
as $function$
with eq as (
  select e.*
  from public.equipment e
  join public.sections s on s.section_id = e.section_id
  join public.areas a on a.area_id = s.area_id
  where p_line is null or a.production_line = p_line
),
tsk as (
  select t.* from public.inspection_tasks t
  where t.equipment_id in (select equipment_id from eq)
),
fnd as (
  select f.* from public.inspection_findings f
  where f.equipment_id in (select equipment_id from eq)
),
act as (
  select m.* from public.maintenance_actions m
  where m.equipment_id is null
     or m.equipment_id in (select equipment_id from eq)
)
select json_build_object(
  'reliability', json_build_object(
    'criticality_risk', coalesce((select json_agg(x) from (
        select e.criticality::text as label, count(*)::int as value
        from fnd f join eq e on e.equipment_id = f.equipment_id
        where f.status <> 'Closed'
        group by e.criticality order by count(*) desc
      ) x), '[]'::json),
    'health', (select json_build_object(
        'healthy',   count(*) filter (where not has_open and not has_overdue),
        'attention', count(*) filter (where (has_open or has_overdue) and not has_crit),
        'critical',  count(*) filter (where has_crit)
      ) from (
        select
          exists(select 1 from fnd f where f.equipment_id = e.equipment_id and f.status <> 'Closed' and f.severity = 'Critical') as has_crit,
          exists(select 1 from fnd f where f.equipment_id = e.equipment_id and f.status <> 'Closed') as has_open,
          exists(select 1 from tsk t where t.equipment_id = e.equipment_id and t.status = 'Overdue') as has_overdue
        from eq e where e.active
      ) h),
    'top_problem_equipment', coalesce((select json_agg(x) from (
        select e.equipment_name as label, count(*)::int as value
        from fnd f join eq e on e.equipment_id = f.equipment_id
        where f.status <> 'Closed'
        group by e.equipment_name order by count(*) desc limit 6
      ) x), '[]'::json),
    'poor_condition_trend', coalesce((select json_agg(x) from (
        select to_char(d,'YYYY-MM') as month,
          (select count(*) from tsk t where t.status = 'Completed'
             and t.condition_rating in ('Poor','Critical')
             and to_char(t.completion_date,'YYYY-MM') = to_char(d,'YYYY-MM'))::int as value
        from generate_series(date_trunc('month',now()) - interval '5 months', date_trunc('month',now()), interval '1 month') d
      ) x), '[]'::json)
  ),
  'maintenance', json_build_object(
    'backlog_open',    (select count(*)::int from act where status not in ('Completed','Verified','Cancelled')),
    'backlog_overdue', (select count(*)::int from act where status not in ('Completed','Verified','Cancelled') and target_date < current_date),
    'mttr_days',       coalesce((select round(avg(extract(epoch from (completion_date - created_at))/86400))::int from act where completion_date is not null), 0),
    'avg_open_age_days', coalesce((select round(avg(extract(epoch from (now() - created_at))/86400))::int from act where status not in ('Completed','Verified','Cancelled')), 0),
    'by_status', coalesce((select json_agg(x) from (
        select status::text as label, count(*)::int as value from act group by status order by count(*) desc
      ) x), '[]'::json),
    'trend', coalesce((select json_agg(x) from (
        select to_char(d,'YYYY-MM') as month,
          (select count(*) from act a where to_char(a.created_at,'YYYY-MM') = to_char(d,'YYYY-MM'))::int as created,
          (select count(*) from act a where a.completion_date is not null and to_char(a.completion_date,'YYYY-MM') = to_char(d,'YYYY-MM'))::int as completed
        from generate_series(date_trunc('month',now()) - interval '5 months', date_trunc('month',now()), interval '1 month') d
      ) x), '[]'::json)
  ),
  'compliance', json_build_object(
    'schedule_compliance_pct', coalesce((select round(100.0 * count(*) filter (where completion_date::date <= due_date) / nullif(count(*),0))::int from tsk where status = 'Completed'), 0),
    'coverage_pct', coalesce((select round(100.0 * (select count(distinct equipment_id) from tsk where status = 'Completed' and completion_date >= now() - interval '90 days')
                        / nullif((select count(*) from eq where active), 0))::int), 0),
    'by_area', coalesce((select json_agg(x) from (
        select a.area_name as label,
          count(*)::int as total,
          count(*) filter (where t.status = 'Completed')::int as completed,
          count(*) filter (where t.status = 'Overdue')::int as overdue
        from tsk t
          join public.equipment e on e.equipment_id = t.equipment_id
          join public.sections s on s.section_id = e.section_id
          join public.areas a on a.area_id = s.area_id
        group by a.area_name order by count(*) desc
      ) x), '[]'::json),
    'by_inspector', coalesce((select json_agg(x) from (
        select p.full_name as label,
          count(*) filter (where t.status = 'Completed')::int as completed,
          coalesce(round(100.0 * count(*) filter (where t.status = 'Completed' and t.completion_date::date <= t.due_date)
              / nullif(count(*) filter (where t.status = 'Completed'), 0))::int, 0) as on_time_pct
        from tsk t join public.profiles p on p.id = t.completed_by
        where t.completed_by is not null
        group by p.full_name order by count(*) filter (where t.status = 'Completed') desc limit 8
      ) x), '[]'::json)
  ),
  'overview_extra', json_build_object(
    'findings_trend', coalesce((select json_agg(x) from (
        select to_char(d,'YYYY-MM') as month,
          (select count(*) from fnd f where to_char(f.created_at,'YYYY-MM') = to_char(d,'YYYY-MM'))::int as raised,
          (select count(*) from fnd f where f.status = 'Closed' and to_char(f.updated_at,'YYYY-MM') = to_char(d,'YYYY-MM'))::int as closed
        from generate_series(date_trunc('month',now()) - interval '5 months', date_trunc('month',now()), interval '1 month') d
      ) x), '[]'::json),
    'completed_this_month', (select count(*)::int from tsk where status = 'Completed' and completion_date >= date_trunc('month',now())),
    'completed_prev_month', (select count(*)::int from tsk where status = 'Completed' and completion_date >= date_trunc('month',now()) - interval '1 month' and completion_date < date_trunc('month',now())),
    'mttr_finding_days', coalesce((select round(avg(extract(epoch from (updated_at - created_at))/86400))::int from fnd where status = 'Closed'), 0),
    'avg_open_finding_age_days', coalesce((select round(avg(extract(epoch from (now() - created_at))/86400))::int from fnd where status <> 'Closed'), 0)
  )
);
$function$;

-- Both are SECURITY DEFINER, so the default PUBLIC/anon execute grant would hand
-- the whole plant's numbers to anyone with the project URL. get_dashboard_data was
-- already locked down; get_analytics_data had been left on the default and is
-- brought in line here.
revoke execute on function public.get_dashboard_data(smallint) from public, anon;
grant execute on function public.get_dashboard_data(smallint) to authenticated, service_role;

revoke execute on function public.get_analytics_data(smallint) from public, anon;
grant execute on function public.get_analytics_data(smallint) to authenticated, service_role;
