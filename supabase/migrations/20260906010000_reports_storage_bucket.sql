-- Somewhere to park the rendered weekly video. Kept private: the email carries a
-- signed URL instead, so a forwarded link stops working eventually rather than
-- exposing plant data to anyone who ever sees it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 104857600, array['video/mp4', 'application/pdf'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The renderer runs as the signed-in user, so uploads go through RLS like anything
-- else. Only registered staff can write, and only into this bucket.
drop policy if exists "reports_insert_authenticated" on storage.objects;
create policy "reports_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'reports');

drop policy if exists "reports_select_authenticated" on storage.objects;
create policy "reports_select_authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'reports');

-- Re-sending a week overwrites its file rather than piling up near-identical renders.
drop policy if exists "reports_update_authenticated" on storage.objects;
create policy "reports_update_authenticated"
  on storage.objects for update to authenticated
  using (bucket_id = 'reports')
  with check (bucket_id = 'reports');
