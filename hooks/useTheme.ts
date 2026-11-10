import { Colors, colors } from '@/constants/theme';

/** Single light palette. No hooks, no subscriptions, no per-component cost. */
export function useTheme() {
  return { colors };
}

const cache = new WeakMap<(c: Colors) => unknown, unknown>();

/**
 * Build a StyleSheet from the palette once per factory and reuse it for every
 * instance. `factory` must be a module-level function.
 */
export function useThemedStyles<T>(factory: (c: Colors) => T): T {
  let styles = cache.get(factory);
  if (styles === undefined) {
    styles = factory(colors);
    cache.set(factory, styles);
  }
  return styles as T;
}
