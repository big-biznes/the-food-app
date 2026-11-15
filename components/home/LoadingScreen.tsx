import { useEffect } from 'react';
import { AccessibilityInfo, Animated, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

import { font } from '@/constants/type';
type Props = {
  fadeAnim: Animated.Value;
  spinAnim: Animated.Value;
  title?: string;
  subtitle?: string;
  /** Lie over the whole screen, so what is being prepared can render beneath it unseen. */
  cover?: boolean;
};

export default function LoadingScreen({
  fadeAnim,
  spinAnim,
  title,
  subtitle,
  cover = false,
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
      style={[styles.container, cover && styles.cover, { opacity: fadeAnim }]}
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
    cover: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: c.bg,
      zIndex: 50,
      elevation: 50,
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
