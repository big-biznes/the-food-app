import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

import { font } from '@/constants/type';
export type ConfirmToastShowOptions = {
  /** Overrides the default message for this showing. */
  message?: string;
  /** When set together with `onAction`, renders a tappable action (e.g. "Undo"). */
  actionLabel?: string;
  onAction?: () => void;
};

export type ConfirmToastHandle = {
  show: (options?: ConfirmToastShowOptions) => void;
};

type Props = {
  message: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

const HIDDEN_Y = -80;
const VISIBLE_MS = 2800;
const VISIBLE_WITH_ACTION_MS = 5000;

const ConfirmToast = forwardRef<ConfirmToastHandle, Props>(function ConfirmToast(
  { message, icon = 'checkmark-circle' },
  ref,
) {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotionRef();
  const [visible, setVisible] = useState(false);
  const [override, setOverride] = useState<ConfirmToastShowOptions>({});
  const anim = useRef(new Animated.Value(HIDDEN_Y)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function hide() {
    if (reducedMotion.current) {
      setVisible(false);
      return;
    }
    Animated.timing(anim, { toValue: HIDDEN_Y, duration: 260, useNativeDriver: true }).start(() =>
      setVisible(false),
    );
  }

  useImperativeHandle(ref, () => ({
    show(options = {}) {
      if (timer.current) clearTimeout(timer.current);
      setOverride(options);
      setVisible(true);

      const text = options.message ?? message;
      AccessibilityInfo.announceForAccessibility(
        options.actionLabel ? `${text}. ${options.actionLabel}` : text,
      );

      if (reducedMotion.current) {
        anim.setValue(0);
      } else {
        anim.setValue(HIDDEN_Y);
        Animated.spring(anim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 200,
        }).start();
      }

      timer.current = setTimeout(
        hide,
        options.actionLabel ? VISIBLE_WITH_ACTION_MS : VISIBLE_MS,
      );
    },
  }));

  if (!visible) return null;

  const text = override.message ?? message;
  const hasAction = Boolean(override.actionLabel && override.onAction);

  return (
    <Animated.View
      style={[styles.toast, { top: insets.top + 12, transform: [{ translateY: anim }] }]}
      pointerEvents={hasAction ? 'box-none' : 'none'}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={icon} size={18} color={c.onPrimary} />
      <Text style={styles.text}>{text}</Text>
      {hasAction && (
        <TouchableOpacity
          onPress={() => {
            if (timer.current) clearTimeout(timer.current);
            override.onAction?.();
            hide();
          }}
          accessibilityRole="button"
          accessibilityLabel={override.actionLabel}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text style={styles.action}>{override.actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

export default ConfirmToast;

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.primary,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 100,
      zIndex: 100,
    },
    text: {
      color: c.onPrimary,
      fontSize: 14,
      fontFamily: font.semibold, fontWeight: '600',
    },
    action: {
      color: c.onPrimary,
      fontSize: 14,
      fontFamily: font.bold, fontWeight: '700',
      textDecorationLine: 'underline',
      marginLeft: 4,
    },
  });
