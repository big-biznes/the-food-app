// Bulgaria, third source: the chains' delivery stores on Glovo.
// Kaufland and Billa list their assortment there with prices, which fills
// what the government feed and the weekly offers leave out (sauces, tofu,
// most vegetables). Lidl is not on Glovo.
//
// The store page takes a ?search= term and renders the results into the page,
// so each ingredient term is one page load. Delivery prices can differ from
// the shelf price; see index.mjs for how the sources are ranked.

import { parsePackSize } from './packSize.mjs';

/** Our chain id → Glovo store slug (Sofia stores). */
export const GLOVO_STORES = {
  kaufland_bg: 'kaufland-sof',
  billa_bg: 'billa-sof1',
};

const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function glovoProducts(chainId, terms) {
  const byId = new Map();
  let failed = 0;
  for (const term of terms) {
    const url = `https://glovoapp.com/bg/bg/sofia/stores/${GLOVO_STORES[chainId]}?search=${encodeURIComponent(term)}`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        for (const p of parseGlovoPage(await res.text())) byId.set(p.externalId, p);
        break;
      } catch {
        if (attempt === 2) failed++;
        await sleep(2000);
      }
    }
    await sleep(700); // stay polite
  }
  if (failed === terms.length) throw new Error('glovo: every request failed');
  if (failed) console.warn(`! glovo ${chainId}: ${failed} of ${terms.length} requests failed`);
  return [...byId.values()];
}

/** Product rows out of a store page. The data sits in the page's streamed script chunks. */
export function parseGlovoPage(html) {
  // Each chunk is a JS string literal; decoding it gives plain JSON-ish text.
  let text = '';
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) {
    try {
      text += JSON.parse(m[1]);
    } catch {}
  }
  const out = [];
  const marker = '{"type":"PRODUCT_ROW","data":';
  for (let i = text.indexOf(marker); i !== -1; i = text.indexOf(marker, i + 1)) {
    const d = readJsonObject(text, i + marker.length);
    const price = d?.priceInfo?.amount ?? d?.price;
    if (!d?.name || typeof price !== 'number' || !(price > 0)) continue;
    // Names end with the store's article number: "K-Asia соев сос 250мл/ 20670636".
    const name = d.name.replace(/\s*[\\/]+\s*\d{5,}\s*$/, '').trim();
    // Loose produce is listed per kilogram: "Моркови кг", "Лук жълт на кг".
    const perKg = /(^|\s)(на\s+)?(кг|kg)\.?$/i.test(name) && !/\d\s*(кг|kg)\.?$/i.test(name);
    const size = perKg ? { amount: 1000, unit: 'g' } : parsePackSize(name);
    out.push({
      externalId: `glovo:${d.externalId || d.id}`,
      name,
      packAmount: size?.amount ?? null,
      packUnit: size?.unit ?? null,
      byWeight: perKg,
      priceCents: Math.round(price * 100),
      promoPriceCents: null,
    });
  }
  return out;
}

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
