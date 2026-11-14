import { useSyncExternalStore } from 'react';
import type { PersonalMeal } from '@/data/portions';
import { recipeTextsVersion, subscribeRecipeTexts, type RecipeText } from '@/data/recipeText';
import { mealText } from '@/lib/localize';
import { useTranslation } from '@/hooks/useTranslation';

/** Redraws the component when the app's language changes or the recipe translations arrive. */
export function useRecipeLanguage() {
  useTranslation();
  useSyncExternalStore(subscribeRecipeTexts, recipeTextsVersion);
}

/** A meal's name, description, steps and seasonings in the app's language. */
export function useMealText(meal: PersonalMeal): RecipeText;
export function useMealText(meal: PersonalMeal | undefined): RecipeText | undefined;
export function useMealText(meal: PersonalMeal | undefined): RecipeText | undefined {
  useRecipeLanguage();
  return meal ? mealText(meal) : undefined;
}
