import { DietaryRestriction } from '@/contexts/AuthContext';
import { RECIPES } from './recipes';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type MealComponents = {
  protein: string;
  carb: string;
  sauce: string;
  vegetable: string;
};

export type Ingredient = {
  name: string;
  amount: number;
  unit: string; // 'g' | 'ml' | 'can' | 'tbsp' | 'tsp' | 'clove' | 'slice' | '' (piece/countable)
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
  ingredients: Ingredient[];
  instructions: string[];
};

/** Format a single ingredient for display on the meal card */
export function formatIngredient(ing: Ingredient): string {
  if (!ing.unit) {
    return ing.amount > 1 ? `${ing.amount} ${ing.name}` : ing.name;
  }
  if (ing.unit === 'g' || ing.unit === 'ml' || ing.unit === 'kg' || ing.unit === 'l') {
    return `${ing.amount}${ing.unit} ${ing.name}`;
  }
  // can, tbsp, tsp, clove, slice, etc.
  return `${ing.amount} ${ing.unit} ${ing.name}`;
}

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

export type WeekPlan = Record<string, DayPlan>;

export const ALL_MEALS: Meal[] = RECIPES;

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoredPool(
  meals: Meal[],
  keywords: string[],
  likedIds: string[] = [],
): (Meal & { score: number })[] {
  // Build a set of components that appear in liked meals so we can
  // boost meals that share ingredients with things the user enjoyed.
  const likedSet = new Set(likedIds);
  const likedComponents = new Set<string>();
  if (likedIds.length > 0) {
    for (const m of meals) {
      if (likedSet.has(m.id)) {
        likedComponents.add(m.components.protein);
        likedComponents.add(m.components.carb);
        likedComponents.add(m.components.vegetable);
        likedComponents.add(m.components.sauce);
      }
    }
  }

  return meals.map(m => {
    let score = 0;

    // Keyword match score
    if (keywords.length > 0) {
      score += m.keywords.filter(k =>
        keywords.some(kw => k.includes(kw) || kw.includes(k)),
      ).length;
    }

    // Liked-meal boost: exact liked meal gets a strong boost
    if (likedSet.has(m.id)) {
      score += 6;
    }

    // Similar-to-liked boost: shares components with liked meals
    if (likedComponents.size > 0 && !likedSet.has(m.id)) {
      if (likedComponents.has(m.components.protein)) score += 3;
      if (likedComponents.has(m.components.carb)) score += 1;
      if (likedComponents.has(m.components.vegetable)) score += 1;
      if (likedComponents.has(m.components.sauce)) score += 1;
    }

    return { ...m, score };
  });
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

export function generateMealPlan(
  restrictions: DietaryRestriction[],
  cravingKeywords: string[],
): WeekPlan {
  const compatible = ALL_MEALS.filter(m =>
    restrictions.every(r => m.dietaryTags.includes(r)),
  );
  const pool = compatible.length >= 15 ? compatible : ALL_MEALS;
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

/** Count how many component fields a meal shares with already-picked meals. */
function sharedIngredientScore(meal: Meal, picked: Meal[]): number {
  if (picked.length === 0) return 0;
  const seen = new Set<string>();
  for (const m of picked) {
    seen.add(m.components.protein);
    seen.add(m.components.carb);
    seen.add(m.components.vegetable);
    seen.add(m.components.sauce);
  }
  let score = 0;
  if (seen.has(meal.components.protein)) score += 3; // protein overlap is most valuable for shopping
  if (seen.has(meal.components.carb)) score += 2;
  if (seen.has(meal.components.vegetable)) score += 2;
  if (seen.has(meal.components.sauce)) score += 1;
  return score;
}

function pickMealWithSharing(
  pool: (Meal & { score: number })[],
  mealType: MealType,
  usedIds: Set<string>,
  pickedInPart: Meal[],
): Meal {
  const typePool = pool.filter(m => m.mealType === mealType);
  const unused = typePool.filter(m => !usedIds.has(m.id));
  const source = unused.length > 0 ? unused : typePool;

  // Add ingredient-sharing bonus to the keyword score
  const boosted = source.map(m => ({
    ...m,
    score: m.score + sharedIngredientScore(m, pickedInPart),
  }));

  const sorted = [...boosted].sort((a, b) => b.score - a.score);
  const topN = sorted.slice(0, Math.min(5, sorted.length));
  const { score: _s, ...pick } = topN[Math.floor(Math.random() * topN.length)];

  usedIds.add(pick.id);
  return pick;
}

function generatePartPlan(
  days: Day[],
  pool: Meal[],
  keywords: string[],
  usedIds: Set<string>,
  likedIds: string[] = [],
): Record<string, DayPlan> {
  const scored = scoredPool(pool, keywords, likedIds);
  const pickedInPart: Meal[] = [];

  const plan: Record<string, DayPlan> = {};
  for (const day of days) {
    const breakfast = pickMealWithSharing(scored, 'breakfast', usedIds, pickedInPart);
    pickedInPart.push(breakfast);
    const lunch = pickMealWithSharing(scored, 'lunch', usedIds, pickedInPart);
    pickedInPart.push(lunch);
    const dinner = pickMealWithSharing(scored, 'dinner', usedIds, pickedInPart);
    pickedInPart.push(dinner);
    plan[day] = { breakfast, lunch, dinner };
  }
  return plan;
}

export function generateStructuredMealPlan(
  restrictions: DietaryRestriction[],
  keywords: string[],
  eatingOutDay: string = 'Sun',
  likedIds: string[] = [],
): StructuredWeekPlan {
  const { partDays } = getWeekStructure(eatingOutDay);

  const compatible = ALL_MEALS.filter(m =>
    restrictions.every(r => m.dietaryTags.includes(r)),
  );
  const pool = compatible.length >= 15 ? compatible : ALL_MEALS;
  const usedIds = new Set<string>();

  const partA = generatePartPlan(partDays.A, pool, keywords, usedIds, likedIds);
  const partB = generatePartPlan(partDays.B, pool, keywords, usedIds, likedIds);

  // Part C: eating-out day — one cooked lunch + eating-out dinner
  const cScored = scoredPool(pool, keywords, likedIds);
  const cLunch = pickMeal(cScored, 'lunch', usedIds);
  const partC: Record<string, PartCDayPlan> = {
    [partDays.C[0]]: { lunch: cLunch, dinner: EATING_OUT },
  };

  const plan: StructuredWeekPlan = { A: partA, B: partB, C: partC };

  // ── Liked-meal injection ────────────────────────────────────────────────────
  if (likedIds.length > 0) {
    const planIds = extractUsedIds(plan);
    const alreadyHasLiked = likedIds.some(id => planIds.has(id));
    if (!alreadyHasLiked) {
      const candidates = ALL_MEALS.filter(
        m =>
          likedIds.includes(m.id) &&
          restrictions.every(r => m.dietaryTags.includes(r)),
      );
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const targetDay = partDays.A[0];
        const dayPlan = partA[targetDay];
        if (dayPlan) {
          dayPlan[chosen.mealType] = chosen;
        }
      }
    }
  }

  return plan;
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

export function extractPartIngredients(plan: StructuredWeekPlan, part: WeekPart): string[] {
  const groups = new Map<string, Ingredient[]>();

  function collect(ing: Ingredient) {
    const key = ing.name.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }

  if (part === 'C') {
    for (const dayPlan of Object.values(plan.C)) {
      for (const ing of dayPlan.lunch.ingredients) collect(ing);
    }
  } else {
    for (const dayPlan of Object.values(plan[part])) {
      for (const meal of [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner]) {
        for (const ing of meal.ingredients) collect(ing);
      }
    }
  }

  const result: string[] = [];

  for (const [, instances] of groups) {
    const { name, unit } = instances[0];

    if (unit === 'can') {
      const count = instances.length;
      result.push(count > 1 ? `x${count} ${name}` : name);

    } else if (!unit) {
      const total = instances.reduce((s, i) => s + i.amount, 0);
      result.push(total > 1 ? `x${total} ${name}` : name);

    } else if (unit === 'g' || unit === 'ml' || unit === 'kg' || unit === 'l') {
      const allSame = instances.every(i => i.amount === instances[0].amount);
      if (instances.length > 1 && allSame) {
        result.push(`x${instances.length} ${instances[0].amount}${unit} ${name}`);
      } else {
        const total = instances.reduce((s, i) => s + i.amount, 0);
        result.push(`${total}${unit} ${name}`);
      }

    } else {
      const total = instances.reduce((s, i) => s + i.amount, 0);
      result.push(`${total} ${unit} ${name}`);
    }
  }

  return result;
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
  const fresh = ALL_MEALS.filter(
    m =>
      m.mealType === current.mealType &&
      m.id !== current.id &&
      !usedIds.has(m.id) &&
      restrictions.every(r => m.dietaryTags.includes(r)),
  );
  if (fresh.length > 0) return fresh[Math.floor(Math.random() * fresh.length)];

  const compatible = ALL_MEALS.filter(
    m =>
      m.mealType === current.mealType &&
      m.id !== current.id &&
      restrictions.every(r => m.dietaryTags.includes(r)),
  );
  if (compatible.length > 0)
    return compatible[Math.floor(Math.random() * compatible.length)];

  const any = ALL_MEALS.filter(m => m.mealType === current.mealType && m.id !== current.id);
  return any.length > 0 ? any[Math.floor(Math.random() * any.length)] : current;
}
