import { DietaryRestriction } from '@/contexts/AuthContext';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type Ingredient = {
  /** Ingredient key from data/ingredients.json, so the shopping list and prices can find it. */
  name: string;
  amount: number;
  unit: string; // 'g' | 'ml' | 'can' | 'tbsp' | 'tsp' | 'clove' | 'slice' | '' (piece/countable)
  /** How the amount reads in a recipe when that differs from amount + unit: "2 eggs", "2 cloves". */
  label?: string;
};

export type Meal = {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  difficulty: string;
  appliances: string[];
  mealType: MealType;
  dietaryTags: DietaryRestriction[];
  keywords: string[];
  emoji: string;
  /** Key of the ingredient the dish is built around: "chicken", "eggs", "oats". */
  main: string;
  ingredients: Ingredient[];
  /** Salt, spices, water: listed with the recipe, never counted or put on the shopping list. */
  seasonings?: string[];
  instructions: string[];
};

/** The main ingredient. Meals saved before recipes had `main` carry it as the protein of `components`. */
export function mainOf(meal: Meal): string {
  return meal.main ?? (meal as { components?: { protein?: string } }).components?.protein ?? '';
}

// In nearly every kitchen and nearly every recipe, so sharing them says nothing about two meals.
const STAPLES = new Set(['oil', 'olive oil', 'butter', 'garlic']);

/** Everything a meal needs besides its main ingredient and kitchen staples. */
function sideIngredients(meal: Meal): string[] {
  const main = mainOf(meal);
  return meal.ingredients.map(i => i.name).filter(n => n !== main && !STAPLES.has(n));
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Meals that fit the user's dietary restrictions. A meal type with nothing that
 * fits keeps all of its meals, so a plan can always be filled.
 */
function compatiblePool(restrictions: DietaryRestriction[]): Meal[] {
  const pool = ALL_MEALS.filter(m => restrictions.every(r => m.dietaryTags.includes(r)));
  for (const type of MEAL_TYPES) {
    if (!pool.some(m => m.mealType === type)) pool.push(...ALL_MEALS.filter(m => m.mealType === type));
  }
  return pool;
}

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

/**
 * All recipes as meals. Filled at runtime by RecipesProvider (contexts/RecipesContext.tsx),
 * which only renders the app once this has been populated.
 */
export const ALL_MEALS: Meal[] = [];

/** Replace the contents of ALL_MEALS in place so existing imports see the new list. */
export function setAllMeals(meals: Meal[]) {
  ALL_MEALS.splice(0, ALL_MEALS.length, ...meals);
}

// Meals we already have full copies of before the recipe list has loaded (the saved plan,
// the cached next Discover cards), so details / cook screens work right after app start.
const KNOWN_MEALS = new Map<string, Meal>();

export function rememberMeals(meals: Iterable<Meal>) {
  for (const meal of meals) KNOWN_MEALS.set(meal.id, meal);
}

/** Look a meal up in the full recipe list, falling back to meals we already know about. */
export function findMeal(id: string | undefined): Meal | undefined {
  if (!id) return undefined;
  return ALL_MEALS.find(m => m.id === id) ?? KNOWN_MEALS.get(id);
}

/** Every meal in a plan (eating-out entries excluded). */
export function planMeals(plan: StructuredWeekPlan): Meal[] {
  const out: Meal[] = [];
  for (const part of ['A', 'B'] as const) {
    for (const day of Object.values(plan[part])) out.push(day.breakfast, day.lunch, day.dinner);
  }
  for (const day of Object.values(plan.C)) out.push(day.lunch);
  return out;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoredPool(
  meals: Meal[],
  keywords: string[],
  likedIds: string[] = [],
): (Meal & { score: number })[] {
  // Collect what liked meals are made of so we can boost meals that share
  // ingredients with things the user enjoyed.
  const likedSet = new Set(likedIds);
  const likedMains = new Set<string>();
  const likedSides = new Set<string>();
  if (likedIds.length > 0) {
    for (const m of meals) {
      if (likedSet.has(m.id)) {
        likedMains.add(mainOf(m));
        for (const name of sideIngredients(m)) likedSides.add(name);
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

    // Similar-to-liked boost: shares ingredients with liked meals
    if (likedMains.size > 0 && !likedSet.has(m.id)) {
      if (likedMains.has(mainOf(m))) score += 3;
      score += Math.min(3, sideIngredients(m).filter(name => likedSides.has(name)).length);
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
  const pool = compatiblePool(restrictions);
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

/**
 * Pick 2 target proteins for a part, biased by the scored pool.
 * Only lunches and dinners count: a breakfast is built around oats or eggs,
 * not around the protein the part's shopping is planned for.
 * Sums per-protein scores from the already-scored meals (which factor in
 * keywords + liked preferences), then picks the top 2 with some randomness.
 * `excludeProteins` ensures Part B doesn't repeat Part A's proteins.
 */
function pickTargetProteins(
  pool: (Meal & { score: number })[],
  excludeProteins: Set<string>,
): [string, string] {
  const cooked = pool.filter(m => m.mealType !== 'breakfast');
  const proteinScore = new Map<string, number>();
  for (const m of cooked) {
    const p = mainOf(m);
    if (excludeProteins.has(p)) continue;
    proteinScore.set(p, (proteinScore.get(p) ?? 0) + m.score);
  }
  // Sort by aggregate score descending, pick from the top candidates
  const ranked = [...proteinScore.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) {
    // Fallback: ignore exclusions
    const all = new Map<string, number>();
    for (const m of cooked) {
      const p = mainOf(m);
      all.set(p, (all.get(p) ?? 0) + m.score);
    }
    const fallback = [...all.entries()].sort((a, b) => b[1] - a[1]);
    const a = fallback[0]?.[0] ?? 'chicken';
    const b = fallback[1]?.[0] ?? fallback[0]?.[0] ?? 'beef';
    return [a, b];
  }
  // Pick from top 4 candidates with a weighted random for variety
  const candidates = ranked.slice(0, Math.min(4, ranked.length));
  const totalWeight = candidates.reduce((s, [, w]) => s + w + 1, 0); // +1 so zero-score proteins still have a chance
  function weightedPick(exclude?: string): string {
    const filtered = exclude
      ? candidates.filter(([p]) => p !== exclude)
      : candidates;
    if (filtered.length === 0) return candidates[candidates.length - 1][0];
    const tw = filtered.reduce((s, [, w]) => s + w + 1, 0);
    let r = Math.random() * tw;
    for (const [p, w] of filtered) {
      r -= w + 1;
      if (r <= 0) return p;
    }
    return filtered[filtered.length - 1][0];
  }
  const first = weightedPick();
  const second = weightedPick(first);
  return [first, second];
}

/** Bonus for non-protein ingredient overlap with already-picked meals in this part. */
function nonProteinSharingScore(meal: Meal, picked: Meal[]): number {
  if (picked.length === 0) return 0;
  const seen = new Set<string>();
  for (const m of picked) {
    for (const name of sideIngredients(m)) seen.add(name);
  }
  return Math.min(5, 2 * sideIngredients(meal).filter(name => seen.has(name)).length);
}

function pickMealWithSharing(
  pool: (Meal & { score: number })[],
  mealType: MealType,
  usedIds: Set<string>,
  pickedInPart: Meal[],
  targetProteins: Set<string>,
): Meal {
  const typePool = pool.filter(m => m.mealType === mealType);
  const unused = typePool.filter(m => !usedIds.has(m.id));
  const source = unused.length > 0 ? unused : typePool;

  const boosted = source.map(m => {
    let bonus = nonProteinSharingScore(m, pickedInPart);
    if (mealType !== 'breakfast') {
      // Strong boost for matching one of the 2 target proteins
      if (targetProteins.has(mainOf(m))) bonus += 4;
      // Penalise proteins outside the target pair
      else bonus -= 3;
    }
    return { ...m, score: m.score + bonus };
  });

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
  excludeProteins: Set<string> = new Set(),
): { plan: Record<string, DayPlan>; proteins: Set<string> } {
  const scored = scoredPool(pool, keywords, likedIds);
  const [prot1, prot2] = pickTargetProteins(scored, excludeProteins);
  const targetProteins = new Set([prot1, prot2]);
  const pickedInPart: Meal[] = [];

  const plan: Record<string, DayPlan> = {};
  for (const day of days) {
    const breakfast = pickMealWithSharing(scored, 'breakfast', usedIds, pickedInPart, targetProteins);
    pickedInPart.push(breakfast);
    const lunch = pickMealWithSharing(scored, 'lunch', usedIds, pickedInPart, targetProteins);
    pickedInPart.push(lunch);
    const dinner = pickMealWithSharing(scored, 'dinner', usedIds, pickedInPart, targetProteins);
    pickedInPart.push(dinner);
    plan[day] = { breakfast, lunch, dinner };
  }
  return { plan, proteins: targetProteins };
}

export function generateStructuredMealPlan(
  restrictions: DietaryRestriction[],
  keywords: string[],
  eatingOutDay: string = 'Sun',
  likedIds: string[] = [],
): StructuredWeekPlan {
  const { partDays } = getWeekStructure(eatingOutDay);

  const pool = compatiblePool(restrictions);
  const usedIds = new Set<string>();

  // Part A picks 2 proteins; Part B excludes those so the week has 4 distinct proteins
  const resultA = generatePartPlan(partDays.A, pool, keywords, usedIds, likedIds);
  const resultB = generatePartPlan(partDays.B, pool, keywords, usedIds, likedIds, resultA.proteins);

  // Part C: eating-out day — one cooked lunch + eating-out dinner
  const cScored = scoredPool(pool, keywords, likedIds);
  const cLunch = pickMeal(cScored, 'lunch', usedIds);
  const partC: Record<string, PartCDayPlan> = {
    [partDays.C[0]]: { lunch: cLunch, dinner: EATING_OUT },
  };

  const partA = resultA.plan;
  const partB = resultB.plan;
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

/** One shopping-list line for a plan, and how many meals need that ingredient. */
export type PlanIngredient = { name: string; uses: number };

export function extractPartIngredients(plan: StructuredWeekPlan, part: WeekPart): PlanIngredient[] {
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

  const result: PlanIngredient[] = [];
  const push = (name: string, uses: number) => result.push({ name, uses });

  for (const [, instances] of groups) {
    const { name, unit } = instances[0];

    if (unit === 'can') {
      const count = instances.length;
      push(count > 1 ? `x${count} ${name}` : name, count);

    } else if (!unit) {
      const total = instances.reduce((s, i) => s + i.amount, 0);
      push(total > 1 ? `x${total} ${name}` : name, total);

    } else if (unit === 'g' || unit === 'ml' || unit === 'kg' || unit === 'l') {
      // One total to buy: "400g carrots", not "x4 100g carrots".
      const total = instances.reduce((s, i) => s + i.amount, 0);
      push(`${total}${unit} ${name}`, instances.length);

    } else {
      const total = instances.reduce((s, i) => s + i.amount, 0);
      push(`${total} ${unit} ${name}`, instances.length);
    }
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
