-- Eaton Home — completion timestamp
-- Projects checked off as complete record when it happened.
-- Safe to run more than once.

alter table public.projects
  add column if not exists completed_at timestamptz;
