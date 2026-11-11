-- Store price comparison. Run once in the Supabase dashboard → SQL Editor,
-- after schema.sql. Safe to re-run.
--
-- Rows are written by scripts/ingest (service-role key, bypasses RLS).
-- The app only reads.

create table if not exists public.chains (
  id       text primary key,
  country  text not null check (country in ('NL', 'BG')),
  name     text not null,
  sort     int  not null default 0
);

insert into public.chains (id, country, name, sort) values
  ('kaufland_bg', 'BG', 'Kaufland', 1),
  ('lidl_bg',     'BG', 'Lidl',     2),
  ('billa_bg',    'BG', 'Billa',    3)
on conflict (id) do update set country = excluded.country, name = excluded.name, sort = excluded.sort;

-- One row per store product that matches an ingredient in data/ingredients.json.
create table if not exists public.products (
  chain_id          text        not null references public.chains (id) on delete cascade,
  external_id       text        not null,
  ingredient_key    text        not null,
  name              text        not null,
  pack_amount       numeric     not null check (pack_amount > 0),
  pack_unit         text        not null check (pack_unit in ('g', 'ml', 'pc')),
  -- Sold loose: price_cents is for pack_amount, any amount can be bought.
  by_weight         boolean     not null default false,
  price_cents       int         not null check (price_cents > 0),
  promo_price_cents int,
  -- Set by hand to drop a wrong match. Ingestion never touches this column.
  hidden            boolean     not null default false,
  updated_at        timestamptz not null default now(),
  primary key (chain_id, external_id)
);

create index if not exists products_chain_ingredient on public.products (chain_id, ingredient_key);

alter table public.chains   enable row level security;
alter table public.products enable row level security;

drop policy if exists "chains readable by everyone" on public.chains;
create policy "chains readable by everyone" on public.chains
  for select to anon, authenticated using (true);

drop policy if exists "products readable by everyone" on public.products;
create policy "products readable by everyone" on public.products
  for select to anon, authenticated using (not hidden);
