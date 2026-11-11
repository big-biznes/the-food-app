import { compare } from '../pricing/compare';
import { bestChoice } from '../pricing/packs';
import type { IngredientDef, Need, Offer } from '../pricing/types';
import { parseItemText, toNeed } from '../parseItem';
import { convert, toBase } from '../units';

const defs: IngredientDef[] = [
  { key: 'chicken', aliases: ['chicken', 'chicken breast'] },
  { key: 'rice', aliases: ['rice'] },
  { key: 'oil', aliases: ['oil'], densityGPerMl: 0.92 },
  { key: 'pesto', aliases: ['pesto'] },
];

let seq = 0;
function offer(chainId: string, ingredientKey: string, packAmount: number, priceCents: number, extra: Partial<Offer> = {}): Offer {
  return { chainId, ingredientKey, productId: `p${++seq}`, name: `${ingredientKey} ${packAmount}`, packAmount, packUnit: 'g', byWeight: false, priceCents, ...extra };
}
const need = (itemId: string, ingredientKey: string | null, amount: number | null): Need => ({ itemId, label: itemId, ingredientKey, amount, unit: 'g' });

describe('parseItemText', () => {
  it.each([
    ['x3 200g chicken', 'chicken', 600, 'g'],
    ['600g rice', 'rice', 600, 'g'],
    ['1.5kg potatoes', 'potatoes', 1.5, 'kg'],
    ['x2 eggs', 'eggs', 2, ''],
    ['2 tbsp olive oil', 'olive oil', 2, 'tbsp'],
    ['3 onions', 'onions', 3, ''],
    ['Chicken breast', 'chicken breast', null, ''],
  ])('%s', (text, baseName, amount, unit) => {
    expect(parseItemText(text)).toEqual({ baseName, amount, unit });
  });

  it('builds a need in base units and resolves aliases', () => {
    expect(toNeed('1', '1.5kg Chicken breast', defs)).toMatchObject({ ingredientKey: 'chicken', amount: 1500, unit: 'g' });
    expect(toNeed('2', 'washing powder', defs)).toMatchObject({ ingredientKey: null, amount: null });
  });
});

describe('units', () => {
  it('converts to base units', () => {
    expect(toBase(2, 'kg')).toEqual({ amount: 2000, unit: 'g' });
    expect(toBase(2, 'tbsp')).toEqual({ amount: 30, unit: 'ml' });
    expect(toBase(1, 'furlong')).toBeNull();
  });
  it('needs a density to cross mass and volume', () => {
    expect(convert(1000, 'ml', 'g', defs[2])).toBeCloseTo(920);
    expect(convert(1000, 'ml', 'g', defs[0])).toBeNull();
  });
});

describe('bestChoice', () => {
  it('charges for whole packs and reports the leftover', () => {
    const c = bestChoice(need('a', 'chicken', 200), [offer('s', 'chicken', 500, 450)])!;
    expect(c.costCents).toBe(450);
    expect(c.lines[0].packs).toBe(1);
    expect(c.leftover).toBe(300);
  });

  it('buys several packs when one is not enough', () => {
    const c = bestChoice(need('a', 'chicken', 1200), [offer('s', 'chicken', 500, 450)])!;
    expect(c.lines[0].packs).toBe(3);
    expect(c.costCents).toBe(1350);
  });

  it('picks the cheaper total, not the cheaper price per kilo', () => {
    // 1 kg is cheaper per kilo, but 200 g only needs the small pack.
    const c = bestChoice(need('a', 'rice', 200), [offer('s', 'rice', 1000, 250), offer('s', 'rice', 250, 110)])!;
    expect(c.costCents).toBe(110);
  });

  it('mixes pack sizes when that is cheapest', () => {
    const c = bestChoice(need('a', 'rice', 1200), [offer('s', 'rice', 1000, 250), offer('s', 'rice', 250, 110)])!;
    expect(c.costCents).toBe(360);
    expect(c.lines.map(l => l.packs).sort()).toEqual([1, 1]);
  });

  it('charges loose by-weight products for the exact amount', () => {
    const c = bestChoice(need('a', 'chicken', 600), [offer('s', 'chicken', 1000, 664, { byWeight: true })])!;
    expect(c.costCents).toBe(398);
    expect(c.leftover).toBe(0);
  });

  it('covers a need in grams with a product sold in millilitres', () => {
    const o = offer('s', 'oil', 1000, 180, { packUnit: 'ml' });
    expect(bestChoice(need('a', 'oil', 900), [o], defs[2])!.lines[0].packs).toBe(1);
    expect(bestChoice(need('a', 'oil', 950), [o], defs[2])!.lines[0].packs).toBe(2);
    // No density known: cannot be compared, so not priced.
    expect(bestChoice(need('a', 'pesto', 100), [offer('s', 'pesto', 190, 200, { packUnit: 'ml' })], defs[3])).toBeNull();
  });

  it('buys one cheapest pack when the list has no quantity', () => {
    const c = bestChoice(need('a', 'rice', null), [offer('s', 'rice', 1000, 250), offer('s', 'rice', 500, 140)])!;
    expect(c.costCents).toBe(140);
  });
});

describe('compare', () => {
  const needs = [need('chicken', 'chicken', 600), need('rice', 'rice', 500), need('soap', null, null)];

  it('recommends the cheapest store that has the items', () => {
    const offers = [
      offer('a', 'chicken', 500, 500), offer('a', 'rice', 1000, 200),
      offer('b', 'chicken', 500, 400), offer('b', 'rice', 1000, 260),
    ];
    const r = compare(needs, offers, ['a', 'b'], defs);
    expect(r.single.map(s => [s.chainId, s.totalCents])).toEqual([['b', 1060], ['a', 1200]]);
    expect(r.unpriced).toEqual(['soap']);
    expect(r.pricedCount).toBe(2);
  });

  it('does not let a store win by missing items', () => {
    const offers = [offer('a', 'chicken', 500, 500), offer('a', 'rice', 1000, 200), offer('b', 'rice', 1000, 100)];
    const r = compare(needs, offers, ['a', 'b'], defs);
    expect(r.single[0].chainId).toBe('a');
    expect(r.single[1].missing).toContain('chicken');
  });

  it('splits across stores when it saves enough', () => {
    const offers = [
      offer('a', 'chicken', 500, 500), offer('a', 'rice', 1000, 200),
      offer('b', 'chicken', 500, 300), offer('b', 'rice', 1000, 400),
    ];
    const r = compare(needs, offers, ['a', 'b'], defs);
    expect(r.single[0]).toMatchObject({ chainId: 'b', totalCents: 1000 });
    expect(r.split).toMatchObject({ totalCents: 800, savingCents: 200 });
    expect(r.split!.chainIds.sort()).toEqual(['a', 'b']);
    expect(r.split!.totalCents).toBeLessThanOrEqual(r.single[0].totalCents);
  });

  it('does not suggest a second store for small change', () => {
    const offers = [
      offer('a', 'chicken', 500, 500), offer('a', 'rice', 1000, 200),
      offer('b', 'chicken', 500, 480), offer('b', 'rice', 1000, 230),
    ];
    expect(compare(needs, offers, ['a', 'b'], defs).split).toBeNull();
  });

  it('adds a third store only when it is worth it', () => {
    const offers = [
      offer('a', 'chicken', 500, 300), offer('a', 'rice', 1000, 400), offer('a', 'oil', 1000, 400),
      offer('b', 'chicken', 500, 500), offer('b', 'rice', 1000, 200), offer('b', 'oil', 1000, 400),
      offer('c', 'chicken', 500, 500), offer('c', 'rice', 1000, 400), offer('c', 'oil', 1000, 390),
    ];
    const r = compare([...needs, need('oil', 'oil', 100)], offers, ['a', 'b', 'c'], defs);
    expect(r.split!.chainIds.sort()).toEqual(['a', 'b']);
  });

  it('uses a second store to cover items the best store lacks', () => {
    const offers = [offer('a', 'chicken', 500, 500), offer('b', 'rice', 1000, 200)];
    const r = compare(needs, offers, ['a', 'b'], defs);
    expect(r.split!.stores).toHaveLength(2);
    expect(r.split!.missing).toEqual(['soap']);
  });
});
