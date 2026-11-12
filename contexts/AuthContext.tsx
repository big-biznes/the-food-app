import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { flushCloudWrites } from '@/lib/cloudWrites';
import {
  USER_DATA_COLUMNS,
  clearPrimed,
  readStored,
  removeStored,
  setPrimed,
  writeStored,
} from '@/lib/cloudCache';

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-allergy'
  | 'halal'
  | 'kosher';

export type Goal = 'lose' | 'gain' | 'maintain';
export type Activity = 'low' | 'light' | 'active' | 'very';
export type Gender = 'male' | 'female' | 'other';

export type UserProfile = {
  name: string;
  email: string;
  goal: Goal;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  /** How active the user is day to day; sets their energy target (data/portions.ts). */
  activity?: Activity;
  restrictions: DietaryRestriction[];
  eatingOutDay: string;
  discoverExpertMode: boolean;
  /** How many plans the user has generated; used to give first-time users more time on tips. */
  plansCreated?: number;
  /** How many times the user opened meal details from a Discover card (tap hint shows until 3). */
  detailsOpened?: number;
  /** Where the user shops; decides which store chains are offered for price comparison. */
  country?: 'NL' | 'BG';
  /** Ids of the store chains the user shops at (see data/stores.ts). */
  stores?: string[];
};

type StoredProfile = Omit<UserProfile, 'email'>;

/** Error message for the UI, or null on success. */
type AuthResult = Promise<string | null>;

/** ok=false without an error means the user closed the Google window. */
export type GoogleSignInResult = { ok: boolean; error?: string };

type AuthContextType = {
  /** True until the saved session (and profile) has been restored on startup. */
  isLoading: boolean;
  /** Signed in and profile complete. */
  isLoggedIn: boolean;
  /** Signed in but the profile quiz hasn't been completed yet. */
  needsProfile: boolean;
  /** Supabase user id, or null when signed out (or in dev login). */
  userId: string | null;
  user: UserProfile | null;
  register: (email: string, password: string) => AuthResult;
  login: (email: string, password: string) => AuthResult;
  /** `onAccountChosen` fires once the user has picked an account, before the sign-in request finishes. */
  signInWithGoogle: (onAccountChosen?: () => void) => Promise<GoogleSignInResult>;
  completeProfile: (profile: StoredProfile) => void;
  updateProfile: (updates: Partial<StoredProfile>) => void;
  devLogin: (profile: UserProfile) => void;
  logout: () => Promise<void>;
  deleteAccount: () => AuthResult;
};

const AuthContext = createContext<AuthContextType | null>(null);


async function saveProfile(userId: string, profile: StoredProfile) {
  writeStored(userId, 'profile', profile);
  setPrimed(userId, 'profile', profile);
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, profile }, { onConflict: 'user_id' });
  if (error) console.warn('[cloud] failed to save profile:', error.message);
}

// ── Google sign-in ────────────────────────────────────────────────────────────
// Dev/release builds use Google's native account picker. Web and Expo Go (which don't
// include the native module) fall back to the browser-based OAuth flow.

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const useNativeGoogle = Platform.OS !== 'web' && !isExpoGo;

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');
let googleModule: GoogleSigninModule | null = null;

/** Loaded lazily so importing this file never touches the native module where it doesn't exist. */
function getGoogleSignin(): GoogleSigninModule {
  if (!googleModule) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    googleModule = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
    googleModule.GoogleSignin.configure({
      // The *Web* client ID: Google issues the ID token for it, and Supabase checks it.
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }
  return googleModule;
}

async function signInWithNativeGoogle(onAccountChosen?: () => void): Promise<GoogleSignInResult> {
  if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
    return { ok: false, error: 'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.' };
  }
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = getGoogleSignin();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      // Also what Google returns for some misconfigurations (e.g. Android client in another project).
      console.warn('[google] sign-in returned:', response.type);
      return { ok: false };
    }
    onAccountChosen?.();
    const idToken = response.data.idToken;
    if (!idToken) return { ok: false, error: 'Google did not return an ID token. Check the web client ID.' };
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) console.warn('[google] Supabase rejected the Google token:', error.message);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    console.warn('[google] sign-in threw:', isErrorWithCode(e) ? `code=${e.code}` : '', (e as Error)?.message);
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) return { ok: false };
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { ok: false, error: 'Google Play Services is not available on this device.' };
      }
      if (String(e.code) === '10' || e.code === 'DEVELOPER_ERROR') {
        console.warn('[google] DEVELOPER_ERROR: Android OAuth client package name / SHA-1 does not match this build.');
        return { ok: false, error: 'Google sign-in is not set up for this build yet.' };
      }
    }
    return { ok: false, error: (e as Error)?.message ?? 'Google sign-in failed.' };
  }
}

async function signOutNativeGoogle() {
  if (!useNativeGoogle) return;
  // Without this the picker silently reuses the last account on the next sign-in.
  // Load the module even if this session never signed in (e.g. after an app restart).
  await getGoogleSignin().GoogleSignin.signOut().catch(() => {});
}

/** Resolves after `ms` at the latest, so one slow step can't block logout. */
function withTimeout(promise: Promise<unknown>, ms: number, label: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise.catch(e => console.warn(`[auth] ${label} failed:`, (e as Error)?.message)),
    new Promise(resolve => {
      timer = setTimeout(() => {
        console.warn(`[auth] ${label} timed out after ${ms}ms`);
        resolve(undefined);
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/** Finish a browser-based Google sign-in from the URL Supabase redirected back to. */
async function completeOAuthFromUrl(url: string): Promise<GoogleSignInResult> {
  const { params, errorCode } = parseAuthUrl(url);
  if (errorCode || params.error) {
    return { ok: false, error: params.error_description ?? params.error ?? errorCode ?? 'Google sign-in failed.' };
  }
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    return error ? { ok: false, error: error.message } : { ok: true };
  }
  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }
  return { ok: false, error: 'Google sign-in did not return a session.' };
}

/** Reads both ?query and #fragment params (Supabase puts tokens in the fragment). */
function parseAuthUrl(url: string): { params: Record<string, string>; errorCode?: string } {
  const params: Record<string, string> = {};
  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.split('?')[1] ?? '';
  for (const part of [query, hash]) {
    new URLSearchParams(part).forEach((value, key) => {
      params[key] = value;
    });
  }
  return { params, errorCode: params.error_code };
}

/**
 * Loads the user's whole `user_data` row in one request (profile, plan, likes, shopping, pantry)
 * and primes the cloud cache, so screens open with real data instead of an empty state.
 * Runs during the "Signing you in" loader and on app start. Returns the profile.
 */
async function loadUserData(userId: string): Promise<StoredProfile | null> {
  const { data, error } = await supabase
    .from('user_data')
    .select(USER_DATA_COLUMNS.join(','))
    .eq('user_id', userId)
    .maybeSingle();
  if (!error) {
    const row = (data ?? {}) as Partial<Record<(typeof USER_DATA_COLUMNS)[number], unknown>>;
    for (const column of USER_DATA_COLUMNS) {
      const value = row[column];
      if (value == null) continue;
      setPrimed(userId, column, value);
      writeStored(userId, column, value);
    }
    return (row.profile ?? null) as StoredProfile | null;
  }
  // Offline: fall back to the last copy saved on this device.
  console.warn('[cloud] failed to load user data:', error.message);
  for (const column of USER_DATA_COLUMNS) {
    const value = await readStored(userId, column);
    if (value !== undefined) setPrimed(userId, column, value);
  }
  return (await readStored<StoredProfile>(userId, 'profile')) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  // Which user id the current `user` profile was loaded for.
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);

  const userId = session?.user.id ?? null;
  const email = session?.user.email ?? '';
  const isLoading = !sessionRestored || (userId !== null && profileLoadedFor !== userId);

  // Restore the saved session and follow sign-in / sign-out events.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionRestored(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load the profile whenever the signed-in user changes.
  useEffect(() => {
    if (!userId) {
      setUser(prev => (prev && !prev.email ? prev : null)); // keep a dev-login user
      // Forget the previous load so signing back in (even as the same user) waits for the profile again.
      setProfileLoadedFor(null);
      return;
    }
    let cancelled = false;
    loadUserData(userId).then(profile => {
      if (cancelled) return;
      setUser(profile ? { ...profile, email } : null);
      setProfileLoadedFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, email]);

  // Put a fresh session into state *before* the caller navigates. Otherwise the next screen can
  // render while we still look signed out (onAuthStateChange arrives a moment later).
  const syncSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  }, []);

  const register = useCallback(async (newEmail: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email: newEmail.trim(), password });
    if (error) return error.message;
    if (!data.session) return 'Check your email to confirm your account, then sign in.';
    setSession(data.session);
    return null;
  }, []);

  const login = useCallback(async (loginEmail: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password });
    if (error) return error.message;
    setSession(data.session);
    return null;
  }, []);

  const signInWithGoogle = useCallback(async (onAccountChosen?: () => void): Promise<GoogleSignInResult> => {
    if (useNativeGoogle) {
      const result = await signInWithNativeGoogle(onAccountChosen);
      if (result.ok) await syncSession();
      return result;
    }

    if (Platform.OS === 'web') {
      // Full-page redirect; the session is picked up from the URL when the app reloads.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    }

    // thefoodapp://auth/callback in builds, exp://…/--/auth/callback in Expo Go.
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) return { ok: false, error: error?.message ?? 'Could not start Google sign-in.' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return { ok: false }; // closed / cancelled
    onAccountChosen?.();
    const completed = await completeOAuthFromUrl(result.url);
    if (completed.ok) await syncSession();
    return completed;
  }, [syncSession]);

  const completeProfile = useCallback(
    (profile: StoredProfile) => {
      setUser({ ...profile, email });
      if (userId) saveProfile(userId, profile);
    },
    [userId, email],
  );

  const updateProfile = useCallback(
    (updates: Partial<StoredProfile>) => {
      if (!user) return;
      const next = { ...user, ...updates };
      setUser(next);
      if (userId) {
        const { email: _email, ...stored } = next;
        saveProfile(userId, stored);
      }
    },
    [user, userId],
  );

  const devLogin = useCallback((profile: UserProfile) => {
    if (!__DEV__) return;
    // Local-only user: nothing is synced because there is no session.
    setUser({ ...profile, email: '' });
  }, []);

  const logout = useCallback(async () => {
    console.log('[auth] logout: saving pending changes');
    await withTimeout(flushCloudWrites(), 4000, 'saving pending changes');
    await withTimeout(signOutNativeGoogle(), 3000, 'Google sign-out');
    // 'local' clears the session on this device without a network round trip, so it works offline.
    await withTimeout(supabase.auth.signOut({ scope: 'local' }), 3000, 'Supabase sign-out');
    clearPrimed();
    setSession(null);
    setUser(null);
    console.log('[auth] logout: done');
  }, []);

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) return error.message;
    if (userId) removeStored(userId);
    clearPrimed();
    await withTimeout(signOutNativeGoogle(), 3000, 'Google sign-out');
    await withTimeout(supabase.auth.signOut({ scope: 'local' }), 3000, 'Supabase sign-out');
    setSession(null);
    setUser(null);
    return null;
  }, [userId]);

  const value: AuthContextType = {
    isLoading,
    isLoggedIn: !!user,
    needsProfile: !!session && !user && !isLoading,
    userId,
    user,
    register,
    login,
    signInWithGoogle,
    completeProfile,
    updateProfile,
    devLogin,
    logout,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
