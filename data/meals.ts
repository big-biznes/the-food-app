import { DietaryRestriction } from '@/contexts/AuthContext';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

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
};

export const MEALS: Meal[] = [
  // ── BREAKFAST ────────────────────────────────────────────────────────────
  {
    id: 'b1',
    name: 'Avocado Toast',
    description: 'Creamy avocado on sourdough with chili flakes & lemon',
    prepTime: 10, calories: 320, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free'],
    keywords: ['light', 'fresh', 'quick', 'toast', 'trendy'],
    emoji: '🥑',
  },
  {
    id: 'b2',
    name: 'Greek Yogurt Parfait',
    description: 'Layered creamy yogurt, granola and mixed berries',
    prepTime: 5, calories: 280, mealType: 'breakfast',
    dietaryTags: ['vegetarian'],
    keywords: ['light', 'fresh', 'quick', 'sweet', 'fruity'],
    emoji: '🫙',
  },
  {
    id: 'b3',
    name: 'Scrambled Eggs & Toast',
    description: 'Fluffy buttered eggs on toasted sourdough',
    prepTime: 10, calories: 350, mealType: 'breakfast',
    dietaryTags: ['vegetarian'],
    keywords: ['hearty', 'quick', 'classic', 'comfort', 'protein'],
    emoji: '🍳',
  },
  {
    id: 'b4',
    name: 'Oatmeal with Berries',
    description: 'Warm oats topped with mixed berries and a drizzle of honey',
    prepTime: 8, calories: 290, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['light', 'warm', 'sweet', 'healthy', 'fruity'],
    emoji: '🫐',
  },
  {
    id: 'b5',
    name: 'Banana Smoothie Bowl',
    description: 'Thick blended banana base topped with seeds and fruit',
    prepTime: 8, calories: 310, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['light', 'fresh', 'sweet', 'tropical', 'fruity'],
    emoji: '🍌',
  },
  {
    id: 'b6',
    name: 'Veggie Omelette',
    description: 'Fluffy omelette filled with peppers, mushrooms and spinach',
    prepTime: 12, calories: 330, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'gluten-free', 'dairy-free'],
    keywords: ['hearty', 'savory', 'fresh', 'protein', 'veggie'],
    emoji: '🥚',
  },
  {
    id: 'b7',
    name: 'Overnight Oats',
    description: 'No-cook oats with chia seeds, almond milk and banana',
    prepTime: 5, calories: 340, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free'],
    keywords: ['quick', 'light', 'prep-ahead', 'sweet', 'easy'],
    emoji: '🥣',
  },
  {
    id: 'b8',
    name: 'Chia Pudding',
    description: 'Creamy coconut chia pudding with fresh mango',
    prepTime: 5, calories: 260, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['light', 'sweet', 'tropical', 'prep-ahead', 'fruity'],
    emoji: '🥥',
  },
  {
    id: 'b9',
    name: 'Tofu Scramble',
    description: 'Seasoned crumbled tofu with turmeric, kale and tomatoes',
    prepTime: 15, calories: 300, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['hearty', 'savory', 'veggie', 'spicy', 'protein'],
    emoji: '🧀',
  },
  {
    id: 'b10',
    name: 'Peanut Butter Toast',
    description: 'Thick toast with peanut butter, banana slices and honey',
    prepTime: 5, calories: 390, mealType: 'breakfast',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free'],
    keywords: ['hearty', 'sweet', 'quick', 'comfort', 'filling'],
    emoji: '🥜',
  },

  // ── LUNCH ─────────────────────────────────────────────────────────────────
  {
    id: 'l1',
    name: 'Caesar Salad',
    description: 'Crisp romaine, parmesan, croutons and Caesar dressing',
    prepTime: 10, calories: 320, mealType: 'lunch',
    dietaryTags: ['vegetarian'],
    keywords: ['light', 'fresh', 'classic', 'salad'],
    emoji: '🥗',
  },
  {
    id: 'l2',
    name: 'Chicken Wrap',
    description: 'Grilled chicken, avocado, lettuce and lime in a tortilla',
    prepTime: 12, calories: 450, mealType: 'lunch',
    dietaryTags: ['dairy-free'],
    keywords: ['hearty', 'quick', 'fresh', 'protein', 'filling'],
    emoji: '🌯',
  },
  {
    id: 'l3',
    name: 'Red Lentil Soup',
    description: 'Hearty red lentil soup with cumin, coriander and lemon',
    prepTime: 25, calories: 350, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['hearty', 'warm', 'comfort', 'filling', 'cozy'],
    emoji: '🍲',
  },
  {
    id: 'l4',
    name: 'Quinoa Power Bowl',
    description: 'Quinoa, roasted veggies, chickpeas and tahini dressing',
    prepTime: 20, calories: 420, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['healthy', 'fresh', 'filling', 'hearty', 'veggie'],
    emoji: '🥙',
  },
  {
    id: 'l5',
    name: 'Tuna Salad Sandwich',
    description: 'Classic tuna salad on whole grain with lettuce and tomato',
    prepTime: 8, calories: 390, mealType: 'lunch',
    dietaryTags: ['dairy-free'],
    keywords: ['quick', 'classic', 'hearty', 'protein', 'easy'],
    emoji: '🥪',
  },
  {
    id: 'l6',
    name: 'Margherita Pizza',
    description: 'Thin crust with tomato sauce, mozzarella and fresh basil',
    prepTime: 15, calories: 480, mealType: 'lunch',
    dietaryTags: ['vegetarian'],
    keywords: ['italian', 'comfort', 'cheesy', 'classic', 'indulgent'],
    emoji: '🍕',
  },
  {
    id: 'l7',
    name: 'Asian Noodle Salad',
    description: 'Rice noodles with sesame dressing, cucumber and mint',
    prepTime: 15, calories: 370, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['asian', 'fresh', 'light', 'noodles', 'cold'],
    emoji: '🍜',
  },
  {
    id: 'l8',
    name: 'Greek Salad',
    description: 'Tomatoes, cucumber, kalamata olives, feta and oregano',
    prepTime: 10, calories: 280, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'gluten-free'],
    keywords: ['mediterranean', 'light', 'fresh', 'greek', 'salad'],
    emoji: '🫒',
  },
  {
    id: 'l9',
    name: 'Black Bean Tacos',
    description: 'Spiced black beans in corn tortillas with salsa and avocado',
    prepTime: 15, calories: 400, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['mexican', 'spicy', 'hearty', 'filling', 'bold'],
    emoji: '🌮',
  },
  {
    id: 'l10',
    name: 'Tomato Basil Soup',
    description: 'Velvety roasted tomato soup with fresh basil and croutons',
    prepTime: 20, calories: 240, mealType: 'lunch',
    dietaryTags: ['vegetarian', 'gluten-free'],
    keywords: ['light', 'warm', 'comfort', 'italian', 'cozy'],
    emoji: '🍅',
  },

  // ── DINNER ────────────────────────────────────────────────────────────────
  {
    id: 'd1',
    name: 'Spaghetti Bolognese',
    description: 'Slow-cooked beef ragù with spaghetti and parmesan',
    prepTime: 40, calories: 580, mealType: 'dinner',
    dietaryTags: [],
    keywords: ['italian', 'comfort', 'hearty', 'classic', 'pasta', 'indulgent'],
    emoji: '🍝',
  },
  {
    id: 'd2',
    name: 'Grilled Salmon',
    description: 'Herb-crusted salmon fillet with roasted asparagus and lemon',
    prepTime: 20, calories: 450, mealType: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
    keywords: ['light', 'healthy', 'fresh', 'protein', 'fish', 'mediterranean'],
    emoji: '🐟',
  },
  {
    id: 'd3',
    name: 'Chicken Stir Fry',
    description: 'Wok-tossed chicken with broccoli, peppers and soy ginger sauce',
    prepTime: 20, calories: 480, mealType: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
    keywords: ['asian', 'quick', 'spicy', 'hearty', 'bold'],
    emoji: '🥢',
  },
  {
    id: 'd4',
    name: 'Vegetable Curry',
    description: 'Fragrant coconut curry with sweet potato and chickpeas',
    prepTime: 30, calories: 420, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['spicy', 'hearty', 'warm', 'indian', 'comfort', 'bold'],
    emoji: '🍛',
  },
  {
    id: 'd5',
    name: 'Beef Tacos',
    description: 'Seasoned ground beef in crispy shells with salsa and cheese',
    prepTime: 25, calories: 530, mealType: 'dinner',
    dietaryTags: [],
    keywords: ['mexican', 'spicy', 'hearty', 'comfort', 'bold', 'indulgent'],
    emoji: '🌮',
  },
  {
    id: 'd6',
    name: 'Pasta Primavera',
    description: 'Penne with seasonal vegetables in a garlic olive oil sauce',
    prepTime: 20, calories: 450, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free'],
    keywords: ['italian', 'light', 'fresh', 'pasta', 'veggie'],
    emoji: '🍝',
  },
  {
    id: 'd7',
    name: 'Lemon Herb Chicken',
    description: 'Roasted chicken thighs with lemon, rosemary and garlic',
    prepTime: 35, calories: 490, mealType: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
    keywords: ['light', 'classic', 'hearty', 'protein', 'mediterranean'],
    emoji: '🍗',
  },
  {
    id: 'd8',
    name: 'Black Bean Chili',
    description: 'Smoky black bean chili with chipotle peppers and lime',
    prepTime: 30, calories: 380, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['spicy', 'hearty', 'mexican', 'comfort', 'filling', 'bold'],
    emoji: '🫘',
  },
  {
    id: 'd9',
    name: 'Mushroom Risotto',
    description: 'Creamy arborio rice with wild mushrooms and parmesan',
    prepTime: 35, calories: 510, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'gluten-free'],
    keywords: ['italian', 'comfort', 'hearty', 'creamy', 'indulgent'],
    emoji: '🍄',
  },
  {
    id: 'd10',
    name: 'Thai Green Curry',
    description: 'Aromatic green curry with tofu, zucchini and coconut milk',
    prepTime: 25, calories: 430, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['asian', 'spicy', 'thai', 'aromatic', 'bold'],
    emoji: '🥬',
  },
  {
    id: 'd11',
    name: 'Baked Cod',
    description: 'Herb-crusted cod with cherry tomatoes and roasted vegetables',
    prepTime: 25, calories: 370, mealType: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
    keywords: ['light', 'healthy', 'fresh', 'fish', 'mediterranean'],
    emoji: '🐠',
  },
  {
    id: 'd12',
    name: 'Chickpea Shakshuka',
    description: 'Eggs poached in spiced tomato sauce with chickpeas and feta',
    prepTime: 25, calories: 390, mealType: 'dinner',
    dietaryTags: ['vegetarian', 'gluten-free'],
    keywords: ['mediterranean', 'spicy', 'hearty', 'warm', 'bold'],
    emoji: '🍳',
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export type DayPlan = {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
};

export type WeekPlan = Record<string, DayPlan>;

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Day = typeof DAYS[number];

// ── Generation ────────────────────────────────────────────────────────────────

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

export function generateMealPlan(
  restrictions: DietaryRestriction[],
  cravingKeywords: string[],
): WeekPlan {
  const compatible = MEALS.filter(m =>
    restrictions.every(r => m.dietaryTags.includes(r)),
  );
  // Fall back to full list if restrictions leave too few options
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

export function getAlternateMeal(
  current: Meal,
  plan: WeekPlan,
  restrictions: DietaryRestriction[],
): Meal {
  const usedIds = new Set(
    Object.values(plan).flatMap(d => [d.breakfast.id, d.lunch.id, d.dinner.id]),
  );

  // Prefer: compatible + not already in plan
  const fresh = MEALS.filter(
    m =>
      m.mealType === current.mealType &&
      m.id !== current.id &&
      !usedIds.has(m.id) &&
      restrictions.every(r => m.dietaryTags.includes(r)),
  );
  if (fresh.length > 0) return fresh[Math.floor(Math.random() * fresh.length)];

  // Then: compatible (may repeat another slot)
  const compatible = MEALS.filter(
    m =>
      m.mealType === current.mealType &&
      m.id !== current.id &&
      restrictions.every(r => m.dietaryTags.includes(r)),
  );
  if (compatible.length > 0)
    return compatible[Math.floor(Math.random() * compatible.length)];

  // Last resort: any other meal of same type
  const any = MEALS.filter(m => m.mealType === current.mealType && m.id !== current.id);
  return any.length > 0 ? any[Math.floor(Math.random() * any.length)] : current;
}
