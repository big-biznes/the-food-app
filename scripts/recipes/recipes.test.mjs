import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildAll, buildRecipe, indexIngredients, toSql } from './lib.mjs';

const defs = indexIngredients([
  { key: 'eggs', per100g: { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0, sugar: 0.4, sodiumMg: 142 }, contains: ['egg'], piece: { g: 55, one: 'egg', many: 'eggs', shop: true } },
  { key: 'bread', per100g: { kcal: 252, protein: 12.4, carbs: 42.7, fat: 3.5, fiber: 6, sugar: 4.3, sodiumMg: 455 }, contains: ['gluten'], piece: { g: 35, one: 'slice', many: 'slices' } },
  { key: 'milk', per100g: { kcal: 50, protein: 3.3, carbs: 4.8, fat: 2, fiber: 0, sugar: 5.1, sodiumMg: 47 }, contains: ['dairy'], densityGPerMl: 1.03 },
  { key: 'bacon', per100g: { kcal: 393, protein: 13.7, carbs: 0, fat: 37.1, fiber: 0, sugar: 0.3, sodiumMg: 751 }, contains: ['meat', 'pork'] },
  { key: 'oats', per100g: { kcal: 379, protein: 13.2, carbs: 67.7, fat: 6.5, fiber: 10.1, sugar: 1, sodiumMg: 6 }, contains: ['gluten'] },
  { key: 'mystery', contains: [] },
]);

const recipe = (over = {}) => ({
  id: 'b-eggs-on-toast',
  name: 'Eggs on Toast',
  description: 'Two fried eggs on toast',
  mealType: 'breakfast',
  prepTime: 8,
  difficulty: 'quick',
  appliances: ['stovetop'],
  emoji: '🍳',
  main: 'eggs',
  tags: ['quick'],
  ingredients: [{ item: 'eggs', pieces: 2 }, { item: 'bread', pieces: 2 }],
  seasonings: ['salt'],
  instructions: ['Toast the bread', 'Fry the eggs and put them on the toast'],
  ...over,
});

test('nutrition is the sum of the ingredients', () => {
  const { row, errors } = buildRecipe(recipe(), defs);
  assert.deepEqual(errors, []);
  // 110 g egg + 70 g bread
  assert.equal(row.calories, Math.round(1.1 * 143 + 0.7 * 252));
  assert.equal(row.protein_g, Math.round(1.1 * 12.6 + 0.7 * 12.4));
  assert.equal(row.sodium_mg, Math.round(1.1 * 142 + 0.7 * 455));
});

test('millilitres are weighed with the density', () => {
  const { row } = buildRecipe(recipe({ ingredients: [{ item: 'oats', g: 60 }, { item: 'milk', ml: 200 }], main: 'oats' }), defs);
  assert.equal(row.calories, Math.round(0.6 * 379 + 2.06 * 50));
  assert.deepEqual(row.ingredients[1], { name: 'milk', amount: 200, unit: 'ml' });
});

test('pieces go on the shopping list as pieces only when bought that way', () => {
  const { row } = buildRecipe(recipe(), defs);
  assert.deepEqual(row.ingredients, [
    { name: 'eggs', amount: 2, unit: '', label: '2 eggs' },
    { name: 'bread', amount: 70, unit: 'g', label: '2 slices' },
  ]);
});

test('dietary tags follow from what the ingredients contain', () => {
  const tags = r => buildRecipe(r, defs).row.dietary_tags;
  assert.deepEqual(tags(recipe()), ['vegetarian', 'dairy-free', 'nut-allergy', 'halal', 'kosher']);
  assert.deepEqual(tags(recipe({ ingredients: [{ item: 'eggs', pieces: 2 }, { item: 'bacon', g: 50 }] })), ['gluten-free', 'dairy-free', 'nut-allergy']);
});

test('a recipe cannot bring its own numbers or unknown ingredients', () => {
  const errors = r => buildRecipe(r, defs).errors.join('; ');
  assert.match(errors(recipe({ ingredients: [{ item: 'eggs', pieces: 2 }, { item: 'unicorn', g: 50 }] })), /unknown ingredient "unicorn"/);
  assert.match(errors(recipe({ ingredients: [{ item: 'eggs', pieces: 2 }, { item: 'mystery', g: 50 }] })), /no nutrition data/);
  assert.match(errors(recipe({ ingredients: [{ item: 'eggs', pieces: 2 }, { item: 'oats', ml: 50 }] })), /cannot be given in ml/);
  assert.match(errors(recipe({ ingredients: [{ item: 'eggs', pieces: 2 }, { item: 'bacon', pieces: 2 }] })), /cannot be given in pieces/);
  assert.match(errors(recipe({ ingredients: [{ item: 'eggs', g: 100, pieces: 2 }, { item: 'bread', g: 70 }] })), /exactly one of/);
  assert.match(errors(recipe({ main: 'bacon' })), /main must be/);
  assert.match(errors(recipe({ mealType: 'brunch' })), /mealType/);
  assert.match(errors(recipe({ tags: ['yummy'] })), /unknown tag/);
  assert.match(errors(recipe({ instructions: ['Cook it'] })), /at least 2 steps/);
  assert.equal(buildRecipe(recipe({ calories: 1 }), defs).row.calories, Math.round(1.1 * 143 + 0.7 * 252));
});

test('duplicate ids are reported and SQL is escaped', () => {
  const { rows, problems } = buildAll([{ name: 'a.json', recipes: [recipe(), recipe({ name: "Tom's Eggs" })] }], defs);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /already used/);
  assert.match(toSql(rows), /'Tom''s Eggs'/);
});

test('the recipes in data/recipes build, and cover every meal type and diet', () => {
  const root = new URL('../../data/', import.meta.url);
  const real = indexIngredients(JSON.parse(readFileSync(new URL('ingredients.json', root), 'utf8')));
  const files = readdirSync(new URL('recipes/', root))
    .filter(f => f.endsWith('.json'))
    .map(name => ({ name, recipes: JSON.parse(readFileSync(new URL(`recipes/${name}`, root), 'utf8')) }));
  const { rows, problems } = buildAll(files, real);
  assert.deepEqual(problems, []);
  for (const type of ['breakfast', 'lunch', 'dinner']) {
    // A week needs six different ones.
    assert.ok(rows.filter(r => r.meal_type === type).length >= 6, `too few ${type} recipes`);
    for (const diet of ['vegetarian', 'vegan', 'gluten-free', 'dairy-free']) {
      assert.ok(rows.some(r => r.meal_type === type && r.dietary_tags.includes(diet)), `no ${diet} ${type}`);
    }
  }
});

test('every ingredient has nutrition data per 100 g', () => {
  const all = JSON.parse(readFileSync(new URL('../../data/ingredients.json', import.meta.url), 'utf8'));
  for (const ing of all) {
    for (const n of ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodiumMg']) {
      assert.equal(typeof ing.per100g?.[n], 'number', `${ing.key}: ${n}`);
    }
    // Atwater check: the macros must roughly add up to the calories.
    const { kcal, protein, carbs, fat, fiber } = ing.per100g;
    const estimate = 4 * protein + 4 * (carbs - fiber) + 2 * fiber + 9 * fat;
    assert.ok(Math.abs(estimate - kcal) <= Math.max(25, kcal * 0.15), `${ing.key}: ${kcal} kcal but macros give ${Math.round(estimate)}`);
    assert.ok(ing.per100g.source, `${ing.key}: source`);
  }
});
