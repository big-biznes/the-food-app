import { useRef } from 'react';
import { Animated, PanResponder, useWindowDimensions } from 'react-native';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

/**
 * Shared hook for the slide-up bottom sheet pattern used throughout the app.
 * Provides animated values, a drag-to-dismiss pan responder, and open/close helpers.
 *
 * @param onClosed - Optional callback fired after the close animation completes.
 */
export function useBottomSheet(onClosed?: () => void) {
  const { height: screenHeight } = useWindowDimensions();
  const heightRef = useRef(screenHeight);
  heightRef.current = screenHeight;

  const reducedMotion = useReducedMotionRef();

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Keep onClosed stable inside the pan responder closure.
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const closeRef = useRef(() => {
    if (reducedMotion.current) {
      backdropAnim.setValue(0);
      slideAnim.setValue(heightRef.current);
      onClosedRef.current?.();
      return;
    }
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: heightRef.current,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => onClosedRef.current?.());
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 0,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          closeRef.current();
        } else if (reducedMotion.current) {
          slideAnim.setValue(0);
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            mass: 1,
            stiffness: 220,
          }).start();
        }
      },
    }),
  ).current;

  function open() {
    if (reducedMotion.current) {
      slideAnim.setValue(0);
      backdropAnim.setValue(1);
      return;
    }
    slideAnim.setValue(heightRef.current);
    backdropAnim.setValue(0);
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        mass: 1,
        stiffness: 220,
      }),
    ]).start();
  }

  return {
    slideAnim,
    backdropAnim,
    panResponder,
    open,
    close: closeRef.current,
  };
}
