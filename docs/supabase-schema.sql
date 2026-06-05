-- Healthy Pro MVP Supabase schema
-- Auth uses Supabase Auth email + password. App rows are linked to auth.users.id.

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

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can manage own assessments" on public.assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own plans" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own training logs" on public.training_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own body logs" on public.body_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
