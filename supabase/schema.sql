-- Run once in the Supabase dashboard → SQL Editor.
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
