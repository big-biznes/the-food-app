import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { colors as c } from '@/constants/theme';
import { font } from '@/constants/type';
import i18n from '@/lib/i18n';
import { reportError } from '@/lib/crashReport';

/**
 * Shown in place of the app when a screen throws while rendering (the root layout's error
 * boundary). It stands outside the app's providers, so it reads the theme and the texts directly.
 */
export default function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError(error, true, (error as { componentStack?: string }).componentStack);
  }, [error]);

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.emoji}>🍳</Text>
      <Text style={styles.title} accessibilityRole="header">
        {i18n.t('crash.title')}
      </Text>
      <Text style={styles.body}>{i18n.t('crash.body')}</Text>
      <TouchableOpacity style={styles.button} onPress={() => retry()} activeOpacity={0.8} accessibilityRole="button">
        <Text style={styles.buttonText}>{i18n.t('crash.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emoji: { fontSize: 44 },
  title: { fontFamily: font.semibold, fontSize: 22, color: c.text, textAlign: 'center' },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: c.textMuted, textAlign: 'center' },
  button: { marginTop: 12, backgroundColor: c.primary, borderRadius: 100, paddingVertical: 16, paddingHorizontal: 40 },
  buttonText: { fontFamily: font.semibold, fontSize: 16, color: c.onPrimary },
});
