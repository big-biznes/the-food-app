-- Run in the Supabase dashboard → SQL Editor. Safe to re-run after it changes.
-- Recipes live in their own scripts: run recipes.sql and then recipes_data.sql.

-- ── Per-user data (one row per user, JSON documents) ─────────────────────────
create table if not exists public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  profile jsonb,
  likes jsonb not null default '{"liked":[],"disliked":[]}',
  shopping jsonb not null default '[]',
  pantry jsonb not null default '[]',
  plan jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists "own row" on public.user_data;
create policy "own row"
  on public.user_data for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch before update on public.user_data
  for each row execute function public.touch_updated_at();

-- ── Account deletion (lets a signed-in user delete only themselves) ──────────
create or replace function public.delete_own_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- ── Crash reports (the app writes, nobody reads through the API) ─────────────
-- An error the app could not recover from, with the app and phone version. No account,
-- no device identifier. Read them in the dashboard: Table Editor → crash_reports.
create table if not exists public.crash_reports (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  message     text not null check (char_length(message) <= 500),
  stack       text check (char_length(stack) <= 6000),
  fatal       boolean not null default false,
  app_version text check (char_length(app_version) <= 40),
  platform    text check (char_length(platform) <= 20),
  os_version  text check (char_length(os_version) <= 40),
  device      text check (char_length(device) <= 80)
);

alter table public.crash_reports enable row level security;

drop policy if exists "anyone may report a crash" on public.crash_reports;
create policy "anyone may report a crash"
  on public.crash_reports for insert to anon, authenticated with check (true);

-- ── Feedback (Settings → Send feedback) ──────────────────────────────────────
-- Stored with the account so it can be answered; deleted with the account.
-- To read it with the sender's email, in the SQL Editor:
--   select f.created_at, u.email, f.message, f.app_version, f.device, f.language
--   from public.feedback f left join auth.users u on u.id = f.user_id
--   order by f.created_at desc;
create table if not exists public.feedback (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  message     text not null check (char_length(message) between 1 and 2000),
  language    text check (char_length(language) <= 10),
  app_version text check (char_length(app_version) <= 40),
  platform    text check (char_length(platform) <= 20),
  os_version  text check (char_length(os_version) <= 40),
  device      text check (char_length(device) <= 80)
);

alter table public.feedback enable row level security;

drop policy if exists "send own feedback" on public.feedback;
create policy "send own feedback"
  on public.feedback for insert to authenticated with check (auth.uid() = user_id);
