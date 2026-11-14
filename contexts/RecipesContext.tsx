import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetchAll';
import { rowsToMeals, RawRecipe } from '@/data/recipes';
import { ALL_MEALS, Meal, setAllMeals } from '@/data/meals';
import FullScreenLoading from '@/components/FullScreenLoading';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { font } from '@/constants/type';

// v2: rows follow supabase/recipes.sql (ingredient lists, computed nutrition).
const CACHE_KEY = 'recipes:v2';
/** Tiny flag saying a full copy exists, so startup can decide without reading the big cache. */
const CACHE_FLAG_KEY = 'recipes:v2:saved';
const OLD_CACHE_KEYS = ['recipes:v1', 'recipes:v1:saved'];
const RECIPE_COLUMNS =
  'id,name,description,meal_type,main,emoji,prep_time_min,difficulty,' +
  'calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,' +
  'ingredients,seasonings,instructions,appliances,keywords,dietary_tags,sort';

type RecipesContextValue = {
  meals: Meal[];
  /** True once the full recipe list is available (from the device cache or Supabase). */
  ready: boolean;
  /** True once the list came from Supabase in this session, not from the device's saved copy. */
  fresh: boolean;
  refresh: () => Promise<void>;
};

const RecipesContext = createContext<RecipesContextValue | null>(null);

// Resolves the first time the full list is available; for code paths outside React.
let resolveReady: () => void = () => {};
const readyPromise = new Promise<void>(resolve => {
  resolveReady = resolve;
});

/** Wait until the full recipe list is loaded (immediately if it already is). */
export function waitForRecipes(): Promise<void> {
  return ALL_MEALS.length > 0 ? Promise.resolve() : readyPromise;
}

async function fetchRecipes(): Promise<RawRecipe[]> {
  return fetchAllRows<RawRecipe>((from, to) =>
    supabase.from('recipes').select(RECIPE_COLUMNS).order('sort').order('id').range(from, to),
  );
}

/**
 * Loads recipes from the device cache and then Supabase, and fills ALL_MEALS.
 *
 * The app only waits for this on the very first launch on a device (no saved copy yet).
 * Otherwise it renders straight away — the plan is stored as full meals in the user's data and
 * Discover keeps its next cards cached — while the full list loads in the background.
 */
export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>(ALL_MEALS);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);
  // 'checking' → reading the small flag; 'blocking' → first launch, wait for the network.
  const [phase, setPhase] = useState<'checking' | 'blocking' | 'open'>('checking');

  const apply = useCallback((rows: RawRecipe[]) => {
    const next = rowsToMeals(rows);
    setAllMeals(next);
    setMeals(next);
    resolveReady();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchRecipes();
      if (rows.length === 0) throw new Error('The recipes table is empty.');
      apply(rows);
      setFresh(true);
      setError(null);
      setPhase('open');
      AsyncStorage.multiSet([
        [CACHE_KEY, JSON.stringify(rows)],
        [CACHE_FLAG_KEY, '1'],
      ]).catch(() => {});
    } catch (e) {
      console.warn('[cloud] failed to load recipes:', (e as Error).message);
      setError((e as Error).message);
    }
  }, [apply]);

  useEffect(() => {
    AsyncStorage.multiRemove(OLD_CACHE_KEYS).catch(() => {});
    (async () => {
      const hasCache = (await AsyncStorage.getItem(CACHE_FLAG_KEY).catch(() => null)) === '1';
      setPhase(hasCache ? 'open' : 'blocking');
      if (hasCache) {
        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY);
          if (cached) apply(JSON.parse(cached) as RawRecipe[]);
        } catch {
          // ignore a corrupt cache; the network fetch below replaces it
        }
      }
      await refresh();
    })();
  }, [apply, refresh]);

  if (phase === 'checking') return null; // a few ms: only a tiny key is read
  if (phase === 'blocking' && meals.length === 0) {
    return error ? <RecipesError message={error} onRetry={refresh} /> : <RecipesLoading />;
  }

  return (
    <RecipesContext.Provider value={{ meals, ready: meals.length > 0, fresh, refresh }}>
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipesProvider');
  return ctx;
}

function RecipesLoading() {
  const { t } = useTranslation();
  return <FullScreenLoading title={t('recipes.loading')} subtitle={t('recipes.fetching')} />;
}

function RecipesError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.title}>{t('recipes.error')}</Text>
      <Text style={styles.subText}>{message}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onRetry}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{t('recipes.retry')}</Text>
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
