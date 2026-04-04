import { DietaryRestriction } from '@/contexts/AuthContext';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type MealComponents = {
  protein: string;
  carb: string;
  sauce: string;
  vegetable: string;
};

export type Meal = {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  calories: number;
  mealType: MealType;
  dietaryTags: DietaryRestriction[];
  keywords: string[];
  emoji: string;
  components: MealComponents;
};

export type WeekPart = 'A' | 'B' | 'C';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Day = typeof DAYS[number];

export const PART_DAYS: Record<WeekPart, Day[]> = {
  A: ['Mon', 'Tue', 'Wed'],
  B: ['Thu', 'Fri', 'Sat'],
  C: ['Sun'],
};

export const PART_SHOPPING_DAY: Record<'A' | 'B', Day> = {
  A: 'Sun',
  B: 'Wed',
};

export type EatingOutEntry = {
  isEatingOut: true;
  mealType: 'dinner';
  emoji: string;
  name: string;
  description: string;
};

export const EATING_OUT: EatingOutEntry = {
  isEatingOut: true,
  mealType: 'dinner',
  emoji: '🍽️',
  name: 'Eating out',
  description: 'Enjoy a meal at your favourite restaurant',
};

export type DayPlan = {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
};

export type PartCDayPlan = {
  lunch: Meal;
  dinner: EatingOutEntry;
};

export type StructuredWeekPlan = {
  A: Record<string, DayPlan>;
  B: Record<string, DayPlan>;
  C: Record<string, PartCDayPlan>;
};

// ── Legacy alias (kept so nothing else breaks) ────────────────────────────────
export type WeekPlan = Record<string, DayPlan>;

export const MEALS: Meal[] = [
  // ── BREAKFAST ────────────────────────────────────────────────────────────────
  {
    id: 'b1',
    name: 'Avocado Toast',
    description: 'Creamy avocado on sourdough with chili flakes & lemon',
    prepTime: 10, calories: 320, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free'],
    keywords: ['light', 'fresh', 'quick', 'toast', 'trendy'],
    emoji: '🥑',
    components: { protein: 'avocado', carb: 'sourdough', sauce: 'lemon & chili', vegetable: 'tomato' },
  },
  {
    id: 'b2',
    name: 'Greek Yogurt Parfait',
    description: 'Layered creamy yogurt, granola and mixed berries',
    prepTime: 5, calories: 280, mealType: 'breakfast',
    dietaryTags: ['vegetarian'],
    keywords: ['light', 'fresh', 'quick', 'sweet', 'fruity'],
    emoji: '🫙',
    components: { protein: 'greek yogurt', carb: 'granola', sauce: 'honey', vegetable: 'mixed berries' },
  },
  {
    id: 'b3',
    name: 'Scrambled Eggs & Toast',
    description: 'Fluffy buttered eggs on toasted sourdough',
    prepTime: 10, calories: 350, mealType: 'breakfast',
    dietaryTags: ['vegetarian'],
    keywords: ['hearty', 'quick', 'classic', 'comfort', 'protein'],
    emoji: '🍳',
    components: { protein: 'eggs', carb: 'sourdough', sauce: 'butter', vegetable: 'tomato' },
  },
  {
    id: 'b4',
    name: 'Oatmeal with Berries',
    description: 'Warm oats topped with mixed berries and a drizzle of honey',
    prepTime: 8, calories: 290, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['light', 'warm', 'sweet', 'healthy', 'fruity'],
    emoji: '🫐',
    components: { protein: 'almond milk', carb: 'oats', sauce: 'honey', vegetable: 'mixed berries' },
  },
  {
    id: 'b5',
    name: 'Banana Smoothie Bowl',
    description: 'Thick blended banana base topped with seeds and fruit',
    prepTime: 8, calories: 310, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['light', 'fresh', 'sweet', 'tropical', 'fruity'],
    emoji: '🍌',
    components: { protein: 'banana', carb: 'granola', sauce: 'honey', vegetable: 'mixed berries' },
  },
  {
    id: 'b6',
    name: 'Veggie Omelette',
    description: 'Fluffy omelette filled with peppers, mushrooms and spinach',
    prepTime: 12, calories: 330, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'gluten-free', 'dairy-free'],
    keywords: ['hearty', 'savory', 'fresh', 'protein', 'veggie'],
    emoji: '🥚',
    components: { protein: 'eggs', carb: 'whole wheat toast', sauce: 'olive oil', vegetable: 'peppers & mushrooms' },
  },
  {
    id: 'b7',
    name: 'Overnight Oats',
    description: 'No-cook oats with chia seeds, almond milk and banana',
    prepTime: 5, calories: 340, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free'],
    keywords: ['quick', 'light', 'prep-ahead', 'sweet', 'easy'],
    emoji: '🥣',
    components: { protein: 'chia seeds', carb: 'oats', sauce: 'almond milk', vegetable: 'banana' },
  },
  {
    id: 'b8',
    name: 'Chia Pudding',
    description: 'Creamy coconut chia pudding with fresh mango',
    prepTime: 5, calories: 260, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['light', 'sweet', 'tropical', 'prep-ahead', 'fruity'],
    emoji: '🥥',
    components: { protein: 'chia seeds', carb: 'coconut milk', sauce: 'honey', vegetable: 'mango' },
  },
  {
    id: 'b9',
    name: 'Tofu Scramble',
    description: 'Seasoned crumbled tofu with turmeric, kale and tomatoes',
    prepTime: 15, calories: 300, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['hearty', 'savory', 'veggie', 'spicy', 'protein'],
    emoji: '🧀',
    components: { protein: 'tofu', carb: 'toast', sauce: 'turmeric sauce', vegetable: 'kale & tomatoes' },
  },
  {
    id: 'b10',
    name: 'Peanut Butter Toast',
    description: 'Thick toast with peanut butter, banana slices and honey',
    prepTime: 5, calories: 390, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free'],
    keywords: ['hearty', 'sweet', 'quick', 'comfort', 'filling'],
    emoji: '🥜',
    components: { protein: 'peanut butter', carb: 'bread', sauce: 'honey', vegetable: 'banana' },
  },

  // ── LUNCH ─────────────────────────────────────────────────────────────────────
  {
    id: 'l1',
    name: 'Caesar Salad',
    description: 'Crisp romaine, parmesan, croutons and Caesar dressing',
    prepTime: 10, calories: 320, mealType: 'lunch',
    dietaryTags: ['vegetarian'],
    keywords: ['light', 'fresh', 'classic', 'salad'],
    emoji: '🥗',
    components: { protein: 'parmesan', carb: 'croutons', sauce: 'caesar dressing', vegetable: 'romaine lettuce' },
  },
  {
    id: 'l2',
    name: 'Chicken Wrap',
    description: 'Grilled chicken, avocado, lettuce and lime in a tortilla',
    prepTime: 12, calories: 450, mealType: 'lunch',
    dietaryTags: ['dairy-free'],
    keywords: ['hearty', 'quick', 'fresh', 'protein', 'filling'],
    emoji: '🌯',
    components: { protein: 'chicken', carb: 'tortilla', sauce: 'lime sauce', vegetable: 'avocado & lettuce' },
  },
  {
    id: 'l3',
    name: 'Red Lentil Soup',
    description: 'Hearty red lentil soup with cumin, coriander and lemon',
    prepTime: 25, calories: 350, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['hearty', 'warm', 'comfort', 'filling', 'cozy'],
    emoji: '🍲',
    components: { protein: 'red lentils', carb: 'bread', sauce: 'cumin & coriander', vegetable: 'spinach' },
  },
  {
    id: 'l4',
    name: 'Quinoa Power Bowl',
    description: 'Quinoa, roasted veggies, chickpeas and tahini dressing',
    prepTime: 20, calories: 420, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['healthy', 'fresh', 'filling', 'hearty', 'veggie'],
    emoji: '🥙',
    components: { protein: 'chickpeas', carb: 'quinoa', sauce: 'tahini', vegetable: 'roasted vegetables' },
  },
  {
    id: 'l5',
    name: 'Tuna Salad Sandwich',
    description: 'Classic tuna salad on whole grain with lettuce and tomato',
    prepTime: 8, calories: 390, mealType: 'lunch',
    dietaryTags: ['dairy-free'],
    keywords: ['quick', 'classic', 'hearty', 'protein', 'easy'],
    emoji: '🥪',
    components: { protein: 'tuna', carb: 'whole grain bread', sauce: 'mayo', vegetable: 'lettuce & tomato' },
  },
  {
    id: 'l6',
    name: 'Margherita Pizza',
    description: 'Thin crust with tomato sauce, mozzarella and fresh basil',
    prepTime: 15, calories: 480, mealType: 'lunch',
    dietaryTags: ['vegetarian'],
    keywords: ['italian', 'comfort', 'cheesy', 'classic', 'indulgent'],
    emoji: '🍕',
    components: { protein: 'mozzarella', carb: 'pizza dough', sauce: 'tomato sauce', vegetable: 'fresh basil' },
  },
  {
    id: 'l7',
    name: 'Asian Noodle Salad',
    description: 'Rice noodles with sesame dressing, cucumber and mint',
    prepTime: 15, calories: 370, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['asian', 'fresh', 'light', 'noodles', 'cold'],
    emoji: '🍜',
    components: { protein: 'tofu', carb: 'rice noodles', sauce: 'sesame dressing', vegetable: 'cucumber & mint' },
  },
  {
    id: 'l8',
    name: 'Greek Salad',
    description: 'Tomatoes, cucumber, kalamata olives, feta and oregano',
    prepTime: 10, calories: 280, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'gluten-free'],
    keywords: ['mediterranean', 'light', 'fresh', 'greek', 'salad'],
    emoji: '🫒',
    components: { protein: 'feta', carb: 'pita bread', sauce: 'olive oil & oregano', vegetable: 'tomatoes & cucumber' },
  },
  {
    id: 'l9',
    name: 'Black Bean Tacos',
    description: 'Spiced black beans in corn tortillas with salsa and avocado',
    prepTime: 15, calories: 400, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['mexican', 'spicy', 'hearty', 'filling', 'bold'],
    emoji: '🌮',
    components: { protein: 'black beans', carb: 'corn tortillas', sauce: 'salsa', vegetable: 'avocado' },
  },
  {
    id: 'l10',
    name: 'Tomato Basil Soup',
    description: 'Velvety roasted tomato soup with fresh basil and croutons',
    prepTime: 20, calories: 240, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'gluten-free'],
    keywords: ['light', 'warm', 'comfort', 'italian', 'cozy'],
    emoji: '🍅',
    components: { protein: 'parmesan', carb: 'croutons', sauce: 'basil cream', vegetable: 'roasted tomatoes' },
  },

  // ── DINNER ────────────────────────────────────────────────────────────────────
  {
    id: 'd1',
    name: 'Spaghetti Bolognese',
    description: 'Slow-cooked beef ragù with spaghetti and parmesan',
    prepTime: 40, calories: 580, mealType: 'dinner',
    dietaryTags: [],
    keywords: ['italian', 'comfort', 'hearty', 'classic', 'pasta', 'indulgent'],
    emoji: '🍝',
    components: { protein: 'ground beef', carb: 'spaghetti', sauce: 'tomato ragù', vegetable: 'carrot & celery' },
  },
  {
    id: 'd2',
    name: 'Grilled Salmon',
    description: 'Herb-crusted salmon fillet with roasted asparagus and lemon',
    prepTime: 20, calories: 450, mealType: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
    keywords: ['light', 'healthy', 'fresh', 'protein', 'fish', 'mediterranean'],
    emoji: '🐟',
    components: { protein: 'salmon', carb: 'potatoes', sauce: 'lemon herb', vegetable: 'asparagus' },
  },
  {
    id: 'd3',
    name: 'Chicken Stir Fry',
    description: 'Wok-tossed chicken with broccoli, peppers and soy ginger sauce',
    prepTime: 20, calories: 480, mealType: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
    keywords: ['asian', 'quick', 'spicy', 'hearty', 'bold'],
    emoji: '🥢',
    components: { protein: 'chicken', carb: 'rice', sauce: 'soy ginger', vegetable: 'broccoli & peppers' },
  },
  {
    id: 'd4',
    name: 'Vegetable Curry',
    description: 'Fragrant coconut curry with sweet potato and chickpeas',
    prepTime: 30, calories: 420, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['spicy', 'hearty', 'warm', 'indian', 'comfort', 'bold'],
    emoji: '🍛',
    components: { protein: 'chickpeas', carb: 'rice', sauce: 'coconut curry', vegetable: 'sweet potato' },
  },
  {
    id: 'd5',
    name: 'Beef Tacos',
    description: 'Seasoned ground beef in crispy shells with salsa and cheese',
    prepTime: 25, calories: 530, mealType: 'dinner',
    dietaryTags: [],
    keywords: ['mexican', 'spicy', 'hearty', 'comfort', 'bold', 'indulgent'],
    emoji: '🌮',
    components: { protein: 'ground beef', carb: 'taco shells', sauce: 'salsa', vegetable: 'lettuce & tomato' },
  },
  {
    id: 'd6',
    name: 'Pasta Primavera',
    description: 'Penne with seasonal vegetables in a garlic olive oil sauce',
    prepTime: 20, calories: 450, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free'],
    keywords: ['italian', 'light', 'fresh', 'pasta', 'veggie'],
    emoji: '🍝',
    components: { protein: 'parmesan', carb: 'penne', sauce: 'garlic olive oil', vegetable: 'seasonal veggies' },
  },
  {
    id: 'd7',
    name: 'Lemon Herb Chicken',
    description: 'Roasted chicken thighs with lemon, rosemary and garlic',
    prepTime: 35, calories: 490, mealType: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
    keywords: ['light', 'classic', 'hearty', 'protein', 'mediterranean'],
    emoji: '🍗',
    components: { protein: 'chicken', carb: 'potatoes', sauce: 'lemon & rosemary', vegetable: 'green beans' },
  },
  {
    id: 'd8',
    name: 'Black Bean Chili',
    description: 'Smoky black bean chili with chipotle peppers and lime',
    prepTime: 30, calories: 380, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['spicy', 'hearty', 'mexican', 'comfort', 'filling', 'bold'],
    emoji: '🫘',
    components: { protein: 'black beans', carb: 'rice', sauce: 'chipotle', vegetable: 'peppers & onion' },
  },
  {
    id: 'd9',
    name: 'Mushroom Risotto',
    description: 'Creamy arborio rice with wild mushrooms and parmesan',
    prepTime: 35, calories: 510, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'gluten-free'],
    keywords: ['italian', 'comfort', 'hearty', 'creamy', 'indulgent'],
    emoji: '🍄',
    components: { protein: 'parmesan', carb: 'arborio rice', sauce: 'white wine', vegetable: 'wild mushrooms' },
  },
  {
    id: 'd10',
    name: 'Thai Green Curry',
    description: 'Aromatic green curry with tofu, zucchini and coconut milk',
    prepTime: 25, calories: 430, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['asian', 'spicy', 'thai', 'aromatic', 'bold'],
    emoji: '🥬',
    components: { protein: 'tofu', carb: 'rice', sauce: 'green curry paste', vegetable: 'zucchini' },
  },
  {
    id: 'd11',
    name: 'Baked Cod',
    description: 'Herb-crusted cod with cherry tomatoes and roasted vegetables',
    prepTime: 25, calories: 370, mealType: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
    keywords: ['light', 'healthy', 'fresh', 'fish', 'mediterranean'],
    emoji: '🐠',
    components: { protein: 'cod', carb: 'potatoes', sauce: 'herb crust', vegetable: 'cherry tomatoes' },
  },
  {
    id: 'd12',
    name: 'Chickpea Shakshuka',
    description: 'Eggs poached in spiced tomato sauce with chickpeas and feta',
    prepTime: 25, calories: 390, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'gluten-free'],
    keywords: ['mediterranean', 'spicy', 'hearty', 'warm', 'bold'],
    emoji: '🍳',
    components: { protein: 'eggs & chickpeas', carb: 'pita bread', sauce: 'spiced tomato', vegetable: 'feta & peppers' },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoredPool(
  meals: Meal[],
  keywords: string[],
): (Meal & { score: number })[] {
  return meals.map(m => ({
    ...m,
    score:
      keywords.length === 0
        ? 0
        : m.keywords.filter(k =>
            keywords.some(kw => k.includes(kw) || kw.includes(k)),
          ).length,
  }));
}

function pickMeal(
  pool: (Meal & { score: number })[],
  mealType: MealType,
  usedIds: Set<string>,
): Meal {
  const typePool = pool.filter(m => m.mealType === mealType);
  const unused = typePool.filter(m => !usedIds.has(m.id));
  const source = unused.length > 0 ? unused : typePool;

  const sorted = [...source].sort((a, b) => b.score - a.score);
  const topN = sorted.slice(0, Math.min(3, sorted.length));
  const { score: _s, ...pick } = topN[Math.floor(Math.random() * topN.length)];

  usedIds.add(pick.id);
  return pick;
}

// ── Legacy plan generation (kept for getAlternateMeal compatibility) ──────────

export function generateMealPlan(
  restrictions: DietaryRestriction[],
  cravingKeywords: string[],
): WeekPlan {
  const compatible = MEALS.filter(m =>
    restrictions.every(r => m.dietaryTags.includes(r)),
  );
  const pool = compatible.length >= 15 ? compatible : MEALS;
  const scored = scoredPool(pool, cravingKeywords);
  const usedIds = new Set<string>();
  const plan: WeekPlan = {};
  for (const day of DAYS) {
    plan[day] = {
      breakfast: pickMeal(scored, 'breakfast', usedIds),
      lunch: pickMeal(scored, 'lunch', usedIds),
      dinner: pickMeal(scored, 'dinner', usedIds),
    };
  }
  return plan;
}

// ── Week structure (dynamic based on eating-out day) ─────────────────────────

export type WeekStructure = {
  partDays: Record<WeekPart, Day[]>;
  partShoppingDay: Record<'A' | 'B', Day>;
  partLabel: Record<WeekPart, string>;
};

export function getWeekStructure(eatingOutDay: string): WeekStructure {
  const idx = DAYS.indexOf(eatingOutDay as Day);
  const safeIdx = idx === -1 ? 6 : idx; // default to Sunday

  const wrap = (n: number) => DAYS[n % 7];
  const a1 = wrap(safeIdx + 1);
  const a2 = wrap(safeIdx + 2);
  const a3 = wrap(safeIdx + 3);
  const b1 = wrap(safeIdx + 4);
  const b2 = wrap(safeIdx + 5);
  const b3 = wrap(safeIdx + 6);
  const c  = DAYS[safeIdx];

  return {
    partDays: { A: [a1, a2, a3], B: [b1, b2, b3], C: [c] },
    partShoppingDay: { A: c, B: a3 },
    partLabel: {
      A: `${a1} – ${a3}`,
      B: `${b1} – ${b3}`,
      C: c,
    },
  };
}

// ── Structured part generation ────────────────────────────────────────────────

function pickDominantProtein(pool: Meal[]): string | null {
  const freq = new Map<string, number>();
  for (const m of pool) {
    const p = m.components.protein;
    freq.set(p, (freq.get(p) ?? 0) + 1);
  }
  const candidates = [...freq.entries()]
    .filter(([, count]) => count >= 2)
    .map(([protein]) => protein);
  return candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : null;
}

function generatePartPlan(
  days: Day[],
  pool: Meal[],
  keywords: string[],
  usedIds: Set<string>,
): Record<string, DayPlan> {
  const dominant = pickDominantProtein(pool);
  const scored = scoredPool(pool, keywords).map(m => ({
    ...m,
    score: dominant && m.components.protein === dominant ? m.score + 4 : m.score,
  }));

  const plan: Record<string, DayPlan> = {};
  for (const day of days) {
    plan[day] = {
      breakfast: pickMeal(scored, 'breakfast', usedIds),
      lunch: pickMeal(scored, 'lunch', usedIds),
      dinner: pickMeal(scored, 'dinner', usedIds),
    };
  }
  return plan;
}

export function generateStructuredMealPlan(
  restrictions: DietaryRestriction[],
  keywords: string[],
  eatingOutDay: string = 'Sun',
): StructuredWeekPlan {
  const { partDays } = getWeekStructure(eatingOutDay);

  const compatible = MEALS.filter(m =>
    restrictions.every(r => m.dietaryTags.includes(r)),
  );
  const pool = compatible.length >= 15 ? compatible : MEALS;
  const usedIds = new Set<string>();

  const partA = generatePartPlan(partDays.A, pool, keywords, usedIds);
  const partB = generatePartPlan(partDays.B, pool, keywords, usedIds);

  // Part C: eating-out day — one cooked lunch + eating-out dinner
  const cScored = scoredPool(pool, keywords);
  const cLunch = pickMeal(cScored, 'lunch', usedIds);
  const partC: Record<string, PartCDayPlan> = {
    [partDays.C[0]]: { lunch: cLunch, dinner: EATING_OUT },
  };

  return { A: partA, B: partB, C: partC };
}

// ── Alternate meal (refresh) ──────────────────────────────────────────────────

export function extractUsedIds(plan: StructuredWeekPlan): Set<string> {
  const ids = new Set<string>();
  for (const part of ['A', 'B'] as const) {
    for (const dayPlan of Object.values(plan[part])) {
      ids.add(dayPlan.breakfast.id);
      ids.add(dayPlan.lunch.id);
      ids.add(dayPlan.dinner.id);
    }
  }
  for (const dayPlan of Object.values(plan.C)) {
    ids.add(dayPlan.lunch.id);
  }
  return ids;
}

export function extractPlanIngredients(plan: StructuredWeekPlan): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  function push(raw: string) {
    for (const part of raw.split(/\s*&\s*/).map(s => s.trim())) {
      const key = part.toLowerCase();
      if (part && !seen.has(key)) {
        seen.add(key);
        result.push(part);
      }
    }
  }

  for (const partKey of ['A', 'B'] as const) {
    for (const dayPlan of Object.values(plan[partKey])) {
      for (const meal of [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner]) {
        push(meal.components.protein);
        push(meal.components.carb);
        push(meal.components.sauce);
        push(meal.components.vegetable);
      }
    }
  }
  for (const dayPlan of Object.values(plan.C)) {
    const { lunch } = dayPlan;
    push(lunch.components.protein);
    push(lunch.components.carb);
    push(lunch.components.sauce);
    push(lunch.components.vegetable);
  }

  return result;
}

export function getAlternateMeal(
  current: Meal,
  usedIds: Set<string>,
  restrictions: DietaryRestriction[],
): Meal {
  const fresh = MEALS.filter(
    m =>
      m.mealType === current.mealType &&
      m.id !== current.id &&
      !usedIds.has(m.id) &&
      restrictions.every(r => m.dietaryTags.includes(r)),
  );
  if (fresh.length > 0) return fresh[Math.floor(Math.random() * fresh.length)];

  const compatible = MEALS.filter(
    m =>
      m.mealType === current.mealType &&
      m.id !== current.id &&
      restrictions.every(r => m.dietaryTags.includes(r)),
  );
  if (compatible.length > 0)
    return compatible[Math.floor(Math.random() * compatible.length)];

  const any = MEALS.filter(m => m.mealType === current.mealType && m.id !== current.id);
  return any.length > 0 ? any[Math.floor(Math.random() * any.length)] : current;
}
