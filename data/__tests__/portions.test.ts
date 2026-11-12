import type { Meal } from '../meals';
import { extractPartIngredients, generateStructuredMealPlan, planMeals, setAllMeals } from '../meals';
import { Body, MAX_PORTION, MIN_PORTION, dailyTargets, goalScore, personalize, renderText, stepIngredients } from '../portions';

const body = (over: Partial<Body> = {}): Body => ({ goal: 'maintain', gender: 'male', age: 30, heightCm: 180, weightKg: 80, ...over });

const meal = (over: Partial<Meal> = {}): Meal => ({
  id: 'm1', name: 'Chicken and Rice', description: '', prepTime: 20, difficulty: 'quick', appliances: [], mealType: 'dinner',
  dietaryTags: [], tags: [], keywords: [], emoji: '🍗', main: 'chicken',
  // 150 g chicken (180 kcal) + 75 g rice (274) + 100 g broccoli (34) + 10 g oil (88) + 2 eggs (157)
  calories: 733, proteinG: 56, carbsG: 67, fatG: 26, fiberG: 4, sugarG: 3, sodiumMg: 262,
  ingredients: [
    { name: 'chicken', amount: 150, unit: 'g' },
    { name: 'rice', amount: 75, unit: 'g' },
    { name: 'broccoli', amount: 100, unit: 'g' },
    { name: 'oil', amount: 10, unit: 'g' },
    { name: 'eggs', amount: 2, unit: '', label: '2 eggs' },
    { name: 'garlic', amount: 8, unit: 'g', label: '2 cloves' },
  ],
  instructions: ['Cook', 'Serve'],
  ...over,
});

test('the daily target follows the Mifflin-St Jeor equation and the goal', () => {
  // 10·80 + 6.25·180 − 5·30 + 5 = 1780 kcal at rest, ×1.4 = 2492
  expect(dailyTargets(body())!.kcal).toBe(2490);
  expect(dailyTargets(body({ goal: 'lose' }))!.kcal).toBe(1990);
  expect(dailyTargets(body({ goal: 'gain' }))!.kcal).toBe(2740);
  // 10·60 + 6.25·165 − 5·30 − 161 = 1320, ×1.4 = 1848
  expect(dailyTargets(body({ gender: 'female', heightCm: 165, weightKg: 60 }))!.kcal).toBe(1850);
});

test('the day is split over the meals', () => {
  const { kcal, perMeal } = dailyTargets(body())!;
  expect(perMeal.breakfast + perMeal.lunch + perMeal.dinner).toBeCloseTo(kcal, -1);
  expect(perMeal.dinner).toBeGreaterThan(perMeal.lunch);
  expect(perMeal.lunch).toBeGreaterThan(perMeal.breakfast);
});

test('nobody is put below a safe minimum, and an underweight person gets no deficit', () => {
  expect(dailyTargets(body({ goal: 'lose', gender: 'female', age: 60, heightCm: 150, weightKg: 45 }))!.kcal).toBeGreaterThanOrEqual(1200);
  const thin = body({ goal: 'lose', heightCm: 185, weightKg: 58 });
  expect(dailyTargets(thin)!.goal).toBe('maintain');
  expect(dailyTargets(thin)!.kcal).toBe(dailyTargets({ ...thin, goal: 'maintain' })!.kcal);
});

test('a profile without usable measurements gets the standard recipe', () => {
  expect(dailyTargets(body({ weightKg: 0 }))).toBeNull();
  expect(dailyTargets(null)).toBeNull();
  expect(personalize(meal(), null)).toEqual(meal());
});

test('a recipe is scaled to the person’s share and its nutrition is recomputed', () => {
  // Dinner share for the 2490 kcal day is 996 kcal: 1.36× this recipe.
  const big = personalize(meal(), dailyTargets(body()));
  expect(big.portion).toBeCloseTo(1.35, 1);
  expect(big.ingredients.find(i => i.name === 'chicken')!.amount).toBe(200);
  expect(big.ingredients.find(i => i.name === 'rice')!.amount).toBe(100);
  expect(big.ingredients.find(i => i.name === 'oil')!.amount).toBe(14);
  expect(big.ingredients.find(i => i.name === 'eggs')).toMatchObject({ amount: 3, label: '3 eggs' });
  expect(big.ingredients.find(i => i.name === 'garlic')).toMatchObject({ amount: 12, label: '3 cloves' });
  expect(big.calories).toBeGreaterThan(940);
  expect(big.calories).toBeLessThan(1050);
  expect(big.proteinG).toBeGreaterThan(meal().proteinG);

  const small = personalize(meal(), dailyTargets(body({ goal: 'lose', gender: 'female', heightCm: 160, weightKg: 55 })));
  expect(small.portion).toBeLessThan(1);
  expect(small.calories).toBeLessThan(meal().calories);
  expect(small.ingredients.find(i => i.name === 'eggs')!.amount).toBeGreaterThanOrEqual(1);
});

test('a recipe is never scaled beyond what still works as a dish', () => {
  const targets = dailyTargets(body({ goal: 'gain', weightKg: 110, heightCm: 195 }))!;
  expect(personalize(meal({ calories: 300 }), targets).portion).toBe(MAX_PORTION);
  const little = dailyTargets(body({ goal: 'lose', gender: 'female', heightCm: 150, weightKg: 45, age: 60 }))!;
  expect(personalize(meal({ calories: 1000 }), little).portion).toBe(MIN_PORTION);
});

test('the goal decides which meals are preferred', () => {
  const light = meal({ id: 'light', calories: 480, proteinG: 45, tags: ['light'] });
  const hearty = meal({ id: 'hearty', calories: 900, proteinG: 65, tags: ['hearty'] });
  const lose = dailyTargets(body({ goal: 'lose', gender: 'female', heightCm: 165, weightKg: 70 }));
  const gain = dailyTargets(body({ goal: 'gain' }));
  expect(goalScore(light, lose)).toBeGreaterThan(goalScore(hearty, lose));
  expect(goalScore(hearty, gain)).toBeGreaterThan(goalScore(light, gain));
  expect(goalScore(light, null)).toBe(0);
});

test('plans lean towards the goal and the shopping list is for the scaled portions', () => {
  const meals: Meal[] = [];
  for (const mealType of ['breakfast', 'lunch', 'dinner'] as const) {
    for (let i = 0; i < 12; i++) {
      const isLight = i % 2 === 0;
      meals.push(meal({
        id: `${mealType}-${i}`, mealType, main: ['chicken', 'beef', 'tofu', 'salmon'][Math.floor(i / 2) % 4],
        calories: isLight ? 420 : 880, proteinG: isLight ? 38 : 45, tags: isLight ? ['light'] : ['hearty'],
      }));
    }
  }
  setAllMeals(meals);
  const share = (tag: string, targets: ReturnType<typeof dailyTargets>) => {
    let hits = 0, all = 0;
    for (let i = 0; i < 30; i++) for (const m of planMeals(generateStructuredMealPlan([], [], 'Sun', [], [], targets))) { all++; if (m.tags!.includes(tag)) hits++; }
    return hits / all;
  };
  const lose = dailyTargets(body({ goal: 'lose', gender: 'female', heightCm: 165, weightKg: 70 }));
  const gain = dailyTargets(body({ goal: 'gain' }));
  // Half the cookbook is light and half hearty; the goal tips the plan clearly one way.
  expect(share('light', lose)).toBeGreaterThan(0.6);
  expect(share('hearty', gain)).toBeGreaterThan(0.6);
  expect(share('light', null)).toBeLessThan(0.6);

  const targets = dailyTargets(body({ goal: 'gain' }));
  const plan = generateStructuredMealPlan([], [], 'Sun', [], [], targets);
  const standard = extractPartIngredients(plan, 'A').find(l => l.name.endsWith('chicken'))!.name;
  const personal = extractPartIngredients(plan, 'A', targets).find(l => l.name.endsWith('chicken'))!.name;
  expect(parseInt(personal, 10)).toBeGreaterThan(parseInt(standard, 10));
  // Plans store the standard recipes; the scaling is applied when they are shown.
  expect(planMeals(plan).every(m => !('portion' in m))).toBe(true);
});

test('activity level changes the daily target', () => {
  // 1780 kcal at rest
  expect(dailyTargets(body({ activity: 'low' }))!.kcal).toBe(2140);
  expect(dailyTargets(body({ activity: 'light' }))!.kcal).toBe(dailyTargets(body())!.kcal);
  expect(dailyTargets(body({ activity: 'active' }))!.kcal).toBe(2850);
  expect(dailyTargets(body({ activity: 'very' }))!.kcal).toBe(3200);
});

test('numbers in steps and seasonings follow the portion', () => {
  const ingredients = [{ name: 'eggs', amount: 3, unit: '', label: '3 eggs' }, { name: 'garlic', amount: 12, unit: 'g', label: '3 cloves' }];
  expect(renderText('Roll into {8} small balls', 1, ingredients)).toBe('Roll into 8 small balls');
  expect(renderText('Roll into {8} small balls', 1.5, ingredients)).toBe('Roll into 12 small balls');
  expect(renderText('Shape into {3} sausages', 0.6, ingredients)).toBe('Shape into 2 sausages');
  expect(renderText('{350} ml water', 1.3, ingredients)).toBe('460 ml water');
  expect(renderText('Make {n:eggs} wells and add the {n:garlic} cloves', 2, ingredients)).toBe('Make 3 wells and add the 3 cloves');
  expect(renderText('Simmer for 8 to 10 minutes', 1.8, ingredients)).toBe('Simmer for 8 to 10 minutes');
});

test('a personal meal has its steps and seasonings filled in for the portion', () => {
  const base = meal({
    instructions: ['Roll into 8 balls', 'Make 2 wells'],
    seasonings: ['300 ml water'],
    templates: { instructions: ['Roll into {8} balls', 'Make {n:eggs} wells'], seasonings: ['{300} ml water'] },
  });
  const big = personalize(base, dailyTargets(body()));
  expect(big.instructions).toEqual(['Roll into 11 balls', 'Make 3 wells']);
  expect(big.seasonings).toEqual(['410 ml water']);
  // Without a profile the standard text stays.
  expect(personalize(base, null).instructions).toEqual(['Roll into 8 balls', 'Make 2 wells']);
});

test('cook mode finds the ingredients a step uses, by any of their names', () => {
  const ingredients = [
    { name: 'beef mince', amount: 150, unit: 'g' },
    { name: 'chopped tomatoes', amount: 200, unit: 'g' },
    { name: 'peas', amount: 50, unit: 'g' },
    { name: 'peanut butter', amount: 20, unit: 'g' },
    { name: 'oil', amount: 10, unit: 'g' },
    { name: 'eggs', amount: 2, unit: '', label: '2 eggs' },
    { name: 'potatoes', amount: 200, unit: 'g' },
  ];
  const names = (step: string) => stepIngredients(step, ingredients).map(i => i.name);
  expect(names('Brown the mince in the oil')).toEqual(['beef mince', 'oil']);
  expect(names('Add the chopped tomatoes and boil for 5 minutes')).toEqual(['chopped tomatoes']);
  expect(names('Stir in the peanut butter')).toEqual(['peanut butter']);
  expect(names('Add the peas, then crack in an egg over each potato')).toEqual(['peas', 'eggs', 'potatoes']);
});
