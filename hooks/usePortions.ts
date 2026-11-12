import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Meal } from '@/data/meals';
import { dailyTargets, personalize, PersonalMeal, Targets } from '@/data/portions';

/** The signed-in user's daily energy target, or null when their profile has no usable measurements. */
export function useTargets(): Targets | null {
  const { user } = useAuth();
  const { goal, gender, age, heightCm, weightKg, activity } = user ?? {};
  return useMemo(
    () => (goal && gender && age && heightCm && weightKg ? dailyTargets({ goal, gender, age, heightCm, weightKg, activity }) : null),
    [goal, gender, age, heightCm, weightKg, activity],
  );
}

/** A recipe with the amounts and nutrition sized for the signed-in user. */
export function usePersonalMeal<T extends Meal | undefined>(meal: T): T extends Meal ? PersonalMeal : undefined {
  const targets = useTargets();
  return useMemo(() => (meal ? personalize(meal, targets) : undefined), [meal, targets]) as T extends Meal ? PersonalMeal : undefined;
}
