import { useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Opacity while pressed, as on TouchableOpacity. 1 switches all press feedback off (a backdrop). */
  activeOpacity?: number;
  /** Size while pressed, as a share of the normal size. Smaller for small buttons, nearer 1 for big cards. */
  scaleTo?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The app's button: a drop-in for TouchableOpacity that also shrinks a little while it
 * is held and springs back when let go.
 *
 * The press itself is not delayed by any of this: onPress fires as it would without it.
 * The animation runs on the native driver, on the button's own view.
 */
export default function PressableScale({
  style,
  children,
  activeOpacity = 0.85,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const reducedMotion = useReducedMotionRef();
  // 0 at rest, 1 held down.
  const press = useRef(new Animated.Value(0)).current;
  const inert = activeOpacity === 1;

  function handlePressIn(e: GestureResponderEvent) {
    onPressIn?.(e);
    if (inert) return;
    if (reducedMotion.current) press.setValue(1);
    else Animated.timing(press, { toValue: 1, duration: 80, useNativeDriver: true }).start();
  }

  function handlePressOut(e: GestureResponderEvent) {
    onPressOut?.(e);
    if (inert) return;
    if (reducedMotion.current) press.setValue(0);
    else Animated.spring(press, { toValue: 0, speed: 22, bounciness: 10, useNativeDriver: true }).start();
  }

  // The button's own opacity (a disabled look) and transform stay; the press works on top of them.
  const flat = StyleSheet.flatten(style) ?? {};
  const baseOpacity = typeof flat.opacity === 'number' ? flat.opacity : 1;
  const baseTransform = Array.isArray(flat.transform) ? flat.transform : [];
  const scale = reducedMotion.current ? 1 : scaleTo;

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        inert
          ? null
          : {
              opacity: press.interpolate({ inputRange: [0, 1], outputRange: [baseOpacity, baseOpacity * activeOpacity] }),
              transform: [...baseTransform, { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }) }],
            },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
