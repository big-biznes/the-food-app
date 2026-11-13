import type { Meal, MealType } from '../meals';
import {
  extractPartIngredients,
  fitsRestrictions,
  formatIngredient,
  generateStructuredMealPlan,
  mealAt,
  planSlots,
  setAllMeals,
  swapGroup,
  withMeal,
  withoutSnack,
} from '../meals';
import { Body, SNACK_FROM_KCAL, canLeaveOut, dailyTargets, goalScore, personalize, stepIngredients } from '../portions';
import { cmToFeet, feetToCm, formatQuantity, kgToLb, lbToKg } from '../quantity';

const body = (over: Partial<Body> = {}): Body => ({ goal: 'maintain', gender: 'male', age: 30, heightCm: 180, weightKg: 80, ...over });
const big = body({ goal: 'gain', activity: 'very', snacks: true });

const meal = (id: string, mealType: MealType, over: Partial<Meal> = {}): Meal => ({
  id, name: id, description: '', prepTime: 20, difficulty: 'quick', appliances: [], mealType,
  dietaryTags: ['nut-allergy'], tags: [], keywords: [], emoji: '🍗', main: 'chicken',
  calories: 601, proteinG: 46, carbsG: 67, fatG: 15, fiberG: 4, sugarG: 3, sodiumMg: 200,
  ingredients: [
    { name: 'chicken', amount: 150, unit: 'g' },
    { name: 'rice', amount: 75, unit: 'g' },
    { name: 'mushrooms', amount: 100, unit: 'g' },
    { name: 'oil', amount: 10, unit: 'g' },
  ],
  instructions: ['Fry the chicken in the oil', 'Add the mushrooms and cook for 5 minutes', 'Serve over the rice'],
  ...over,
});

/** A cookbook with enough of every meal type for a week; `snacks` of them are snacks. */
function cookbook(snacks: number, snackOver: Partial<Meal> = {}): Meal[] {
  const of = (type: MealType, n: number, over: Partial<Meal> = {}) =>
    Array.from({ length: n }, (_, i) => meal(`${type}-${i}`, type, over));
  return [...of('breakfast', 8), ...of('lunch', 9), ...of('dinner', 8), ...of('snack', snacks, { calories: 300, ...snackOver })];
}

describe('leaving an ingredient out of a meal', () => {
  test('it is gone from the list, the nutrition and the shopping, and the rest keeps its size', () => {
    const targets = dailyTargets(body());
    const full = personalize(meal('m', 'dinner'), targets);
    const edited = personalize(meal('m', 'dinner'), targets, ['mushrooms']);
    expect(edited.ingredients.map(i => i.name)).toEqual(['chicken', 'rice', 'oil']);
    expect(edited.removed!.map(i => i.name)).toEqual(['mushrooms']);
    expect(edited.calories).toBeLessThan(full.calories);
    expect(edited.portion).toBe(full.portion);
    expect(edited.ingredients.find(i => i.name === 'chicken')).toEqual(full.ingredients.find(i => i.name === 'chicken'));
  });

  test('it works without body measurements too', () => {
    const edited = personalize(meal('m', 'dinner'), null, ['oil']);
    expect(edited.ingredients.map(i => i.name)).not.toContain('oil');
    expect(edited.calories).toBeLessThan(601);
    expect(edited.portion).toBeUndefined();
  });

  test('the main ingredient and unknown names stay', () => {
    const m = meal('m', 'dinner');
    expect(canLeaveOut(m, 'chicken')).toBe(false);
    expect(canLeaveOut(m, 'mushrooms')).toBe(true);
    expect(personalize(m, null, ['chicken', 'saffron'])).toBe(m);
  });

  test('cook mode can tell which steps mention what was left out', () => {
    const edited = personalize(meal('m', 'dinner'), null, ['mushrooms']);
    expect(stepIngredients(edited.instructions[1], edited.removed!).map(i => i.name)).toEqual(['mushrooms']);
    expect(stepIngredients(edited.instructions[0], edited.removed!)).toEqual([]);
  });

  test('the shopping list skips it for that meal only', () => {
    setAllMeals(cookbook(0));
    const plan = generateStructuredMealPlan([], [], 'Sun');
    const first = planSlots(plan).find(s => s.part === 'A')!.meal;
    const names = (without: Record<string, string[]>) => extractPartIngredients(plan, 'A', null, without).map(i => i.name);
    expect(names({})).toContain('900g mushrooms');
    expect(names({ [first.id]: ['mushrooms'] })).toContain('800g mushrooms');
  });
});

describe('snacks', () => {
  test('whoever wants a snack gets one and the meals share the rest; nobody gets one unasked', () => {
    expect(dailyTargets(body())!.snack).toBe(false);
    expect(dailyTargets(body())!.perMeal.snack).toBe(0);
    expect(dailyTargets({ ...big, snacks: undefined })!.snack).toBe(false);
    expect(dailyTargets({ ...big, snacks: false })!.snack).toBe(false);
    const small = dailyTargets(body({ snacks: true }))!;
    expect(small.perMeal.snack).toBe(Math.round(small.kcal * 0.1));
    const t = dailyTargets(big)!;
    expect(t.kcal).toBeGreaterThanOrEqual(SNACK_FROM_KCAL);
    expect(t.snack).toBe(true);
    const { breakfast, lunch, dinner, snack } = t.perMeal;
    expect(breakfast + lunch + dinner + snack).toBeCloseTo(t.kcal, -1);
  });

  test('a plan has a snack every day only for someone who wants one', () => {
    setAllMeals(cookbook(8));
    const small = generateStructuredMealPlan([], [], 'Sun', [], [], dailyTargets(body()));
    expect(planSlots(small).some(s => s.mealType === 'snack')).toBe(false);
    const plan = generateStructuredMealPlan([], [], 'Sun', [], [], dailyTargets(big));
    expect(planSlots(plan).filter(s => s.mealType === 'snack')).toHaveLength(7);
    expect(plan.C.Sun.snack).toBeDefined();
  });

  test('no snack recipes, or none that fits the diet, means no snack', () => {
    setAllMeals(cookbook(0));
    expect(planSlots(generateStructuredMealPlan([], [], 'Sun', [], [], dailyTargets(big))).some(s => s.mealType === 'snack')).toBe(false);
    setAllMeals(cookbook(8));
    const plan = generateStructuredMealPlan(['vegan'], [], 'Sun', [], [], dailyTargets(big));
    expect(planSlots(plan).some(s => s.mealType === 'snack')).toBe(false);
  });

  test('a snack seen by someone without snacks is the recipe as written', () => {
    expect(personalize(meal('s', 'snack', { calories: 300 }), dailyTargets(body())).portion).toBe(1);
  });

  test('meals trade places within their own kind', () => {
    expect(swapGroup('lunch')).toBe(swapGroup('dinner'));
    expect(swapGroup('snack')).not.toBe(swapGroup('lunch'));
    expect(swapGroup('breakfast')).not.toBe(swapGroup('snack'));
  });
});

describe('a plan and its places', () => {
  test('meals can be read, replaced and checked against the diet', () => {
    setAllMeals(cookbook(8));
    const plan = generateStructuredMealPlan([], [], 'Sun', [], [], dailyTargets(big));
    const slots = planSlots(plan);
    // 6 days of four, and lunch and a snack on the eating-out day.
    expect(slots).toHaveLength(26);
    const slot = slots[0];
    const other = meal('other', slot.mealType, { dietaryTags: ['vegan'] });
    const next = withMeal(plan, slot, other);
    expect(mealAt(next, slot)).toBe(other);
    expect(mealAt(plan, slot)).toBe(slot.meal);
    expect(mealAt(plan, { part: 'C', day: 'Sun', mealType: 'dinner' })).toBeUndefined();
    expect(fitsRestrictions(other, ['vegan'])).toBe(true);
    expect(fitsRestrictions(slot.meal, ['vegan'])).toBe(false);
    expect(withoutSnack(plan, 'C', 'Sun').C.Sun.snack).toBeUndefined();
    expect(withoutSnack(plan, 'C', 'Sun').C.Sun.lunch).toBe(plan.C.Sun.lunch);
  });
});

describe('macro balance', () => {
  const lean = meal('lean', 'dinner', { calories: 500, proteinG: 45, carbsG: 20 });
  const starchy = meal('starchy', 'dinner', { calories: 500, proteinG: 12, carbsG: 80 });
  const score = (m: Meal, macroBalance: Body['macroBalance']) => goalScore(m, dailyTargets(body({ macroBalance })));

  test('balanced treats them alike, the other two prefer the lean meal', () => {
    expect(score(lean, 'balanced')).toBe(score(starchy, 'balanced'));
    expect(score(lean, 'high-protein')).toBeGreaterThan(score(starchy, 'high-protein'));
    expect(score(lean, 'low-carb')).toBeGreaterThan(score(starchy, 'low-carb'));
    expect(score(starchy, 'low-carb')).toBeLessThan(score(starchy, 'balanced'));
  });
});

describe('amounts in imperial units', () => {
  test('grams and millilitres are converted, spoons and counts are not', () => {
    expect(formatQuantity(150, 'g')).toBe('150g');
    expect(formatQuantity(150, 'g', true)).toBe('5.5 oz');
    expect(formatQuantity(10, 'g', true)).toBe('0.4 oz');
    expect(formatQuantity(500, 'g', true)).toBe('1.1 lb');
    expect(formatQuantity(250, 'ml', true)).toBe('8.5 fl oz');
    expect(formatQuantity(2, 'tbsp', true)).toBe('2 tbsp');
    expect(formatIngredient({ name: 'rice', amount: 75, unit: 'g' }, true)).toBe('2.5 oz rice');
    expect(formatIngredient({ name: 'eggs', amount: 2, unit: '', label: '2 eggs' }, true)).toBe('2 eggs');
  });

  test('height and weight go there and back', () => {
    expect(cmToFeet(180)).toEqual({ ft: 5, inch: 11 });
    expect(feetToCm(5, 11)).toBe(180);
    expect(kgToLb(80)).toBe(176);
    expect(lbToKg(176)).toBe(80);
  });
});
