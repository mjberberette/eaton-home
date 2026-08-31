-- Eaton Home — photo uploads
-- Public bucket for project photos (inspiration / before / after).
-- Run this after the initial migration. Safe to run more than once.

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

create policy "household upload project images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-images');

create policy "household update project images" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-images');

create policy "household delete project images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-images');

create policy "public read project images" on storage.objects
  for select to public
  using (bucket_id = 'project-images');
