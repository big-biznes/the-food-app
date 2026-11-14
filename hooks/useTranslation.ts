import { createContext, createElement, startTransition, useContext, useEffect, useState, type ReactNode } from 'react';
// expo-router ships its own copy of React Navigation; its hook reads the right context.
import { useIsFocused } from 'expo-router';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

/**
 * The language a part of the app shows. Components do not follow i18next's language
 * on their own (lib/i18n.ts turns that off); they re-render when this context changes.
 * That lets a hidden tab keep its old text for a moment and catch up in the background,
 * instead of every screen of the app redrawing in the same frame as the switch.
 */
export const LanguageContext = createContext<string>(i18n.language);

/** react-i18next's hook, following LanguageContext. `t` always speaks the current language. */
export function useTranslation() {
  useContext(LanguageContext);
  return useI18nextTranslation();
}

/**
 * Around a tab's screens: while the tab is open it follows the language at once; while it
 * is hidden it catches up after `delay` ms, as a transition, so it never holds up a tap.
 */
export function DeferredLanguage({ delay, children }: { delay: number; children: ReactNode }) {
  const language = useContext(LanguageContext);
  const focused = useIsFocused();
  const [shown, setShown] = useState(language);

  useEffect(() => {
    if (shown === language || focused) return;
    const id = setTimeout(() => startTransition(() => setShown(language)), delay);
    return () => clearTimeout(id);
  }, [language, focused, shown, delay]);

  return createElement(LanguageContext.Provider, { value: focused ? language : shown }, children);
}
