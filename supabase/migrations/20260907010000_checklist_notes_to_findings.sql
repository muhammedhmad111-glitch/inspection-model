-- An inspector types the most useful sentence of the whole round into the little
-- notes box under a checklist item — "الصوت عالي من ناحية الكوبلينج". Until now that
-- sentence died inside the task. This lets it surface on the findings page so a
-- manager can turn it into a real finding, and from there into a maintenance action.

-- Which note a finding grew out of. Null for findings raised the normal way.
alter table public.inspection_findings
  add column if not exists checklist_item_id uuid
  references public.inspection_task_checklist_items (id) on delete set null;

comment on column public.inspection_findings.checklist_item_id is
  'The checklist item note this finding was promoted from. Null when raised directly.';

-- One note becomes at most one finding; the pending list is driven off this, so a
-- double click must not be able to produce two findings for the same note.
create unique index if not exists inspection_findings_checklist_item_uniq
  on public.inspection_findings (checklist_item_id)
  where checklist_item_id is not null;

-- Not every note deserves a finding — "تم التنظيف" is worth writing down and nothing
-- more. Without a way to clear those, the pending list fills with noise and stops
-- being read at all.
alter table public.inspection_task_checklist_items
  add column if not exists note_dismissed_at timestamptz,
  add column if not exists note_dismissed_by uuid references public.profiles (id);

comment on column public.inspection_task_checklist_items.note_dismissed_at is
  'Set when someone decided this note needs no finding. Hides it from pending_checklist_notes.';

-- Scanning the pending list means finding the few items that carry a note.
create index if not exists checklist_items_pending_note_idx
  on public.inspection_task_checklist_items (updated_at desc)
  where notes is not null and note_dismissed_at is null;

-- Every note still waiting on a decision, with enough context to judge it without
-- opening the task. security_invoker keeps the caller's RLS on the tables underneath.
create or replace view public.pending_checklist_notes
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
  e.functional_location,
  ep.part_name,
  ia.activity_name,
  p.full_name as inspector_name
from public.inspection_task_checklist_items ci
join public.inspection_tasks t on t.inspection_task_id = ci.inspection_task_id
join public.equipment e on e.equipment_id = t.equipment_id
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

-- Dismissing is a findings decision, not an inspection edit, so it cannot go through
-- the checklist items UPDATE policy — that one only lets the assigned inspector write.
create or replace function public.dismiss_checklist_note(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('findings') then
    raise exception 'Not authorized to dismiss checklist notes';
  end if;

  update public.inspection_task_checklist_items
  set note_dismissed_at = now(),
      note_dismissed_by = auth.uid()
  where id = p_item_id
    and note_dismissed_at is null;

  if not found then
    raise exception 'Checklist note not found or already dismissed';
  end if;
end;
$$;

revoke execute on function public.dismiss_checklist_note(uuid) from public, anon;
grant execute on function public.dismiss_checklist_note(uuid) to authenticated;

-- Undo, because a note dismissed by mistake is otherwise gone from the list forever.
create or replace function public.restore_checklist_note(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('findings') then
    raise exception 'Not authorized to restore checklist notes';
  end if;

  update public.inspection_task_checklist_items
  set note_dismissed_at = null,
      note_dismissed_by = null
  where id = p_item_id;

  if not found then
    raise exception 'Checklist note not found';
  end if;
end;
$$;

revoke execute on function public.restore_checklist_note(uuid) from public, anon;
grant execute on function public.restore_checklist_note(uuid) to authenticated;
