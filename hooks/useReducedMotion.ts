import { useRef } from 'react';
import { useAccessibilityState } from '@/contexts/AccessibilityContext';

/** True when the OS "Reduce Motion" setting is on. Read from the root provider; no per-component work. */
export function useReducedMotion(): boolean {
  return useAccessibilityState().reduceMotion;
}

/** Same value exposed through a ref, for use inside pan responders and imperative handles. */
export function useReducedMotionRef() {
  const reduced = useReducedMotion();
  const ref = useRef(reduced);
  ref.current = reduced;
  return ref;
}

/** True when a screen reader (VoiceOver / TalkBack) is running. */
export function useScreenReader(): boolean {
  return useAccessibilityState().screenReader;
}
