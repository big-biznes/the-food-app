import type { IngredientDef, Need } from './pricing/types';
import { toBase } from './units';

const NUM = '(\\d+(?:[.,]\\d+)?)';
const MULT = /^x(\d+)\s+/i;
const ATTACHED = new RegExp(`^${NUM}\\s?(kg|g|ml|l)\\s+`, 'i');
const SPACED = new RegExp(`^${NUM}\\s+(tbsp|tsp|clove|slice|can)s?\\s+`, 'i');
const BARE = new RegExp(`^${NUM}\\s+`);

const num = (s: string) => parseFloat(s.replace(',', '.'));

export type ParsedItem = { baseName: string; amount: number | null; unit: string };

/**
 * Split a shopping-list line into quantity and name. Handles every format the
 * plan generator writes ("x3 200g chicken", "600g rice", "x2 eggs", "2 tbsp oil")
 * and the same shapes typed by hand.
 */
export function parseItemText(text: string): ParsedItem {
  let s = text.trim();
  let mult = 1;
  let hadMult = false;
  const m = s.match(MULT);
  if (m) {
    mult = parseInt(m[1], 10);
    hadMult = true;
    s = s.slice(m[0].length);
  }

  let amount: number | null = null;
  let unit = '';
  let q = s.match(ATTACHED) ?? s.match(SPACED);
  if (q) {
    amount = num(q[1]) * mult;
    unit = q[2].toLowerCase();
    s = s.slice(q[0].length);
  } else if ((q = s.match(BARE))) {
    amount = num(q[1]) * mult;
    s = s.slice(q[0].length);
  } else if (hadMult) {
    amount = mult;
  }
  return { baseName: s.toLowerCase().trim(), amount, unit };
}

export function findIngredient(baseName: string, defs: IngredientDef[]): IngredientDef | null {
  const name = baseName.toLowerCase().trim();
  if (!name) return null;
  for (const d of defs) {
    if (d.key === name || d.aliases.includes(name)) return d;
  }
  return null;
}

/** Turn one shopping-list line into something the pricing code can work with. */
export function toNeed(itemId: string, text: string, defs: IngredientDef[]): Need {
  const parsed = parseItemText(text);
  const def = findIngredient(parsed.baseName, defs);
  const base = parsed.amount != null ? toBase(parsed.amount, parsed.unit) : null;
  return {
    itemId,
    label: text.trim(),
    ingredientKey: def?.key ?? null,
    amount: base?.amount ?? null,
    unit: base?.unit ?? 'pc',
  };
}
