import React, { createContext, useContext, useState, useCallback, useRef, startTransition } from 'react';

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  lowStock?: boolean;
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
  replacePlanIngredients: (names: string[]) => void;
  addShoppingItem: (name: string) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  clearChecked: () => void;
  finishShopping: () => void;
  addPantryItem: (name: string) => void;
  deletePantryItem: (id: string) => void;
};

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

/** Returns true when the formatted string indicates the plan needs this ingredient
 *  more than once (x2, x3, …), meaning a single pantry stock is likely not enough. */
function isMultiUse(formatted: string): boolean {
  return /^x[2-9]\d*\s/.test(formatted.trim());
}

const ShoppingContext = createContext<ShoppingContextType | null>(null);

let nextId = 1;
function uid() {
  return String(nextId++);
}

export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  // Ref kept in sync on every render so callbacks can read current pantry
  // without needing it as a dependency or triggering extra state updates.
  const pantryRef = useRef(pantryItems);
  pantryRef.current = pantryItems;

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
  }, []);

  const replacePlanIngredients = useCallback((names: string[]) => {
    const pantryNames = new Set(pantryRef.current.map(p => p.name.toLowerCase().trim()));
    const seen = new Set<string>();
    const result: ShoppingItem[] = [];

    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const baseName = extractBaseName(trimmed);
      if (seen.has(baseName)) continue;
      seen.add(baseName);

      if (pantryNames.has(baseName)) {
        if (isMultiUse(trimmed)) {
          result.push({ id: uid(), name: trimmed, checked: false, lowStock: true });
        }
      } else {
        result.push({ id: uid(), name: trimmed, checked: false });
      }
    }

    startTransition(() => {
      setShoppingItems(result);
    });
  }, []);

  const replaceShoppingItems = useCallback((names: string[]) => {
    setShoppingItems(
      names
        .filter(n => n.trim())
        .map(name => ({ id: uid(), name: name.trim(), checked: false })),
    );
  }, []);

  const addShoppingItem = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setShoppingItems(prev => [{ id: uid(), name: trimmed, checked: false }, ...prev]);
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  }, []);

  const deleteShoppingItem = useCallback((id: string) => {
    setShoppingItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearChecked = useCallback(() => {
    setShoppingItems(prev => prev.filter(item => !item.checked));
  }, []);

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
  }, []);

  const addPantryItem = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPantryItems(prev => [{ id: uid(), name: trimmed }, ...prev]);
  }, []);

  const deletePantryItem = useCallback((id: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return (
    <ShoppingContext.Provider
      value={{
        shoppingItems,
        pantryItems,
        addShoppingItems,
        replaceShoppingItems,
        replacePlanIngredients,
        addShoppingItem,
        toggleShoppingItem,
        deleteShoppingItem,
        clearChecked,
        finishShopping,
        addPantryItem,
        deletePantryItem,
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
