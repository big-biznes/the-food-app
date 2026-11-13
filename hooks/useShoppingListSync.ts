import { useCallback, useMemo } from 'react';
import { usePlan } from '@/contexts/PlanContext';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import { extractPartIngredients } from '@/data/meals';
import { useTargets } from '@/hooks/usePortions';

/**
 * Whether the shopping list made from the plan no longer matches it because
 * ingredients were left out of (or put back into) its recipes since, and a way
 * to bring the list up to date.
 */
export function useShoppingListSync(): { stale: boolean; update: () => void } {
  const { savedPlan, setSavedPlan, without } = usePlan();
  const { shoppingItems, updatePlanIngredients } = useShoppingContext();
  const targets = useTargets();
  const plan = savedPlan?.plan;
  const list = savedPlan?.list;
  const hasList = shoppingItems.length > 0;

  const change = useMemo(() => {
    if (!plan || !list || !hasList || list.without === without) return null;
    const before = extractPartIngredients(plan, list.part, targets, list.without);
    const after = extractPartIngredients(plan, list.part, targets, without);
    const same = before.length === after.length && before.every((b, i) => b.name === after[i].name);
    return same ? null : { before, after };
  }, [plan, list, hasList, targets, without]);

  const update = useCallback(() => {
    if (!change) return;
    updatePlanIngredients(change.before, change.after);
    setSavedPlan(prev => (prev?.list ? { ...prev, list: { ...prev.list, without: prev.without ?? {} } } : prev));
  }, [change, updatePlanIngredients, setSavedPlan]);

  return { stale: change != null, update };
}
