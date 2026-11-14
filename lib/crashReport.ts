// Crash reports: when the app hits an error it cannot recover from, the error and the
// app/phone version are stored in Supabase (table crash_reports), without the account,
// so the bug can be found. Nothing is sent while developing, and nothing else is tracked.

import { supabase } from '@/lib/supabase';
import { appInfo } from '@/lib/appInfo';

/** At most this many reports per app start: one broken screen must not flood the table. */
const MAX_PER_START = 5;
const sent = new Set<string>();

const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max) : text);

/** Store an error. `where` is the React component stack, when there is one. Never throws. */
export function reportError(error: unknown, fatal: boolean, where?: string | null) {
  if (__DEV__) return;
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const message = clip(`${err.name}: ${err.message}`, 500);
    if (sent.has(message) || sent.size >= MAX_PER_START) return;
    sent.add(message);
    const stack = clip([err.stack, where].filter(Boolean).join('\n--- components ---\n'), 6000);
    supabase
      .from('crash_reports')
      .insert({ message, stack, fatal, ...appInfo() })
      .then(
        () => {},
        () => {},
      );
  } catch {
    // Reporting a crash must never cause one.
  }
}

type ErrorUtilsType = {
  getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

let installed = false;

/** Report errors that nothing caught (outside rendering), then let React Native handle them as before. */
export function installCrashReporting() {
  if (installed || __DEV__) return;
  installed = true;
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsType }).ErrorUtils;
  if (!errorUtils) return;
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    reportError(error, Boolean(isFatal));
    previous(error, isFatal);
  });
}
