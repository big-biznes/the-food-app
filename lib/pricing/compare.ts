import { bestChoice } from './packs';
import type { Comparison, IngredientDef, ItemChoice, Need, Offer, SplitPlan, StoreTotal } from './types';

export type CompareOptions = {
  /** A split, or one more store in it, must save at least this much to be suggested. */
  minSavingCents?: number;
  /** Most stores a split may send the shopper to. */
  maxStores?: number;
};

/**
 * Price the list at every chain, rank the chains for a one-store trip, and
 * find the best split across several stores.
 */
export function compare(
  needs: Need[],
  offers: Offer[],
  chainIds: string[],
  defs: IngredientDef[],
  { minSavingCents = 100, maxStores = 3 }: CompareOptions = {},
): Comparison {
  const defByKey = new Map(defs.map(d => [d.key, d]));
  const byChainIng = new Map<string, Offer[]>();
  for (const o of offers) {
    const k = `${o.chainId}|${o.ingredientKey}`;
    let list = byChainIng.get(k);
    if (!list) byChainIng.set(k, (list = []));
    list.push(o);
  }

  // choice[chain][item]: the cheapest way to buy that item at that chain.
  const choice = new Map<string, Map<string, ItemChoice>>();
  for (const chainId of chainIds) {
    const perItem = new Map<string, ItemChoice>();
    for (const need of needs) {
      if (!need.ingredientKey) continue;
      const c = bestChoice(need, byChainIng.get(`${chainId}|${need.ingredientKey}`) ?? [], defByKey.get(need.ingredientKey));
      if (c) perItem.set(need.itemId, c);
    }
    choice.set(chainId, perItem);
  }

  const single = chainIds
    .map(chainId => storeTotal(chainId, needs, id => choice.get(chainId)!.get(id)))
    .sort(better);

  const unpriced = needs
    .filter(n => !chainIds.some(c => choice.get(c)!.has(n.itemId)))
    .map(n => n.itemId);

  return {
    single,
    split: bestSplit(needs, chainIds, choice, single[0], minSavingCents, maxStores),
    unpriced,
    pricedCount: needs.length - unpriced.length,
    itemCount: needs.length,
  };
}

function storeTotal(chainId: string, needs: Need[], get: (itemId: string) => ItemChoice | undefined): StoreTotal {
  const found: ItemChoice[] = [];
  const missing: string[] = [];
  for (const n of needs) {
    const c = get(n.itemId);
    if (c) found.push(c);
    else missing.push(n.itemId);
  }
  return { chainId, found, missing, totalCents: found.reduce((s, c) => s + c.costCents, 0) };
}

/** More items found wins; then the lower total. A half-empty basket is not "cheap". */
function better(a: { found: unknown[]; totalCents: number }, b: { found: unknown[]; totalCents: number }) {
  return b.found.length - a.found.length || a.totalCents - b.totalCents;
}

type Candidate = { chainIds: string[]; picks: ItemChoice[]; totalCents: number; found: ItemChoice[] };

function bestSplit(
  needs: Need[],
  chainIds: string[],
  choice: Map<string, Map<string, ItemChoice>>,
  baseline: StoreTotal | undefined,
  minSavingCents: number,
  maxStores: number,
): SplitPlan | null {
  if (!baseline || chainIds.length < 2) return null;

  // With a handful of chains every combination can be tried, so the result is exact.
  let current: Candidate = { chainIds: [baseline.chainId], picks: baseline.found, found: baseline.found, totalCents: baseline.totalCents };
  for (let size = 2; size <= Math.min(maxStores, chainIds.length); size++) {
    let bestOfSize: Candidate | null = null;
    for (const subset of subsets(chainIds, size)) {
      const picks: ItemChoice[] = [];
      for (const n of needs) {
        let pick: ItemChoice | undefined;
        for (const c of subset) {
          const o = choice.get(c)!.get(n.itemId);
          if (o && (!pick || o.costCents < pick.costCents)) pick = o;
        }
        if (pick) picks.push(pick);
      }
      const used = subset.filter(c => picks.some(p => p.chainId === c));
      if (used.length < size) continue; // same as a smaller combination
      const cand = { chainIds: used, picks, found: picks, totalCents: picks.reduce((s, p) => s + p.costCents, 0) };
      if (!bestOfSize || better(cand, bestOfSize) < 0) bestOfSize = cand;
    }
    if (!bestOfSize) continue;
    const coversMore = bestOfSize.picks.length > current.picks.length;
    const savesEnough =
      bestOfSize.picks.length === current.picks.length && current.totalCents - bestOfSize.totalCents >= minSavingCents;
    if (coversMore || savesEnough) current = bestOfSize;
  }
  if (current.chainIds.length < 2) return null;

  // Saving is measured on the items the best single store also sells.
  const splitCost = new Map(current.picks.map(p => [p.itemId, p.costCents]));
  const savingCents = baseline.found.reduce((s, c) => s + c.costCents - (splitCost.get(c.itemId) ?? c.costCents), 0);

  const stores = current.chainIds
    .map(chainId => {
      const found = current.picks.filter(p => p.chainId === chainId);
      return { chainId, found, missing: [], totalCents: found.reduce((s, c) => s + c.costCents, 0) };
    })
    .sort((a, b) => b.found.length - a.found.length);
  const picked = new Set(current.picks.map(p => p.itemId));
  return {
    chainIds: stores.map(s => s.chainId),
    totalCents: current.totalCents,
    savingCents,
    stores,
    missing: needs.filter(n => !picked.has(n.itemId)).map(n => n.itemId),
  };
}

function* subsets<T>(items: T[], size: number, start = 0, acc: T[] = []): Generator<T[]> {
  if (acc.length === size) {
    yield acc;
    return;
  }
  for (let i = start; i <= items.length - (size - acc.length); i++) {
    yield* subsets(items, size, i + 1, [...acc, items[i]]);
  }
}
