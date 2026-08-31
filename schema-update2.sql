-- Run this in Supabase SQL Editor to upgrade an existing installation.
-- Adds: multiple exam-schedule entries (with optional auto date range + reorder),
-- a vertical offset for the date text, and a slideshow interval.

alter table public.display_settings add column if not exists date_offset integer not null default 0;
alter table public.display_settings add column if not exists slideshow_seconds integer not null default 8;

create table if not exists public.exam_schedules (
  id bigint generated always as identity primary key,
  title text not null default '',
  image_url text not null,
  storage_path text,
  start_date date,
  end_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by text
);

alter table public.exam_schedules enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.exam_schedules to anon, authenticated;
grant insert, update, delete on public.exam_schedules to authenticated;

drop policy if exists "public read exam schedules" on public.exam_schedules;
create policy "public read exam schedules" on public.exam_schedules
  for select to anon, authenticated using (true);

drop policy if exists "authenticated manage exam schedules" on public.exam_schedules;
create policy "authenticated manage exam schedules" on public.exam_schedules
  for all to authenticated using (true) with check (true);

alter table public.exam_schedules replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.exam_schedules;
exception when duplicate_object then null;
end $$;

-- Existing storage policies already allow authenticated upload/update/delete
-- on the exam-images bucket, so no storage changes are needed here.
