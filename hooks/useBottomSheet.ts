import { useRef } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';

/**
 * Shared hook for the slide-up bottom sheet pattern used throughout the app.
 * Provides animated values, a drag-to-dismiss pan responder, and open/close helpers.
 *
 * @param onClosed - Optional callback fired after the close animation completes.
 */
export function useBottomSheet(onClosed?: () => void) {
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get('screen').height),
  ).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Keep onClosed stable inside the pan responder closure.
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const closeRef = useRef(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('screen').height,
        duration: 280,
        useNativeDriver: false,
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
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
            damping: 22,
            mass: 1,
            stiffness: 220,
          }).start();
        }
      },
    }),
  ).current;

  function open() {
    slideAnim.setValue(Dimensions.get('screen').height);
    backdropAnim.setValue(0);
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
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
