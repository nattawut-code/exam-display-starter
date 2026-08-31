-- Run this once in Supabase SQL Editor for a new Exam Display project.
-- The display is public read-only; publishing requires a signed-in admin.

create table if not exists public.display_settings (
  id integer primary key check (id = 1),
  clock_size integer not null default 110,
  clock_position text not null default 'bottom',
  clock_align text not null default 'center',
  clock_offset integer not null default 0,
  clock_font text not null default 'system',
  image_size integer not null default 90,
  image_position text not null default 'center',
  show_date boolean not null default true,
  show_clock boolean not null default true,
  date_size integer not null default 36,
  theme text not null default 'midnight',
  image_url text,
  updated_at timestamptz not null default now()
);

alter table public.display_settings add column if not exists clock_align text not null default 'center';
alter table public.display_settings add column if not exists clock_offset integer not null default 0;
alter table public.display_settings add column if not exists clock_font text not null default 'system';
alter table public.display_settings add column if not exists date_size integer not null default 36;
alter table public.display_settings add column if not exists theme text not null default 'midnight';

insert into public.display_settings (id) values (1) on conflict (id) do nothing;

alter table public.display_settings enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.display_settings to anon, authenticated;
grant insert, update on public.display_settings to authenticated;

drop policy if exists "public read display settings" on public.display_settings;
create policy "public read display settings" on public.display_settings
  for select to anon, authenticated using (true);

drop policy if exists "authenticated insert display settings" on public.display_settings;
drop policy if exists "authenticated insert settings" on public.display_settings;
create policy "authenticated insert display settings" on public.display_settings
  for insert to authenticated with check (id = 1);

drop policy if exists "authenticated update display settings" on public.display_settings;
drop policy if exists "authenticated update settings" on public.display_settings;
create policy "authenticated update display settings" on public.display_settings
  for update to authenticated using (id = 1) with check (id = 1);

alter table public.display_settings replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.display_settings;
exception when duplicate_object then null;
end $$;

-- The image URL is read by unauthenticated display screens, so this bucket is public.
insert into storage.buckets (id, name, public)
values ('exam-images', 'exam-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "authenticated upload exam images" on storage.objects;
create policy "authenticated upload exam images" on storage.objects
  for insert to authenticated with check (bucket_id = 'exam-images');

drop policy if exists "authenticated update exam images" on storage.objects;
create policy "authenticated update exam images" on storage.objects
  for update to authenticated using (bucket_id = 'exam-images') with check (bucket_id = 'exam-images');

drop policy if exists "authenticated delete exam images" on storage.objects;
create policy "authenticated delete exam images" on storage.objects
  for delete to authenticated using (bucket_id = 'exam-images');
