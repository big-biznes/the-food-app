import type { DietaryRestriction } from '@/contexts/AuthContext';
import type { Meal, MealType, MealComponents, Ingredient } from './meals';
import { RAW_RECIPES } from './recipe-data';
import type { RawRecipe } from './recipe-data';

// ── Helpers: derive Meal fields from CSV columns ─────────────────────────────

const PROTEIN_EMOJI: Record<string, string> = {
  chicken: '🍗',
  beef: '🥩',
  pork: '🥓',
  salmon: '🐟',
  shrimp: '🦐',
  tofu: '🧈',
  lentils: '🫘',
  turkey: '🦃',
};

const VEGETARIAN_PROTEINS = new Set(['tofu', 'lentils']);
const MEAT_PROTEINS = new Set(['chicken', 'beef', 'pork', 'turkey']);
const FISH_PROTEINS = new Set(['salmon', 'shrimp']);
const GLUTEN_CARBS = new Set(['pasta', 'noodles']);

function inferDietaryTags(protein: string, carb: string): DietaryRestriction[] {
  const tags: DietaryRestriction[] = [];

  if (VEGETARIAN_PROTEINS.has(protein)) {
    tags.push('vegetarian');
    tags.push('vegan');
    tags.push('dairy-free');
  }

  if (!MEAT_PROTEINS.has(protein) && !FISH_PROTEINS.has(protein) && !VEGETARIAN_PROTEINS.has(protein)) {
    tags.push('dairy-free');
  }

  if (!GLUTEN_CARBS.has(carb)) {
    tags.push('gluten-free');
  }

  // Halal: no pork
  if (protein !== 'pork') {
    tags.push('halal');
  }

  return tags;
}

function inferMealType(calories: number): MealType {
  if (calories <= 480) return 'breakfast';
  if (calories <= 650) return 'lunch';
  return 'dinner';
}

function prettyName(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/meal \d+$/i, '')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim();
}

function buildDescription(protein: string, carb: string, vegetable: string, sauce: string): string {
  const p = protein.charAt(0).toUpperCase() + protein.slice(1);
  return `${p} with ${carb}, ${vegetable} and ${sauce}`;
}

function buildKeywords(protein: string, carb: string, vegetable: string, sauce: string): string[] {
  const kw = [protein, carb, vegetable, sauce];

  if (MEAT_PROTEINS.has(protein)) kw.push('hearty', 'protein');
  if (FISH_PROTEINS.has(protein)) kw.push('light', 'fresh', 'protein');
  if (VEGETARIAN_PROTEINS.has(protein)) kw.push('veggie', 'healthy');

  if (sauce.includes('teriyaki') || sauce.includes('soy')) kw.push('asian');
  if (sauce.includes('pesto') || sauce.includes('tomato')) kw.push('italian');
  if (sauce.includes('cream')) kw.push('creamy', 'comfort');
  if (sauce.includes('garlic')) kw.push('savory');

  if (carb === 'rice' || carb === 'noodles') kw.push('asian');
  if (carb === 'pasta') kw.push('italian');
  if (carb === 'quinoa') kw.push('healthy');

  return [...new Set(kw)];
}

function buildIngredients(
  protein: string,
  carb: string,
  vegetable: string,
  sauce: string,
): Ingredient[] {
  return [
    { name: protein, amount: 300, unit: 'g' },
    { name: carb, amount: 200, unit: 'g' },
    { name: vegetable, amount: 150, unit: 'g' },
    { name: sauce, amount: 2, unit: 'tbsp' },
  ];
}

/** Parse "1. Do X. 2. Do Y." into individual step strings. */
function parseInstructions(raw: string): string[] {
  return raw
    .split(/\d+\.\s*/)
    .map(s => s.trim().replace(/\.$/, ''))
    .filter(Boolean);
}

// ── Convert a raw recipe → Meal ──────────────────────────────────────────────

function rowToMeal(row: RawRecipe): Meal {
  const components: MealComponents = {
    protein: row.protein,
    carb: row.carb,
    vegetable: row.vegetable,
    sauce: row.sauce,
  };

  return {
    id: `r_${row.id}`,
    name: prettyName(row.name),
    description: buildDescription(row.protein, row.carb, row.vegetable, row.sauce),
    prepTime: row.prep_time_min,
    calories: row.calories,
    mealType: inferMealType(row.calories),
    dietaryTags: inferDietaryTags(row.protein, row.carb),
    keywords: buildKeywords(row.protein, row.carb, row.vegetable, row.sauce),
    emoji: PROTEIN_EMOJI[row.protein] ?? '🍽️',
    components,
    ingredients: buildIngredients(row.protein, row.carb, row.vegetable, row.sauce),
    instructions: parseInstructions(row.instructions),
  };
}

// ── Public exports ───────────────────────────────────────────────────────────

export const RECIPES: Meal[] = RAW_RECIPES.map(rowToMeal);
