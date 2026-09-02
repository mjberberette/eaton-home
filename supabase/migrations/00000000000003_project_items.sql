-- Eaton Home — project items
-- Adds the per-project materials checklist ({id, name, price, url?, purchased}).
-- For databases created before this column existed; safe to run more than once.

alter table public.projects
  add column if not exists items jsonb not null default '[]'::jsonb;
