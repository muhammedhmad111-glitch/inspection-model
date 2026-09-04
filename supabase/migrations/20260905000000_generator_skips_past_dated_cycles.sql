-- The generator walked every cycle from the activity's start_date and created a
-- task for each one, however long ago it fell. Run months after start_date, it
-- materialised the whole skipped history at once, so the plant opened the app to
-- hundreds of "overdue" inspections nobody had ever been asked to do.
--
-- Cycles in the past are history, not schedule: skip them. The default horizon
-- also moves from 30 days to a year, so annual and semi-annual activities land on
-- the calendar and a month without a generator run no longer empties it.

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
    v_cycle := 1;
    v_base := a.start_date;
    while v_base <= v_horizon loop
      -- weekly and longer -> fixed working weekday; shorter -> just avoid the weekend
      if v_interval >= 7 then
        v_scheduled := public.snap_to_workday(v_base, v_pdow);
      else
        v_scheduled := public.roll_to_workday(v_base);
      end if;

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
      v_base := a.start_date + (v_interval * (v_cycle - 1));
    end loop;
  end loop;

  perform public.refresh_task_statuses();
  return v_created;
end;
$function$;
