import { useCallback, useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, UserDataColumn } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { registerFlush } from '@/lib/cloudWrites';

const SAVE_DELAY_MS = 800;

function cacheKey(userId: string, column: UserDataColumn) {
  return `cloud:${userId}:${column}`;
}

async function readCache<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function writeCache(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

/**
 * useState that is stored in one JSON column of the signed-in user's `user_data` row.
 * Loads from the local cache first, then from Supabase; saves changes back with a debounce.
 * Without a signed-in user (logged out / dev login) it behaves like plain useState.
 */
export function useCloudState<T>(
  column: UserDataColumn,
  initial: T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const { userId } = useAuth();
  const [value, setValueRaw] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  const initialRef = useRef(initial);
  const valueRef = useRef(value);
  valueRef.current = value;
  // True while a local change is waiting to be saved.
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!userId || !dirty.current) return;
    dirty.current = false;
    const current = valueRef.current;
    writeCache(cacheKey(userId, column), current);
    const { error } = await supabase
      .from('user_data')
      .upsert({ user_id: userId, [column]: current }, { onConflict: 'user_id' });
    if (error) {
      dirty.current = true; // retry on the next change / flush
      console.warn(`[cloud] failed to save ${column}:`, error.message);
    }
  }, [userId, column]);

  // Load whenever the signed-in user changes.
  useEffect(() => {
    let cancelled = false;
    dirty.current = false;
    setLoaded(false);
    setValueRaw(initialRef.current);
    if (!userId) {
      setLoaded(true);
      return;
    }

    (async () => {
      const key = cacheKey(userId, column);
      const cached = await readCache<T>(key);
      if (!cancelled && cached !== undefined && !dirty.current) setValueRaw(cached);

      const { data, error } = await supabase
        .from('user_data')
        .select(column)
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn(`[cloud] failed to load ${column}:`, error.message);
      } else {
        const remote = (data as Record<string, unknown> | null)?.[column] as T | null | undefined;
        if (remote != null && !dirty.current) {
          setValueRaw(remote);
          writeCache(key, remote);
        }
      }
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, column]);

  // Register for logout flushes and save anything pending on unmount / user change.
  useEffect(() => {
    const unregister = registerFlush(save);
    return () => {
      unregister();
      save();
    };
  }, [save]);

  // Stable setter (like useState's): reads the current user / save function from refs,
  // so callbacks that captured it keep working after the user changes.
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const saveRef = useRef(save);
  saveRef.current = save;

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(action => {
    setValueRaw(action);
    if (!userIdRef.current) return;
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveRef.current(), SAVE_DELAY_MS);
  }, []);

  return [value, setValue, loaded];
}
