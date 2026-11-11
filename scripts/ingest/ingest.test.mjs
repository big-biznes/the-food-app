import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv } from './csv.mjs';
import { toProducts } from './kolkostruva.mjs';
import { matchIngredient } from './match.mjs';
import { parseKauflandOffers, parseLidlSearch } from './offers.mjs';
import { parsePackSize } from './packSize.mjs';

test('parsePackSize', () => {
  assert.deepEqual(parsePackSize('Krina ориз Перлен 1 кг'), { amount: 1000, unit: 'g' });
  assert.deepEqual(parsePackSize('500ГР СПАГЕТИ CLEVER'), { amount: 500, unit: 'g' });
  assert.deepEqual(parsePackSize('Helios спагети №10 500г'), { amount: 500, unit: 'g' });
  assert.deepEqual(parsePackSize('1Л ОЛИО БИСЕР'), { amount: 1000, unit: 'ml' });
  assert.deepEqual(parsePackSize('500МЛ ДОМАТЕНО ПЮРЕ 7% PHILICON'), { amount: 500, unit: 'ml' });
  assert.deepEqual(parsePackSize('БАНИЧКИ BELLA 8Х60Г'), { amount: 480, unit: 'g' });
  assert.deepEqual(parsePackSize('МОРТАДЕЛА БРАВО 2,2КГ'), { amount: 2200, unit: 'g' });
  assert.deepEqual(parsePackSize('Зелен фасул OHT 350g'), { amount: 350, unit: 'g' });
  assert.equal(parsePackSize('Макарони от твърда пшеница'), null);
  assert.equal(parsePackSize('500 грах'), null);
});

test('parseCsv handles quotes and commas', () => {
  assert.deepEqual(parseCsv('a,"b,c","d ""e"""\r\n1,2,3\n'), [['a', 'b,c', 'd "e"'], ['1', '2', '3']]);
});

test('toProducts uses the most common branch price and majority promos', () => {
  const rows = [
    ['1', 'A', 'Ориз 1 кг', 'r1', '35', '2.55', ''],
    ['1', 'B', 'Ориз 1 кг', 'r1', '35', '2.55', '1.99'],
    ['1', 'C', 'Ориз 1 кг', 'r1', '35', '2.65', '1.99'],
    ['1', 'A', 'Пилешко филе около 2кг', 'c1', '16', '6.64', '0'],
  ];
  const [rice, chicken] = toProducts(rows);
  assert.deepEqual(
    { ...rice, name: undefined, category: undefined },
    { externalId: 'r1', name: undefined, category: undefined, packAmount: 1000, packUnit: 'g', byWeight: false, priceCents: 255, promoPriceCents: 199 },
  );
  assert.equal(chicken.byWeight, true);
  assert.equal(chicken.packAmount, 1000);
  assert.equal(chicken.promoPriceCents, null);
});

test('matchIngredient respects category, include and exclude', () => {
  const ingredients = [
    { key: 'chicken', bg: { categories: ['16'], exclude: ['пуешк'] } },
    { key: 'turkey', bg: { categories: ['16'], include: ['пуешк'] } },
    { key: 'tofu', nl: { include: ['tofu'] } },
  ];
  const m = (name, category) => matchIngredient({ name, category }, ingredients, 'bg');
  assert.equal(m('Прясно пилешко филе XXL', '16'), 'chicken');
  assert.equal(m('Прясно пуешко филе', '16'), 'turkey');
  assert.equal(m('Пилешко филе слайс 120г', '27'), null);

  const byName = [{ key: 'oil', bgOffers: { include: ['олио'], exclude: ['маслиново'] } }];
  const n = name => matchIngredient({ name }, byName, 'bgOffers');
  assert.equal(n('Слънчогледово олио 1 л'), 'oil');
  assert.equal(n('Фъстък печен безцветно фолио 200г'), null); // "олио" inside "фолио"
  assert.equal(n('Babywell Бебешко олио 250 МЛ'), null); // never an ingredient
});

test('parseKauflandOffers keeps priced, current offers', () => {
  const offer = o => JSON.stringify({ offerId: 'x', dateFrom: '2026-11-09', dateTo: '2026-11-15', ...o });
  const html = `<script>window.SSR = {"offers":[${[
    offer({ klNr: '1', title: 'Шеф Месар', subtitle: 'Телешко\nмляно месо', unit: '1 кг', price: 9.2 }),
    offer({ klNr: '2', title: 'Броколи', subtitle: '', unit: 'кг', price: 1.99 }),
    offer({ klNr: '3', title: 'Krina', subtitle: 'Ориз {с карта}', unit: '1 кг' }),
    offer({ klNr: '4', title: 'Стара', subtitle: 'оферта', unit: '1 кг', price: 1, dateTo: '2026-11-10' }),
  ].join(',')}]}</script>`;
  assert.deepEqual(parseKauflandOffers(html, '2026-11-11'), [
    { externalId: 'offer:1', name: 'Шеф Месар Телешко мляно месо', packAmount: 1000, packUnit: 'g', byWeight: false, priceCents: 920, promoPriceCents: null },
    { externalId: 'offer:2', name: 'Броколи', packAmount: 1000, packUnit: 'g', byWeight: true, priceCents: 199, promoPriceCents: null },
  ]);
});

test('parseLidlSearch reads price and packaging', () => {
  const item = (productId, fullTitle, price, text) => ({ gridbox: { data: { productId, fullTitle, price: { price, packaging: text ? { text } : null } } } });
  const out = parseLidlSearch({ items: [item(1, 'Песто', 1.42, '190 g/опаковка'), item(2, 'Прясно пилешко филе', 6.69, 'за kg'), item(3, 'Броколи', null)] });
  assert.deepEqual(out.map(p => [p.externalId, p.packAmount, p.byWeight, p.priceCents]), [['offer:1', 190, false, 142], ['offer:2', 1000, true, 669]]);
});
