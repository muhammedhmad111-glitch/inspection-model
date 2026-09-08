-- Photos taken at a single checklist item, not just at the round as a whole.
-- A close-up of the cracked weld belongs next to "فحص اللحام"; hanging it off the
-- task turns thirty items' evidence into one undifferentiated pile.
--
-- attachments already carries (entity_type, entity_id) with an index on the pair,
-- so this only has to widen the type whitelist.

alter table public.attachments
  drop constraint if exists attachments_entity_type_check;

alter table public.attachments
  add constraint attachments_entity_type_check
  check (entity_type in ('task', 'finding', 'checklist_item'));
