import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

import { font } from '@/constants/type';
export type PlanToastHandle = {
  /** `extraMs` keeps the toast (and its button label) up longer, e.g. for first-time users. */
  show: (options?: { extraMs?: number }) => void;
  dismiss: () => void;
};

type Props = {
  message: string;
  actionLabel: string;
  actionIcon: React.ComponentProps<typeof Ionicons>['name'];
  onAction: () => void;
  /** Called with true when the toast starts to appear and false as soon as it starts to leave. */
  onVisibleChange?: (visible: boolean) => void;
};

const HIDDEN_Y = 130;
/** Drag distance / speed that dismisses the toast when released. */
const DISMISS_DRAG_Y = 36;
const DISMISS_VELOCITY = 0.5;
/** Far enough below its resting spot that a swiped-away toast is fully off the bottom. */
const SWIPE_OFFSCREEN_Y = 240;
/** Slowest a swiped-away toast may leave (px/ms), so a gentle release doesn't crawl. */
const MIN_FLING_SPEED = 0.9;
const COLLAPSE_AFTER_MS = 3500;
const DISMISS_AFTER_MS = 7000;

const PlanToast = forwardRef<PlanToastHandle, Props>(function PlanToast(
  { message, actionLabel, actionIcon, onAction, onVisibleChange },
  ref,
) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const reducedMotion = useReducedMotionRef();
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(HIDDEN_Y)).current;
  // The label's natural width, measured on first layout. Until it's known the label isn't
  // width-constrained; after that the width animates from this value to 0 (icon-only).
  const [labelWidth, setLabelWidth] = useState<number | null>(null);
  const labelWidthRef = useRef<number | null>(null);
  const textWidth = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  useEffect(() => clearTimers, []);

  // A ref, so the timers and the pan responder always call the latest callback.
  const onVisibleChangeRef = useRef(onVisibleChange);
  onVisibleChangeRef.current = onVisibleChange;

  // Swipe down to dismiss. Capture only clear downward drags, so taps still reach the button.
  const flingAwayRef = useRef<(dy: number, vy: number) => void>(() => {});
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        slideAnim.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        // Follows the finger downwards; resists being pulled up.
        slideAnim.setValue(g.dy > 0 ? g.dy : g.dy * 0.2);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DRAG_Y || g.vy > DISMISS_VELOCITY) {
          flingAwayRef.current(g.dy, g.vy);
        } else {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      },
    }),
  ).current;

  function dismissInternal() {
    clearTimers();
    onVisibleChangeRef.current?.(false);
    if (reducedMotion.current) {
      setVisible(false);
      return;
    }
    Animated.timing(slideAnim, {
      toValue: HIDDEN_Y,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }

  /**
   * Continue the swipe at the finger's speed: an ease-out curve starts at 2 × distance / duration,
   * so pick the duration that makes that starting speed match the release velocity.
   */
  function flingAway(dy: number, vy: number) {
    clearTimers();
    onVisibleChangeRef.current?.(false);
    const distance = Math.max(SWIPE_OFFSCREEN_Y - dy, 0);
    const speed = Math.max(vy, MIN_FLING_SPEED);
    const duration = Math.min(Math.max((2 * distance) / speed, 120), 380);
    Animated.timing(slideAnim, {
      toValue: SWIPE_OFFSCREEN_Y,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }
  flingAwayRef.current = flingAway;

  useImperativeHandle(ref, () => ({
    show({ extraMs = 0 } = {}) {
      clearTimers();
      // Extra time is shared between keeping the label visible and keeping the toast up.
      const collapseAfter = COLLAPSE_AFTER_MS + extraMs / 2;
      const dismissAfter = DISMISS_AFTER_MS + extraMs;
      if (labelWidthRef.current != null) textWidth.setValue(labelWidthRef.current);
      textOpacity.setValue(1);
      setVisible(true);
      onVisibleChangeRef.current?.(true);
      AccessibilityInfo.announceForAccessibility(`${message} ${actionLabel}`);

      if (reducedMotion.current) {
        slideAnim.setValue(0);
      } else {
        slideAnim.setValue(HIDDEN_Y);
        // Native driver: shown right after a plan is generated, while the JS thread is busy;
        // a JS-driven slide would skip frames and jump into place.
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();

        // Collapse button text to icon-only. Skipped under reduced motion so the label stays.
        const t1 = setTimeout(() => {
          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 0,
              duration: 280,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(textWidth, {
              toValue: 0,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]).start();
        }, collapseAfter);
        timers.current.push(t1);
      }

      const t2 = setTimeout(dismissInternal, dismissAfter);
      timers.current.push(t2);
    },
    dismiss() {
      dismissInternal();
    },
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.toast, { transform: [{ translateY: slideAnim }] }]}
      {...panResponder.panHandlers}
      accessibilityActions={[{ name: 'dismiss', label: t('nav.dismiss') }]}
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'dismiss') dismissInternal();
      }}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.left}>
        <Ionicons name="checkmark-circle-outline" size={17} color={c.onPrimary} />
        <Text style={styles.message}>{message}</Text>
      </View>
      <PressableScale
        style={styles.actionBtn}
        onPress={onAction}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons name={actionIcon} size={15} color={c.text} />
        <Animated.View style={labelWidth == null ? null : { width: textWidth, overflow: 'hidden' }}>
          <Animated.Text
            style={[styles.actionBtnText, { opacity: textOpacity }]}
            numberOfLines={1}
            onLayout={e => {
              if (labelWidthRef.current != null) return;
              const w = Math.ceil(e.nativeEvent.layout.width);
              labelWidthRef.current = w;
              textWidth.setValue(w);
              setLabelWidth(w);
            }}
          >
            {' '}{actionLabel}
          </Animated.Text>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
});

export default PlanToast;

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      // The spot the Replan button normally has; the button steps aside while the toast is up.
      bottom: 28,
      // As wide as its content and centred, like the Replan pill, so it never
      // lines up edge to edge with a meal card underneath.
      alignSelf: 'center',
      maxWidth: '92%',
      backgroundColor: c.primary,
      borderRadius: 100,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 18,
      paddingRight: 8,
      paddingVertical: 8,
      gap: 12,
      // Knockout ring so the ink toast stays separate from the ink "eating out" card.
      borderWidth: 3,
      borderColor: c.bg,
    },
    left: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    message: {
      fontSize: 14,
      fontFamily: font.semibold, fontWeight: '600',
      color: c.onPrimary,
      flexShrink: 1,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bg,
      borderRadius: 100,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    actionBtnText: {
      fontSize: 13,
      fontFamily: font.semibold, fontWeight: '600',
      color: c.text,
    },
  });
