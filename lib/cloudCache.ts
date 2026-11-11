import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserDataColumn } from '@/lib/supabase';

/**
 * Per-user copies of the `user_data` columns.
 *
 * - In memory: filled by AuthContext while signing in (one request for the whole row), so every
 *   useCloudState starts with the real value on its first render — no "empty" flash on home.
 * - In AsyncStorage: the same values persisted for offline starts.
 */

export const USER_DATA_COLUMNS: UserDataColumn[] = ['profile', 'likes', 'shopping', 'pantry', 'plan'];

const memory = new Map<string, unknown>();

export function cloudKey(userId: string, column: UserDataColumn) {
  return `cloud:${userId}:${column}`;
}

/** Value loaded during sign-in (or saved since), if any. */
export function getPrimed<T>(userId: string, column: UserDataColumn): T | undefined {
  return memory.get(cloudKey(userId, column)) as T | undefined;
}

export function setPrimed(userId: string, column: UserDataColumn, value: unknown) {
  memory.set(cloudKey(userId, column), value);
}

export function clearPrimed() {
  memory.clear();
}

export async function readStored<T>(userId: string, column: UserDataColumn): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(cloudKey(userId, column));
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export function writeStored(userId: string, column: UserDataColumn, value: unknown) {
  AsyncStorage.setItem(cloudKey(userId, column), JSON.stringify(value)).catch(() => {});
}

export function removeStored(userId: string) {
  AsyncStorage.multiRemove(USER_DATA_COLUMNS.map(col => cloudKey(userId, col))).catch(() => {});
}
