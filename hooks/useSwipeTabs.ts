import { useCallback, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, useWindowDimensions } from 'react-native';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

/**
 * Two side-by-side panels that switch by tapping a tab or swiping sideways.
 * Lay the panels out in a row twice the screen width, move it with
 * `translateX`, spread `panHandlers` on its container, and give `progress`
 * to <SegmentTabs> so the underline follows the finger.
 */
export function useSwipeTabs<K extends string>(keys: readonly [K, K]) {
  const { width } = useWindowDimensions();
  const widthRef = useRef(width);
  widthRef.current = width;
  const reducedMotion = useReducedMotionRef();

  const [active, setActive] = useState<K>(keys[0]);
  const activeRef = useRef<K>(keys[0]);
  const progress = useRef(new Animated.Value(0)).current; // 0 = first tab, 1 = second

  const switchTab = useCallback(
    (tab: K) => {
      activeRef.current = tab;
      setActive(tab);
      const toValue = tab === keys[0] ? 0 : 1;
      if (reducedMotion.current) {
        progress.setValue(toValue);
        return;
      }
      // JS driver so the panel's rows are tappable immediately, not only after the slide ends.
      Animated.timing(progress, {
        toValue,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [keys, progress, reducedMotion],
  );
  const switchRef = useRef(switchTab);
  switchRef.current = switchTab;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        const base = activeRef.current === keys[0] ? 0 : 1;
        progress.setValue(Math.max(0, Math.min(1, base - g.dx / widthRef.current)));
      },
      onPanResponderRelease: (_, g) => {
        const onFirst = activeRef.current === keys[0];
        const value = Math.max(0, Math.min(1, (onFirst ? 0 : 1) - g.dx / widthRef.current));
        const fastLeft = g.vx < -0.15;
        const fastRight = g.vx > 0.15;
        if ((fastLeft || value > 0.3) && onFirst) switchRef.current(keys[1]);
        else if ((fastRight || value < 0.7) && !onFirst) switchRef.current(keys[0]);
        else switchRef.current(activeRef.current);
      },
      onPanResponderTerminate: () => switchRef.current(activeRef.current),
    }),
  ).current;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
    extrapolate: 'clamp',
  });

  return { active, switchTab, progress, translateX, panHandlers: panResponder.panHandlers, width };
}
