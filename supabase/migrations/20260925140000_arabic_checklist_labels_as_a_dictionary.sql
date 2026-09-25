-- The checklist items reach the fitter in English, straight out of the CIMPOR
-- workbooks: "Casing: Check for water in-leakage, condensation." He is asked to
-- judge it and, on many items, to enter a reading. So the wording has to be in
-- a language he reads.
--
-- It cannot simply be replaced. `web/src/lib/measurement.ts` matches the ENGLISH
-- label to decide what input he gets -- a millimetre field with ISO limits for a
-- clearance, a graded scale for wear, plain pass/fail otherwise. Overwrite the
-- label with Arabic and every one of those degrades to pass/fail, silently: the
-- measurement capture and the automatic verdict disappear and nothing raises.
--
-- So the English stays exactly where it is, and the Arabic lives beside it.
--
-- Beside it in a dictionary, not in each row. 16,304 checklist items are only
-- 2,078 distinct sentences; "Safety: Check lighting" alone appears 614 times.
-- Keyed by the sentence, a translation is written once, corrected once, and
-- reaches all 614. Keyed by the row it would be written 614 times, and the
-- fifteenth revision of the wording would miss some of them.
--
-- Nothing here translates anything. This is the shelf; the words come after, in
-- their own migrations, and until one arrives its items keep showing English.

-- The join key. Two sentences that differ only in a trailing full stop, a double
-- space or a capital are the same instruction to a fitter -- and the workbooks
-- are full of exactly that ("Safety: Check lighting" vs "Safety: Check
-- lighting."), which is why 2,205 raw labels are only 2,078 real ones.
--
-- Immutable, because a generated column below is computed with it.
create or replace function public.checklist_label_norm(p_label text)
returns text
language sql
immutable
parallel safe
set search_path to ''
as $$
  select nullif(btrim(regexp_replace(lower(btrim(p_label)), '[[:space:][:punct:]]+', ' ', 'g')), '');
$$;

comment on function public.checklist_label_norm(text) is
  'Normalised form of a checklist sentence: the key a translation hangs on.';

create table if not exists public.checklist_translations (
  label_norm  text primary key,
  -- One of the raw spellings that normalise to this key, kept so the table can
  -- be read by a human without going back to the activities to see the original.
  label_en    text not null,
  label_ar    text not null,
  -- False while a translation is machine-made and has not yet been read by
  -- someone who maintains the plant. The UI shows it either way; this only
  -- records what has actually been checked, so a review can be resumed.
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.checklist_translations is
  'Arabic wording for checklist items. The English label stays the functional key '
  '(see web/src/lib/measurement.ts); this is display only.';

alter table public.checklist_translations enable row level security;

-- Readable by everyone who can read a checklist -- a fitter cannot execute a
-- round without it. Writable only by master data, like the activities it renders.
create policy translations_select on public.checklist_translations
  for select to authenticated using (true);

create policy translations_insert on public.checklist_translations
  for insert to authenticated with check (public.has_master_data_write());

create policy translations_update on public.checklist_translations
  for update to authenticated
  using (public.has_master_data_write()) with check (public.has_master_data_write());

create policy translations_delete on public.checklist_translations
  for delete to authenticated using (public.has_master_data_write());

-- A started task copies its checklist into its own rows, so that editing a plan
-- later cannot rewrite what an inspector already signed. Those copies need the
-- same key to look a translation up by -- computed here rather than in the
-- browser, so the two normalisations can never drift apart.
alter table public.inspection_task_checklist_items
  add column if not exists label_norm text
  generated always as (public.checklist_label_norm(label)) stored;

create index if not exists idx_task_checklist_items_label_norm
  on public.inspection_task_checklist_items (label_norm);
