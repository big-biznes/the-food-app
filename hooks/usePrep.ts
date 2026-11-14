import { useMemo } from 'react';
import { usePlan } from '@/contexts/PlanContext';
import type { Meal, WeekPart } from '@/data/meals';
import { PrepList, PrepTask, prepList, prepTasks, timeWithPrep } from '@/data/prep';
import { useTargets } from '@/hooks/usePortions';

/** The prep list of one part of the week plan, and which of its lines are ticked off. */
export function usePrepList(part: WeekPart): PrepList & { done: string[] } {
  const { savedPlan, without, preppedIn } = usePlan();
  const targets = useTargets();
  const plan = savedPlan?.plan;
  const list = useMemo(
    () => (plan ? prepList(plan, part, targets, without) : { lines: [], minutes: 0, saves: 0 }),
    [plan, part, targets, without],
  );
  const ticked = preppedIn(part);
  // Jobs that are no longer on the list (a meal was replaced) do not count.
  const done = useMemo(
    () => list.lines.filter(l => l.keys.every(k => ticked.includes(k))).map(l => l.key),
    [list, ticked],
  );
  return { ...list, done };
}

/** What preparing ahead means for one meal. */
export type MealPrep = {
  /** Minutes the meal takes, given the prep that was done. */
  time: number;
  /** Minutes it would take with all of its prep done. */
  bestTime: number;
  /** The jobs that can be done ahead for it, and the ones that were. */
  tasks: PrepTask[];
  done: PrepTask[];
};

export function useMealPrep(meal: Meal | undefined): MealPrep | undefined {
  const { without, preppedFor, inPlan } = usePlan();
  const skip = meal ? without[meal.id] : undefined;
  // Prep belongs to the week plan: a recipe looked at in Discover has none.
  const ticked = meal && inPlan(meal.id) ? preppedFor(meal.id) : undefined;
  return useMemo(() => {
    if (!meal || !ticked) return undefined;
    // An ingredient left out of the meal has no prep.
    const tasks = prepTasks(meal).filter(t => !skip?.includes(t.ingredient));
    const done = tasks.filter(t => ticked.includes(t.key));
    return {
      time: timeWithPrep(meal, done.map(t => t.key)),
      bestTime: timeWithPrep(meal, tasks.map(t => t.key)),
      tasks,
      done,
    };
  }, [meal, skip, ticked]);
}
