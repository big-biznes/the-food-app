import { createContext, useCallback, useContext, useEffect, useMemo, Dispatch, ReactNode, SetStateAction } from 'react';
import { useCloudState } from '@/hooks/useCloudState';
import { PlanIngredient, StructuredWeekPlan, WeekPart, findMeal, planMeals, planSlots, rememberMeals } from '@/data/meals';
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
  /** The shopping list last made from this plan: for which part, and what the plan needed then. */
  list?: { part: WeekPart; needs: PlanIngredient[] };
  /** Prep jobs the user ticked off, per part: keys of data/prep.ts tasks. */
  prepped?: Partial<Record<WeekPart, string[]>>;
};

type PlanContextValue = {
  savedPlan: SavedPlan | null;
  setSavedPlan: Dispatch<SetStateAction<SavedPlan | null>>;
  without: Record<string, string[]>;
  /** Whether the meal is in the current plan, and so can be edited. */
  inPlan: (mealId: string) => boolean;
  /** Leave an ingredient out of a plan meal, or put it back. */
  toggleIngredient: (mealId: string, name: string) => void;
  /** The prep jobs ticked off for a part of the week. */
  preppedIn: (part: WeekPart) => string[];
  /** The prep jobs ticked off for the part a meal is in (none for a meal outside the plan). */
  preppedFor: (mealId: string) => string[];
  /** Tick prep jobs of a part off (`done`), or untick them. */
  setPrepped: (part: WeekPart, keys: string[], done: boolean) => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);
const NOTHING: Record<string, string[]> = {};
const NONE: string[] = [];

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

  const prepped = savedPlan?.prepped;
  // Which part each meal is cooked in (the first, should a meal be in the plan twice).
  const partOf = useMemo(() => {
    const parts = new Map<string, WeekPart>();
    for (const slot of plan ? planSlots(plan) : []) if (!parts.has(slot.meal.id)) parts.set(slot.meal.id, slot.part);
    return parts;
  }, [plan]);
  const preppedIn = useCallback((part: WeekPart) => prepped?.[part] ?? NONE, [prepped]);
  const preppedFor = useCallback(
    (mealId: string) => {
      const part = partOf.get(mealId);
      return part ? (prepped?.[part] ?? NONE) : NONE;
    },
    [partOf, prepped],
  );
  const setPrepped = useCallback(
    (part: WeekPart, keys: string[], done: boolean) =>
      setSavedPlan(prev => {
        if (!prev) return prev;
        const others = (prev.prepped?.[part] ?? []).filter(k => !keys.includes(k));
        return { ...prev, prepped: { ...prev.prepped, [part]: done ? [...others, ...keys] : others } };
      }),
    [setSavedPlan],
  );

  const without = savedPlan?.without ?? NOTHING;
  const value = useMemo(
    () => ({ savedPlan, setSavedPlan, without, inPlan, toggleIngredient, preppedIn, preppedFor, setPrepped }),
    [savedPlan, setSavedPlan, without, inPlan, toggleIngredient, preppedIn, preppedFor, setPrepped],
  );
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
