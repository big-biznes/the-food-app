import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Meal } from '@/data/meals';

// The next few Discover cards, saved as full meals so the deck can show them on app start
// before the recipe list has loaded (and so the user continues where they left off).
const KEY = 'discover:next:v1';
export const DISCOVER_CACHED_COUNT = 5;

export async function loadDiscoverNext(): Promise<Meal[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Meal[]) : [];
  } catch {
    return [];
  }
}

export function saveDiscoverNext(meals: Meal[]) {
  AsyncStorage.setItem(KEY, JSON.stringify(meals.slice(0, DISCOVER_CACHED_COUNT))).catch(() => {});
}
