-- Run this in Supabase SQL Editor after schema-update2.sql.
-- Adds date+time scheduling (previously date-only) to exam_schedules.
-- Old start_date/end_date columns are left in place, unused, and can be
-- dropped later once you've confirmed everything works.

alter table public.exam_schedules add column if not exists start_at timestamptz;
alter table public.exam_schedules add column if not exists end_at timestamptz;

-- Optional one-time carry-over: if you already set start_date/end_date on
-- some rows before this update, this copies them into the new columns
-- (start of day / end of day, in the database's time zone). Safe to run
-- even if start_date/end_date are empty.
update public.exam_schedules
  set start_at = coalesce(start_at, start_date::timestamptz)
  where start_date is not null and start_at is null;
update public.exam_schedules
  set end_at = coalesce(end_at, (end_date + interval '23:59:59')::timestamptz)
  where end_date is not null and end_at is null;
