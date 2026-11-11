// Pack size out of a product name: "Krina ориз 1 кг", "500ГР СПАГЕТИ", "8Х60Г", "1,5 l", "200 GRAM", "28 cl".

const UNIT = {
  кг: ['g', 1000], kg: ['g', 1000], kilo: ['g', 1000],
  гр: ['g', 1], г: ['g', 1], g: ['g', 1], gram: ['g', 1], grm: ['g', 1], gr: ['g', 1],
  мл: ['ml', 1], ml: ['ml', 1], milliliter: ['ml', 1],
  cl: ['ml', 10], dl: ['ml', 100],
  л: ['ml', 1000], l: ['ml', 1000], liter: ['ml', 1000],
};
const N = '(\\d+(?:[.,]\\d+)?)';
// Longer spellings first, so "gram" is not read as "g" followed by letters.
const U = '(кг|kg|kilo|гр|gram|grm|gr|мл|mill?iliters?|ml|cl|dl|liter|г|g|л|l)';
// A unit only counts when no letter follows it, so "500 грах" is not 500 g.
const END = '(?![a-zа-я])';
const MULTI = new RegExp(`(\\d+)\\s*[xх]\\s*${N}\\s*${U}\\.?${END}`, 'i');
const SINGLE = new RegExp(`${N}\\s*${U}\\.?${END}`, 'i');

const num = s => parseFloat(s.replace(',', '.'));

/** @returns {{ amount: number, unit: 'g' | 'ml' } | null} */
export function parsePackSize(name) {
  const s = name.toLowerCase();
  let count = 1;
  let m = s.match(MULTI);
  let value, unit;
  if (m) [, count, value, unit] = m;
  else if ((m = s.match(SINGLE))) [, value, unit] = m;
  else return null;
  const [base, factor] = UNIT[unit.startsWith('mil') ? 'milliliter' : unit];
  const amount = Number(count) * num(value) * factor;
  return amount > 0 ? { amount: Math.round(amount * 100) / 100, unit: base } : null;
}
