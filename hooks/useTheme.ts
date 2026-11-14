import { useTranslation } from 'react-i18next';
import { Colors, colors } from '@/constants/theme';

/** Single light palette. No hooks, no subscriptions, no per-component cost. */
export function useTheme() {
  return { colors };
}

/**
 * The app's font, Bricolage Grotesque, has no Cyrillic letters. In a language written
 * in Cyrillic every weight of it is swapped for the same weight of Onest, which sits
 * close to it; React Native cannot fall back to another font letter by letter.
 */
const CYRILLIC_LANGUAGES = new Set(['bg']);
const CYRILLIC_FONT: Record<string, string> = {
  BricolageGrotesque_400Regular: 'Onest_400Regular',
  BricolageGrotesque_500Medium: 'Onest_500Medium',
  BricolageGrotesque_600SemiBold: 'Onest_600SemiBold',
  BricolageGrotesque_700Bold: 'Onest_700Bold',
  BricolageGrotesque_800ExtraBold: 'Onest_800ExtraBold',
};

/** The same styles with every font swapped for its Cyrillic stand-in. */
function withCyrillicFont<T>(styles: T): T {
  const out: Record<string, unknown> = {};
  for (const [name, style] of Object.entries(styles as Record<string, unknown>)) {
    const family = (style as { fontFamily?: string } | null)?.fontFamily;
    out[name] = family && CYRILLIC_FONT[family] ? { ...(style as object), fontFamily: CYRILLIC_FONT[family] } : style;
  }
  return out as T;
}

type Built = { latin?: unknown; cyrillic?: unknown };
const cache = new WeakMap<(c: Colors) => unknown, Built>();

/**
 * Build a StyleSheet from the palette once per factory (and script) and reuse it for
 * every instance. `factory` must be a module-level function. Components re-render when
 * the language changes, and pick up the styles for its script.
 */
export function useThemedStyles<T>(factory: (c: Colors) => T): T {
  const { i18n } = useTranslation();
  const script = CYRILLIC_LANGUAGES.has(i18n.language) ? 'cyrillic' : 'latin';
  let built = cache.get(factory);
  if (!built) {
    built = {};
    cache.set(factory, built);
  }
  if (built.latin === undefined) built.latin = factory(colors);
  if (script === 'cyrillic' && built.cyrillic === undefined) built.cyrillic = withCyrillicFont(built.latin as T);
  return built[script] as T;
}
