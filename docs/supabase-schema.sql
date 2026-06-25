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
  coach_feedback jsonb,
  created_at timestamptz not null default now()
);

alter table public.training_logs
  add column if not exists coach_feedback jsonb;

create table if not exists public.body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric not null,
  body_fat_percent numeric,
  sleep_hours numeric,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.friend_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '训练伙伴',
  friend_code text not null unique,
  share_leaderboard boolean not null default false,
  share_weekly_summary boolean not null default false,
  current_week_count int not null default 0,
  current_week_completed int not null default 0,
  current_week_completion_rate int not null default 0,
  streak_weeks int not null default 0,
  latest_training_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint friend_profiles_code_shape check (friend_code ~ '^[A-Z0-9]{6,12}$'),
  constraint friend_profiles_nickname_length check (char_length(nickname) between 1 and 16),
  constraint friend_profiles_completion_rate_range check (current_week_completion_rate between 0 and 100)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_not_self check (requester_id <> addressee_id),
  constraint friendships_status_check check (status in ('pending', 'accepted', 'declined'))
);

create unique index if not exists friendships_unique_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null,
  category text not null,
  page text,
  message text not null,
  created_at timestamptz not null default now(),
  constraint feedback_rating_range check (rating between 1 and 5),
  constraint feedback_message_length check (char_length(message) between 2 and 500)
);

create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  summary text not null,
  highlights jsonb not null default '[]'::jsonb,
  details text,
  release_type text not null default 'improvement',
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint app_releases_version_length check (char_length(version) between 2 and 32),
  constraint app_releases_title_length check (char_length(title) between 2 and 80),
  constraint app_releases_summary_length check (char_length(summary) between 2 and 240),
  constraint app_releases_highlights_array check (jsonb_typeof(highlights) = 'array'),
  constraint app_releases_type_check check (release_type in ('feature', 'improvement', 'fix'))
);

create table if not exists public.user_release_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  release_id uuid not null references public.app_releases(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, release_id)
);

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.plans enable row level security;
alter table public.training_logs enable row level security;
alter table public.body_logs enable row level security;
alter table public.friend_profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.feedback enable row level security;
alter table public.app_releases enable row level security;
alter table public.user_release_reads enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
grant select, insert, update, delete on public.training_logs to authenticated;
grant select, insert, update, delete on public.body_logs to authenticated;
grant select, insert, update on public.friend_profiles to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant insert, select on public.feedback to authenticated;
grant select on public.app_releases to authenticated;
grant select, insert, update on public.user_release_reads to authenticated;

create index if not exists assessments_user_created_idx on public.assessments (user_id, created_at desc);
create index if not exists plans_user_created_idx on public.plans (user_id, created_at desc);
create index if not exists training_logs_user_created_idx on public.training_logs (user_id, created_at desc);
create index if not exists body_logs_user_created_idx on public.body_logs (user_id, created_at desc);
create index if not exists friend_profiles_code_idx on public.friend_profiles (friend_code);
create index if not exists friendships_requester_idx on public.friendships (requester_id, status, created_at desc);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status, created_at desc);
create index if not exists feedback_user_created_idx on public.feedback (user_id, created_at desc);
create index if not exists app_releases_published_idx on public.app_releases (is_published, published_at desc);
create index if not exists user_release_reads_user_idx on public.user_release_reads (user_id, read_at desc);

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can manage own assessments" on public.assessments;
drop policy if exists "Users can manage own plans" on public.plans;
drop policy if exists "Users can manage own training logs" on public.training_logs;
drop policy if exists "Users can manage own body logs" on public.body_logs;
drop policy if exists "Users can read friend public summaries" on public.friend_profiles;
drop policy if exists "Users can insert own friend profile" on public.friend_profiles;
drop policy if exists "Users can update own friend profile" on public.friend_profiles;
drop policy if exists "Users can read own friendships" on public.friendships;
drop policy if exists "Users can insert outgoing friend requests" on public.friendships;
drop policy if exists "Users can update own friendships" on public.friendships;
drop policy if exists "Users can delete own friendships" on public.friendships;
drop policy if exists "Users can insert own feedback" on public.feedback;
drop policy if exists "Users can read own feedback" on public.feedback;
drop policy if exists "Users can read published releases" on public.app_releases;
drop policy if exists "Users can read own release reads" on public.user_release_reads;
drop policy if exists "Users can insert own release reads" on public.user_release_reads;
drop policy if exists "Users can update own release reads" on public.user_release_reads;

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

create policy "Users can read friend public summaries" on public.friend_profiles
  for select to authenticated
  using ((select auth.uid()) is not null);
create policy "Users can insert own friend profile" on public.friend_profiles
  for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Users can update own friend profile" on public.friend_profiles
  for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read own friendships" on public.friendships
  for select to authenticated
  using ((select auth.uid()) is not null and ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id));
create policy "Users can insert outgoing friend requests" on public.friendships
  for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = requester_id and requester_id <> addressee_id and status = 'pending');
create policy "Users can update own friendships" on public.friendships
  for update to authenticated
  using ((select auth.uid()) is not null and ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id))
  with check ((select auth.uid()) is not null and ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id));
create policy "Users can delete own friendships" on public.friendships
  for delete to authenticated
  using ((select auth.uid()) is not null and ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id));

create policy "Users can insert own feedback" on public.feedback
  for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Users can read own feedback" on public.feedback
  for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read published releases" on public.app_releases
  for select to authenticated
  using ((select auth.uid()) is not null and is_published = true and published_at <= now());

create policy "Users can read own release reads" on public.user_release_reads
  for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Users can insert own release reads" on public.user_release_reads
  for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Users can update own release reads" on public.user_release_reads
  for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

insert into public.app_releases (
  version,
  title,
  summary,
  highlights,
  details,
  release_type,
  is_published,
  published_at
) values (
  'v0.8.1',
  'PWA 与小程序功能对齐',
  '补齐小程序和 PWA 的计划解释、计划编辑审核、趋势、训练历史、器械分组和反馈记录差异。',
  '["小程序计划页新增教练解释，编辑计划前会提示风险和建议", "小程序我的页补齐强度趋势和身体趋势，器械页按今日器械和训练区分组", "PWA 历史训练补齐动作明细和训练后教练反馈"]'::jsonb,
  '这次更新目标是让已经在 PWA 验证过的功能完整迁移到微信小程序，同时把小程序里更细的训练历史体验同步回 PWA。',
  'improvement',
  true,
  '2026-06-25 00:00:00+08'
) on conflict (version) do update set
  title = excluded.title,
  summary = excluded.summary,
  highlights = excluded.highlights,
  details = excluded.details,
  release_type = excluded.release_type,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

insert into public.app_releases (
  version,
  title,
  summary,
  highlights,
  details,
  release_type,
  is_published,
  published_at
) values (
  'v0.8.0',
  '训练反馈和好友动态',
  '保存训练后会给即时教练反馈，新用户首次进入会看到开始顺序，好友页新增最近训练动态。',
  '["训练记录保存后生成一句教练反馈，并随记录保存", "首页新增首次使用引导，帮助新用户知道先看什么、先做什么", "好友页新增最近训练动态，只展示昵称、训练时间和本周次数"]'::jsonb,
  '这次更新继续把 App 从记录器变成训练助手：训练后立刻告诉你下一次该稳住、补齐还是小幅进阶，同时让好友之间更容易看到彼此是否在持续训练。',
  'feature',
  true,
  '2026-06-24 20:00:00+08'
) on conflict (version) do update set
  title = excluded.title,
  summary = excluded.summary,
  highlights = excluded.highlights,
  details = excluded.details,
  release_type = excluded.release_type,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

insert into public.app_releases (
  version,
  title,
  summary,
  highlights,
  details,
  release_type,
  is_published,
  published_at
) values (
  'v0.5.0',
  '界面和训练流程简化',
  '首页、计划、记录、器械和我的页重新分层，让训练时更容易知道下一步做什么。',
  '["首页聚焦今天训练和开始按钮", "计划页优先展示本周安排，教练解释改为折叠", "记录页改为逐项展开，器械页支持搜索和今日器械"]'::jsonb,
  '这次更新重点不是增加复杂功能，而是把训练流程变得更像一个可以拿在手里的私人教练工具。后续会继续优化训练中的动作提示、休息倒计时和周报表达。',
  'improvement',
  true,
  '2026-06-09 00:00:00+08'
) on conflict (version) do update set
  title = excluded.title,
  summary = excluded.summary,
  highlights = excluded.highlights,
  details = excluded.details,
  release_type = excluded.release_type,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

insert into public.app_releases (
  version,
  title,
  summary,
  highlights,
  details,
  release_type,
  is_published,
  published_at
) values (
  'v0.7.2',
  '小程序我的页简化',
  '微信小程序我的页改为训练档案、周报摘要和更多入口，减少首屏信息堆叠。',
  '["首屏保留训练状态和本周周报摘要", "好友排行、更新公告、设置与反馈改为入口卡片", "保留原有好友、反馈、同步和公告能力，不改变数据逻辑"]'::jsonb,
  '这次更新重点是减少我的页默认展示的信息量，让朋友打开后更容易知道自己当前计划状态，再按需进入周报、好友、更新或设置详情。',
  'improvement',
  true,
  '2026-06-24 00:00:00+08'
) on conflict (version) do update set
  title = excluded.title,
  summary = excluded.summary,
  highlights = excluded.highlights,
  details = excluded.details,
  release_type = excluded.release_type,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

insert into public.app_releases (
  version,
  title,
  summary,
  highlights,
  details,
  release_type,
  is_published,
  published_at
) values (
  'v0.7.1',
  '小程序用户数据隔离修复',
  '微信小程序启动时会自动绑定当前微信用户，新用户不再默认进入同一套演示计划。',
  '["启动时自动读取微信身份并按 openid 加载云端数据", "新用户先进入基础评估，不再共用默认 demo 计划", "本地训练草稿和身体草稿按微信用户隔离"]'::jsonb,
  '这次修复解决体验版里不同用户先看到相同默认数据的问题。云端仍按微信 openid 分用户保存，已有误同步的纯 demo seed 会被识别并清理。',
  'fix',
  true,
  '2026-06-22 12:00:00+08'
) on conflict (version) do update set
  title = excluded.title,
  summary = excluded.summary,
  highlights = excluded.highlights,
  details = excluded.details,
  release_type = excluded.release_type,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

insert into public.app_releases (
  version,
  title,
  summary,
  highlights,
  details,
  release_type,
  is_published,
  published_at
) values (
  'v0.7.0',
  '微信小程序功能迁移',
  '小程序端补齐 PWA 已验证的训练记录、好友排行、反馈和更新公告能力。',
  '["记录页升级为训练助手，支持当前动作、休息倒计时和动作详情", "我的页补齐好友码、好友请求、稳定榜和结构化反馈", "小程序端发布公告支持多版本展示和已读状态"]'::jsonb,
  '这次更新重点是让微信小程序端和 PWA 的可用功能保持一致，方便朋友直接在微信里体验和反馈。',
  'feature',
  true,
  '2026-06-22 00:00:00+08'
) on conflict (version) do update set
  title = excluded.title,
  summary = excluded.summary,
  highlights = excluded.highlights,
  details = excluded.details,
  release_type = excluded.release_type,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

insert into public.app_releases (
  version,
  title,
  summary,
  highlights,
  details,
  release_type,
  is_published,
  published_at
) values (
  'v0.6.0',
  '动作详情和训练中辅助',
  '训练动作可以点进详情，记录页也升级成边练边看的训练助手。',
  '["新增动作详情页，包含器械图、调节方式、动作提示、常见错误和替代动作", "记录页新增当前动作卡、完成组数、训练队列和组间休息倒计时", "器械页可以直接查看相关动作，训练时更容易确认自己该怎么做"]'::jsonb,
  '这次更新让 App 不只是生成计划和记录结果，而是在训练过程中给你更清晰的动作指引。后续会继续把训练记录转化成动作进步分析和更主动的计划调整建议。',
  'feature',
  true,
  '2026-06-10 11:20:00+08'
) on conflict (version) do update set
  title = excluded.title,
  summary = excluded.summary,
  highlights = excluded.highlights,
  details = excluded.details,
  release_type = excluded.release_type,
  is_published = excluded.is_published,
  published_at = excluded.published_at;
