-- profile_stats: sync streak / badge inputs as one JSON blob per user.
--
-- data shape mirrors utils/profileStats.js:
--   { "activeDays": string[], "surahsFinished": number[], "khatmCompletedCount": number }
--
-- Badges are derived client-side from these fields (not stored).
-- Run in the Supabase SQL Editor (or via `supabase db push`). Safe to re-run.

create table if not exists public.profile_stats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  data        jsonb not null default '{"activeDays":[],"surahsFinished":[],"khatmCompletedCount":0}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.profile_stats enable row level security;

drop policy if exists "profile_stats_select_own" on public.profile_stats;
create policy "profile_stats_select_own" on public.profile_stats
  for select using (auth.uid() = user_id);

drop policy if exists "profile_stats_insert_own" on public.profile_stats;
create policy "profile_stats_insert_own" on public.profile_stats
  for insert with check (auth.uid() = user_id);

drop policy if exists "profile_stats_update_own" on public.profile_stats;
create policy "profile_stats_update_own" on public.profile_stats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "profile_stats_delete_own" on public.profile_stats;
create policy "profile_stats_delete_own" on public.profile_stats
  for delete using (auth.uid() = user_id);

drop trigger if exists set_profile_stats_updated_at on public.profile_stats;
create trigger set_profile_stats_updated_at
  before update on public.profile_stats
  for each row execute function public.set_updated_at();
