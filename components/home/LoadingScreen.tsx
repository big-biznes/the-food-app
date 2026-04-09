import { Animated, Text, StyleSheet } from 'react-native';

type Props = {
  fadeAnim: Animated.Value;
  spinAnim: Animated.Value;
};

export default function LoadingScreen({ fadeAnim, spinAnim }: Props) {
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
      <Text style={styles.title}>Building your plan</Text>
      <Text style={styles.subText}>Picking meals just for you…</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 40,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#F5F5F5',
    borderTopColor: '#111111',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 15,
    color: '#AAAAAA',
    marginTop: -8,
  },
});
