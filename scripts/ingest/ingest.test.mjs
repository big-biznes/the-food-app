import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseNlSize, toProducts as toNlProducts } from './checkjebon.mjs';
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

test('parsePackSize reads Dutch unit spellings', () => {
  assert.deepEqual(parsePackSize('200 GRAM'), { amount: 200, unit: 'g' });
  assert.deepEqual(parsePackSize('170 GRM'), { amount: 170, unit: 'g' });
  assert.deepEqual(parsePackSize('1 KILO'), { amount: 1000, unit: 'g' });
  assert.deepEqual(parsePackSize('28 cl'), { amount: 280, unit: 'ml' });
  assert.deepEqual(parsePackSize('500 Mililiters'), { amount: 500, unit: 'ml' });
  assert.deepEqual(parsePackSize('1.5 liter'), { amount: 1500, unit: 'ml' });
  assert.deepEqual(parsePackSize('Indomie Instant Noedels Kip 5x70g'), { amount: 350, unit: 'g' });
});

test('parseNlSize reads weights, loose goods and pieces', () => {
  assert.deepEqual(parseNlSize('ca. 500 g'), { amount: 500, unit: 'g', byWeight: false });
  assert.deepEqual(parseNlSize('2 x 90 g'), { amount: 180, unit: 'g', byWeight: false });
  assert.deepEqual(parseNlSize('0,75 l'), { amount: 750, unit: 'ml', byWeight: false });
  assert.deepEqual(parseNlSize('los per 500 g'), { amount: 500, unit: 'g', byWeight: true });
  assert.deepEqual(parseNlSize('los per kilo'), { amount: 1000, unit: 'g', byWeight: true });
  assert.deepEqual(parseNlSize('per stuk'), { amount: 1, unit: 'pc', byWeight: false });
  assert.deepEqual(parseNlSize('Jumbo Gele Uien Extra Groot 3 Stuks'), { amount: 3, unit: 'pc', byWeight: false });
  assert.equal(parseNlSize('4 pers | 20 min'), null);
  assert.equal(parseNlSize(''), null);
});

test('checkjebon toProducts takes the size from the size text, then the name', () => {
  const ah = toNlProducts('ah', [
    { n: 'AH Zonnebloemolie', l: 'wi1525/ah-zonnebloemolie', p: 1.79, s: '1 l' },
    { n: 'AH Courgette', l: 'wi4164/ah-courgette', p: 0.65, s: 'per stuk' },
    { n: 'AH Verspakket', l: 'wi9/ah-verspakket', p: 5.49, s: '4 pers | 25 min' },
  ]);
  assert.deepEqual(ah.map(p => [p.externalId, p.packAmount, p.packUnit, p.priceCents]), [['wi1525', 1000, 'ml', 179], ['wi4164', 1, 'pc', 65], ['wi9', null, null, 549]]);

  const jumbo = toNlProducts('jumbo', [
    { n: 'Jumbo Kipfilet ca. 600g', l: 'jumbo-kipfilet-ca-600g-123456DS', p: 7.53, s: '' },
    { n: 'Jumbo Varkenshaas Cul 2 Stuks ca. 650 g', l: 'jumbo-varkenshaas-9KG', p: 0.02, s: '' }, // placeholder price
    { n: 'Jumbo Kipfilet 800 g', l: 'jumbo-kipfilet-800-g-123456DS', p: 9.51, s: '800 g' }, // same article twice: the last wins
  ]);
  assert.deepEqual(jumbo.map(p => [p.externalId, p.packAmount, p.priceCents]), [['123456DS', 800, 951]]);
});

test('matchIngredient applies the Dutch never-list and minAmount', () => {
  const ingredients = [{ key: 'chicken', nl: { include: ['kipfilet'], minAmount: 250 } }, { key: 'noodles', nl: { include: ['mie nestjes'] } }];
  const m = (name, packAmount) => matchIngredient({ name, packAmount }, ingredients, 'nl');
  assert.equal(m('AH Scharrel kipfilet', 800), 'chicken');
  assert.equal(m('AH Kipfilet', 150), null); // sandwich slices
  assert.equal(m('AH Gerookte kipfilet', 300), null);
  assert.equal(m('Olvarit Kipfilet rijst 8m+', 300), null);
  assert.equal(m('Chaumes le crémier nestjes', 250), null); // "mie" inside "crémier"
  assert.equal(m('Пилешки чипс', 300), null);
});

test('data/ingredients.json keeps mince apart from whole meat', () => {
  const ingredients = JSON.parse(readFileSync(new URL('../../data/ingredients.json', import.meta.url), 'utf8'));
  const nl = (name, packAmount = 500) => matchIngredient({ name, packAmount }, ingredients, 'nl');
  assert.equal(nl('AH Rundergehakt'), 'beef mince');
  assert.equal(nl('AH Biefstuk 2 stuks'), 'beef');
  assert.equal(nl('Jumbo Rund Sukadelappen 3 Stuks ca. 525 g'), 'beef');
  assert.equal(nl('AH Scharrel kipgehakt'), 'chicken mince');
  assert.equal(nl('AH Scharrel kipfilet'), 'chicken');
  assert.equal(nl('Jumbo Half-om-Half Gehakt Varken-Rund 500 g'), 'mixed mince');
  assert.equal(nl('AH Rundergehaktbal'), null);

  const offer = name => matchIngredient({ name }, ingredients, 'bgOffers');
  assert.equal(offer('Шеф Месар Телешко мляно месо'), 'beef mince');
  assert.equal(offer('Говеждо месо от врат от свежата витрина'), 'beef');
  assert.equal(offer('Делиа Пуешко мляно месо от бут'), 'turkey mince');
  assert.equal(matchIngredient({ name: 'КАЙМА СМЕС 60/40', category: '25' }, ingredients, 'bg'), 'mixed mince');
});
