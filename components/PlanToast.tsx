import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

import { font } from '@/constants/type';
export type PlanToastHandle = {
  show: () => void;
  dismiss: () => void;
};

type Props = {
  message: string;
  actionLabel: string;
  actionIcon: React.ComponentProps<typeof Ionicons>['name'];
  onAction: () => void;
};

const HIDDEN_Y = 100;
const COLLAPSE_AFTER_MS = 3500;
const DISMISS_AFTER_MS = 7000;

const PlanToast = forwardRef<PlanToastHandle, Props>(function PlanToast(
  { message, actionLabel, actionIcon, onAction },
  ref,
) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotionRef();
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(HIDDEN_Y)).current;
  const textWidth = useRef(new Animated.Value(160)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  useEffect(() => clearTimers, []);

  function dismissInternal() {
    clearTimers();
    if (reducedMotion.current) {
      setVisible(false);
      return;
    }
    Animated.timing(slideAnim, {
      toValue: HIDDEN_Y,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }

  useImperativeHandle(ref, () => ({
    show() {
      clearTimers();
      textWidth.setValue(160);
      textOpacity.setValue(1);
      setVisible(true);
      AccessibilityInfo.announceForAccessibility(`${message} ${actionLabel}`);

      if (reducedMotion.current) {
        slideAnim.setValue(0);
      } else {
        slideAnim.setValue(HIDDEN_Y);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
          mass: 1,
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
        }, COLLAPSE_AFTER_MS);
        timers.current.push(t1);
      }

      const t2 = setTimeout(dismissInternal, DISMISS_AFTER_MS);
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
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.left}>
        <Ionicons name="checkmark-circle-outline" size={17} color={c.onPrimary} />
        <Text style={styles.message}>{message}</Text>
      </View>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onAction}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons name={actionIcon} size={15} color={c.text} />
        <Animated.View style={{ width: textWidth, overflow: 'hidden' }}>
          <Animated.Text
            style={[styles.actionBtnText, { opacity: textOpacity }]}
            numberOfLines={1}
          >
            {' '}{actionLabel}
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default PlanToast;

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      bottom: 96,
      left: 16,
      right: 16,
      backgroundColor: c.primary,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
      // Knockout ring so the ink toast stays separate from the ink "eating out" card.
      borderWidth: 3,
      borderColor: c.bg,
    },
    left: {
      flex: 1,
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
