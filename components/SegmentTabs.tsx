import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { font } from '@/constants/type';
import { useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

type Props<K extends string> = {
  tabs: readonly { key: K; label: string }[];
  active: K;
  onChange: (key: K) => void;
  /**
   * Position of the underline, 0 = first tab … n-1 = last. Pass it when the
   * screen drives the position itself (e.g. swiping between panels); otherwise
   * the underline animates on its own when `active` changes.
   */
  progress?: Animated.Value;
};

/** The app's tab switcher: labels on a hairline with a sliding underline. */
export default function SegmentTabs<K extends string>({ tabs, active, onChange, progress }: Props<K>) {
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotionRef();
  const [tabWidth, setTabWidth] = useState(0);
  const activeIndex = tabs.findIndex(t => t.key === active);
  const own = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    if (progress) return;
    if (reducedMotion.current) {
      own.setValue(activeIndex);
      return;
    }
    Animated.timing(own, {
      toValue: activeIndex,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeIndex, progress, own, reducedMotion]);

  const last = Math.max(1, tabs.length - 1);
  const translateX = (progress ?? own).interpolate({
    inputRange: [0, last],
    outputRange: [0, tabWidth * last],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={styles.wrapper}
      onLayout={e => setTabWidth(e.nativeEvent.layout.width / tabs.length)}
      accessibilityRole="tablist"
    >
      <Animated.View style={[styles.underline, { width: tabWidth, transform: [{ translateX }] }]} />
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={styles.btn}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: active === tab.key }}
        >
          <Text style={[styles.text, active === tab.key && styles.textOn]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    underline: {
      position: 'absolute',
      bottom: -1,
      left: 0,
      height: 2,
      backgroundColor: c.text,
    },
    btn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    text: { fontSize: 14, fontFamily: font.semibold, fontWeight: '600', color: c.textMuted },
    textOn: { color: c.text },
  });
