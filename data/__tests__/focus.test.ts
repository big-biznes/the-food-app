import { ALL_MEALS, Meal, MealType, extractUsedIds, generateStructuredMealPlan, getAlternateMeal, planMeals, setAllMeals, toFocus } from '../meals';

let n = 0;
function meal(mealType: MealType, tags: string[], over: Partial<Meal> = {}): Meal {
  n++;
  return {
    id: `m${n}`, name: `Meal ${n}`, description: '', prepTime: 30, calories: 600, proteinG: 30, carbsG: 50, fatG: 20, fiberG: 5, sugarG: 5,
    sodiumMg: 300, difficulty: 'balanced', appliances: [], mealType, dietaryTags: [], tags, keywords: tags, emoji: '🍽️',
    main: ['chicken', 'beef', 'tofu', 'salmon'][n % 4],
    ingredients: [{ name: ['chicken', 'beef', 'tofu', 'salmon'][n % 4], amount: 150, unit: 'g' }, { name: 'rice', amount: 75, unit: 'g' }],
    instructions: ['Cook', 'Serve'],
    ...over,
  };
}

/** `count` meals of each type per tag set. */
function cookbook(sets: string[][], count: number): Meal[] {
  const meals: Meal[] = [];
  for (const type of ['breakfast', 'lunch', 'dinner'] as MealType[]) for (const tags of sets) for (let i = 0; i < count; i++) meals.push(meal(type, tags));
  return meals;
}

const cooked = (meals: Meal[]) => meals.filter(m => m.mealType !== 'breakfast');
const plan = (focus: string[], liked: string[] = []) => planMeals(generateStructuredMealPlan([], [], 'Sun', liked, focus));

beforeEach(() => {
  n = 0;
});

test('chips and typed words become a focus; other words are ignored', () => {
  expect(toFocus(['Mexican', 'spicy', 'chicken'])).toEqual({ cuisines: ['mexican'], qualities: ['spicy'] });
});

test('a focused plan only uses meals of that category while there are enough', () => {
  setAllMeals(cookbook([['mexican'], ['asian'], ['italian'], []], 8));
  for (let i = 0; i < 20; i++) expect(plan(['mexican']).every(m => m.tags!.includes('mexican'))).toBe(true);
});

test('several cuisines mean any of them, several qualities mean all of them', () => {
  setAllMeals(cookbook([['asian'], ['italian'], ['mexican'], ['spicy'], ['quick'], ['spicy', 'quick']], 8));
  for (let i = 0; i < 20; i++) {
    const either = plan(['asian', 'italian']);
    expect(either.every(m => m.tags!.includes('asian') || m.tags!.includes('italian'))).toBe(true);
    expect(plan(['spicy', 'quick']).every(m => m.tags!.includes('spicy') && m.tags!.includes('quick'))).toBe(true);
  }
});

test('the cuisine is kept when no meal has every quality', () => {
  setAllMeals(cookbook([['mexican'], ['spicy'], []], 8));
  for (let i = 0; i < 20; i++) expect(plan(['mexican', 'spicy']).every(m => m.tags!.includes('mexican'))).toBe(true);
});

test('when a category runs out, the plan uses all of it and fills up with other meals', () => {
  setAllMeals([...cookbook([[]], 10), meal('dinner', ['mexican']), meal('dinner', ['mexican']), meal('dinner', ['mexican'])]);
  const dinners = plan(['mexican']).filter(m => m.mealType === 'dinner');
  expect(dinners).toHaveLength(6);
  expect(dinners.filter(m => m.tags!.includes('mexican'))).toHaveLength(3);
});

test('light means the lightest meals when none is tagged light', () => {
  const meals = cookbook([[]], 30).map((m, i) => ({ ...m, calories: 400 + 10 * (i % 30) }));
  setAllMeals(meals);
  for (let i = 0; i < 10; i++) expect(Math.max(...cooked(plan(['light'])).map(m => m.calories))).toBeLessThanOrEqual(500);
});

test('a liked meal that does not fit is not forced into a focused plan', () => {
  setAllMeals(cookbook([['mexican'], []], 8));
  const liked = ALL_MEALS.find(m => m.mealType === 'dinner' && m.tags!.length === 0)!;
  for (let i = 0; i < 20; i++) {
    expect(plan(['mexican'], [liked.id]).some(m => m.id === liked.id)).toBe(false);
    expect(plan([], [liked.id]).some(m => m.id === liked.id)).toBe(true);
  }
});

test('a replacement meal stays in the plan’s focus', () => {
  setAllMeals(cookbook([['asian'], []], 10));
  const week = generateStructuredMealPlan([], [], 'Sun', [], ['asian']);
  const current = Object.values(week.A)[0].dinner;
  for (let i = 0; i < 20; i++) expect(getAlternateMeal(current, extractUsedIds(week), [], ['asian']).tags).toContain('asian');
});

test('plans hold plain meals, without scoring fields', () => {
  setAllMeals(cookbook([['asian'], []], 8));
  for (const m of plan(['asian'])) expect(Object.keys(m)).not.toEqual(expect.arrayContaining(['score', 'focus']));
});
