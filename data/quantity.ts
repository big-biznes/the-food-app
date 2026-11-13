// How an amount of an ingredient is written, in metric or imperial units, and
// the body measurements of the profile in both.

const G_PER_OZ = 28.3495;
const ML_PER_FL_OZ = 29.5735;
const OZ_PER_LB = 16;
export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

/** One decimal for small amounts, halves from 2 up: "0.4 oz", "5.5 oz". */
function roundImperial(n: number): number {
  return n >= 2 ? Math.round(n * 2) / 2 : Math.max(0.1, Math.round(n * 10) / 10);
}

/** "150g", "250ml", "2 tbsp"; in imperial "5.5 oz", "8.5 fl oz", "1.1 lb". Spoons and counts stay as they are. */
export function formatQuantity(amount: number, unit: string, imperial = false): string {
  const metric = unit === 'g' || unit === 'ml' || unit === 'kg' || unit === 'l';
  if (!metric) return `${amount} ${unit}`;
  if (!imperial) return `${amount}${unit}`;
  if (unit === 'g' || unit === 'kg') {
    const oz = (unit === 'kg' ? amount * 1000 : amount) / G_PER_OZ;
    return oz >= OZ_PER_LB ? `${Math.round((oz / OZ_PER_LB) * 10) / 10} lb` : `${roundImperial(oz)} oz`;
  }
  return `${roundImperial((unit === 'l' ? amount * 1000 : amount) / ML_PER_FL_OZ)} fl oz`;
}

export const kgToLb = (kg: number) => Math.round(kg / KG_PER_LB);
export const lbToKg = (lb: number) => Math.round(lb * KG_PER_LB);
/** Height in feet and inches: 180 cm is 5 ft 11 in. */
export function cmToFeet(cm: number): { ft: number; inch: number } {
  const total = Math.round(cm / CM_PER_IN);
  return { ft: Math.floor(total / 12), inch: total % 12 };
}
export const feetToCm = (ft: number, inch: number) => Math.round((ft * 12 + inch) * CM_PER_IN);
