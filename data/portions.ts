// Portions sized for the person: how much energy they need in a day, how that is
// spread over the meals, and a recipe scaled to its share.
//
// A recipe in the cookbook is one standard serving. What the user sees is that
// recipe with the amounts scaled to their own target, and the nutrition worked
// out again from the scaled amounts, so the numbers always match the ingredients.

import ingredientDefs from './ingredients.json';
import type { Ingredient, Meal, MealType } from './meals';

export type Goal = 'lose' | 'gain' | 'maintain';
/** How much someone moves on a normal day, work and exercise together. */
export type Activity = 'low' | 'light' | 'active' | 'very';
/** Which meals the plan leans towards, on top of the goal. */
export type MacroBalance = 'balanced' | 'low-carb' | 'high-protein';

/** What is needed from the user's profile. */
export type Body = {
  goal: Goal;
  gender: 'male' | 'female' | 'other';
  age: number;
  heightCm: number;
  weightKg: number;
  /** Profiles made before the app asked are treated as 'light'. */
  activity?: Activity;
  macroBalance?: MacroBalance;
  /** Whether the person wants a snack next to the three meals. Off unless they said yes. */
  snacks?: boolean;
};

/** The measurements a daily target can be worked out from; outside these the profile is ignored. */
export const BODY_LIMITS = {
  age: { min: 14, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 250 },
};

export type Targets = {
  goal: Goal;
  /** Energy for the whole day. */
  kcal: number;
  /** Energy for each meal; `snack` is 0 when the day has no snack. */
  perMeal: Record<MealType, number>;
  /** Whether the day gets a snack next to the three meals. */
  snack: boolean;
  macro: MacroBalance;
};

// Energy used in a day as a multiple of energy used at rest: the usual factors
// for a desk job with little exercise, some exercise, exercise most days, and
// physical work or daily training.
export const ACTIVITY_FACTOR: Record<Activity, number> = { low: 1.2, light: 1.4, active: 1.6, very: 1.8 };
/** Eat this share of what the body uses: a moderate deficit, a small surplus. */
const GOAL_FACTOR: Record<Goal, number> = { lose: 0.8, maintain: 1, gain: 1.1 };
/** Below this a diet is not something an app should hand out. */
const MIN_KCAL = { male: 1500, female: 1200, other: 1350 };
/** Under this BMI a person is underweight, and is not given a deficit even if they ask to lose weight. */
const UNDERWEIGHT_BMI = 18.5;
/** How the day is divided over the three meals. */
const MEAL_SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.4 };
// Three meals stop being enough for a big day: even stretched to MAX_PORTION they
// fall short, or turn into plates nobody finishes. From SNACK_FROM_KCAL the app
// asks whether the person wants a snack. Whoever wants one (at any target) gets a snack that
// takes a share of the day and the meals share the rest.
export const SNACK_FROM_KCAL = 2800;
const BIG_SNACK_FROM_KCAL = 3400;
const SNACK_SHARE = 0.1;
const BIG_SNACK_SHARE = 0.15;
/** A recipe is never shrunk or stretched beyond this; outside it the dish stops working. */
export const MIN_PORTION = 0.6;
export const MAX_PORTION = 1.8;

const within = (n: number, { min, max }: { min: number; max: number }) => n >= min && n <= max;
const plausible = (b: Body) =>
  within(b.age, BODY_LIMITS.age) && within(b.heightCm, BODY_LIMITS.heightCm) && within(b.weightKg, BODY_LIMITS.weightKg);

export function bmi(body: Pick<Body, 'heightCm' | 'weightKg'>): number {
  const m = body.heightCm / 100;
  return body.weightKg / (m * m);
}

/**
 * Daily energy target, or null when the profile has no usable measurements.
 *
 * Resting energy use comes from the Mifflin-St Jeor equation, which uses the
 * same height, weight and age as BMI but estimates energy rather than a
 * weight class. BMI is only used as a guard.
 */
export function dailyTargets(body: Body | null | undefined): Targets | null {
  if (!body || !plausible(body)) return null;
  const sexTerm = body.gender === 'male' ? 5 : body.gender === 'female' ? -161 : -78;
  const resting = 10 * body.weightKg + 6.25 * body.heightCm - 5 * body.age + sexTerm;
  const maintenance = resting * ACTIVITY_FACTOR[body.activity ?? 'light'];
  const goal: Goal = body.goal === 'lose' && bmi(body) < UNDERWEIGHT_BMI ? 'maintain' : body.goal;
  const kcal = Math.round(Math.max(maintenance * GOAL_FACTOR[goal], MIN_KCAL[body.gender]) / 10) * 10;
  const snackShare = !body.snacks ? 0 : kcal >= BIG_SNACK_FROM_KCAL ? BIG_SNACK_SHARE : SNACK_SHARE;
  const meals = kcal * (1 - snackShare);
  return {
    goal,
    kcal,
    perMeal: {
      breakfast: Math.round(meals * MEAL_SHARE.breakfast),
      lunch: Math.round(meals * MEAL_SHARE.lunch),
      dinner: Math.round(meals * MEAL_SHARE.dinner),
      snack: Math.round(kcal * snackShare),
    },
    snack: snackShare > 0,
    macro: body.macroBalance ?? 'balanced',
  };
}

/** How much of the standard recipe this person gets: 1 is the recipe as written. */
export function portionOf(meal: Meal, targets: Targets): number {
  const share = targets.perMeal[meal.mealType];
  // A snack looked at by someone whose day has no snack: the recipe as written.
  if (!(share > 0)) return 1;
  return Math.min(MAX_PORTION, Math.max(MIN_PORTION, share / meal.calories));
}

// ── Scaling a recipe ─────────────────────────────────────────────────────────

type Def = {
  key: string;
  densityGPerMl?: number;
  piece?: { g: number; one: string; many: string; shop?: boolean };
  per100g?: { kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodiumMg: number };
};
const DEFS = new Map((ingredientDefs as Def[]).map(d => [d.key, d]));

/** Amounts a cook can measure: 10 g steps for big amounts, 5 g for medium, 1 g for a spoon of oil. */
function roundAmount(amount: number): number {
  const step = amount >= 50 ? 10 : amount >= 20 ? 5 : 1;
  return Math.max(step === 1 ? 1 : 5, Math.round(amount / step) * step);
}

const words = (n: number, piece: NonNullable<Def['piece']>) => `${n} ${n === 1 ? piece.one : piece.many}`;

function scaleIngredient(ing: Ingredient, factor: number): Ingredient {
  const piece = DEFS.get(ing.name)?.piece;
  // Counted and bought by the piece: eggs, bananas, tortillas.
  if (!ing.unit) {
    const n = Math.max(1, Math.round(ing.amount * factor));
    return { ...ing, amount: n, ...(piece ? { label: words(n, piece) } : {}) };
  }
  // Counted in the recipe but bought by weight: slices of bread, cloves of garlic.
  if (ing.label && piece && ing.unit === 'g') {
    const n = Math.max(1, Math.round((ing.amount * factor) / piece.g));
    return { ...ing, amount: n * piece.g, label: words(n, piece) };
  }
  return { ...ing, amount: roundAmount(ing.amount * factor) };
}

/** Weight of an ingredient line in grams, or null when it cannot be known. */
function gramsOf(ing: Ingredient): number | null {
  const def = DEFS.get(ing.name);
  if (ing.unit === 'g') return ing.amount;
  if (ing.unit === 'kg') return ing.amount * 1000;
  if (ing.unit === 'ml') return def?.densityGPerMl ? ing.amount * def.densityGPerMl : null;
  if (!ing.unit) return def?.piece ? ing.amount * def.piece.g : null;
  return null;
}

type Nutrition = Pick<Meal, 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG' | 'sugarG' | 'sodiumMg'>;

/** Nutrition added up from the ingredients, or null when one of them is not in the table. */
function nutritionOf(ingredients: Ingredient[]): Nutrition | null {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodiumMg: 0 };
  for (const ing of ingredients) {
    const per100g = DEFS.get(ing.name)?.per100g;
    const grams = gramsOf(ing);
    if (!per100g || grams == null) return null;
    for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] += (per100g[k] * grams) / 100;
  }
  return {
    calories: Math.round(t.kcal),
    proteinG: Math.round(t.protein),
    carbsG: Math.round(t.carbs),
    fatG: Math.round(t.fat),
    fiberG: Math.round(t.fiber),
    sugarG: Math.round(t.sugar),
    sodiumMg: Math.round(t.sodiumMg),
  };
}

/** Grams of food on the plate, for telling filling meals from dense ones. */
function plateGrams(meal: Meal): number {
  return meal.ingredients.reduce((sum, ing) => sum + (gramsOf(ing) ?? 0), 0);
}

// ── Recipe text that follows the portion ─────────────────────────────────────
// Steps and seasonings can carry numbers that depend on how much is cooked:
//   "roll into {8} small balls"   a number that grows and shrinks with the portion
//   "make {n:eggs} wells"         the number of pieces of an ingredient
// scripts/recipes/lib.mjs checks these when the recipes are built.

const MARKER = /\{(n:)?([^}]+)\}/g;

/** Pieces of a counted ingredient (eggs, cloves, slices) in a list of ingredients. */
function piecesOf(name: string, ingredients: Ingredient[]): number | null {
  const ing = ingredients.find(i => i.name === name);
  if (!ing) return null;
  if (!ing.unit) return ing.amount;
  const piece = DEFS.get(name)?.piece;
  return piece && ing.unit === 'g' ? Math.max(1, Math.round(ing.amount / piece.g)) : null;
}

/** Fill in the numbers of a step or seasoning for a portion of `factor` made with `ingredients`. */
export function renderText(text: string, factor: number, ingredients: Ingredient[]): string {
  return text.replace(MARKER, (_all, count: string | undefined, value: string) => {
    if (count) return String(piecesOf(value.trim(), ingredients) ?? '');
    const base = Number(value);
    if (!(base > 0)) return value;
    // Liquids in 10 ml steps, counts in whole numbers.
    return String(base >= 50 ? Math.max(10, Math.round((base * factor) / 10) * 10) : Math.max(1, Math.round(base * factor)));
  });
}

/** Singular and plural spellings of a word: "tomatoes" is also "tomato", "egg" also "eggs". */
function spellings(word: string): string[] {
  const out = new Set([word, `${word}s`]);
  if (word.endsWith('ies')) out.add(`${word.slice(0, -3)}y`);
  if (word.endsWith('es')) out.add(word.slice(0, -2));
  if (word.endsWith('s')) out.add(word.slice(0, -1));
  return [...out];
}

/** What an ingredient can be called in a step: "beef mince" is also "the mince". */
function namesIn(name: string, all: Ingredient[]): string[] {
  const parts = name.split(' ');
  const last = parts[parts.length - 1];
  const head = parts.slice(0, -1).join(' ');
  const names = spellings(last).map(l => (head ? `${head} ${l}` : l));
  // The last word alone, when no other ingredient of the recipe ends in it.
  if (head && all.filter(i => i.name.split(' ').pop() === last).length === 1) names.push(...spellings(last));
  if (name.endsWith('berries')) names.push('berries');
  return names;
}

/** The ingredients a step works with, so cook mode can show how much of each to use. */
export function stepIngredients(step: string, ingredients: Ingredient[]): Ingredient[] {
  const text = step.toLowerCase();
  return ingredients.filter(ing => new RegExp(`\\b(${namesIn(ing.name, ingredients).join('|')})\\b`).test(text));
}

/**
 * A meal as this person should cook it. `portion` says how it relates to the
 * standard recipe; `removed` are the ingredients the person chose to leave out,
 * in the amounts the recipe would have used.
 */
export type PersonalMeal = Meal & { portion?: number; removed?: Ingredient[] };

/** The main ingredient cannot be left out: without it the dish is a different dish. */
export function canLeaveOut(meal: Meal, name: string): boolean {
  return name !== meal.main && meal.ingredients.some(i => i.name === name);
}

/**
 * The recipe scaled to the person's share of the day, without the ingredients
 * they left out (`without`, by name). With no targets (no measurements in the
 * profile) the amounts stay those of the standard recipe.
 *
 * The portion is sized on the recipe as written, so leaving something out does
 * not make the rest of the plate bigger; the nutrition is for what is left.
 */
export function personalize(meal: Meal, targets: Targets | null, without: string[] = []): PersonalMeal {
  const skip = new Set(without.filter(name => canLeaveOut(meal, name)));
  const sized = Boolean(targets) && meal.calories > 0;
  if (!sized && skip.size === 0) return meal;
  const factor = sized ? portionOf(meal, targets!) : 1;
  const all = sized ? meal.ingredients.map(ing => scaleIngredient(ing, factor)) : meal.ingredients;
  const ingredients = all.filter(ing => !skip.has(ing.name));
  // Counts in the text ("make {n:eggs} wells") come from the full recipe.
  const text = sized && meal.templates && {
    instructions: meal.templates.instructions.map(t => renderText(t, factor, all)),
    seasonings: meal.templates.seasonings.map(t => renderText(t, factor, all)),
  };
  const scaled = (n: number) => Math.round(n * factor);
  const nutrition = nutritionOf(ingredients) ?? {
    // An ingredient we have no table entry for: scale the recipe's own numbers instead.
    calories: scaled(meal.calories),
    proteinG: scaled(meal.proteinG),
    carbsG: scaled(meal.carbsG),
    fatG: scaled(meal.fatG),
    fiberG: scaled(meal.fiberG),
    sugarG: scaled(meal.sugarG),
    sodiumMg: scaled(meal.sodiumMg),
  };
  return {
    ...meal,
    ...nutrition,
    ...text,
    ingredients,
    ...(sized ? { portion: Math.round(factor * 20) / 20 } : {}),
    ...(skip.size > 0 ? { removed: all.filter(ing => skip.has(ing.name)) } : {}),
  };
}

// ── Choosing meals that suit the goal ────────────────────────────────────────

/** Grams of protein per 100 kcal from which a meal counts as protein-rich (chicken with rice is about 7). */
const PROTEIN_RICH = 7;
/** Grams of protein per 100 kcal under which a meal has little protein (oats with banana are about 3). */
const PROTEIN_POOR = 4;
/** Share of a meal's energy that comes from carbohydrates: low up to a quarter, high from half. */
const LOW_CARB = 0.25;
const HIGH_CARB = 0.5;
/** kcal per gram of food up to which a meal counts as high-volume: a big plate for its calories. */
const HIGH_VOLUME = 1.1;

/**
 * Points a meal earns for suiting the person's goal, on the same scale as the
 * plan's other preferences (ingredient sharing up to 5, the part's proteins +4/-3).
 *
 * Every goal prefers meals whose standard recipe is already close to the
 * person's share, so little scaling is needed. Losing weight adds a preference
 * for light, high-volume and protein-rich meals; gaining for hearty and
 * protein-rich ones.
 */
export function goalScore(meal: Meal, targets: Targets | null): number {
  if (!targets || !(meal.calories > 0)) return 0;
  const tags = meal.tags ?? meal.keywords;
  const wanted = targets.perMeal[meal.mealType] / meal.calories;
  let score = 0;
  if (wanted < MIN_PORTION || wanted > MAX_PORTION) score -= 3;
  else if (wanted >= 0.8 && wanted <= 1.3) score += 1;
  // 0 for a meal with little protein, 1 for a protein-rich one, in between for the rest:
  // a vegan cookbook has few meals over the line, and the better ones should still win.
  const per100 = (meal.proteinG / meal.calories) * 100;
  const protein = Math.min(1, Math.max(0, (per100 - PROTEIN_POOR) / (PROTEIN_RICH - PROTEIN_POOR)));
  // Strong enough to win over the plan's protein grouping (a swing of 7 points),
  // so most of a week suits the goal, without shutting other meals out.
  if (targets.goal === 'lose') {
    if (tags.includes('light')) score += 4;
    const grams = plateGrams(meal);
    if (grams > 0 && meal.calories / grams <= HIGH_VOLUME) score += 2;
    score += 2 * protein;
  }
  if (targets.goal === 'gain') {
    if (tags.includes('hearty')) score += 4;
    score += 3 * protein;
  }
  // The macro balance chosen in Settings, as strong as the goal's own preferences.
  if (targets.macro === 'high-protein') {
    score += per100 < PROTEIN_POOR ? -3 : 4 * protein;
  }
  if (targets.macro === 'low-carb') {
    const carbShare = (meal.carbsG * 4) / meal.calories;
    if (carbShare <= LOW_CARB) score += 4;
    else if (carbShare >= HIGH_CARB) score -= 3;
  }
  return score;
}
