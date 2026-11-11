import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Keeps a "Signing you in…" state from the moment the user starts signing in until their
 * profile has loaded, then goes straight to home (or the quiz for a new account).
 * Avoids routing through the index screen, which briefly shows the welcome page.
 */
export function useSignInTransition() {
  const router = useRouter();
  const { isLoading, isLoggedIn, needsProfile } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!signingIn || isLoading) return;
    if (isLoggedIn) router.replace('/(tabs)/(home)');
    else if (needsProfile) router.replace('/(auth)/quiz');
    // Otherwise sign-in hasn't completed yet (picker still open / request in flight): keep waiting.
  }, [signingIn, isLoading, isLoggedIn, needsProfile, router]);

  const begin = useCallback(() => setSigningIn(true), []);
  const cancel = useCallback(() => setSigningIn(false), []);

  return { signingIn, begin, cancel };
}
