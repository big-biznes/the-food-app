import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { rowsToMeals, RawRecipe } from '@/data/recipes';
import { ALL_MEALS, Meal, setAllMeals } from '@/data/meals';
import FullScreenLoading from '@/components/FullScreenLoading';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { font } from '@/constants/type';

const CACHE_KEY = 'recipes:v1';
const RECIPE_COLUMNS =
  'id,name,protein,carb,vegetable,sauce,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,' +
  'prep_time_min,difficulty,ingredient_quantities,appliances,tags,instructions';

type RecipesContextValue = {
  meals: Meal[];
  refresh: () => Promise<void>;
};

const RecipesContext = createContext<RecipesContextValue | null>(null);

async function fetchRecipes(): Promise<RawRecipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_COLUMNS)
    .range(0, 4999);
  if (error) throw new Error(error.message);
  // ids are text, so sort numerically to keep the CSV order.
  return ((data ?? []) as unknown as RawRecipe[]).sort((a, b) => Number(a.id) - Number(b.id));
}

/**
 * Loads recipes from the local cache (instant start / offline) and then from Supabase,
 * fills ALL_MEALS, and holds back rendering the app until there is something to show.
 */
export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>(ALL_MEALS);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((rows: RawRecipe[]) => {
    const next = rowsToMeals(rows);
    setAllMeals(next);
    setMeals(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchRecipes();
      if (rows.length === 0) throw new Error('The recipes table is empty.');
      apply(rows);
      setError(null);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(rows)).catch(() => {});
    } catch (e) {
      console.warn('[cloud] failed to load recipes:', (e as Error).message);
      setError((e as Error).message);
    }
  }, [apply]);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) apply(JSON.parse(cached) as RawRecipe[]);
      } catch {
        // ignore a corrupt cache; the network fetch below replaces it
      }
      await refresh();
    })();
  }, [apply, refresh]);

  if (meals.length === 0) {
    return error ? <RecipesError message={error} onRetry={refresh} /> : <RecipesLoading />;
  }

  return <RecipesContext.Provider value={{ meals, refresh }}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipesProvider');
  return ctx;
}

function RecipesLoading() {
  return <FullScreenLoading title="Loading recipes" subtitle="Fetching the cookbook…" />;
}

function RecipesError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.title}>Couldn’t load recipes</Text>
      <Text style={styles.subText}>{message}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onRetry}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 12,
    },
    title: { fontFamily: font.semibold, fontSize: 20, color: c.text, textAlign: 'center' },
    subText: { fontFamily: font.regular, fontSize: 15, color: c.textMuted, textAlign: 'center' },
    button: {
      marginTop: 12,
      backgroundColor: c.primary,
      borderRadius: 100,
      paddingVertical: 16,
      paddingHorizontal: 40,
    },
    buttonText: { fontFamily: font.semibold, fontSize: 16, color: c.onPrimary },
  });
