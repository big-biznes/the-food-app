import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import type { Meal } from '@/data/meals';
import { dailyTargets, personalize, PersonalMeal, Targets } from '@/data/portions';

/** The signed-in user's daily energy target, or null when their profile has no usable measurements. */
export function useTargets(): Targets | null {
  const { user } = useAuth();
  const { goal, gender, age, heightCm, weightKg, activity, macroBalance, snacks } = user ?? {};
  return useMemo(
    () =>
      goal && gender && age && heightCm && weightKg
        ? dailyTargets({ goal, gender, age, heightCm, weightKg, activity, macroBalance, snacks })
        : null,
    [goal, gender, age, heightCm, weightKg, activity, macroBalance, snacks],
  );
}

/**
 * A recipe with the amounts and nutrition sized for the signed-in user, and
 * without the ingredients they left out of it in their plan.
 */
export function usePersonalMeal<T extends Meal | undefined>(meal: T): T extends Meal ? PersonalMeal : undefined {
  const targets = useTargets();
  const { without } = usePlan();
  const skip = meal ? without[meal.id] : undefined;
  return useMemo(() => (meal ? personalize(meal, targets, skip) : undefined), [meal, targets, skip]) as T extends Meal ? PersonalMeal : undefined;
}
