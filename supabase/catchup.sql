-- Eaton Home — schema catch-up
-- Brings any older Eaton Home database fully up to date with the current app.
-- Safe to run repeatedly: everything is IF NOT EXISTS / additive.
-- Run this in Supabase → SQL Editor whenever the app warns about missing
-- columns or failed saves after an update.

-- Columns added to projects over time
alter table public.projects add column if not exists notes jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists updated_by text;
alter table public.projects add column if not exists updated_at timestamptz;

-- Household change log
create table if not exists public.activity_log (
  id text primary key,
  actor text not null,
  action text not null,
  target_id text,
  target_title text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);
alter table public.activity_log enable row level security;
do $$ begin
  create policy "household read activity" on public.activity_log
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "household write activity" on public.activity_log
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- Home facts
create table if not exists public.home_info (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb
);
alter table public.home_info enable row level security;
do $$ begin
  create policy "household read home_info" on public.home_info
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "household write home_info" on public.home_info
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- Photo uploads bucket
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;
do $$ begin
  create policy "household upload project images" on storage.objects
    for insert to authenticated with check (bucket_id = 'project-images');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "household update project images" on storage.objects
    for update to authenticated using (bucket_id = 'project-images');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "household delete project images" on storage.objects
    for delete to authenticated using (bucket_id = 'project-images');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read project images" on storage.objects
    for select to public using (bucket_id = 'project-images');
exception when duplicate_object then null; end $$;

-- Live sync between household members
do $$ begin
  alter publication supabase_realtime add table public.projects;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.recurring_tasks;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.budget;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.categories;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.activity_log;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.home_info;
exception when duplicate_object then null; end $$;
