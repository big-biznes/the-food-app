#!/usr/bin/env node
// Daily price ingestion. Reads store prices, keeps the products that match an
// ingredient in data/ingredients.json, and upserts them into Supabase.
//
//   node scripts/ingest/index.mjs --dry-run          print what would be written
//   node scripts/ingest/index.mjs --sql out.sql      write a SQL file to paste into the Supabase SQL Editor (no key needed)
//   node scripts/ingest/index.mjs                    write (needs the env vars below)
//   node scripts/ingest/index.mjs --date 2026-11-10  use one specific day
//   node scripts/ingest/index.mjs --country nl       one country only (nl or bg)
//   node scripts/ingest/index.mjs --glovo            also read the chains' delivery stores (off by default:
//                                                    the site stops answering automated requests after a while)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (never ship this key in the app).

import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { NL_CHAINS, downloadCheckjebon, toProducts as toNlProducts } from './checkjebon.mjs';
import { GLOVO_STORES, glovoProducts } from './glovo.mjs';
import { BG_CHAINS, downloadDay, readChainRows, toProducts } from './kolkostruva.mjs';
import { matchIngredient } from './match.mjs';
import { kauflandOffers, lidlOffers } from './offers.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sqlFile = args.includes('--sql') ? args[args.indexOf('--sql') + 1] : null;
const useGlovo = args.includes('--glovo');
const dateArg = args.includes('--date') ? args[args.indexOf('--date') + 1] : null;
const country = args.includes('--country') ? String(args[args.indexOf('--country') + 1]).toUpperCase() : null;
if (country && !['NL', 'BG'].includes(country)) {
  console.error('--country takes nl or bg.');
  process.exit(1);
}
const runs = c => !country || country === c;
/** A retailer can be missing from a day's file, so look back a few days. */
const LOOKBACK_DAYS = 4;

const ingredients = JSON.parse(readFileSync(new URL('../../data/ingredients.json', import.meta.url), 'utf8'));

function recentDates() {
  if (dateArg) return [dateArg];
  const out = [];
  for (let i = 1; i <= LOOKBACK_DAYS; i++) out.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  return out;
}

async function collectBulgaria() {
  const pending = new Set(Object.keys(BG_CHAINS));
  const result = [];
  for (const date of recentDates()) {
    if (pending.size === 0) break;
    const dir = await downloadDay(date);
    if (!dir) {
      console.log(`${date}: not published`);
      continue;
    }
    try {
      for (const chainId of [...pending]) {
        const rows = readChainRows(dir, chainId);
        if (!rows) continue;
        pending.delete(chainId);
        result.push({ chainId, date, products: toProducts(rows) });
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  for (const chainId of pending) console.warn(`! ${chainId}: no data in the last ${LOOKBACK_DAYS} days`);
  return result;
}

/** Weekly offers from the chains' own sites. A failing site must not stop the feed import. */
async function collectOffers() {
  const terms = [...new Set(ingredients.flatMap(i => i.bgOffers?.include ?? []))];
  const sources = [
    ['kaufland_bg', 'offers', () => kauflandOffers()],
    ['lidl_bg', 'offers', () => lidlOffers(terms)],
    ...(!useGlovo ? [] : Object.keys(GLOVO_STORES).map(chainId => [chainId, 'glovo', () => glovoProducts(chainId, terms)])),
  ];
  const result = [];
  for (const [chainId, label, load] of sources) {
    try {
      result.push({ chainId, date: label, products: await load(), rules: 'bgOffers' });
    } catch (e) {
      console.warn(`! ${chainId} ${label}: ${e.message}`);
    }
  }
  return result;
}

/** The Dutch assortments, all from one file. A failed download must not stop the other countries. */
async function collectNetherlands() {
  let stores;
  try {
    stores = await downloadCheckjebon();
  } catch (e) {
    console.warn(`! checkjebon: ${e.message}`);
    return [];
  }
  const result = [];
  for (const [chainId, store] of Object.entries(NL_CHAINS)) {
    const entries = stores.find(s => s.n === store)?.d;
    if (!entries?.length) {
      console.warn(`! ${chainId}: not in the checkjebon file`);
      continue;
    }
    // `full`: the file lists the whole assortment, so a product missing from it is gone.
    result.push({ chainId, date: 'checkjebon', products: toNlProducts(store, entries), rules: 'nl', full: true });
  }
  return result;
}

function toRows({ chainId, products, rules = 'bg' }) {
  const rows = [];
  let noSize = 0;
  for (const p of products) {
    const ingredientKey = matchIngredient(p, ingredients, rules);
    if (!ingredientKey) continue;
    if (!p.packAmount) {
      noSize++;
      continue;
    }
    rows.push({
      chain_id: chainId,
      external_id: p.externalId,
      ingredient_key: ingredientKey,
      name: p.name,
      pack_amount: p.packAmount,
      pack_unit: p.packUnit,
      by_weight: p.byWeight,
      price_cents: p.priceCents,
      promo_price_cents: p.promoPriceCents,
      updated_at: new Date().toISOString(),
    });
  }
  return { rows, noSize };
}

function report(chainId, date, total, rows, noSize, rules = 'bg') {
  const counts = new Map();
  for (const r of rows) counts.set(r.ingredient_key, (counts.get(r.ingredient_key) ?? 0) + 1);
  const expected = rules === 'bg' || rules === 'nl' ? ingredients.filter(i => i[rules]).map(i => i.key) : [];
  const none = expected.filter(k => !counts.has(k));
  console.log(`\n${chainId} (${date}): ${total} products, ${rows.length} matched, ${noSize} matched but skipped (no pack size)`);
  console.log('  ' + [...counts].map(([k, n]) => `${k} ${n}`).join(', '));
  if (none.length) console.log(`  no product for: ${none.join(', ')}`);
}

const runStart = new Date().toISOString();
const all = [];
/** Chains read from a full listing this run: their rows that were not rewritten are stale. */
const fullChains = [];
const chains = [
  ...(runs('BG') ? [...(await collectBulgaria()), ...(await collectOffers())] : []),
  ...(runs('NL') ? await collectNetherlands() : []),
];
for (const chain of chains) {
  const { rows, noSize } = toRows(chain);
  report(chain.chainId, chain.date, chain.products.length, rows, noSize, chain.rules);
  all.push(...rows);
  // An empty result is more likely a broken source than an empty store: keep the old rows.
  if (chain.full && rows.length) fullChains.push(chain.chainId);
}

// The same article can come from two sources ("00101436", "offer:00101436",
// "glovo:00101436"). The shelf sources win over the delivery store.
const shelf = new Set(all.filter(r => !r.external_id.startsWith('glovo:')).map(r => `${r.chain_id}|${r.external_id.replace(/^offer:/, '')}`));
for (let i = all.length - 1; i >= 0; i--) {
  const r = all[i];
  if (r.external_id.startsWith('glovo:') && shelf.has(`${r.chain_id}|${r.external_id.slice(6)}`)) all.splice(i, 1);
}

const priced = new Set(all.map(r => r.ingredient_key));
const unpriced = ingredients.map(i => i.key).filter(k => !priced.has(k));
console.log(`\nIngredients with a price somewhere: ${priced.size} of ${ingredients.length}`);
if (unpriced.length) console.log(`Nowhere today: ${unpriced.join(', ')}`);

if (sqlFile) {
  writeFileSync(sqlFile, toSql(all));
  console.log(`\nWrote ${all.length} rows to ${sqlFile}. Paste it into the Supabase SQL Editor and run it.`);
} else if (dryRun) {
  if (args.includes('--verbose')) console.table(all.map(({ updated_at, ...r }) => r));
  console.log(`\nDry run: ${all.length} rows, nothing written.`);
} else {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or pass --dry-run.');
    process.exit(1);
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  for (let i = 0; i < all.length; i += 500) {
    const { error } = await supabase.from('products').upsert(all.slice(i, i + 500), { onConflict: 'chain_id,external_id' });
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
  // Offers and delivery listings that are no longer there have ended.
  if (runs('BG')) {
    const { error: delError } = await supabase.from('products').delete().or('external_id.like.offer:%,external_id.like.glovo:%').lt('updated_at', runStart);
    if (delError) console.warn(`! could not remove ended offers: ${delError.message}`);
  }
  if (fullChains.length) {
    const { error: staleError } = await supabase.from('products').delete().in('chain_id', fullChains).lt('updated_at', runStart);
    if (staleError) console.warn(`! could not remove delisted products: ${staleError.message}`);
  }
  console.log(`\nWrote ${all.length} rows.`);
}

/** The same upsert as a SQL script, for running by hand in the Supabase dashboard. */
function toSql(rows) {
  const q = v => (v == null ? 'null' : typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(v));
  const cols = ['chain_id', 'external_id', 'ingredient_key', 'name', 'pack_amount', 'pack_unit', 'by_weight', 'price_cents', 'promo_price_cents', 'updated_at'];
  const values = rows.map(r => `  (${cols.map(c => q(r[c])).join(', ')})`).join(',\n');
  const updates = cols.slice(2).map(c => `${c} = excluded.${c}`).join(', ');
  return [
    `-- Store prices, generated ${new Date().toISOString()} by scripts/ingest.`,
    '-- Paste into Supabase dashboard → SQL Editor and run. Safe to re-run.',
    `insert into public.products (${cols.join(', ')}) values`,
    values,
    `on conflict (chain_id, external_id) do update set ${updates};`,
    ...(!runs('BG') ? [] : [
      '-- Offers that are no longer listed have ended.',
      `delete from public.products where (external_id like 'offer:%' or external_id like 'glovo:%') and updated_at < '${runStart}';`,
    ]),
    ...(!fullChains.length ? [] : [
      '-- Products that left a fully listed assortment.',
      `delete from public.products where chain_id in (${fullChains.map(q).join(', ')}) and updated_at < '${runStart}';`,
    ]),
    '',
  ].join('\n');
}
