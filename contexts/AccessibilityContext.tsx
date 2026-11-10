import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

type A11yState = { reduceMotion: boolean; screenReader: boolean };

const DEFAULT: A11yState = { reduceMotion: false, screenReader: false };
const AccessibilityContext = createContext<A11yState>(DEFAULT);

/** Reads OS accessibility settings once at the root; components read them from context. */
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => {
      if (mounted) setReduceMotion(v);
    });
    AccessibilityInfo.isScreenReaderEnabled().then(v => {
      if (mounted) setScreenReader(v);
    });
    const subs = [
      AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion),
      AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader),
    ];
    return () => {
      mounted = false;
      subs.forEach(s => s.remove());
    };
  }, []);

  const value = useMemo(() => ({ reduceMotion, screenReader }), [reduceMotion, screenReader]);
  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibilityState(): A11yState {
  return useContext(AccessibilityContext);
}
