-- Findings and actions could only be born inside an inspection: a finding needed a
-- task, an action needed a finding. Anything spotted on a walk-round had nowhere to
-- go. Both links become optional so they can be logged directly.

-- A finding raised outside a scheduled inspection has no task to point at.
-- RLS still holds: findings_insert falls back to has_permission('findings') when
-- can_execute_task(null) is false, so only findings managers can create these.
alter table public.inspection_findings
  alter column inspection_task_id drop not null;

-- An action used to borrow its equipment from the finding. Standing alone, it needs
-- its own, or the actions page would show a job with no idea what it is on.
alter table public.maintenance_actions
  add column equipment_id uuid references public.equipment (equipment_id) on delete restrict,
  add column equipment_part_id uuid references public.equipment_parts (equipment_part_id) on delete restrict;

update public.maintenance_actions a
set equipment_id = f.equipment_id,
    equipment_part_id = f.equipment_part_id
from public.inspection_findings f
where f.finding_id = a.finding_id
  and a.equipment_id is null;

alter table public.maintenance_actions
  alter column finding_id drop not null;

-- Never both null: an action always says what it is about, one way or the other.
alter table public.maintenance_actions
  add constraint maintenance_actions_has_context
  check (finding_id is not null or equipment_id is not null);
