import type { BaseUnit, IngredientDef } from './pricing/types';

/** Recipe / list units → base unit and factor. */
const UNITS: Record<string, { base: BaseUnit; factor: number }> = {
  g: { base: 'g', factor: 1 },
  kg: { base: 'g', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  l: { base: 'ml', factor: 1000 },
  tbsp: { base: 'ml', factor: 15 },
  tsp: { base: 'ml', factor: 5 },
  '': { base: 'pc', factor: 1 },
  can: { base: 'pc', factor: 1 },
  clove: { base: 'pc', factor: 1 },
  slice: { base: 'pc', factor: 1 },
};

export function toBase(amount: number, unit: string): { amount: number; unit: BaseUnit } | null {
  const u = UNITS[unit.toLowerCase()];
  if (!u) return null;
  return { amount: amount * u.factor, unit: u.base };
}

/**
 * Express `amount` (in `from`) in the unit a product is sold in.
 * Returns null when the two cannot be compared for this ingredient.
 */
export function convert(
  amount: number,
  from: BaseUnit,
  to: BaseUnit,
  ing?: Pick<IngredientDef, 'densityGPerMl' | 'gramsPerPiece'>,
): number | null {
  if (from === to) return amount;
  const density = ing?.densityGPerMl;
  const perPiece = ing?.gramsPerPiece;
  if (from === 'g' && to === 'ml') return density ? amount / density : null;
  if (from === 'ml' && to === 'g') return density ? amount * density : null;
  if (from === 'pc' && to === 'g') return perPiece ? amount * perPiece : null;
  if (from === 'g' && to === 'pc') return perPiece ? amount / perPiece : null;
  if (from === 'pc' && to === 'ml') return perPiece && density ? (amount * perPiece) / density : null;
  if (from === 'ml' && to === 'pc') return perPiece && density ? (amount * density) / perPiece : null;
  return null;
}
