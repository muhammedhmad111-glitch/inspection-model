-- Phase 1: Foundation + Master Data
-- Consolidated final state (as applied to project sodkgmmlgpzhmvknroyx).
-- Replaces an earlier, incomplete/abandoned schema (production_areas/production_lines/
-- inspection_sessions/etc, all empty) that didn't match the master spec.

-- ── Enums ──────────────────────────────────────────────
create type public.app_user_role as enum (
  'Super Admin',
  'Inspection Manager',
  'Inspection Engineer',
  'Inspector',
  'Maintenance Manager',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Reliability Engineer',
  'Production Manager',
  'Plant Manager',
  'Viewer'
);

create type public.equipment_criticality as enum ('Low', 'Medium', 'High', 'Critical');
create type public.equipment_status as enum ('Operational', 'Warning', 'Critical', 'Offline');

-- ── profiles ───────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_user_role not null default 'Viewer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── areas ──────────────────────────────────────────────
create table public.areas (
  area_id uuid primary key default gen_random_uuid(),
  area_code text not null unique,
  area_name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── sections ───────────────────────────────────────────
create table public.sections (
  section_id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(area_id) on delete restrict,
  section_code text not null,
  section_name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (area_id, section_code)
);

-- ── equipment ──────────────────────────────────────────
create table public.equipment (
  equipment_id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(section_id) on delete restrict,
  equipment_code text not null unique,
  equipment_name text not null,
  functional_location text,
  equipment_type text,
  manufacturer text,
  model text,
  serial_number text,
  criticality public.equipment_criticality not null default 'Medium',
  status public.equipment_status not null default 'Operational',
  installation_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── equipment_parts ────────────────────────────────────
create table public.equipment_parts (
  equipment_part_id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(equipment_id) on delete restrict,
  part_code text not null,
  part_name text not null,
  part_group text,
  description text,
  criticality public.equipment_criticality not null default 'Medium',
  inspectable boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (equipment_id, part_code)
);

-- ── indexes ────────────────────────────────────────────
create index idx_sections_area_id on public.sections(area_id);
create index idx_equipment_section_id on public.equipment(section_id);
create index idx_equipment_type on public.equipment(equipment_type);
create index idx_equipment_criticality on public.equipment(criticality);
create index idx_equipment_parts_equipment_id on public.equipment_parts(equipment_id);

-- ── updated_at trigger ─────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_areas_updated_at before update on public.areas
  for each row execute function public.set_updated_at();
create trigger trg_sections_updated_at before update on public.sections
  for each row execute function public.set_updated_at();
create trigger trg_equipment_updated_at before update on public.equipment
  for each row execute function public.set_updated_at();
create trigger trg_equipment_parts_updated_at before update on public.equipment_parts
  for each row execute function public.set_updated_at();

-- ── auto-create profile on signup ─────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'Viewer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── role helper functions (security definer to avoid RLS recursion) ──
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Super Admin' and active = true
  );
$$;

create or replace function public.has_master_data_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('Super Admin', 'Inspection Manager', 'Inspection Engineer')
      and active = true
  );
$$;

-- guard against self role/active escalation
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and not public.is_super_admin() then
    raise exception 'Only Super Admin can change role or active status';
  end if;
  return new;
end;
$$;

create trigger trg_profiles_guard_role
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();

-- lock down helper/trigger functions: remove default PUBLIC/anon/authenticated
-- execute grants except where RLS policies actually need them (authenticated only,
-- for the two role-check functions; none for the trigger-only functions)
revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

revoke execute on function public.has_master_data_write() from public, anon;
grant execute on function public.has_master_data_write() to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prevent_self_role_escalation() from public, anon, authenticated;

-- ── RLS ────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.areas enable row level security;
alter table public.sections enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_parts enable row level security;

create policy profiles_select_authenticated on public.profiles
  for select to authenticated using (true);
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_super_admin())
  with check (id = (select auth.uid()) or public.is_super_admin());

create policy areas_select_authenticated on public.areas
  for select to authenticated using (true);
create policy areas_insert_authorized on public.areas for insert to authenticated with check (public.has_master_data_write());
create policy areas_update_authorized on public.areas for update to authenticated using (public.has_master_data_write()) with check (public.has_master_data_write());
create policy areas_delete_authorized on public.areas for delete to authenticated using (public.has_master_data_write());

create policy sections_select_authenticated on public.sections
  for select to authenticated using (true);
create policy sections_insert_authorized on public.sections for insert to authenticated with check (public.has_master_data_write());
create policy sections_update_authorized on public.sections for update to authenticated using (public.has_master_data_write()) with check (public.has_master_data_write());
create policy sections_delete_authorized on public.sections for delete to authenticated using (public.has_master_data_write());

create policy equipment_select_authenticated on public.equipment
  for select to authenticated using (true);
create policy equipment_insert_authorized on public.equipment for insert to authenticated with check (public.has_master_data_write());
create policy equipment_update_authorized on public.equipment for update to authenticated using (public.has_master_data_write()) with check (public.has_master_data_write());
create policy equipment_delete_authorized on public.equipment for delete to authenticated using (public.has_master_data_write());

create policy equipment_parts_select_authenticated on public.equipment_parts
  for select to authenticated using (true);
create policy equipment_parts_insert_authorized on public.equipment_parts for insert to authenticated with check (public.has_master_data_write());
create policy equipment_parts_update_authorized on public.equipment_parts for update to authenticated using (public.has_master_data_write()) with check (public.has_master_data_write());
create policy equipment_parts_delete_authorized on public.equipment_parts for delete to authenticated using (public.has_master_data_write());
