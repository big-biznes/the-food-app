import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

/** The bottom sheets' curve, so panels and sheets move alike. */
const EASING = Easing.bezier(0.32, 0.72, 0, 1);
const OPEN_MS = 380;
const CLOSE_MS = 300;

/**
 * Opens and closes its content smoothly: the height grows to the content's and the content
 * fades in, so what is below slides down instead of jumping. The content stays mounted while
 * it closes, and a change of its own height (e.g. a country opened inside) animates too.
 */
export default function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reducedMotion = useReducedMotionRef();
  // Height is JS-driven (it cannot use the native driver), and the content has buttons:
  // on the native driver taps would be measured against a stale position.
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(open ? 1 : 0)).current;
  const contentHeight = useRef(0);
  const [mounted, setMounted] = useState(open);
  const openRef = useRef(open);
  openRef.current = open;
  // Open from the start (e.g. no stores chosen yet): already in place, not growing as the screen opens.
  const placeOnFirstLayout = useRef(open);

  function animate(toHeight: number, toOpacity: number, duration: number, done?: () => void) {
    if (reducedMotion.current) {
      height.setValue(toHeight);
      opacity.setValue(toOpacity);
      done?.();
      return;
    }
    Animated.parallel([
      Animated.timing(height, { toValue: toHeight, duration, easing: EASING, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: toOpacity, duration, easing: EASING, useNativeDriver: false }),
    ]).start(({ finished }) => finished && done?.());
  }

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Measured already (opened before): grow now; otherwise onLayout starts it.
      if (contentHeight.current > 0) animate(contentHeight.current, 1, OPEN_MS);
    } else if (mounted) {
      animate(0, 0, CLOSE_MS, () => {
        if (!openRef.current) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onLayout(e: LayoutChangeEvent) {
    const h = Math.ceil(e.nativeEvent.layout.height);
    if (h === contentHeight.current) return;
    contentHeight.current = h;
    if (placeOnFirstLayout.current) {
      placeOnFirstLayout.current = false;
      height.setValue(h);
      return;
    }
    if (openRef.current) animate(h, 1, OPEN_MS);
  }

  if (!mounted) return null;

  return (
    <Animated.View style={[styles.clip, { height, opacity }]}>
      {/* Laid out at its own height whatever the clip's height is at the moment. */}
      <View style={styles.content} onLayout={onLayout}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  content: { position: 'absolute', left: 0, right: 0, top: 0 },
});
