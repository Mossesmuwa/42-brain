-- 42 Brain cloud foundation.
-- Run with Supabase CLI migrations. Never place a service-role key in client apps.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player'
    check (char_length(display_name) between 1 and 32),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_session_id uuid not null,
  game_id text not null check (game_id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  rules_version integer not null check (rules_version > 0),
  category text not null check (category in (
    'memory', 'logic', 'patterns', 'focus', 'speed', 'maths', 'strategy', 'technical'
  )),
  score integer not null default 0 check (score >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  total_questions integer not null default 0 check (total_questions >= correct_answers),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  completed boolean not null default false,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_session_id),
  check (finished_at >= started_at)
);

create index if not exists game_sessions_user_finished_idx
  on public.game_sessions (user_id, finished_at desc);
create index if not exists game_sessions_user_game_idx
  on public.game_sessions (user_id, game_id, finished_at desc);

create table if not exists public.player_game_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  attempts integer not null default 0 check (attempts >= 0),
  best_score integer not null default 0 check (best_score >= 0),
  best_accuracy numeric(5,2) not null default 0
    check (best_accuracy between 0 and 100),
  last_played_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table if not exists public.achievement_definitions (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  title text not null,
  description text not null,
  category text,
  criteria jsonb not null default '{}'::jsonb,
  reward_xp integer not null default 0 check (reward_xp >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.player_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievement_definitions(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.daily_challenges (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  challenge_date date not null,
  game_id text not null,
  title text not null,
  description text not null,
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  unique (challenge_date, game_id)
);

create table if not exists public.daily_challenge_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id text not null references public.daily_challenges(id) on delete cascade,
  session_id uuid references public.game_sessions(id) on delete set null,
  completed_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- All tables use RLS. User data is private by default.
alter table public.profiles enable row level security;
alter table public.game_sessions enable row level security;
alter table public.player_game_progress enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.player_achievements enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.daily_challenge_completions enable row level security;

create policy "Players can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Players can create their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "Players can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Players can read their own sessions"
  on public.game_sessions for select to authenticated
  using (user_id = (select auth.uid()));
-- Initial personal history write path. Before production rewards or rankings,
-- replace direct inserts with a validating Edge Function/RPC.
create policy "Players can append their own sessions"
  on public.game_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));
-- Intentionally no client write policy for aggregate progress or awarded achievements.
create policy "Players can read their own game progress"
  on public.player_game_progress for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Achievement catalogue is readable"
  on public.achievement_definitions for select to authenticated
  using (active = true);
create policy "Players can read their own achievements"
  on public.player_achievements for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Active daily challenges are readable"
  on public.daily_challenges for select to authenticated
  using (active = true);
create policy "Players can read their own challenge completions"
  on public.daily_challenge_completions for select to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.game_sessions to authenticated;
grant select on public.player_game_progress to authenticated;
grant select on public.achievement_definitions to authenticated;
grant select on public.player_achievements to authenticated;
grant select on public.daily_challenges to authenticated;
grant select on public.daily_challenge_completions to authenticated;

-- Profile creation happens automatically after Auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(left(new.raw_user_meta_data ->> 'display_name', 32), ''), 'Player')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
