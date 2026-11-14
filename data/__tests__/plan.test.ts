import type { Meal, MealType } from '../meals';
import {
  NO_EATING_OUT,
  addSnacks,
  removeSnacks,
  extractPartIngredients,
  fitsRestrictions,
  generateStructuredMealPlan,
  mealAt,
  planSlots,
  setAllMeals,
  swapGroup,
  withMeal,
  withoutSnack,
} from '../meals';
import { Body, SNACK_FROM_KCAL, canLeaveOut, dailyTargets, goalScore, personalize, stepIngredients } from '../portions';
import { prepList, prepTasks, timeWithPrep } from '../prep';

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
    // 6 days of four, and breakfast, lunch and a snack on the eating-out day.
    expect(slots).toHaveLength(27);
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

describe('preparing ahead', () => {
  const stirFry = meal('stir-fry', 'dinner', {
    prepTime: 30,
    ingredients: [
      { name: 'chicken', amount: 150, unit: 'g' },
      { name: 'rice', amount: 75, unit: 'g' },
      { name: 'onion', amount: 60, unit: 'g' },
      { name: 'carrots', amount: 80, unit: 'g' },
      { name: 'broccoli', amount: 100, unit: 'g' },
      { name: 'parmesan', amount: 10, unit: 'g' },
      { name: 'tomato', amount: 100, unit: 'g' },
    ],
    instructions: [
      'Cook the rice in 150 ml of salted water, covered, for 12 minutes',
      'Dice the onion and the carrots, cut the broccoli into small florets and slice the chicken',
      'Fry the chicken, then add the vegetables and the diced tomato',
      'Serve over the rice with the grated parmesan',
    ],
  });

  test('the cutting is read from the steps, and only what keeps is offered', () => {
    expect(prepTasks(stirFry).map(t => t.key)).toEqual([
      'rice|cook',
      'onion|dice',
      'carrots|dice',
      'broccoli|cut into florets',
      'parmesan|grate',
    ]);
  });

  test('a verb belongs to its own ingredient, and a staple cooked in the dish is not cooked ahead', () => {
    const pasta = meal('pasta', 'dinner', {
      ingredients: [
        { name: 'chicken', amount: 150, unit: 'g' },
        { name: 'broccoli', amount: 100, unit: 'g' },
        { name: 'parmesan', amount: 10, unit: 'g' },
        { name: 'lentils', amount: 60, unit: 'g' },
        { name: 'cheese', amount: 30, unit: 'g' },
      ],
      instructions: [
        'Add the lentils, the chicken and 300 ml of water and simmer for 20 minutes',
        'Toss in the broccoli and grated parmesan and lay the cheese on top',
      ],
    });
    // Broccoli is not grated; cheese is not cut at all here; the lentils cook in the sauce.
    expect(prepTasks(pasta).map(t => t.key)).toEqual(['broccoli|cut into florets', 'parmesan|grate']);
  });

  test('a meal gets quicker by what was done, but never by more than half', () => {
    expect(timeWithPrep(stirFry, [])).toBe(30);
    expect(timeWithPrep(stirFry, ['onion|dice'])).toBe(28);
    const all = prepTasks(stirFry).map(t => t.key);
    expect(timeWithPrep(stirFry, all)).toBe(15);
    expect(timeWithPrep(stirFry, ['saffron|grind'])).toBe(30);
  });

  test('the list of a part does a job once for all its meals, and follows left-out ingredients', () => {
    setAllMeals(cookbook(0, {}).map(m => ({ ...stirFry, id: m.id, name: m.id, mealType: m.mealType })));
    const plan = generateStructuredMealPlan([], [], 'Sun');
    const list = prepList(plan, 'A');
    // 9 meals of 60 g onion each, as one job; staples first.
    expect(list.lines[0].label).toBe('Cook 675g rice');
    const onion = list.lines.find(l => l.key === 'onion|dice')!;
    expect(onion.label).toBe('Dice 540g onion');
    expect(onion.meals).toHaveLength(9);
    expect(list.lines.find(l => l.key === 'broccoli|cut into florets')!.label).toBe('Cut 900g broccoli into florets');
    expect(list.saves).toBe(9 * 15);
    const first = planSlots(plan).find(s => s.part === 'A')!.meal;
    const edited = prepList(plan, 'A', null, { [first.id]: ['onion'] });
    expect(edited.lines.find(l => l.key === 'onion|dice')!.label).toBe('Dice 480g onion');
    expect(prepList(plan, 'C').lines.length).toBeGreaterThan(0);
  });
});

test('a meal that does not say how to cut joins the part’s line for that ingredient', () => {
  const says = meal('says', 'lunch', {
    ingredients: [{ name: 'chicken', amount: 150, unit: 'g' }, { name: 'carrots', amount: 80, unit: 'g' }],
    instructions: ['Dice the carrots', 'Fry with the chicken'],
  });
  const silent = meal('silent', 'dinner', {
    ingredients: [{ name: 'chicken', amount: 150, unit: 'g' }, { name: 'carrots', amount: 50, unit: 'g' }],
    instructions: ['Fry the chicken', 'Add the carrots'],
  });
  const any = meal('b', 'breakfast', { ingredients: [{ name: 'chicken', amount: 100, unit: 'g' }], instructions: ['Fry', 'Eat'] });
  const day = { breakfast: any, lunch: says, dinner: silent };
  const plan = { A: { Mon: day }, B: {}, C: {} };
  const { lines } = prepList(plan, 'A');
  expect(lines).toHaveLength(1);
  expect(lines[0]).toMatchObject({ label: 'Dice 130g carrots', keys: ['carrots|dice', 'carrots|chop'], meals: ['says', 'silent'] });
});

describe('someone who does not eat out', () => {
  test('the day on its own is cooked in full; with an eating-out day only its dinner is left open', () => {
    setAllMeals(cookbook(0));
    const out = generateStructuredMealPlan([], [], 'Fri');
    expect('isEatingOut' in out.C.Fri.dinner).toBe(true);
    // Breakfast and lunch at home on the eating-out day too.
    expect(out.C.Fri.breakfast).toBeDefined();
    expect(planSlots(out)).toHaveLength(20);

    const home = generateStructuredMealPlan([], [], NO_EATING_OUT);
    expect(Object.keys(home.C)).toEqual(['Sun']);
    expect('isEatingOut' in home.C.Sun.dinner).toBe(false);
    expect(home.C.Sun.breakfast).toBeDefined();
    // Seven days of three meals, all of them shopped for.
    expect(planSlots(home)).toHaveLength(21);
    // The day on its own is bought for on the second shopping day, with the three days before it.
    expect(extractPartIngredients(home, 'C')).toEqual(extractPartIngredients(home, 'B'));
    expect(extractPartIngredients(home, 'B')[0].name).toBe('1800g chicken');
  });
});

describe('switching the daily snack on or off for a plan that exists', () => {
  test('snacks are added to every day from those that fit, and taken out again', () => {
    setAllMeals([...cookbook(3), meal('vegan-snack', 'snack', { dietaryTags: ['vegan'] })]);
    const plan = generateStructuredMealPlan([], [], 'Sun');
    const withSnacks = addSnacks(plan, []);
    expect(planSlots(withSnacks).filter(s => s.mealType === 'snack')).toHaveLength(7);
    expect(planSlots(addSnacks(plan, ['vegan'])).filter(s => s.mealType === 'snack').every(s => s.meal.id === 'vegan-snack')).toBe(true);
    expect(addSnacks(plan, ['kosher'])).toBe(plan);
    expect(removeSnacks(withSnacks)).toEqual(plan);
  });
});
