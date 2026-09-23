-- Until now every area implicitly belonged to production line 1, so the line was
-- never worth recording. Line 3 changes that: the two lines share a plant but not
-- a shift, a crew or a report, and mixing them would make every count meaningless.
-- The line lives on the area because that is the top of the master-data tree —
-- sections, equipment, tasks and findings all inherit it by walking up.

alter table public.areas
  add column production_line smallint not null default 1;

alter table public.areas
  add constraint areas_production_line_positive check (production_line > 0);

create index idx_areas_production_line on public.areas(production_line);

comment on column public.areas.production_line is
  'Production line this area belongs to (1 or 3 today). Everything under the area inherits it.';
