import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, LayoutChangeEvent, Text, StyleSheet, View, useWindowDimensions} from 'react-native';
import PressableScale from '@/components/PressableScale';
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
  /** When set, tapping the action turns the toast into this message in place instead of hiding it. */
  doneMessage?: string;
  /** Overrides the icon for this showing. */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

export type ConfirmToastHandle = {
  show: (options?: ConfirmToastShowOptions) => void;
  /** Slide the toast away now, when what it offers no longer applies. */
  dismiss: () => void;
};

type Props = {
  message: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

// Far enough up that the toast starts fully hidden behind the top edge and visibly slides in.
const HIDDEN_Y = -140;
const VISIBLE_MS = 2800;
const VISIBLE_WITH_ACTION_MS = 5000;
/** How long the content takes to roll over to new content, and the pill to take its new width. */
const ROLL_MS = 320;
const ROLL_EASING = Easing.bezier(0.32, 0.72, 0, 1);
/** Wider than any toast, so a line of content is laid out at its own width, whatever the pill's width is. */
const LINE_WIDTH = 1000;

/**
 * One thing the toast says. `roll` is where it is: 0 waiting below the pill,
 * 1 in place, 2 gone out through the top.
 */
type Line = { id: number; options: ConfirmToastShowOptions; roll: Animated.Value };

const ConfirmToast = forwardRef<ConfirmToastHandle, Props>(function ConfirmToast(
  { message, icon = 'checkmark-circle' },
  ref,
) {
  const insets = useSafeAreaInsets();
  // A long message is cut off with an ellipsis rather than running off the screen.
  const maxWidth = useWindowDimensions().width - 32;
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotionRef();
  const [visible, setVisible] = useState(false);
  // The last line is the current one; the ones before it are on their way out.
  const [lines, setLines] = useState<Line[]>([]);
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const nextId = useRef(0);
  const anim = useRef(new Animated.Value(HIDDEN_Y)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set by show(); the slide starts once the content has been measured, i.e. the toast is really on screen.
  const pendingEnter = useRef(false);
  const visibleRef = useRef(false);
  visibleRef.current = visible;
  // True while the toast is sliding away.
  const hiding = useRef(false);
  // The pill is as wide as its current line. JS-driven (width cannot use the native driver),
  // on its own view so the slide of the whole toast stays on the native driver.
  const widthAnim = useRef(new Animated.Value(0)).current;
  const measuredWidth = useRef<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  const textOf = (options: ConfirmToastShowOptions) => options.message ?? message;
  const announce = (options: ConfirmToastShowOptions) =>
    AccessibilityInfo.announceForAccessibility(
      options.actionLabel ? `${textOf(options)}. ${options.actionLabel}` : textOf(options),
    );

  /** New content in the same toast: the old line leaves through the top, the new one comes up from below. */
  function rollTo(options: ConfirmToastShowOptions) {
    const id = nextId.current++;
    if (reducedMotion.current) {
      setLines([{ id, options, roll: new Animated.Value(1) }]);
      return;
    }
    const line: Line = { id, options, roll: new Animated.Value(0) };
    const leaving = linesRef.current;
    setLines([...leaving, line]);
    const to = (value: Animated.Value, toValue: number) =>
      Animated.timing(value, { toValue, duration: ROLL_MS, easing: ROLL_EASING, useNativeDriver: true });
    Animated.parallel([to(line.roll, 1), ...leaving.map(old => to(old.roll, 2))]).start(() =>
      setLines(current => current.filter(l => !leaving.some(old => old.id === l.id))),
    );
  }

  /** The current line was laid out: size the pill to it, and let a waiting toast slide in. */
  function onLineLayout(e: LayoutChangeEvent) {
    const { width, height: lineHeight } = e.nativeEvent.layout;
    setHeight(lineHeight);
    if (measuredWidth.current == null || reducedMotion.current) {
      widthAnim.setValue(width);
    } else if (width !== measuredWidth.current) {
      Animated.timing(widthAnim, { toValue: width, duration: ROLL_MS, easing: ROLL_EASING, useNativeDriver: false }).start();
    }
    measuredWidth.current = width;
    if (pendingEnter.current) startEnter();
  }

  function startEnter() {
    pendingEnter.current = false;
    Animated.timing(anim, {
      toValue: 0,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

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
    hiding.current = true;
    Animated.timing(anim, { toValue: HIDDEN_Y, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(
      ({ finished }) => {
        // Not when show() interrupted the slide to bring the toast back.
        if (!finished) return;
        hiding.current = false;
        setVisible(false);
      },
    );
  }

  useImperativeHandle(ref, () => ({
    dismiss() {
      if (!visibleRef.current || hiding.current) return;
      if (timer.current) clearTimeout(timer.current);
      hide();
    },
    show(options = {}) {
      if (timer.current) clearTimeout(timer.current);
      const restart = () => {
        timer.current = setTimeout(hide, options.actionLabel ? VISIBLE_WITH_ACTION_MS : VISIBLE_MS);
      };

      // Already on screen: it stays where it is and only stays longer. It does not slide in again.
      const shown = linesRef.current[linesRef.current.length - 1];
      if (visibleRef.current && shown) {
        if (textOf(shown.options) === textOf(options) && shown.options.actionLabel === options.actionLabel) {
          // The same words, but the latest handlers.
          setLines(current => current.map(l => (l === shown ? { ...l, options } : l)));
        } else {
          rollTo(options);
          announce(options);
        }
        if (hiding.current) {
          // Caught on its way out: bring it back from where it is.
          hiding.current = false;
          startEnter();
        }
        restart();
        return;
      }

      measuredWidth.current = null;
      setLines([{ id: nextId.current++, options, roll: new Animated.Value(1) }]);
      setVisible(true);
      announce(options);

      if (reducedMotion.current) {
        anim.setValue(0);
      } else {
        anim.setValue(HIDDEN_Y);
        // Native driver so a busy JS thread can't make the slide skip frames. Starting it is
        // deferred until the content is laid out: the toast often mounts late (after e.g. the
        // shopping-list rebuild), and a slide started earlier would be mostly over by then — a "pop".
        pendingEnter.current = true;
      }

      restart();
    },
  }));

  if (!visible) return null;

  const current = lines[lines.length - 1];
  const hasAction = Boolean(current?.options.actionLabel && current.options.onAction);
  // How far a line travels: just out of the pill.
  const travel = height ?? 44;

  function press(options: ConfirmToastShowOptions) {
    if (timer.current) clearTimeout(timer.current);
    options.onAction?.();
    if (!options.doneMessage) {
      hide();
      return;
    }
    // The same toast now confirms what was done.
    const done = { message: options.doneMessage };
    rollTo(done);
    announce(done);
    timer.current = setTimeout(hide, VISIBLE_MS);
  }

  return (
    <Animated.View
      style={[styles.toast, { top: insets.top + 12, transform: [{ translateY: anim }] }]}
      pointerEvents="box-none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={[styles.pill, { width: widthAnim, height: height ?? undefined }]}
        pointerEvents={hasAction ? 'box-none' : 'none'}
      >
        {lines.map(line => {
          const isCurrent = line === current;
          const { options } = line;
          return (
            <Animated.View
              key={line.id}
              style={[
                styles.line,
                {
                  opacity: line.roll.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] }),
                  transform: [
                    { translateY: line.roll.interpolate({ inputRange: [0, 1, 2], outputRange: [travel, 0, -travel] }) },
                  ],
                },
              ]}
              pointerEvents={isCurrent ? 'box-none' : 'none'}
              importantForAccessibility={isCurrent ? 'auto' : 'no-hide-descendants'}
              accessibilityElementsHidden={!isCurrent}
            >
              <View style={[styles.content, { maxWidth }]} onLayout={isCurrent ? onLineLayout : undefined}>
                <Ionicons name={options.icon ?? icon} size={18} color={c.onPrimary} />
                <Text style={styles.text} numberOfLines={1}>
                  {textOf(options)}
                </Text>
                {options.actionLabel && options.onAction && (
                  <PressableScale
                    onPress={() => press(options)}
                    disabled={!isCurrent}
                    accessibilityRole="button"
                    accessibilityLabel={options.actionLabel}
                    hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.action}>{options.actionLabel}</Text>
                  </PressableScale>
                )}
              </View>
            </Animated.View>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
});

export default ConfirmToast;

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // Spans the screen so the pill can be centred whatever its width is at the moment.
    toast: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 100,
    },
    pill: {
      backgroundColor: c.primary,
      borderRadius: 100,
      overflow: 'hidden',
    },
    // Each line sits at the pill's left edge, in a row wide enough that it never wraps.
    line: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: LINE_WIDTH,
      alignItems: 'flex-start',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    text: {
      color: c.onPrimary,
      fontSize: 14,
      fontFamily: font.semibold, fontWeight: '600',
      flexShrink: 1,
    },
    action: {
      color: c.onPrimary,
      fontSize: 14,
      fontFamily: font.bold, fontWeight: '700',
      textDecorationLine: 'underline',
      marginLeft: 4,
    },
  });
