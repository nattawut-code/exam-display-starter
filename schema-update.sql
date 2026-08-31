-- Run this in Supabase SQL Editor when upgrading an existing installation.
alter table public.display_settings add column if not exists theme text not null default 'midnight';
