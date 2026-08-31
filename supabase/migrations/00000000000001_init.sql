-- Eaton Home — initial schema
-- Household dashboard: upgrade projects, price tracking, recurring care, budget.

create table public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  zone text not null check (zone in ('outdoor', 'indoor', 'repairs')),
  sort integer not null default 0
);

create table public.projects (
  id text primary key,
  title text not null,
  description text not null default '',
  category_id text not null references public.categories (id) on delete cascade,
  rank integer not null,
  status text not null default 'idea' check (status in ('idea', 'planned', 'in_progress', 'done')),
  estimated_cost numeric not null default 0,
  spent numeric not null default 0,
  progress integer not null default 0 check (progress between 0 and 100),
  store_name text,
  store_url text,
  inspiration_image text,
  before_image text,
  after_image text,
  -- {x, y, z} position of the marker on the 3D house model
  hotspot jsonb,
  -- array of {date, price, note?} points for best-time-to-buy tracking
  price_history jsonb not null default '[]'::jsonb,
  created_at date not null default current_date,
  -- household member attribution ("changed by Nate")
  updated_by text,
  updated_at timestamptz
);

create table public.recurring_tasks (
  id text primary key,
  name text not null,
  detail text,
  interval_days integer not null,
  last_done date not null default current_date,
  icon text not null default 'wrench'
);

create table public.budget (
  id integer primary key default 1 check (id = 1),
  monthly_budget numeric not null default 0,
  project_fund numeric not null default 0
);

-- Row Level Security: this is a private household app — any signed-in
-- member of the household account has full access.
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.recurring_tasks enable row level security;
alter table public.budget enable row level security;

create policy "household read categories" on public.categories
  for select to authenticated using (true);
create policy "household write categories" on public.categories
  for all to authenticated using (true) with check (true);

create policy "household read projects" on public.projects
  for select to authenticated using (true);
create policy "household write projects" on public.projects
  for all to authenticated using (true) with check (true);

create policy "household read tasks" on public.recurring_tasks
  for select to authenticated using (true);
create policy "household write tasks" on public.recurring_tasks
  for all to authenticated using (true) with check (true);

create policy "household read budget" on public.budget
  for select to authenticated using (true);
create policy "household write budget" on public.budget
  for all to authenticated using (true) with check (true);

-- Live sync: broadcast table changes so both members' dashboards update
-- the moment either of them edits anything.
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.recurring_tasks;
alter publication supabase_realtime add table public.budget;
alter publication supabase_realtime add table public.categories;
