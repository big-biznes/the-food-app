import { DietaryRestriction } from '@/contexts/AuthContext';
import { goalScore, personalize } from './portions';
import { formatQuantity } from './quantity';
import i18n from '../lib/i18n';
import type { Targets } from './portions';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Meals that can trade places in a plan: breakfasts with breakfasts, snacks with
 * snacks, lunches and dinners with each other.
 */
export function swapGroup(type: MealType): 'breakfast' | 'snack' | 'main' {
  return type === 'breakfast' || type === 'snack' ? type : 'main';
}

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
  /** The categories the meal belongs to (see CATEGORIES); absent on meals saved before they existed. */
  tags?: string[];
  keywords: string[];
  emoji: string;
  /** Key of the ingredient the dish is built around: "chicken", "eggs", "oats". */
  main: string;
  ingredients: Ingredient[];
  /** Salt, spices, water: listed with the recipe, never counted or put on the shopping list. */
  seasonings?: string[];
  instructions: string[];
  /**
   * The steps and seasonings as written in the cookbook, when they contain numbers that
   * depend on the portion ("roll into {8} balls"). `instructions` and `seasonings` hold
   * the same text filled in for the standard recipe; data/portions.ts fills it in per person.
   */
  templates?: { instructions: string[]; seasonings: string[] };
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

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

// ── Categories a plan can focus on ───────────────────────────────────────────
// Recipes get these from scripts/recipes/lib.mjs: quick, light and hearty are
// computed from the recipe, the others are written by the recipe's author.

/** Where a dish comes from. A dish has at most one or two; a plan asking for several wants any of them. */
export const CUISINES = ['asian', 'italian', 'mediterranean', 'mexican'];
/** What a dish is like. A plan asking for several wants dishes that are all of them. */
export const QUALITIES = ['spicy', 'light', 'hearty', 'fresh', 'comfort', 'quick'];
export const CATEGORIES = [...CUISINES, ...QUALITIES];

export type Focus = { cuisines: string[]; qualities: string[] };

/** The focus in a list of chosen chips or typed words; anything that is not a category is ignored. */
export function toFocus(words: string[]): Focus {
  const chosen = new Set(words.map(w => w.toLowerCase().trim()));
  return { cuisines: CUISINES.filter(c => chosen.has(c)), qualities: QUALITIES.filter(q => chosen.has(q)) };
}

const hasFocus = (focus: Focus) => focus.cuisines.length + focus.qualities.length > 0;

function tagsOf(meal: Meal): string[] {
  return meal.tags ?? meal.keywords.filter(k => CATEGORIES.includes(k));
}

/** Calories that bound the lightest and the heaviest third of each meal type in a set of meals. */
type CalorieThirds = Record<MealType, { low: number; high: number }>;

function calorieThirds(meals: Meal[]): CalorieThirds {
  const out = {} as CalorieThirds;
  for (const type of MEAL_TYPES) {
    const kcal = meals.filter(m => m.mealType === type).map(m => m.calories).sort((a, b) => a - b);
    const at = (share: number) => kcal[Math.floor(share * (kcal.length - 1))] ?? 0;
    out[type] = { low: at(1 / 3), high: at(2 / 3) };
  }
  return out;
}

/** "Quick" when nothing is truly quick: still on the table in half an hour. */
const NEARLY_QUICK_MINUTES = 30;

/**
 * How well a meal fits the focus; higher is better, 0 when there is no focus.
 *
 * The cuisine counts for more than all qualities together, so a Mexican plan
 * stays Mexican before it gets light or quick. A quality that is measured
 * (light, hearty, quick) gives half credit to the meals that come closest, so
 * asking for "light" still means the lightest dishes when none is truly light.
 */
function focusFit(meal: Meal, focus: Focus, thirds: CalorieThirds): number {
  const tags = tagsOf(meal);
  let fit = 0;
  if (focus.cuisines.some(c => tags.includes(c))) fit += focus.qualities.length + 1;
  for (const q of focus.qualities) {
    if (tags.includes(q)) fit += 1;
    else if (q === 'light' && meal.calories <= thirds[meal.mealType].low) fit += 0.5;
    else if (q === 'hearty' && meal.calories >= thirds[meal.mealType].high) fit += 0.5;
    else if (q === 'quick' && meal.prepTime <= NEARLY_QUICK_MINUTES) fit += 0.5;
  }
  return fit;
}

/** The meals that fit the focus best out of `meals` (all of them when there is no focus). */
function bestFitting<T extends { focus: number }>(meals: T[]): T[] {
  const best = Math.max(...meals.map(m => m.focus));
  return meals.filter(m => m.focus === best);
}

type ScoredMeal = Meal & { score: number; focus: number };

/** Drop the scoring fields again, so only the meal itself is stored in a plan. */
function plain({ score: _score, focus: _focus, ...meal }: ScoredMeal): Meal {
  return meal;
}

/**
 * Meals that fit the user's dietary restrictions. A meal type with nothing that
 * fits keeps all of its meals, so a plan can always be filled (snacks excepted).
 */
function compatiblePool(restrictions: DietaryRestriction[]): Meal[] {
  const pool = ALL_MEALS.filter(m => restrictions.every(r => m.dietaryTags.includes(r)));
  for (const type of MEAL_TYPES) {
    // A snack is an extra: none at all is better than one the person cannot eat.
    if (type === 'snack') continue;
    if (!pool.some(m => m.mealType === type)) pool.push(...ALL_MEALS.filter(m => m.mealType === type));
  }
  return pool;
}

/** Format a single ingredient for display on the meal card */
export function formatIngredient(ing: Ingredient): string {
  // "2 eggs" already names the ingredient; "2 cloves" needs it: "2 cloves garlic".
  if (ing.label) return ing.label.includes(ing.name.replace(/s$/, '')) ? ing.label : `${ing.label} ${ing.name}`;
  if (!ing.unit) {
    return ing.amount > 1 ? `${ing.amount} ${ing.name}` : ing.name;
  }
  return `${formatQuantity(ing.amount, ing.unit)} ${ing.name}`;
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
  /** Only for people whose day is too big for three meals; see data/portions.ts. */
  snack?: Meal;
};

/**
 * The day on its own at the end of the week. For someone who eats out it is the
 * eating-out day: breakfast and lunch at home, dinner out. For someone who does not,
 * it is a full day of cooking. Plans made before the eating-out day had a breakfast
 * have none.
 */
export type PartCDayPlan = {
  breakfast?: Meal;
  lunch: Meal;
  dinner: Meal | EatingOutEntry;
  snack?: Meal;
};

/** The value of the profile's eating-out day for someone who does not eat out. */
export const NO_EATING_OUT = 'none';

/** One meal's place in a plan. */
export type PlanSlot = { part: WeekPart; day: string; mealType: MealType };

/** Every cooked meal of a plan with its place (eating-out entries excluded). */
export function planSlots(plan: StructuredWeekPlan): (PlanSlot & { meal: Meal })[] {
  const out: (PlanSlot & { meal: Meal })[] = [];
  for (const part of ['A', 'B', 'C'] as const) {
    for (const [day, dayPlan] of Object.entries(plan[part])) {
      for (const mealType of MEAL_TYPES) {
        const meal = (dayPlan as Partial<Record<MealType, Meal | EatingOutEntry>>)[mealType];
        if (meal && !('isEatingOut' in meal)) out.push({ part, day, mealType, meal });
      }
    }
  }
  return out;
}

/** The cooked meal at a place in the plan, if there is one. */
export function mealAt(plan: StructuredWeekPlan, slot: PlanSlot): Meal | undefined {
  const meal = (plan[slot.part][slot.day] as Partial<Record<MealType, Meal | EatingOutEntry>> | undefined)?.[slot.mealType];
  return meal && !('isEatingOut' in meal) ? meal : undefined;
}

/** The plan without the snack of one day. */
export function withoutSnack(plan: StructuredWeekPlan, part: WeekPart, day: string): StructuredWeekPlan {
  const { snack: _snack, ...rest } = plan[part][day] as DayPlan;
  return { ...plan, [part]: { ...plan[part], [day]: rest } };
}

/** The plan without any snacks. */
export function removeSnacks(plan: StructuredWeekPlan): StructuredWeekPlan {
  let next = plan;
  for (const slot of planSlots(plan)) if (slot.mealType === 'snack') next = withoutSnack(next, slot.part, slot.day);
  return next;
}

/**
 * The plan with a snack on every day that has none, from the snacks that fit the
 * dietary restrictions; days stay without one when no snack fits.
 */
export function addSnacks(plan: StructuredWeekPlan, restrictions: DietaryRestriction[]): StructuredWeekPlan {
  const fitting = ALL_MEALS.filter(m => m.mealType === 'snack' && fitsRestrictions(m, restrictions));
  if (fitting.length === 0) return plan;
  const used = extractUsedIds(plan);
  let next = plan;
  for (const part of ['A', 'B', 'C'] as const) {
    for (const [day, dayPlan] of Object.entries(plan[part])) {
      if (dayPlan.snack) continue;
      const fresh = fitting.filter(m => !used.has(m.id));
      const from = fresh.length > 0 ? fresh : fitting;
      const snack = from[Math.floor(Math.random() * from.length)];
      used.add(snack.id);
      next = withMeal(next, { part, day, mealType: 'snack' }, snack);
    }
  }
  return next;
}

/** The plan with one of its meals replaced. */
export function withMeal(plan: StructuredWeekPlan, slot: PlanSlot, meal: Meal): StructuredWeekPlan {
  return {
    ...plan,
    [slot.part]: { ...plan[slot.part], [slot.day]: { ...plan[slot.part][slot.day], [slot.mealType]: meal } },
  };
}

/** Whether a meal fits every one of the dietary restrictions. */
export function fitsRestrictions(meal: Meal, restrictions: DietaryRestriction[]): boolean {
  return restrictions.every(r => meal.dietaryTags.includes(r));
}

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
  return planSlots(plan).map(slot => slot.meal);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoredPool(
  meals: Meal[],
  keywords: string[],
  likedIds: string[] = [],
  focus: Focus = { cuisines: [], qualities: [] },
  targets: Targets | null = null,
): ScoredMeal[] {
  const thirds = calorieThirds(meals);
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
    // Meals that suit the person's goal and need little scaling to fit their day.
    let score = goalScore(m, targets);

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

    return { ...m, score, focus: focusFit(m, focus, thirds) };
  });
}

function pickMeal(
  pool: ScoredMeal[],
  mealType: MealType,
  usedIds: Set<string>,
): Meal {
  const typePool = pool.filter(m => m.mealType === mealType);
  const unused = typePool.filter(m => !usedIds.has(m.id));
  // The focus comes first: only the best-fitting meals that are still unused compete.
  const source = bestFitting(unused.length > 0 ? unused : typePool);

  const sorted = [...source].sort((a, b) => b.score - a.score);
  // Snacks are few; drawing from more of them keeps a week from repeating the same three.
  const topN = sorted.slice(0, Math.min(mealType === 'snack' ? 6 : 3, sorted.length));
  const pick = plain(topN[Math.floor(Math.random() * topN.length)]);

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

const short = (day: Day) => i18n.t(`daysShort.${day}`);

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
    // In the app's language: "Mon – Wed", "Пн – Ср".
    partLabel: {
      A: `${short(a1)} – ${short(a3)}`,
      B: `${short(b1)} – ${short(b3)}`,
      C: short(c),
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
  pool: ScoredMeal[],
  excludeProteins: Set<string>,
): [string, string] {
  // With a focus, only the lunches and dinners that fit it best get a say, so the
  // part is planned around proteins the focus can actually be cooked with.
  const all = pool.filter(m => m.mealType !== 'breakfast');
  const cooked = all.length > 0 ? bestFitting(all) : all;
  const proteinScore = new Map<string, number>();
  for (const m of cooked) {
    const p = mainOf(m);
    if (excludeProteins.has(p)) continue;
    // Every meal counts once on top of its score, so a protein with many suitable
    // meals is likelier than one with a single recipe, also when nothing is scored.
    proteinScore.set(p, (proteinScore.get(p) ?? 0) + m.score + 1);
  }
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
  // Weighted random over every protein, for variety from week to week
  const candidates = ranked;
  function weightedPick(exclude?: string): string {
    const filtered = exclude
      ? candidates.filter(([p]) => p !== exclude)
      : candidates;
    if (filtered.length === 0) return candidates[candidates.length - 1][0];
    const tw = filtered.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * tw;
    for (const [p, w] of filtered) {
      r -= w;
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
  pool: ScoredMeal[],
  mealType: MealType,
  usedIds: Set<string>,
  pickedInPart: Meal[],
  targetProteins: Set<string>,
): Meal {
  const typePool = pool.filter(m => m.mealType === mealType);
  const unused = typePool.filter(m => !usedIds.has(m.id));
  // The focus comes first: only the best-fitting meals that are still unused compete,
  // and ingredient sharing and the part's proteins decide among those.
  const source = bestFitting(unused.length > 0 ? unused : typePool);

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
  const pick = plain(topN[Math.floor(Math.random() * topN.length)]);

  usedIds.add(pick.id);
  return pick;
}

/** A day gets a snack when the person's day is big enough and the cookbook has snacks. */
function wantsSnack(pool: Meal[], targets: Targets | null): boolean {
  return Boolean(targets?.snack) && pool.some(m => m.mealType === 'snack');
}

function generatePartPlan(
  days: Day[],
  pool: Meal[],
  keywords: string[],
  usedIds: Set<string>,
  likedIds: string[] = [],
  excludeProteins: Set<string> = new Set(),
  focus?: Focus,
  targets: Targets | null = null,
): { plan: Record<string, DayPlan>; proteins: Set<string> } {
  const scored = scoredPool(pool, keywords, likedIds, focus, targets);
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
    if (wantsSnack(scored, targets)) plan[day].snack = pickMeal(scored, 'snack', usedIds);
  }
  return { plan, proteins: targetProteins };
}

export function generateStructuredMealPlan(
  restrictions: DietaryRestriction[],
  keywords: string[],
  eatingOutDay: string = 'Sun',
  likedIds: string[] = [],
  /** Categories the plan should focus on (chip names); see CATEGORIES. */
  focusOn: string[] = [],
  /** The person's energy targets, to favour meals that suit their goal; see data/portions.ts. */
  targets: Targets | null = null,
): StructuredWeekPlan {
  const focus = toFocus(focusOn);
  const { partDays } = getWeekStructure(eatingOutDay);

  const pool = compatiblePool(restrictions);
  const usedIds = new Set<string>();

  // Part A picks 2 proteins; Part B excludes those so the week has 4 distinct proteins
  const resultA = generatePartPlan(partDays.A, pool, keywords, usedIds, likedIds, new Set(), focus, targets);
  const resultB = generatePartPlan(partDays.B, pool, keywords, usedIds, likedIds, resultA.proteins, focus, targets);

  // Part C: the eating-out day — breakfast and lunch at home, dinner out. Without an
  // eating-out day the week still ends on a day of its own (Sunday), cooked in full.
  const cScored = scoredPool(pool, keywords, likedIds, focus, targets);
  const cooksAll = eatingOutDay === NO_EATING_OUT;
  const partC: Record<string, PartCDayPlan> = {
    [partDays.C[0]]: {
      breakfast: pickMeal(cScored, 'breakfast', usedIds),
      lunch: pickMeal(cScored, 'lunch', usedIds),
      dinner: cooksAll ? pickMeal(cScored, 'dinner', usedIds) : EATING_OUT,
      ...(wantsSnack(cScored, targets) ? { snack: pickMeal(cScored, 'snack', usedIds) } : {}),
    },
  };

  const partA = resultA.plan;
  const partB = resultB.plan;
  const plan: StructuredWeekPlan = { A: partA, B: partB, C: partC };

  // ── Liked-meal injection ────────────────────────────────────────────────────
  // Not for a focused plan: a liked meal that fits the focus is already favoured,
  // and one that does not fit would break it.
  if (likedIds.length > 0 && !hasFocus(focus)) {
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
        // A liked snack only goes into a plan that has snacks.
        if (dayPlan && (chosen.mealType !== 'snack' || dayPlan.snack)) {
          dayPlan[chosen.mealType] = chosen;
        }
      }
    }
  }

  return plan;
}

// ── Alternate meal (refresh) ──────────────────────────────────────────────────

export function extractUsedIds(plan: StructuredWeekPlan): Set<string> {
  return new Set(planMeals(plan).map(m => m.id));
}

/** One shopping-list line for a plan, and how many meals need that ingredient. */
export type PlanIngredient = { name: string; uses: number };

/**
 * The parts one shopping trip covers. The day on its own at the end of the week has no
 * shop of its own: its food is bought on the second shopping day, with the days before it.
 */
export function shopParts(part: WeekPart): WeekPart[] {
  return part === 'A' ? ['A'] : ['B', 'C'];
}

/** The shopping list for the trip that covers `part` (see shopParts). */
export function extractPartIngredients(
  plan: StructuredWeekPlan,
  part: WeekPart,
  /** The person's energy targets, so the list is for the portions they will cook. */
  targets: Targets | null = null,
  /** Ingredients the person left out of a meal, by meal id; those are not bought. */
  without: Record<string, string[]> = {},
): PlanIngredient[] {
  const groups = new Map<string, Ingredient[]>();
  const ingredientsOf = (meal: Meal) => personalize(meal, targets, without[meal.id]).ingredients;

  function collect(ing: Ingredient) {
    const key = ing.name.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }

  const parts = shopParts(part);
  for (const slot of planSlots(plan)) {
    if (!parts.includes(slot.part)) continue;
    for (const ing of ingredientsOf(slot.meal)) collect(ing);
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
  /** Categories the plan was made for, so a replacement stays in theme. */
  focusOn: string[] = [],
): Meal {
  const fresh = ALL_MEALS.filter(
    m =>
      m.mealType === current.mealType &&
      m.id !== current.id &&
      !usedIds.has(m.id) &&
      restrictions.every(r => m.dietaryTags.includes(r)),
  );
  if (fresh.length > 0) {
    const focus = toFocus(focusOn);
    const thirds = calorieThirds(ALL_MEALS);
    const fitting = bestFitting(fresh.map(meal => ({ meal, focus: focusFit(meal, focus, thirds) })));
    return fitting[Math.floor(Math.random() * fitting.length)].meal;
  }

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
