-- Eaton Home — project subtasks
-- Steps to finish a project ({id, title, done, completedAt?}). Safe to re-run.

alter table public.projects
  add column if not exists subtasks jsonb not null default '[]'::jsonb;
