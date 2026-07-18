-- QuranApp cloud sync schema.
--
-- One row per user per feature, holding the whole local JSON blob as `data`.
-- This mirrors how the client already stores each feature under a single
-- AsyncStorage key (a whole array/object), so sync is a plain upsert/select
-- keyed by user_id instead of per-item merge logic.
--
-- Run this in the Supabase SQL Editor (or via `supabase db push`) on your
-- project. Safe to re-run: every statement is guarded with IF NOT EXISTS /
-- OR REPLACE / DROP POLICY IF EXISTS.

create extension if not exists pgcrypto with schema extensions;

-- Shared trigger: keeps `updated_at` current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
-- Schema-ready for the account fields already shown in EditProfileScreen.js
-- (first/last name, location, bio, avatar). Not wired to the client in this
-- change — Step 3 only covers hifz/khatm/bookmarks/reading_circle.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text,
  last_name   text,
  location    text,
  bio         text,
  avatar_url  text,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Generic "one JSON blob per user" tables.
-- hifz_plans.data      <-> utils/hifz.js loadPlans()/savePlans()        (array, default [])
-- khatm_progress.data  <-> utils/khatmStorage.js loadKhatmPlan()/save() (object or null)
-- bookmarks.data       <-> utils/bookmarks.js loadBookmarks()/save()   (array, default [])
-- reading_circle.data  <-> utils/readingCircle.js loadCircle()/save()  (array, default [])
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.hifz_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  data        jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.khatm_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  data        jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  data        jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.reading_circle (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  data        jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['hifz_plans', 'khatm_progress', 'bookmarks', 'reading_circle']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      t || '_select_own', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      t || '_insert_own', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_update_own', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      t || '_delete_own', t
    );

    execute format('drop trigger if exists %I on public.%I', 'set_' || t || '_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'set_' || t || '_updated_at', t
    );
  end loop;
end $$;
