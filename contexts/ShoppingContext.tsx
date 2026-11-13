import React, { createContext, useContext, useCallback, useRef, startTransition } from 'react';
import { useCloudState } from '@/hooks/useCloudState';
import type { PlanIngredient } from '@/data/meals';

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  lowStock?: boolean;
  /** Chain id chosen for this item on the compare screen. */
  store?: string;
};

export type PantryItem = {
  id: string;
  name: string;
};

type ShoppingContextType = {
  shoppingItems: ShoppingItem[];
  pantryItems: PantryItem[];
  addShoppingItems: (names: string[]) => void;
  replaceShoppingItems: (names: string[]) => void;
  replacePlanIngredients: (ingredients: PlanIngredient[]) => void;
  /**
   * Bring a list made from the plan up to date after the plan's recipes were edited:
   * `before` is what the list was made from, `after` what the plan needs now.
   * Ticks, chosen stores and items the user added themselves are kept.
   */
  updatePlanIngredients: (before: PlanIngredient[], after: PlanIngredient[]) => void;
  addShoppingItem: (name: string) => void;
  toggleShoppingItem: (id: string) => void;
  /** Check or uncheck every item on the list. */
  setAllChecked: (checked: boolean) => void;
  deleteShoppingItem: (id: string) => void;
  clearChecked: () => void;
  finishShopping: () => void;
  addPantryItem: (name: string) => void;
  deletePantryItem: (id: string) => void;
  /** Restores the items removed by the most recent delete / clear. Returns false if nothing to undo. */
  undoLastRemoval: () => boolean;
  /** Tag items with the store to buy them at (item id → chain id) and group the list by store. */
  assignStores: (storeByItem: Record<string, string>) => void;
};

type Removal =
  | { kind: 'shopping'; entries: { item: ShoppingItem; index: number }[] }
  | { kind: 'pantry'; entries: { item: PantryItem; index: number }[] };

/** Re-insert removed entries at their original positions (skipping any that were re-added). */
function restore<T extends { id: string }>(list: T[], entries: { item: T; index: number }[]): T[] {
  const next = [...list];
  const present = new Set(next.map(i => i.id));
  for (const { item, index } of [...entries].sort((a, b) => a.index - b.index)) {
    if (present.has(item.id)) continue;
    next.splice(Math.min(index, next.length), 0, item);
    present.add(item.id);
  }
  return next;
}

/** Strip quantity/unit prefix from a formatted ingredient string to get the base name.
 *  e.g. "400g chicken breast" → "chicken breast"
 *       "x2 eggs"             → "eggs"
 *       "2 tbsp olive oil"    → "olive oil"
 */
function extractBaseName(formatted: string): string {
  let s = formatted.trim();
  // Strip "x{N} " prefix (cans / countable multiples)
  s = s.replace(/^x\d+\s+/, '');
  // Strip "{N}{unit} " prefix  e.g. "400g ", "500ml ", "1.5kg "
  s = s.replace(/^\d+(?:\.\d+)?(?:g|ml|kg|l)\s+/, '');
  // Strip "{N} {unit} " prefix  e.g. "2 tbsp ", "3 tsp ", "1 can ", "2 clove "
  s = s.replace(/^\d+(?:\.\d+)?\s+(?:tbsp|tsp|clove|slice|can)\s+/, '');
  // Strip any remaining leading digits (bare count)
  s = s.replace(/^\d+(?:\.\d+)?\s+/, '');
  return s.toLowerCase().trim();
}

const ShoppingContext = createContext<ShoppingContextType | null>(null);

// Items are persisted, so ids must stay unique across app launches and devices.
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const EMPTY_SHOPPING: ShoppingItem[] = [];
const EMPTY_PANTRY: PantryItem[] = [];

export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const [shoppingItems, setShoppingItems] = useCloudState<ShoppingItem[]>('shopping', EMPTY_SHOPPING);
  const [pantryItems, setPantryItems] = useCloudState<PantryItem[]>('pantry', EMPTY_PANTRY);

  // Ref kept in sync on every render so callbacks can read current pantry
  // without needing it as a dependency or triggering extra state updates.
  const pantryRef = useRef(pantryItems);
  pantryRef.current = pantryItems;
  const shoppingRef = useRef(shoppingItems);
  shoppingRef.current = shoppingItems;

  // Most recent destructive action, kept so the UI can offer "Undo".
  const lastRemoval = useRef<Removal | null>(null);

  const addShoppingItems = useCallback((names: string[]) => {
    setShoppingItems(prev => {
      const existingNames = new Set(prev.map(i => i.name.toLowerCase()));
      const toAdd = names
        .filter(n => {
          const key = n.toLowerCase().trim();
          return key && !existingNames.has(key);
        })
        .map(name => ({ id: uid(), name: name.trim(), checked: false }));
      return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
    });
  }, [setShoppingItems]);

  const replacePlanIngredients = useCallback((ingredients: PlanIngredient[]) => {
    const pantryNames = new Set(pantryRef.current.map(p => p.name.toLowerCase().trim()));
    const seen = new Set<string>();
    const result: ShoppingItem[] = [];

    for (const { name, uses } of ingredients) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const baseName = extractBaseName(trimmed);
      if (seen.has(baseName)) continue;
      seen.add(baseName);

      if (pantryNames.has(baseName)) {
        // Needed by several meals: what is in the pantry is likely not enough.
        if (uses > 1) {
          result.push({ id: uid(), name: trimmed, checked: false, lowStock: true });
        }
      } else {
        result.push({ id: uid(), name: trimmed, checked: false });
      }
    }

    startTransition(() => {
      setShoppingItems(result);
    });
  }, [setShoppingItems]);

  const updatePlanIngredients = useCallback((before: PlanIngredient[], after: PlanIngredient[]) => {
    const was = new Set(before.map(i => extractBaseName(i.name)));
    const now = new Map(after.map(i => [extractBaseName(i.name), i.name.trim()]));
    const pantryNames = new Set(pantryRef.current.map(p => p.name.toLowerCase().trim()));
    setShoppingItems(prev => {
      const kept: ShoppingItem[] = [];
      const listed = new Set<string>();
      for (const item of prev) {
        const base = extractBaseName(item.name);
        listed.add(base);
        const name = now.get(base);
        // Still needed: the new amount. No longer needed by the plan: gone. Not from the plan: untouched.
        if (name) kept.push(name === item.name ? item : { ...item, name });
        else if (!was.has(base)) kept.push(item);
      }
      // Needed now but not before (an ingredient put back into a recipe).
      const added: ShoppingItem[] = [];
      for (const [base, name] of now) {
        if (!was.has(base) && !listed.has(base) && !pantryNames.has(base)) added.push({ id: uid(), name, checked: false });
      }
      return [...kept, ...added];
    });
  }, [setShoppingItems]);

  const replaceShoppingItems = useCallback((names: string[]) => {
    setShoppingItems(
      names
        .filter(n => n.trim())
        .map(name => ({ id: uid(), name: name.trim(), checked: false })),
    );
  }, [setShoppingItems]);

  const addShoppingItem = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setShoppingItems(prev => [{ id: uid(), name: trimmed, checked: false }, ...prev]);
  }, [setShoppingItems]);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  }, [setShoppingItems]);

  const setAllChecked = useCallback((checked: boolean) => {
    setShoppingItems(prev =>
      prev.every(item => item.checked === checked) ? prev : prev.map(item => (item.checked === checked ? item : { ...item, checked })),
    );
  }, [setShoppingItems]);

  const deleteShoppingItem = useCallback((id: string) => {
    const index = shoppingRef.current.findIndex(item => item.id === id);
    if (index < 0) return;
    lastRemoval.current = { kind: 'shopping', entries: [{ item: shoppingRef.current[index], index }] };
    setShoppingItems(prev => prev.filter(item => item.id !== id));
  }, [setShoppingItems]);

  const clearChecked = useCallback(() => {
    const entries = shoppingRef.current
      .map((item, index) => ({ item, index }))
      .filter(e => e.item.checked);
    if (entries.length === 0) return;
    lastRemoval.current = { kind: 'shopping', entries };
    setShoppingItems(prev => prev.filter(item => !item.checked));
  }, [setShoppingItems]);

  const finishShopping = useCallback(() => {
    setShoppingItems(prev => {
      const bought = prev.filter(i => i.checked);
      if (bought.length === 0) return prev;
      setPantryItems(existingPantry => {
        const existingNames = new Set(existingPantry.map(p => p.name.toLowerCase()));
        const newItems = bought
          .filter(i => !existingNames.has(i.name.toLowerCase()))
          .map(i => ({ id: uid(), name: i.name }));
        return [...newItems, ...existingPantry];
      });
      return prev.filter(i => !i.checked);
    });
  }, [setShoppingItems, setPantryItems]);

  const addPantryItem = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPantryItems(prev => [{ id: uid(), name: trimmed }, ...prev]);
  }, [setPantryItems]);

  const deletePantryItem = useCallback((id: string) => {
    const index = pantryRef.current.findIndex(item => item.id === id);
    if (index < 0) return;
    lastRemoval.current = { kind: 'pantry', entries: [{ item: pantryRef.current[index], index }] };
    setPantryItems(prev => prev.filter(item => item.id !== id));
  }, [setPantryItems]);

  const undoLastRemoval = useCallback(() => {
    const removal = lastRemoval.current;
    if (!removal) return false;
    lastRemoval.current = null;
    if (removal.kind === 'shopping') {
      setShoppingItems(prev => restore(prev, removal.entries));
    } else {
      setPantryItems(prev => restore(prev, removal.entries));
    }
    return true;
  }, [setShoppingItems, setPantryItems]);

  const assignStores = useCallback((storeByItem: Record<string, string>) => {
    setShoppingItems(prev => {
      const tagged = prev.map(({ store: _old, ...item }) =>
        storeByItem[item.id] ? { ...item, store: storeByItem[item.id] } : item,
      );
      // Stable sort: one block per store, untagged items last.
      const order = [...new Set(Object.values(storeByItem))];
      const rank = (i: ShoppingItem) => (i.store ? order.indexOf(i.store) : order.length);
      return tagged.sort((a, b) => rank(a) - rank(b));
    });
  }, [setShoppingItems]);

  return (
    <ShoppingContext.Provider
      value={{
        shoppingItems,
        pantryItems,
        addShoppingItems,
        replaceShoppingItems,
        replacePlanIngredients,
        updatePlanIngredients,
        addShoppingItem,
        toggleShoppingItem,
        setAllChecked,
        deleteShoppingItem,
        clearChecked,
        finishShopping,
        addPantryItem,
        deletePantryItem,
        undoLastRemoval,
        assignStores,
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShoppingContext() {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error('useShoppingContext must be used within ShoppingProvider');
  return ctx;
}
