import { useEffect } from 'react';
import { AccessibilityInfo, Animated, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

import { font } from '@/constants/type';
type Props = {
  fadeAnim: Animated.Value;
  spinAnim: Animated.Value;
  title?: string;
  subtitle?: string;
};

export default function LoadingScreen({
  fadeAnim,
  spinAnim,
  title,
  subtitle,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const TITLE = title ?? t('setup.building');
  const SUBTITLE = subtitle ?? t('setup.picking');

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${TITLE}. ${SUBTITLE}`);
  }, [TITLE, SUBTITLE]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={[styles.spinner, { transform: [{ rotate: spin }] }]}
        accessibilityRole="progressbar"
        accessibilityLabel={t('setup.loading')}
      />
      <Text style={styles.title}>{TITLE}</Text>
      <Text style={styles.subText}>{SUBTITLE}</Text>
    </Animated.View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
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
      borderColor: c.surfaceAlt,
      borderTopColor: c.primary,
    },
    title: {
      fontSize: 22,
      fontFamily: font.bold, fontWeight: '700',
      color: c.text,
      letterSpacing: -0.3,
    },
    subText: {
      fontFamily: font.regular, fontSize: 15,
      color: c.textMuted,
      marginTop: -8,
    },
  });
