// Bulgaria, second source: the chains' own weekly offer listings.
// The government feed (kolkostruva.mjs) only covers basket staples, so beef,
// fish, most vegetables and sauces are priced from here when they are on offer.
// These prices are valid for the offer period only; index.mjs removes them
// once they stop being listed.

import { parsePackSize } from './packSize.mjs';

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; price-ingest)' };
const clean = s => (s ?? '').replace(/\s+/g, ' ').trim();

/** "кг" / "за kg" means a price per kilogram; otherwise a pack size like "500 г". */
function sizeOf(unitText) {
  const u = clean(unitText).toLowerCase();
  if (!u) return null;
  if (/^(за\s+)?(кг|kg)\.?$/.test(u)) return { amount: 1000, unit: 'g', byWeight: true };
  const size = parsePackSize(u);
  return size ? { ...size, byWeight: false } : null;
}

function product(id, name, unitText, price) {
  const size = sizeOf(unitText);
  return {
    externalId: `offer:${id}`,
    name,
    packAmount: size?.amount ?? null,
    packUnit: size?.unit ?? null,
    byWeight: size?.byWeight ?? false,
    priceCents: Math.round(price * 100),
    promoPriceCents: null,
  };
}

/** Kaufland publishes all current offers as JSON embedded in one page. */
export async function kauflandOffers(today = new Date().toISOString().slice(0, 10)) {
  const res = await fetch('https://www.kaufland.bg/aktualni-predlozheniya/oferti.html', { headers: UA });
  if (!res.ok) throw new Error(`kaufland offers: HTTP ${res.status}`);
  return parseKauflandOffers(await res.text(), today);
}

export function parseKauflandOffers(html, today) {
  const byId = new Map();
  for (const m of html.matchAll(/\{"offerId"/g)) {
    const o = readJsonObject(html, m.index);
    // Card-only deals carry no price; skip them and anything outside its dates.
    if (!o || typeof o.price !== 'number' || !o.klNr) continue;
    if (o.dateFrom > today || o.dateTo < today) continue;
    byId.set(o.klNr, product(o.klNr, clean(`${o.title ?? ''} ${o.subtitle ?? ''}`), o.unit, o.price));
  }
  return [...byId.values()];
}

/** Parse the JSON object starting at `start` (string-aware brace matching). */
function readJsonObject(text, start) {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      try {
        return JSON.parse(text.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Lidl has no single listing, so its site search is asked once per ingredient term. */
export async function lidlOffers(terms) {
  const byId = new Map();
  let failed = 0;
  for (const term of terms) {
    const q = new URLSearchParams({ q: term, locale: 'bg_BG', assortment: 'BG', version: '2.1.0', fetchsize: '48' });
    // One slow or dropped request should not lose the whole chain: retry once, then move on.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`https://www.lidl.bg/q/api/search?${q}`, { headers: UA, signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        for (const p of parseLidlSearch(await res.json())) byId.set(p.externalId, p);
        break;
      } catch {
        if (attempt === 2) failed++;
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    await new Promise(r => setTimeout(r, 400)); // stay polite
  }
  if (failed === terms.length) throw new Error('lidl search: every request failed');
  if (failed) console.warn(`! lidl search: ${failed} of ${terms.length} requests failed`);
  return [...byId.values()];
}

export function parseLidlSearch(json) {
  const out = [];
  for (const item of json.items ?? []) {
    const d = item.gridbox?.data;
    const price = d?.price?.price;
    if (!d?.productId || typeof price !== 'number') continue;
    out.push(product(d.productId, clean(d.fullTitle), d.price.packaging?.text, price));
  }
  return out;
}
