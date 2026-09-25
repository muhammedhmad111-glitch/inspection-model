-- Two faults in the generator, both found by asking which active plans came out
-- of a run with no task at all. On line 3 that was the kiln's two-year
-- ultrasonic: cycle 1 sits in the past, so the past-date guard drops it, and
-- cycle 2 lands in 2028, past the one-year horizon, so the loop never reaches
-- it. A plan on a longer cycle than the horizon is therefore scheduled never —
-- silently, because nothing counts what was skipped.
--
-- So the horizon now decides how far ahead we fill in, not whether a plan is
-- scheduled at all: after filling the window, any plan still without a future
-- task gets its next due date, however far out that is. An inspection every two
-- years is still an inspection someone has to be told about.
--
-- The loop also used to walk every cycle from start_date forward, discarding the
-- past ones one at a time. It now starts at the first cycle that is not past,
-- which is the same arithmetic the old loop performed by brute force, so cycle
-- numbers are unchanged and the on-conflict key still lines up with rows that
-- are already there.

create or replace function public.generate_inspection_tasks(p_horizon_days integer default 365)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_created integer := 0;
  a record;
  v_interval integer;
  v_cycle integer;
  v_base date;
  v_scheduled date;
  v_pdow int;
  v_horizon date := current_date + p_horizon_days;
begin
  if not public.has_master_data_write() then
    raise exception 'Not authorized to generate inspection schedules';
  end if;

  for a in select * from public.inspection_activities where active loop
    v_interval := public.frequency_interval_days(a.frequency_type, a.custom_interval_days);
    v_pdow := public.activity_workday(a.inspection_activity_id);

    -- Jump straight to the first cycle that is not already history.
    v_cycle := 1;
    if a.start_date < current_date and v_interval > 0 then
      v_cycle := floor((current_date - a.start_date)::numeric / v_interval)::int + 1;
    end if;

    loop
      v_base := a.start_date + (v_interval * (v_cycle - 1));
      exit when v_base > v_horizon;

      -- weekly and longer -> fixed working weekday; shorter -> just avoid the weekend
      if v_interval >= 7 then
        v_scheduled := public.snap_to_workday(v_base, v_pdow);
      else
        v_scheduled := public.roll_to_workday(v_base);
      end if;

      -- A cycle whose date has already passed is history, not schedule.
      if v_scheduled >= current_date then
        insert into public.inspection_tasks (
          task_code, inspection_activity_id, equipment_part_id, equipment_id,
          scheduled_date, due_date, recurrence_cycle, status, priority
        )
        select
          'T-' || substr(a.inspection_activity_id::text, 1, 8) || '-C' || v_cycle,
          a.inspection_activity_id, a.equipment_part_id, ep.equipment_id,
          v_scheduled, v_scheduled, v_cycle, 'Scheduled', a.priority
        from public.equipment_parts ep
        where ep.equipment_part_id = a.equipment_part_id
        on conflict (inspection_activity_id, recurrence_cycle) do nothing;

        if found then
          v_created := v_created + 1;
        end if;
      end if;

      v_cycle := v_cycle + 1;
    end loop;

    -- A cycle longer than the horizon would leave this plan with nothing at all.
    -- Give it the one next date so it is on somebody's list.
    if not exists (
      select 1 from public.inspection_tasks t
      where t.inspection_activity_id = a.inspection_activity_id
        and t.scheduled_date >= current_date
    ) then
      v_base := a.start_date + (v_interval * (v_cycle - 1));
      if v_interval >= 7 then
        v_scheduled := public.snap_to_workday(v_base, v_pdow);
      else
        v_scheduled := public.roll_to_workday(v_base);
      end if;

      insert into public.inspection_tasks (
        task_code, inspection_activity_id, equipment_part_id, equipment_id,
        scheduled_date, due_date, recurrence_cycle, status, priority
      )
      select
        'T-' || substr(a.inspection_activity_id::text, 1, 8) || '-C' || v_cycle,
        a.inspection_activity_id, a.equipment_part_id, ep.equipment_id,
        v_scheduled, v_scheduled, v_cycle, 'Scheduled', a.priority
      from public.equipment_parts ep
      where ep.equipment_part_id = a.equipment_part_id
      on conflict (inspection_activity_id, recurrence_cycle) do nothing;

      if found then
        v_created := v_created + 1;
      end if;
    end if;
  end loop;

  perform public.refresh_task_statuses();
  return v_created;
end;
$function$;
