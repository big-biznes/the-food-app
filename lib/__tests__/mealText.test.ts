import type { Meal } from '@/data/meals';
import { personalize, type PersonalMeal } from '@/data/portions';
import { setRecipeTexts } from '@/data/recipeText';
import { mealText } from '@/lib/localize';

import i18n from '@/lib/i18n';

// The app's language, without loading the translation files and the phone's settings.
jest.mock('@/lib/i18n', () => ({ __esModule: true, default: { language: 'en', t: (key: string) => key, exists: () => false } }));
const mockI18n = i18n as unknown as { language: string };

const meal: Meal = {
  id: 'r_d-shakshuka', name: 'Shakshuka', description: 'Eggs in tomato sauce', prepTime: 25, difficulty: 'quick', appliances: [],
  mealType: 'dinner', dietaryTags: [], keywords: [], emoji: '🍳', main: 'eggs',
  calories: 400, proteinG: 20, carbsG: 20, fatG: 20, fiberG: 4, sugarG: 8, sodiumMg: 300,
  ingredients: [
    { name: 'eggs', amount: 2, unit: '', label: '2 eggs' },
    { name: 'chopped tomatoes', amount: 200, unit: 'g' },
  ],
  seasonings: ['salt', '100 ml water'],
  instructions: ['Simmer the chopped tomatoes', 'Make 2 wells and crack in the eggs'],
  templates: { seasonings: ['salt', '{100} ml water'], instructions: ['Simmer the chopped tomatoes', 'Make {n:eggs} wells and crack in the eggs'] },
};

const dutch = {
  name: 'Shakshuka NL',
  description: 'Eieren in tomatensaus',
  seasonings: ['zout', '{100} ml water'],
  instructions: ['Laat de tomatenblokjes zachtjes koken', 'Maak {n:eggs} kuiltjes en breek de eieren erin'],
};

beforeEach(() => {
  mockI18n.language = 'en';
  setRecipeTexts([{ id: 'd-shakshuka', i18n: { nl: dutch } }]);
});

test('a meal reads as written in English, and for a language it has no translation in', () => {
  expect(mealText(meal).name).toBe('Shakshuka');
  mockI18n.language = 'bg';
  expect(mealText(meal)).toEqual({ name: 'Shakshuka', description: 'Eggs in tomato sauce', instructions: meal.instructions, seasonings: meal.seasonings });
});

test('a translated meal shows its texts with the portion numbers filled in', () => {
  mockI18n.language = 'nl';
  expect(mealText(meal)).toEqual({
    name: 'Shakshuka NL',
    description: 'Eieren in tomatensaus',
    seasonings: ['zout', '100 ml water'],
    instructions: ['Laat de tomatenblokjes zachtjes koken', 'Maak 2 kuiltjes en breek de eieren erin'],
  });
});

test('the translated numbers follow the portion, like the English ones', () => {
  mockI18n.language = 'nl';
  // A dinner share of 600 kcal makes this 400 kcal recipe one and a half times as big.
  const targets = { kcal: 1500, proteinG: 0, carbsG: 0, fatG: 0, perMeal: { breakfast: 375, lunch: 525, dinner: 600, snack: 0 } };
  const personal: PersonalMeal = personalize(meal, targets as never);
  expect(personal.scale).toBeCloseTo(1.5);
  const text = mealText(personal);
  expect(text.seasonings).toEqual(['zout', '150 ml water']);
  expect(text.instructions[1]).toBe('Maak 3 kuiltjes en breek de eieren erin');
  expect(personal.instructions[1]).toBe('Make 3 wells and crack in the eggs');
});

test('a translation with another number of steps is not used for the steps', () => {
  mockI18n.language = 'nl';
  setRecipeTexts([{ id: 'd-shakshuka', i18n: { nl: { ...dutch, instructions: ['Eén stap'] } } }]);
  const text = mealText(meal);
  expect(text.name).toBe('Shakshuka NL');
  expect(text.instructions).toEqual(meal.instructions);
});
