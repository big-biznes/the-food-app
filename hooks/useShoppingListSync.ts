import { useCallback, useMemo } from 'react';
import { usePlan } from '@/contexts/PlanContext';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import { extractPartIngredients } from '@/data/meals';
import { useTargets } from '@/hooks/usePortions';

/**
 * Whether the shopping list made from the plan no longer matches it, because a
 * meal was replaced or swapped to other days, or ingredients were left out of
 * (or put back into) a recipe since. `update` brings the list up to date.
 */
export function useShoppingListSync(): { stale: boolean; update: () => void } {
  const { savedPlan, setSavedPlan, without } = usePlan();
  const { shoppingItems, updatePlanIngredients } = useShoppingContext();
  const targets = useTargets();
  const plan = savedPlan?.plan;
  const list = savedPlan?.list;
  const hasList = shoppingItems.length > 0;

  const change = useMemo(() => {
    // `needs` is absent on a list made by an older version of the app.
    if (!plan || !list?.needs || !hasList) return null;
    const after = extractPartIngredients(plan, list.part, targets, without);
    // The order follows the days, and meals trading days within the part changes nothing to buy.
    const names = (items: { name: string }[]) => items.map(i => i.name).sort().join('\n');
    return names(list.needs) === names(after) ? null : { before: list.needs, after };
  }, [plan, list, hasList, targets, without]);

  const update = useCallback(() => {
    if (!change) return;
    updatePlanIngredients(change.before, change.after);
    setSavedPlan(prev => (prev?.list ? { ...prev, list: { ...prev.list, needs: change.after } } : prev));
  }, [change, updatePlanIngredients, setSavedPlan]);

  return { stale: change != null, update };
}
