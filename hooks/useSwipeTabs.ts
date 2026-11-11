import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, useWindowDimensions } from 'react-native';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

type Controlled<K> = { active: K; onChange: (tab: K) => void };

/**
 * Side-by-side panels that switch by tapping a tab or swiping sideways.
 * Lay the panels out in a row (one screen width per panel), move it with
 * `translateX`, spread `panHandlers` on its container, and give `progress`
 * (the active index, fractional mid-swipe) to <SegmentTabs> so the underline
 * follows the finger.
 *
 * Pass `controlled` when the active tab lives in a parent's state; the hook
 * then calls `onChange` instead of keeping its own, and animates to any
 * change the parent makes on its own.
 */
export function useSwipeTabs<K extends string>(keys: readonly K[], controlled?: Controlled<K>) {
  const { width } = useWindowDimensions();
  const widthRef = useRef(width);
  widthRef.current = width;
  const reducedMotion = useReducedMotionRef();
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const onChangeRef = useRef(controlled?.onChange);
  onChangeRef.current = controlled?.onChange;

  const [internalActive, setInternalActive] = useState<K>(keys[0]);
  const active = controlled ? controlled.active : internalActive;
  const activeRef = useRef<K>(active);
  activeRef.current = active;

  const progress = useRef(new Animated.Value(Math.max(0, keys.indexOf(active)))).current;
  // The index the slider is resting at or heading to.
  const targetRef = useRef(Math.max(0, keys.indexOf(active)));

  const animateTo = useCallback(
    (index: number) => {
      targetRef.current = index;
      if (reducedMotion.current) {
        progress.setValue(index);
        return;
      }
      // JS driver so the panel's rows are tappable immediately, not only after the slide ends.
      Animated.timing(progress, {
        toValue: index,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [progress, reducedMotion],
  );

  const switchTab = useCallback(
    (tab: K) => {
      // Start the slide before the re-render so it begins on this frame.
      animateTo(keysRef.current.indexOf(tab));
      if (tab === activeRef.current) return; // snap back, nothing changed
      activeRef.current = tab;
      if (onChangeRef.current) onChangeRef.current(tab);
      else setInternalActive(tab);
    },
    [animateTo],
  );
  const switchRef = useRef(switchTab);
  switchRef.current = switchTab;

  // Follow changes the parent makes without going through switchTab.
  const activeIndex = keys.indexOf(active);
  useEffect(() => {
    if (activeIndex >= 0 && activeIndex !== targetRef.current) animateTo(activeIndex);
  }, [activeIndex, animateTo]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        const base = keysRef.current.indexOf(activeRef.current);
        const last = keysRef.current.length - 1;
        progress.setValue(Math.max(0, Math.min(last, base - g.dx / widthRef.current)));
      },
      onPanResponderRelease: (_, g) => {
        const k = keysRef.current;
        const base = k.indexOf(activeRef.current);
        const value = base - g.dx / widthRef.current;
        const fastLeft = g.vx < -0.15;
        const fastRight = g.vx > 0.15;
        if ((fastLeft || value > base + 0.3) && base < k.length - 1) switchRef.current(k[base + 1]);
        else if ((fastRight || value < base - 0.3) && base > 0) switchRef.current(k[base - 1]);
        else switchRef.current(activeRef.current);
      },
      onPanResponderTerminate: () => switchRef.current(activeRef.current),
    }),
  ).current;

  const translateX = progress.interpolate({
    inputRange: [0, Math.max(1, keys.length - 1)],
    outputRange: [0, -width * Math.max(1, keys.length - 1)],
    extrapolate: 'clamp',
  });

  return { active, switchTab, progress, translateX, panHandlers: panResponder.panHandlers, width };
}
