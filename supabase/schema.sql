-- Run once in the Supabase dashboard → SQL Editor.
-- Then import data/recipe_dataset_1000_FINAL.csv into `recipes` (Table Editor → recipes → Insert → Import data from CSV).

-- ── Recipes (shared, read-only; not sensitive, so readable before sign-in too) ────────────────────────────────
create table if not exists public.recipes (
  id text primary key,
  name text not null,
  protein text not null,
  carb text not null,
  vegetable text not null,
  sauce text not null,
  calories int not null,
  protein_g int not null,
  carbs_g int not null,
  fat_g int not null,
  fiber_g int not null,
  sugar_g int not null,
  sodium_mg int not null,
  prep_time_min int not null,
  difficulty text not null,
  ingredient_quantities text not null,
  appliances text not null,
  tags text not null,
  instructions text not null,
  updated_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

drop policy if exists "recipes readable by everyone" on public.recipes;
create policy "recipes readable by everyone"
  on public.recipes for select to anon, authenticated using (true);

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
