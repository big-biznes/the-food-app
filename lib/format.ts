import type { BaseUnit } from './pricing/types';

/** Euro cents → "€12.34". */
export function formatMoney(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

/** 1500 g → "1.5 kg", 250 ml → "250 ml", 2 pc → "2 pcs". */
export function formatAmount(amount: number, unit: BaseUnit): string {
  if (unit === 'pc') return `${amount} ${amount === 1 ? 'pc' : 'pcs'}`;
  if (amount >= 1000) return `${+(amount / 1000).toFixed(2)} ${unit === 'g' ? 'kg' : 'l'}`;
  return `${Math.round(amount)} ${unit}`;
}
