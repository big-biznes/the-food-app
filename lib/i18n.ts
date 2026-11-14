import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en';

/**
 * The languages the app is translated into. A language is offered (in Settings and on
 * the welcome screen) once it has a file here; until then everyone gets English.
 */
export const resources = {
  en: { translation: en },
} as const;

export type Language = keyof typeof resources;
export const LANGUAGES = Object.keys(resources) as Language[];
const FALLBACK: Language = 'en';

const isLanguage = (code: string | undefined | null): code is Language =>
  !!code && (LANGUAGES as string[]).includes(code);

/** The phone's language, when the app has it: "bg-BG" → "bg". */
export function deviceLanguage(): Language {
  let tag: string | undefined;
  try {
    tag = Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    tag = undefined;
  }
  const code = tag?.split(/[-_]/)[0]?.toLowerCase();
  return isLanguage(code) ? code : FALLBACK;
}

/**
 * The language to show: the one the person chose (profile, or on the welcome screen
 * before there is a profile), else the phone's, else English.
 */
export function pickLanguage(chosen?: string | null): Language {
  return isLanguage(chosen) ? chosen : deviceLanguage();
}

// The app's own instance; react-i18next's hooks use it through initReactI18next.
const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: FALLBACK,
  // Synchronous: the first render already has its text.
  initAsync: false,
  interpolation: { escapeValue: false }, // React escapes already
  returnNull: false,
});

export default i18n;
