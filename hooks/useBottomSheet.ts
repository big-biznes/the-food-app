import { useRef } from 'react';
import { Animated, Easing, PanResponder, useWindowDimensions } from 'react-native';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

type Motion = { duration: number; easing: (t: number) => number };

/** Curve used by iOS-style sheets (and drawer libraries that imitate them): smooth start, long soft settle. */
const IOS_CURVE = Easing.bezier(0.32, 0.72, 0, 1);

export type SheetMotion = 'ios' | 'easeOut';

const MOTIONS: Record<SheetMotion, { open: Motion; close: Motion; snapBack: Motion; backdrop?: (t: number) => number }> = {
  easeOut: {
    open: { duration: 400, easing: Easing.out(Easing.cubic) },
    close: { duration: 320, easing: Easing.in(Easing.cubic) },
    snapBack: { duration: 280, easing: Easing.out(Easing.cubic) },
  },
  ios: {
    open: { duration: 450, easing: IOS_CURVE },
    close: { duration: 420, easing: IOS_CURVE },
    snapBack: { duration: 350, easing: IOS_CURVE },
    backdrop: IOS_CURVE,
  },
};

/**
 * Shared hook for the slide-up bottom sheet pattern used throughout the app.
 * Provides animated values, a drag-to-dismiss pan responder, and open/close helpers.
 *
 * The slide runs on the JS driver on purpose: with the native driver React Native's view
 * of the sheet's position stays at the start (off-screen) until the animation ends, so
 * buttons inside it ignore taps (any finger movement counts as "left the button") until then.
 * The backdrop fade has no touch targets, so it stays on the native driver.
 *
 * @param onClosed - Optional callback fired after the close animation completes.
 * @param motion - Animation curves: 'ios' (iOS sheet curve, the app default) or 'easeOut' (ease-out cubic).
 */
export function useBottomSheet(onClosed?: () => void, motion: SheetMotion = 'ios') {
  const motionRef = useRef(MOTIONS[motion]);
  motionRef.current = MOTIONS[motion];

  const { height: screenHeight } = useWindowDimensions();
  const heightRef = useRef(screenHeight);
  heightRef.current = screenHeight;

  const reducedMotion = useReducedMotionRef();

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Keep onClosed stable inside the pan responder closure.
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  // Whether the sheet is open. Sheets call close() whenever `visible` is false, which includes
  // their first render; without this, a sheet that was never opened would report being closed
  // and its onClose would run (the snack question then answered itself and built a plan).
  const isOpen = useRef(false);

  const closeRef = useRef(() => {
    if (!isOpen.current) return;
    isOpen.current = false;
    if (reducedMotion.current) {
      backdropAnim.setValue(0);
      slideAnim.setValue(heightRef.current);
      onClosedRef.current?.();
      return;
    }
    const m = motionRef.current;
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: m.close.duration - 20,
        easing: m.backdrop,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: heightRef.current,
        ...m.close,
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
        } else if (reducedMotion.current) {
          slideAnim.setValue(0);
        } else {
          Animated.timing(slideAnim, {
            toValue: 0,
            ...motionRef.current.snapBack,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  function open() {
    isOpen.current = true;
    if (reducedMotion.current) {
      slideAnim.setValue(0);
      backdropAnim.setValue(1);
      return;
    }
    slideAnim.setValue(heightRef.current);
    backdropAnim.setValue(0);
    const m = motionRef.current;
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: m.open.duration - 20,
        easing: m.backdrop,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        ...m.open,
        useNativeDriver: false,
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
