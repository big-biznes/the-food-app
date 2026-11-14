import i18n from './i18n';
import { amountText } from './localize';
import type { BaseUnit } from './pricing/types';

/** Euro cents → "€12.34". */
export function formatMoney(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

/** 1500 g → "1.5 kg", 250 ml → "250 ml", 2 pc → "2 pcs". */
export function formatAmount(amount: number, unit: BaseUnit): string {
  if (unit === 'pc') return i18n.t('unitMore.pc', { count: amount });
  if (amount >= 1000) return amountText(+(amount / 1000).toFixed(2), unit === 'g' ? 'kg' : 'l');
  return amountText(Math.round(amount), unit);
}
