import { convert } from '../units';
import type { ChoiceLine, IngredientDef, ItemChoice, Need, Offer } from './types';

/** Upper bound on the table size of the pack search; larger needs are scaled down. */
const MAX_STEPS = 20000;

type Sized = { offer: Offer; size: number };

/**
 * Cheapest way to buy what `need` asks for from one chain's `offers`
 * (all for the same ingredient). Whole packs are counted, so the cost is what
 * the till will charge; loose by-weight products are charged for the exact amount.
 */
export function bestChoice(need: Need, offers: Offer[], ing?: IngredientDef): ItemChoice | null {
  if (offers.length === 0) return null;
  const chainId = offers[0].chainId;
  const base = { itemId: need.itemId, label: need.label, chainId };

  // No quantity on the list: one of the cheapest pack.
  if (need.amount == null || need.amount <= 0) {
    const o = offers.reduce((a, b) => (b.priceCents < a.priceCents ? b : a));
    return { ...base, lines: [line(o, 1)], byWeight: o.byWeight, costCents: o.priceCents, leftover: 0, leftoverUnit: o.packUnit };
  }

  // Pack sizes expressed in the unit the list uses, so different products compare.
  const sized: Sized[] = [];
  for (const offer of offers) {
    const size = convert(offer.packAmount, offer.packUnit, need.unit, ing);
    if (size != null && size > 0) sized.push({ offer, size });
  }
  if (sized.length === 0) return null;

  let best: ItemChoice | null = null;
  const consider = (c: ItemChoice | null) => {
    if (c && (!best || c.costCents < best.costCents || (c.costCents === best.costCents && c.leftover < best.leftover))) best = c;
  };

  for (const { offer, size } of sized) {
    if (!offer.byWeight) continue;
    consider({
      ...base,
      lines: [line(offer, 1)],
      byWeight: true,
      costCents: Math.max(1, Math.round((offer.priceCents * need.amount) / size)),
      leftover: 0,
      leftoverUnit: need.unit,
    });
  }
  consider(cheapestCover(need, sized.filter(s => !s.offer.byWeight), base));
  return best;
}

/** Minimum-cost combination of whole packs covering at least the needed amount. */
function cheapestCover(
  need: Need,
  packs: Sized[],
  base: Pick<ItemChoice, 'itemId' | 'label' | 'chainId'>,
): ItemChoice | null {
  if (packs.length === 0) return null;
  const amount = need.amount as number;
  const scale = Math.max(1, amount / MAX_STEPS);
  const target = Math.ceil(amount / scale);
  // Rounding pack sizes down can only overbuy, never leave the list short.
  const sizes = packs.map(p => Math.max(1, Math.floor(p.size / scale)));

  const cost = new Float64Array(target + 1).fill(Infinity);
  const pick = new Int32Array(target + 1).fill(-1);
  cost[0] = 0;
  for (let a = 1; a <= target; a++) {
    for (let i = 0; i < packs.length; i++) {
      const c = cost[Math.max(0, a - sizes[i])] + packs[i].offer.priceCents;
      if (c < cost[a]) {
        cost[a] = c;
        pick[a] = i;
      }
    }
  }

  const counts = new Map<number, number>();
  for (let a = target; a > 0; a = Math.max(0, a - sizes[pick[a]])) {
    counts.set(pick[a], (counts.get(pick[a]) ?? 0) + 1);
  }
  let bought = 0;
  const lines: ChoiceLine[] = [];
  for (const [i, n] of counts) {
    bought += packs[i].size * n;
    lines.push(line(packs[i].offer, n));
  }
  return {
    ...base,
    lines,
    byWeight: false,
    costCents: cost[target],
    leftover: Math.max(0, Math.round(bought - amount)),
    leftoverUnit: need.unit,
  };
}

function line(o: Offer, packs: number): ChoiceLine {
  return {
    productId: o.productId,
    productName: o.name,
    packs,
    packAmount: o.packAmount,
    packUnit: o.packUnit,
    priceCents: o.priceCents,
  };
}
