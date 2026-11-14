// How an amount of an ingredient is written.

/** "150g", "250ml", "2 tbsp". */
export function formatQuantity(amount: number, unit: string): string {
  const metric = unit === 'g' || unit === 'ml' || unit === 'kg' || unit === 'l';
  return metric ? `${amount}${unit}` : `${amount} ${unit}`;
}
