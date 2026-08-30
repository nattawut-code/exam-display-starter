create extension if not exists pgcrypto;

create table if not exists public.exams(
id uuid primary key default gen_random_uuid(),
exam_date date not null,
subject text not null,
start_time time not null,
end_time time not null,
room text default '',
enabled boolean not null default true,
created_at timestamptz not null default now()
);

create index if not exists exams_date_idx on public.exams(exam_date,start_time);

create table if not exists public.display_settings(
id integer primary key,
clock_size integer not null default 110,
clock_position text not null default 'right',
image_size integer not null default 90,
image_position text not null default 'center',
show_date boolean not null default true,
show_clock boolean not null default true,
show_schedule boolean not null default true,
show_image boolean not null default true,
image_url text,
announcement text default '',
show_announcement boolean not null default false,
updated_at timestamptz not null default now()
);

insert into public.display_settings(id) values(1) on conflict(id) do nothing;

alter table public.exams enable row level security;
alter table public.display_settings enable row level security;

drop policy if exists "public read exams" on public.exams;
create policy "public read exams" on public.exams for select to anon,authenticated using(true);

drop policy if exists "public read display settings" on public.display_settings;
create policy "public read display settings" on public.display_settings for select to anon,authenticated using(true);

drop policy if exists "authenticated insert exams" on public.exams;
create policy "authenticated insert exams" on public.exams for insert to authenticated with check(true);

drop policy if exists "authenticated update exams" on public.exams;
create policy "authenticated update exams" on public.exams for update to authenticated using(true) with check(true);

drop policy if exists "authenticated delete exams" on public.exams;
create policy "authenticated delete exams" on public.exams for delete to authenticated using(true);

drop policy if exists "authenticated update settings" on public.display_settings;
create policy "authenticated update settings" on public.display_settings for update to authenticated using(true) with check(true);

drop policy if exists "authenticated insert settings" on public.display_settings;
create policy "authenticated insert settings" on public.display_settings for insert to authenticated with check(true);

alter table public.exams replica identity full;
alter table public.display_settings replica identity full;

do $$ begin alter publication supabase_realtime add table public.exams; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.display_settings; exception when duplicate_object then null; end $$;

drop policy if exists "authenticated upload exam images" on storage.objects;
create policy "authenticated upload exam images" on storage.objects for insert to authenticated with check(bucket_id='exam-images');

drop policy if exists "authenticated update exam images" on storage.objects;
create policy "authenticated update exam images" on storage.objects for update to authenticated using(bucket_id='exam-images') with check(bucket_id='exam-images');

drop policy if exists "authenticated delete exam images" on storage.objects;
create policy "authenticated delete exam images" on storage.objects for delete to authenticated using(bucket_id='exam-images');
