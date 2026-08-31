-- Run once in Supabase SQL Editor to let the new display options sync to every screen.
alter table public.display_settings add column if not exists clock_align text not null default 'center';
alter table public.display_settings add column if not exists clock_offset integer not null default 0;
alter table public.display_settings add column if not exists clock_font text not null default 'system';
alter table public.display_settings add column if not exists date_size integer not null default 36;
