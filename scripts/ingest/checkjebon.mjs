// Netherlands: checkjebon.nl publishes the supermarkets' online assortments as
// one open JSON file (MIT), refreshed daily:
//   [{ n: 'ah', d: [{ n: name, l: link, p: price in EUR, s: size text }] }]
// The size text is often empty (always for some chains); the name then carries it.
// There is one price per product, so a promotion cannot be told from the shelf price.

import { parsePackSize } from './packSize.mjs';

const URL = 'https://raw.githubusercontent.com/supermarkt/checkjebon/main/data/supermarkets.json';

/** Our chain id → the store's name in the file. */
export const NL_CHAINS = {
  ah_nl: 'ah',
  jumbo_nl: 'jumbo',
  lidl_nl: 'lidl',
};

// The stable product number out of the link, so a renamed product keeps its row.
const EXTERNAL_ID = {
  ah: link => link.split('/')[0], // "wi415202/100-coconut-grove"
  jumbo: link => link.match(/-([0-9A-Z]+)$/)?.[1] ?? link, // "...-fijn-gesneden-450-g-270366ZK"
  lidl: link => link,
};

// Placeholder prices ("0.01", "0.02") are coupons and unpriced weight articles.
const MIN_CENTS = 10;

export async function downloadCheckjebon() {
  const res = await fetch(URL, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const stores = await res.json();
  if (!Array.isArray(stores)) throw new Error('unexpected file shape');
  return stores;
}

/**
 * Pack size out of a size text or a product name: "ca. 500 g", "2 x 90 g",
 * "0,75 l", "los per kilo", "per stuk", "3 Stuks".
 * @returns {{ amount: number, unit: 'g' | 'ml' | 'pc', byWeight: boolean } | null}
 */
export function parseNlSize(text) {
  const s = text.toLowerCase();
  const loose = /\blos\b/.test(s);
  const size = parsePackSize(s);
  if (size) return { ...size, byWeight: loose };
  if (/per (kilo|kg)\b/.test(s)) return { amount: 1000, unit: 'g', byWeight: loose };
  const pieces = s.match(/(\d+)\s*(?:stuks?|st)\b/);
  if (pieces) return Number(pieces[1]) > 0 ? { amount: Number(pieces[1]), unit: 'pc', byWeight: false } : null;
  if (/per stuk\b/.test(s)) return { amount: 1, unit: 'pc', byWeight: false };
  return null;
}

/** One store's entries from the file as products. `store` is the store's name in the file. */
export function toProducts(store, entries) {
  const externalId = EXTERNAL_ID[store];
  const byId = new Map();
  for (const e of entries) {
    const name = String(e.n ?? '').trim();
    const link = String(e.l ?? '');
    const priceCents = Math.round(Number(e.p) * 100);
    if (!name || !link || !(priceCents >= MIN_CENTS)) continue;
    const size = parseNlSize(String(e.s ?? '')) ?? parseNlSize(name);
    const id = externalId(link);
    byId.set(id, {
      externalId: id,
      name,
      packAmount: size?.amount ?? null,
      packUnit: size?.unit ?? null,
      byWeight: size?.byWeight ?? false,
      priceCents,
      promoPriceCents: null,
    });
  }
  return [...byId.values()];
}
