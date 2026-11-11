// Bulgaria: the Commission for Consumer Protection publishes every large
// retailer's daily shelf prices as open data at kolkostruva.bg.
// One ZIP per day, one CSV per retailer, one row per branch and product:
//   settlement, branch, product name, product code, category, price, promo price
// Prices are in EUR. The feed covers the consumer-basket categories only.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCsv } from './csv.mjs';
import { parsePackSize } from './packSize.mjs';

/** Our chain id → the retailer's company number, which ends its CSV file name. */
export const BG_CHAINS = {
  kaufland_bg: '131129282',
  lidl_bg: '131071587',
  billa_bg: '130007884',
};

// Fresh meat, fish and vegetables are priced per kilogram whatever the name says
// ("Пилешко филе около 2кг" is still a per-kg price).
const PER_KG = new Set(['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '30', '55', '56', '57', '58', '59', '60', '61']);

const url = date => `https://kolkostruva.bg/opendata_files/${date}.zip`;

/** Download and unpack one day. Returns the directory, or null if that day is not published. */
export async function downloadDay(date) {
  const res = await fetch(url(date));
  if (!res.ok) return null;
  const dir = mkdtempSync(join(tmpdir(), 'kolkostruva-'));
  const zip = join(dir, 'day.zip');
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  execFileSync('unzip', ['-o', '-q', zip, '-d', dir]);
  rmSync(zip);
  return dir;
}

/** Raw rows of one retailer from an unpacked day, or null if the retailer did not report. */
export function readChainRows(dir, chainId) {
  const file = readdirSync(dir).find(f => f.endsWith(`_${BG_CHAINS[chainId]}.csv`));
  if (!file) return null;
  const text = readFileSync(join(dir, file), 'utf8').replace(/^﻿/, '');
  return parseCsv(text).slice(1);
}

/**
 * Collapse branch rows into one product per code, using the price most
 * branches charge. A promo counts when at least half of the branches run it.
 */
export function toProducts(rows) {
  const byCode = new Map();
  for (const [, , name, code, category, price, promo] of rows) {
    const cents = Math.round(parseFloat(price) * 100);
    if (!code || !(cents > 0)) continue;
    let p = byCode.get(code);
    if (!p) byCode.set(code, (p = { name: name.trim(), category, prices: [], promos: [] }));
    p.prices.push(cents);
    const promoCents = Math.round(parseFloat(promo) * 100);
    if (promoCents > 0 && promoCents < cents) p.promos.push(promoCents);
  }

  const products = [];
  for (const [externalId, p] of byCode) {
    const size = PER_KG.has(p.category) ? { amount: 1000, unit: 'g' } : parsePackSize(p.name);
    products.push({
      externalId,
      name: p.name,
      category: p.category,
      packAmount: size?.amount ?? null,
      packUnit: size?.unit ?? null,
      byWeight: PER_KG.has(p.category),
      priceCents: mode(p.prices),
      promoPriceCents: p.promos.length * 2 >= p.prices.length ? mode(p.promos) : null,
    });
  }
  return products;
}

function mode(values) {
  const counts = new Map();
  let best = values[0];
  for (const v of values) {
    const n = (counts.get(v) ?? 0) + 1;
    counts.set(v, n);
    if (n > counts.get(best) || (n === counts.get(best) && v < best)) best = v;
  }
  return best;
}
