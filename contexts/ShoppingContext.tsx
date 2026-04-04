import React, { createContext, useContext, useState, useCallback } from 'react';

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
};

export type PantryItem = {
  id: string;
  name: string;
};

type ShoppingContextType = {
  shoppingItems: ShoppingItem[];
  pantryItems: PantryItem[];
  addShoppingItems: (names: string[]) => void;
  addShoppingItem: (name: string) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  clearChecked: () => void;
  finishShopping: () => void;
  addPantryItem: (name: string) => void;
  deletePantryItem: (id: string) => void;
};

const ShoppingContext = createContext<ShoppingContextType | null>(null);

let nextId = 1;
function uid() {
  return String(nextId++);
}

export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  const addShoppingItems = useCallback((names: string[]) => {
    setShoppingItems(prevShopping => {
      const existingNames = new Set(prevShopping.map(i => i.name.toLowerCase()));
      setPantryItems(prevPantry => {
        const pantryNames = new Set(prevPantry.map(i => i.name.toLowerCase()));
        const toAdd = names
          .filter(n => {
            const key = n.toLowerCase().trim();
            return key && !existingNames.has(key) && !pantryNames.has(key);
          })
          .map(name => ({ id: uid(), name: name.trim(), checked: false }));
        if (toAdd.length > 0) {
          setShoppingItems(prev => [...toAdd, ...prev]);
        }
        return prevPantry;
      });
      return prevShopping;
    });
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
