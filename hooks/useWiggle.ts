import { useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

/**
 * A small shake for an icon: it rocks around its centre a few times and settles.
 * Put `style` on an Animated.View around the icon and call `wiggle()` when it is pressed.
 */
export function useWiggle() {
  const reducedMotion = useReducedMotionRef();
  const value = useRef(new Animated.Value(0)).current;

  const wiggle = useCallback(() => {
    if (reducedMotion.current) return;
    value.setValue(0);
    // Native driver: a press often starts work on the JS thread (building the shopping list).
    Animated.timing(value, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [reducedMotion, value]);

  const rotate = value.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['0deg', '-16deg', '13deg', '-8deg', '4deg', '0deg'],
  });

  return { style: { transform: [{ rotate }] }, wiggle };
}
