import breakfast from '../recipes/breakfast.json';
import lunch from '../recipes/lunch.json';
import dinner from '../recipes/dinner.json';
import snacks from '../recipes/snacks.json';
import { prepTasks, stepAfterPrep } from '../prep';
import type { Ingredient, Meal } from '../meals';

const ingredients = (...names: string[]): Ingredient[] => names.map(name => ({ name, amount: 100, unit: 'g' }));
const after = (step: string, prepped: string[], all: Ingredient[]) => stepAfterPrep(step, prepped, all).text;

describe('a step after prepping', () => {
  const all = ingredients('onion', 'carrots', 'peppers', 'chicken', 'cheese', 'eggs', 'ham', 'oil');

  test('cutting and then cooking names the ingredient as cut', () => {
    expect(after('Dice the onion and soften it in the oil for 4 minutes', ['onion'], all)).toBe(
      'Soften the diced onion in the oil for 4 minutes',
    );
    expect(after('Finely dice the onion and carrots and fry them in the oil', ['onion', 'carrots'], all)).toBe(
      'Fry the diced onion and carrots in the oil',
    );
  });

  test('only part of a cut was prepped', () => {
    expect(after('Dice the onion and carrots and soften them in the oil', ['onion'], all)).toBe(
      'Dice the carrots and soften it with the diced onion in the oil',
    );
  });

  test('a list of actions keeps everything but the prepped cut', () => {
    expect(after('Beat the eggs with pepper, cut the ham into strips and grate the cheese', ['cheese'], all)).toBe(
      'Beat the eggs with pepper and cut the ham into strips',
    );
    expect(after('Cut the chicken and peppers into strips and fry them', ['peppers'], all)).toBe(
      'Cut the chicken into strips and fry it with the prepped peppers',
    );
  });

  test('a step that only cuts what was prepped has nothing left', () => {
    expect(after('Dice the onion and slice the peppers', ['onion', 'peppers'], all)).toBe('');
  });

  test('steps without a prepped cut stay as written', () => {
    const step = 'Brown the chicken with the diced onion in the oil';
    expect(stepAfterPrep(step, ['onion'], all)).toEqual({ text: step, complete: true });
  });
});

test('every recipe still reads right with all of its prep done', () => {
  const unreadable: string[] = [];
  for (const recipe of [...breakfast, ...lunch, ...dinner, ...snacks] as { id: string; ingredients: { item: string }[]; instructions: string[] }[]) {
    const meal = {
      ...recipe,
      prepTime: 20,
      ingredients: ingredients(...recipe.ingredients.map(i => i.item)),
    } as unknown as Meal;
    const cut = prepTasks(meal).filter(t => t.kind === 'cut').map(t => t.ingredient);
    for (const step of recipe.instructions) {
      if (!stepAfterPrep(step, cut, meal.ingredients).complete) unreadable.push(`${recipe.id}: ${step}`);
    }
  }
  expect(unreadable).toEqual([]);
});
