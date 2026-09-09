-- Addresses that get the inspection reports but do not have an account: the plant
-- manager's personal mailbox, a contractor, a shared distribution list. They used
-- to be retyped into a free-text box on every single send.
--
-- The list is shared, not per-user: whoever sends the report that morning should
-- reach the same people as whoever sent it yesterday.

create table if not exists public.report_extra_recipients (
  email text primary key,
  label text,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Stored lower-cased and trimmed so the primary key actually deduplicates, and
  -- shaped here too: the UI is not the only thing that can write this table.
  constraint report_extra_recipients_email_check check (
    email = lower(btrim(email))
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'
  )
);

alter table public.report_extra_recipients enable row level security;

-- Anyone who can open the send dialog needs to see who is on the list.
drop policy if exists extra_recipients_select on public.report_extra_recipients;
create policy extra_recipients_select on public.report_extra_recipients
  for select to authenticated using (true);

-- Changing who receives the plant's reports is a reporting decision.
drop policy if exists extra_recipients_write on public.report_extra_recipients;
create policy extra_recipients_write on public.report_extra_recipients
  for all to authenticated
  using (has_permission('reports'))
  with check (has_permission('reports'));

grant select, insert, update, delete on public.report_extra_recipients to authenticated;
