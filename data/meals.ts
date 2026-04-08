import { DietaryRestriction } from '@/contexts/AuthContext';

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
    ingredients: [
      { name: 'sourdough bread', amount: 2, unit: 'slice' },
      { name: 'avocado', amount: 1, unit: '' },
      { name: 'lemon', amount: 1, unit: '' },
      { name: 'chili flakes', amount: 1, unit: 'tsp' },
      { name: 'olive oil', amount: 1, unit: 'tbsp' },
      { name: 'tomato', amount: 1, unit: '' },
    ],
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
    ingredients: [
      { name: 'greek yogurt', amount: 200, unit: 'g' },
      { name: 'granola', amount: 60, unit: 'g' },
      { name: 'mixed berries', amount: 100, unit: 'g' },
      { name: 'honey', amount: 1, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'eggs', amount: 3, unit: '' },
      { name: 'sourdough bread', amount: 2, unit: 'slice' },
      { name: 'butter', amount: 20, unit: 'g' },
      { name: 'tomato', amount: 1, unit: '' },
    ],
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
    ingredients: [
      { name: 'oats', amount: 80, unit: 'g' },
      { name: 'almond milk', amount: 200, unit: 'ml' },
      { name: 'mixed berries', amount: 100, unit: 'g' },
      { name: 'honey', amount: 1, unit: 'tbsp' },
      { name: 'cinnamon', amount: 1, unit: 'tsp' },
    ],
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
    ingredients: [
      { name: 'banana', amount: 2, unit: '' },
      { name: 'almond milk', amount: 150, unit: 'ml' },
      { name: 'granola', amount: 50, unit: 'g' },
      { name: 'mixed berries', amount: 80, unit: 'g' },
      { name: 'chia seeds', amount: 1, unit: 'tbsp' },
      { name: 'honey', amount: 1, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'eggs', amount: 3, unit: '' },
      { name: 'bell peppers', amount: 100, unit: 'g' },
      { name: 'mushrooms', amount: 100, unit: 'g' },
      { name: 'spinach', amount: 60, unit: 'g' },
      { name: 'olive oil', amount: 1, unit: 'tbsp' },
      { name: 'whole wheat bread', amount: 2, unit: 'slice' },
    ],
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
    ingredients: [
      { name: 'oats', amount: 80, unit: 'g' },
      { name: 'chia seeds', amount: 1, unit: 'tbsp' },
      { name: 'almond milk', amount: 200, unit: 'ml' },
      { name: 'banana', amount: 1, unit: '' },
      { name: 'honey', amount: 1, unit: 'tbsp' },
      { name: 'vanilla extract', amount: 1, unit: 'tsp' },
    ],
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
    ingredients: [
      { name: 'chia seeds', amount: 3, unit: 'tbsp' },
      { name: 'coconut milk', amount: 250, unit: 'ml' },
      { name: 'mango', amount: 1, unit: '' },
      { name: 'honey', amount: 1, unit: 'tbsp' },
      { name: 'vanilla extract', amount: 1, unit: 'tsp' },
    ],
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
    ingredients: [
      { name: 'firm tofu', amount: 300, unit: 'g' },
      { name: 'kale', amount: 80, unit: 'g' },
      { name: 'tomato', amount: 1, unit: '' },
      { name: 'turmeric', amount: 1, unit: 'tsp' },
      { name: 'garlic', amount: 2, unit: 'clove' },
      { name: 'olive oil', amount: 1, unit: 'tbsp' },
      { name: 'bread', amount: 2, unit: 'slice' },
    ],
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
    ingredients: [
      { name: 'bread', amount: 2, unit: 'slice' },
      { name: 'peanut butter', amount: 40, unit: 'g' },
      { name: 'banana', amount: 1, unit: '' },
      { name: 'honey', amount: 1, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'romaine lettuce', amount: 200, unit: 'g' },
      { name: 'parmesan', amount: 40, unit: 'g' },
      { name: 'croutons', amount: 60, unit: 'g' },
      { name: 'caesar dressing', amount: 3, unit: 'tbsp' },
      { name: 'garlic', amount: 2, unit: 'clove' },
      { name: 'lemon', amount: 1, unit: '' },
    ],
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
    ingredients: [
      { name: 'chicken breast', amount: 300, unit: 'g' },
      { name: 'flour tortilla', amount: 2, unit: '' },
      { name: 'avocado', amount: 1, unit: '' },
      { name: 'romaine lettuce', amount: 80, unit: 'g' },
      { name: 'lime', amount: 1, unit: '' },
      { name: 'olive oil', amount: 1, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'red lentils', amount: 200, unit: 'g' },
      { name: 'onion', amount: 1, unit: '' },
      { name: 'garlic', amount: 3, unit: 'clove' },
      { name: 'cumin', amount: 2, unit: 'tsp' },
      { name: 'coriander', amount: 1, unit: 'tsp' },
      { name: 'lemon', amount: 1, unit: '' },
      { name: 'spinach', amount: 100, unit: 'g' },
      { name: 'vegetable stock', amount: 500, unit: 'ml' },
      { name: 'olive oil', amount: 2, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'quinoa', amount: 180, unit: 'g' },
      { name: 'chickpeas', amount: 1, unit: 'can' },
      { name: 'zucchini', amount: 150, unit: 'g' },
      { name: 'bell peppers', amount: 150, unit: 'g' },
      { name: 'tahini', amount: 3, unit: 'tbsp' },
      { name: 'lemon', amount: 1, unit: '' },
      { name: 'garlic', amount: 2, unit: 'clove' },
      { name: 'olive oil', amount: 2, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'canned tuna', amount: 1, unit: 'can' },
      { name: 'whole grain bread', amount: 2, unit: 'slice' },
      { name: 'mayonnaise', amount: 2, unit: 'tbsp' },
      { name: 'romaine lettuce', amount: 80, unit: 'g' },
      { name: 'tomato', amount: 1, unit: '' },
      { name: 'celery', amount: 80, unit: 'g' },
      { name: 'lemon', amount: 1, unit: '' },
    ],
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
    ingredients: [
      { name: 'pizza dough', amount: 300, unit: 'g' },
      { name: 'mozzarella', amount: 150, unit: 'g' },
      { name: 'tomato sauce', amount: 1, unit: 'can' },
      { name: 'fresh basil', amount: 20, unit: 'g' },
      { name: 'olive oil', amount: 2, unit: 'tbsp' },
      { name: 'garlic', amount: 2, unit: 'clove' },
    ],
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
    ingredients: [
      { name: 'rice noodles', amount: 150, unit: 'g' },
      { name: 'firm tofu', amount: 200, unit: 'g' },
      { name: 'cucumber', amount: 1, unit: '' },
      { name: 'fresh mint', amount: 20, unit: 'g' },
      { name: 'sesame oil', amount: 2, unit: 'tbsp' },
      { name: 'soy sauce', amount: 3, unit: 'tbsp' },
      { name: 'lime', amount: 1, unit: '' },
      { name: 'sesame seeds', amount: 1, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'tomato', amount: 300, unit: 'g' },
      { name: 'cucumber', amount: 1, unit: '' },
      { name: 'feta cheese', amount: 100, unit: 'g' },
      { name: 'kalamata olives', amount: 60, unit: 'g' },
      { name: 'red onion', amount: 1, unit: '' },
      { name: 'olive oil', amount: 3, unit: 'tbsp' },
      { name: 'dried oregano', amount: 1, unit: 'tsp' },
      { name: 'pita bread', amount: 2, unit: '' },
    ],
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
    ingredients: [
      { name: 'black beans', amount: 1, unit: 'can' },
      { name: 'corn tortillas', amount: 6, unit: '' },
      { name: 'avocado', amount: 1, unit: '' },
      { name: 'salsa', amount: 4, unit: 'tbsp' },
      { name: 'lime', amount: 1, unit: '' },
      { name: 'cumin', amount: 1, unit: 'tsp' },
      { name: 'cilantro', amount: 20, unit: 'g' },
      { name: 'red onion', amount: 1, unit: '' },
    ],
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
    ingredients: [
      { name: 'tomato', amount: 500, unit: 'g' },
      { name: 'fresh basil', amount: 30, unit: 'g' },
      { name: 'cream', amount: 100, unit: 'ml' },
      { name: 'garlic', amount: 3, unit: 'clove' },
      { name: 'onion', amount: 1, unit: '' },
      { name: 'vegetable stock', amount: 400, unit: 'ml' },
      { name: 'croutons', amount: 60, unit: 'g' },
      { name: 'parmesan', amount: 40, unit: 'g' },
      { name: 'olive oil', amount: 2, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'spaghetti', amount: 200, unit: 'g' },
      { name: 'ground beef', amount: 400, unit: 'g' },
      { name: 'canned tomatoes', amount: 1, unit: 'can' },
      { name: 'onion', amount: 1, unit: '' },
      { name: 'garlic', amount: 3, unit: 'clove' },
      { name: 'carrot', amount: 1, unit: '' },
      { name: 'celery', amount: 80, unit: 'g' },
      { name: 'olive oil', amount: 2, unit: 'tbsp' },
      { name: 'parmesan', amount: 50, unit: 'g' },
      { name: 'red wine', amount: 100, unit: 'ml' },
    ],
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
    ingredients: [
      { name: 'salmon fillet', amount: 400, unit: 'g' },
      { name: 'asparagus', amount: 200, unit: 'g' },
      { name: 'potatoes', amount: 300, unit: 'g' },
      { name: 'lemon', amount: 1, unit: '' },
      { name: 'fresh dill', amount: 15, unit: 'g' },
      { name: 'garlic', amount: 2, unit: 'clove' },
      { name: 'olive oil', amount: 2, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'chicken breast', amount: 400, unit: 'g' },
      { name: 'broccoli', amount: 200, unit: 'g' },
      { name: 'bell peppers', amount: 150, unit: 'g' },
      { name: 'jasmine rice', amount: 200, unit: 'g' },
      { name: 'soy sauce', amount: 3, unit: 'tbsp' },
      { name: 'fresh ginger', amount: 20, unit: 'g' },
      { name: 'garlic', amount: 3, unit: 'clove' },
      { name: 'sesame oil', amount: 1, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'chickpeas', amount: 1, unit: 'can' },
      { name: 'sweet potato', amount: 400, unit: 'g' },
      { name: 'coconut milk', amount: 1, unit: 'can' },
      { name: 'curry paste', amount: 3, unit: 'tbsp' },
      { name: 'basmati rice', amount: 200, unit: 'g' },
      { name: 'onion', amount: 1, unit: '' },
      { name: 'garlic', amount: 3, unit: 'clove' },
      { name: 'fresh ginger', amount: 20, unit: 'g' },
      { name: 'fresh coriander', amount: 20, unit: 'g' },
    ],
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
    ingredients: [
      { name: 'ground beef', amount: 400, unit: 'g' },
      { name: 'taco shells', amount: 8, unit: '' },
      { name: 'salsa', amount: 4, unit: 'tbsp' },
      { name: 'cheddar cheese', amount: 100, unit: 'g' },
      { name: 'romaine lettuce', amount: 100, unit: 'g' },
      { name: 'tomato', amount: 1, unit: '' },
      { name: 'cumin', amount: 2, unit: 'tsp' },
      { name: 'chili powder', amount: 1, unit: 'tsp' },
      { name: 'sour cream', amount: 60, unit: 'g' },
    ],
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
    ingredients: [
      { name: 'penne pasta', amount: 200, unit: 'g' },
      { name: 'zucchini', amount: 150, unit: 'g' },
      { name: 'cherry tomatoes', amount: 200, unit: 'g' },
      { name: 'bell peppers', amount: 150, unit: 'g' },
      { name: 'garlic', amount: 3, unit: 'clove' },
      { name: 'olive oil', amount: 3, unit: 'tbsp' },
      { name: 'parmesan', amount: 50, unit: 'g' },
      { name: 'fresh basil', amount: 20, unit: 'g' },
      { name: 'lemon', amount: 1, unit: '' },
    ],
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
    ingredients: [
      { name: 'chicken thighs', amount: 500, unit: 'g' },
      { name: 'potatoes', amount: 400, unit: 'g' },
      { name: 'green beans', amount: 200, unit: 'g' },
      { name: 'lemon', amount: 1, unit: '' },
      { name: 'fresh rosemary', amount: 15, unit: 'g' },
      { name: 'garlic', amount: 4, unit: 'clove' },
      { name: 'olive oil', amount: 3, unit: 'tbsp' },
    ],
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
    ingredients: [
      { name: 'black beans', amount: 1, unit: 'can' },
      { name: 'canned tomatoes', amount: 1, unit: 'can' },
      { name: 'onion', amount: 1, unit: '' },
      { name: 'bell peppers', amount: 200, unit: 'g' },
      { name: 'garlic', amount: 3, unit: 'clove' },
      { name: 'cumin', amount: 2, unit: 'tsp' },
      { name: 'chipotle paste', amount: 1, unit: 'tbsp' },
      { name: 'basmati rice', amount: 200, unit: 'g' },
      { name: 'lime', amount: 1, unit: '' },
    ],
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
    ingredients: [
      { name: 'arborio rice', amount: 250, unit: 'g' },
      { name: 'wild mushrooms', amount: 300, unit: 'g' },
      { name: 'parmesan', amount: 80, unit: 'g' },
      { name: 'white wine', amount: 150, unit: 'ml' },
      { name: 'onion', amount: 1, unit: '' },
      { name: 'garlic', amount: 2, unit: 'clove' },
      { name: 'butter', amount: 40, unit: 'g' },
      { name: 'vegetable stock', amount: 800, unit: 'ml' },
      { name: 'fresh thyme', amount: 10, unit: 'g' },
    ],
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
    ingredients: [
      { name: 'firm tofu', amount: 300, unit: 'g' },
      { name: 'green curry paste', amount: 3, unit: 'tbsp' },
      { name: 'coconut milk', amount: 1, unit: 'can' },
      { name: 'zucchini', amount: 200, unit: 'g' },
      { name: 'jasmine rice', amount: 200, unit: 'g' },
      { name: 'fresh basil', amount: 20, unit: 'g' },
      { name: 'fish sauce', amount: 1, unit: 'tbsp' },
      { name: 'lime', amount: 1, unit: '' },
    ],
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
    ingredients: [
      { name: 'cod fillet', amount: 400, unit: 'g' },
      { name: 'cherry tomatoes', amount: 200, unit: 'g' },
      { name: 'potatoes', amount: 300, unit: 'g' },
      { name: 'fresh parsley', amount: 20, unit: 'g' },
      { name: 'garlic', amount: 3, unit: 'clove' },
      { name: 'olive oil', amount: 2, unit: 'tbsp' },
      { name: 'lemon', amount: 1, unit: '' },
      { name: 'breadcrumbs', amount: 40, unit: 'g' },
    ],
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
    ingredients: [
      { name: 'eggs', amount: 4, unit: '' },
      { name: 'chickpeas', amount: 1, unit: 'can' },
      { name: 'canned tomatoes', amount: 1, unit: 'can' },
      { name: 'feta cheese', amount: 80, unit: 'g' },
      { name: 'bell peppers', amount: 200, unit: 'g' },
      { name: 'onion', amount: 1, unit: '' },
      { name: 'garlic', amount: 3, unit: 'clove' },
      { name: 'cumin', amount: 2, unit: 'tsp' },
      { name: 'paprika', amount: 1, unit: 'tsp' },
      { name: 'pita bread', amount: 2, unit: '' },
    ],
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
  likedIds: string[] = [],
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

  const plan: StructuredWeekPlan = { A: partA, B: partB, C: partC };

  // ── Liked-meal injection ────────────────────────────────────────────────────
  // Guarantee at least one liked meal appears in the plan if any liked meals
  // are compatible with the user's dietary restrictions.
  if (likedIds.length > 0) {
    const planIds = extractUsedIds(plan);
    const alreadyHasLiked = likedIds.some(id => planIds.has(id));
    if (!alreadyHasLiked) {
      const candidates = MEALS.filter(
        m =>
          likedIds.includes(m.id) &&
          restrictions.every(r => m.dietaryTags.includes(r)),
      );
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        // Replace the slot in part A on the first day matching this meal type.
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
  // Collect every Ingredient instance across all meals in this part
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
      // Whole cans — show x{N} prefix when more than one
      const count = instances.length;
      result.push(count > 1 ? `x${count} ${name}` : name);

    } else if (!unit) {
      // Countable pieces (egg, banana, lemon, avocado…) — sum amounts
      const total = instances.reduce((s, i) => s + i.amount, 0);
      result.push(total > 1 ? `x${total} ${name}` : name);

    } else if (unit === 'g' || unit === 'ml' || unit === 'kg' || unit === 'l') {
      // Weight / volume — x{N} when all portions are equal, otherwise sum
      const allSame = instances.every(i => i.amount === instances[0].amount);
      if (instances.length > 1 && allSame) {
        result.push(`x${instances.length} ${instances[0].amount}${unit} ${name}`);
      } else {
        const total = instances.reduce((s, i) => s + i.amount, 0);
        result.push(`${total}${unit} ${name}`);
      }

    } else {
      // tbsp, tsp, clove, slice — always sum
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
