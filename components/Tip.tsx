import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '@/components/PressableScale';
import { Colors } from '@/constants/theme';
import { font } from '@/constants/type';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

type Props = {
  /** Text, may hold inline icons (an Ionicons inside it renders in the line). */
  children: React.ReactNode;
  /** The close button was tapped. The parent then sets `leaving`. */
  onDismiss: () => void;
  /** Set to let the tip leave: it fades and folds away, then calls onGone. */
  leaving?: boolean;
  /** The tip has finished leaving and can be unmounted. */
  onGone?: () => void;
  /**
   * Distance from the tip's right edge to the centre of what it points at, for a tip sitting
   * just below a button. Without it the tip has no pointer.
   */
  pointRight?: number;
};

const POINTER = 12;
/** Space below the tip; part of its folding height, so the content under it moves smoothly. */
const GAP_BELOW = 16;
/** A pointing tip tucks this far up under the button row, so the pointer reaches the button. */
const TUCK_UP = 8;
/**
 * Leaving is two steps: the bubble fades where it is, then its space folds shut. Arriving is the
 * reverse. The fold runs on an even ease-in-out, so the content below glides rather than jumps
 * (a front-loaded curve does most of the move in the first frame).
 */
const FOLD_MS = 340;
const FADE_MS = 180;
const FOLD_EASING = Easing.inOut(Easing.cubic);
const FADE_EASING = Easing.out(Easing.quad);

/**
 * A small one-time tip in the flow of the screen: ink bubble, optional pointer, a close button.
 * It opens its space and then fades in; it leaves by fading while the space folds shut, so
 * whatever is below it slides into place instead of jumping.
 */
export default function Tip({ children, onDismiss, leaving = false, onGone, pointRight }: Props) {
  const { colors: c } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotionRef();
  // 0 folded away, 1 open. JS-driven: height cannot run on the native driver.
  const fold = useRef(new Animated.Value(reducedMotion.current ? 1 : 0)).current;
  // The bubble's opacity, on its own view so it can stay on the native driver.
  const fade = useRef(new Animated.Value(reducedMotion.current ? 1 : 0)).current;
  // The height the tip takes when open, measured from its content.
  const [height, setHeight] = useState<number | null>(null);
  const opened = useRef(false);
  const onGoneRef = useRef(onGone);
  onGoneRef.current = onGone;

  function onContentLayout(e: LayoutChangeEvent) {
    const h = e.nativeEvent.layout.height;
    if (h === height) return;
    setHeight(h);
    if (opened.current || leaving || reducedMotion.current) return;
    opened.current = true;
    Animated.sequence([
      Animated.timing(fold, { toValue: 1, duration: FOLD_MS, easing: FOLD_EASING, useNativeDriver: false }),
      Animated.timing(fade, { toValue: 1, duration: FADE_MS, easing: FADE_EASING, useNativeDriver: true }),
    ]).start();
  }

  useEffect(() => {
    if (!leaving) return;
    if (reducedMotion.current) {
      onGoneRef.current?.();
      return;
    }
    fold.stopAnimation();
    fade.stopAnimation();
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: FADE_MS, easing: FADE_EASING, useNativeDriver: true }),
      Animated.timing(fold, { toValue: 0, duration: FOLD_MS, easing: FOLD_EASING, useNativeDriver: false }),
    ]).start(({ finished }) => {
      if (finished) onGoneRef.current?.();
    });
  }, [leaving, fold, fade, reducedMotion]);

  const pointing = pointRight != null;

  return (
    <Animated.View
      style={{
        // Until it is measured the tip takes no space; the content is laid out inside regardless.
        height: height == null ? 0 : Animated.multiply(fold, height),
        marginTop: pointing ? fold.interpolate({ inputRange: [0, 1], outputRange: [0, -TUCK_UP] }) : 0,
        overflow: 'hidden',
      }}
      pointerEvents={leaving ? 'none' : 'box-none'}
      accessibilityLiveRegion="polite"
      accessibilityElementsHidden={leaving}
      importantForAccessibility={leaving ? 'no-hide-descendants' : 'auto'}
    >
      <Animated.View
        style={[styles.content, pointing && styles.contentWithPointer, { opacity: fade }]}
        onLayout={onContentLayout}
      >
        {pointing && <View style={[styles.pointer, { right: pointRight - POINTER / 2 }]} />}
        <View style={styles.bubble}>
          <Ionicons name="bulb" size={16} color={c.butter} style={styles.bulb} />
          <Text style={styles.text}>{children}</Text>
          <PressableScale
            style={styles.close}
            onPress={onDismiss}
            activeOpacity={0.7}
            scaleTo={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('tips.close')}
          >
            <Ionicons name="close" size={16} color={c.onPrimaryMuted} />
          </PressableScale>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // Laid out at its own height inside the folding view, so it can be measured at any moment.
    content: { position: 'absolute', top: 0, left: 0, right: 0, paddingBottom: GAP_BELOW },
    // Room above the bubble for the pointer, which reaches up to the button.
    contentWithPointer: { paddingTop: POINTER / 2 },
    pointer: {
      position: 'absolute',
      top: 0,
      width: POINTER,
      height: POINTER,
      borderRadius: 2,
      backgroundColor: c.primary,
      transform: [{ rotate: '45deg' }],
    },
    bubble: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingLeft: 14,
      paddingRight: 8,
      paddingVertical: 12,
    },
    bulb: { marginTop: 1 },
    text: { flex: 1, fontFamily: font.medium, fontSize: 14, lineHeight: 19, color: c.onPrimary },
    close: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -5,
    },
  });
