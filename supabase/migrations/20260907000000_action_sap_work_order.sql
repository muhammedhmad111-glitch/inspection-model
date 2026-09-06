-- Maintenance work is actually executed through SAP PM, so an action here has a
-- twin over there. Keeping the work order number on the action is what lets an
-- inspector jump from "this bearing is hot" to the order the planner raised for it.
alter table public.maintenance_actions
  add column if not exists sap_work_order text;

-- Nullable on purpose: the order is often raised days after the action, and an
-- action with no order yet is a normal state, not a broken row.
alter table public.maintenance_actions
  drop constraint if exists maintenance_actions_sap_work_order_check;
alter table public.maintenance_actions
  add constraint maintenance_actions_sap_work_order_check
  check (
    sap_work_order is null
    or (btrim(sap_work_order) = sap_work_order and char_length(sap_work_order) between 1 and 32)
  );

comment on column public.maintenance_actions.sap_work_order is
  'SAP PM work order number raised for this action. Null until a planner creates one.';

-- Looking an action up by the order number a planner quotes over the phone.
create index if not exists maintenance_actions_sap_work_order_idx
  on public.maintenance_actions (sap_work_order)
  where sap_work_order is not null;
