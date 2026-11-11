export type Country = 'NL' | 'BG';

export type Chain = { id: string; country: Country; name: string };

/** Chains with price data. Mirrors the `chains` table in supabase/prices.sql. */
export const CHAINS: Chain[] = [
  { id: 'kaufland_bg', country: 'BG', name: 'Kaufland' },
  { id: 'lidl_bg', country: 'BG', name: 'Lidl' },
  { id: 'billa_bg', country: 'BG', name: 'Billa' },
  { id: 'ah_nl', country: 'NL', name: 'Albert Heijn' },
  { id: 'jumbo_nl', country: 'NL', name: 'Jumbo' },
  { id: 'lidl_nl', country: 'NL', name: 'Lidl' },
];

/** Countries offered in the picker. */
export const COUNTRIES: { value: Country; label: string }[] = [
  { value: 'BG', label: 'Bulgaria' },
  { value: 'NL', label: 'Netherlands' },
];

export function chainsIn(country: Country): Chain[] {
  return CHAINS.filter(c => c.country === country);
}

export function chainName(id: string): string {
  return CHAINS.find(c => c.id === id)?.name ?? id;
}
