import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import LoadingScreen from '@/components/home/LoadingScreen';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

type Props = { title: string; subtitle: string };

/** Full-screen spinner + title, using the same look as the "Building your plan" screen. */
export default function FullScreenLoading({ title, subtitle }: Props) {
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotionRef();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion.current) return;
    const loop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim, reducedMotion]);

  return (
    <View style={styles.root}>
      <LoadingScreen fadeAnim={fadeAnim} spinAnim={spinAnim} title={title} subtitle={subtitle} />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
  });
