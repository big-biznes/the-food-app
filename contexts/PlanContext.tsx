import { createContext, useCallback, useContext, useEffect, useMemo, Dispatch, ReactNode, SetStateAction } from 'react';
import { useCloudState } from '@/hooks/useCloudState';
import { StructuredWeekPlan, WeekPart, findMeal, planMeals, rememberMeals } from '@/data/meals';
import { canLeaveOut } from '@/data/portions';

/** What gets saved to the cloud: the plan and what it was built for. */
export type SavedPlan = {
  plan: StructuredWeekPlan;
  /** The eating-out day when the plan was made; changing it in Settings only affects the next plan. */
  eatingOutDay: string;
  /** The categories the plan was generated for, so replaced meals stay in theme. */
  focus?: string[];
  /** Ingredients the user left out of a meal: meal id → ingredient names. */
  without?: Record<string, string[]>;
  /** The shopping list last made from this plan: for which part, and with which ingredients left out. */
  list?: { part: WeekPart; without: Record<string, string[]> };
};

type PlanContextValue = {
  savedPlan: SavedPlan | null;
  setSavedPlan: Dispatch<SetStateAction<SavedPlan | null>>;
  without: Record<string, string[]>;
  /** Whether the meal is in the current plan, and so can be edited. */
  inPlan: (mealId: string) => boolean;
  /** Leave an ingredient out of a plan meal, or put it back. */
  toggleIngredient: (mealId: string, name: string) => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);
const NOTHING: Record<string, string[]> = {};

/** The week plan, shared by the home screen, the recipe screens and Settings. */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [savedPlan, setSavedPlan] = useCloudState<SavedPlan | null>('plan', null);
  const plan = savedPlan?.plan ?? null;

  const ids = useMemo(() => new Set(plan ? planMeals(plan).map(m => m.id) : []), [plan]);
  // The plan stores full meals, so details / cook can open them before the recipe list loads.
  useEffect(() => {
    if (plan) rememberMeals(planMeals(plan));
  }, [plan]);

  const inPlan = useCallback((mealId: string) => ids.has(mealId), [ids]);

  const toggleIngredient = useCallback(
    (mealId: string, name: string) => {
      const meal = findMeal(mealId);
      if (!meal || !canLeaveOut(meal, name)) return;
      setSavedPlan(prev => {
        if (!prev) return prev;
        const current = prev.without?.[mealId] ?? [];
        const next = current.includes(name) ? current.filter(n => n !== name) : [...current, name];
        const { [mealId]: _old, ...others } = prev.without ?? {};
        return { ...prev, without: next.length > 0 ? { ...others, [mealId]: next } : others };
      });
    },
    [setSavedPlan],
  );

  const without = savedPlan?.without ?? NOTHING;
  const value = useMemo(
    () => ({ savedPlan, setSavedPlan, without, inPlan, toggleIngredient }),
    [savedPlan, setSavedPlan, without, inPlan, toggleIngredient],
  );
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
