-- Healthy Pro MVP Supabase schema
-- Auth uses Supabase Auth email + password. App rows are linked to auth.users.id.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gender text not null,
  age int not null,
  height_cm numeric not null,
  weight_kg numeric not null,
  body_fat_percent numeric,
  training_experience text not null default 'beginner',
  target_preference text not null default 'auto',
  focus_areas text[] not null default '{}',
  weekly_limit text not null default 'coach',
  session_budget_minutes int not null default 60,
  injury text not null default 'none',
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  coach_spec_version text not null,
  plan_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  workout_id text not null,
  workout_title text not null,
  week int not null,
  completed_count int not null default 0,
  intensity_feedback text,
  note text,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric not null,
  body_fat_percent numeric,
  sleep_hours numeric,
  note text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.plans enable row level security;
alter table public.training_logs enable row level security;
alter table public.body_logs enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
grant select, insert, update, delete on public.training_logs to authenticated;
grant select, insert, update, delete on public.body_logs to authenticated;

create index if not exists assessments_user_created_idx on public.assessments (user_id, created_at desc);
create index if not exists plans_user_created_idx on public.plans (user_id, created_at desc);
create index if not exists training_logs_user_created_idx on public.training_logs (user_id, created_at desc);
create index if not exists body_logs_user_created_idx on public.body_logs (user_id, created_at desc);

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can manage own assessments" on public.assessments;
drop policy if exists "Users can manage own plans" on public.plans;
drop policy if exists "Users can manage own training logs" on public.training_logs;
drop policy if exists "Users can manage own body logs" on public.body_logs;

create policy "Users can read own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "Users can manage own assessments" on public.assessments
  for all to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Users can manage own plans" on public.plans
  for all to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Users can manage own training logs" on public.training_logs
  for all to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Users can manage own body logs" on public.body_logs
  for all to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
