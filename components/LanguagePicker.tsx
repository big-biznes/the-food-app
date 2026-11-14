import { startTransition, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import PressableScale from '@/components/PressableScale';
import { Colors } from '@/constants/theme';
import { font } from '@/constants/type';
import { useAuth } from '@/contexts/AuthContext';
import { LANGUAGES, Language, resources } from '@/lib/i18n';
import { useThemedStyles } from '@/hooks/useTheme';

/**
 * Chips for the app's languages, each named in its own language (Settings; the welcome screen
 * has LanguageMenu). Nothing is shown while
 * the app has only one language.
 */
export default function LanguagePicker() {
  const styles = useThemedStyles(makeStyles);
  const { i18n } = useTranslation();
  const { setLanguage } = useAuth();
  // The chip lights up at once; the switch itself re-renders every screen, so it runs
  // after this frame and as a transition, without holding up the tap.
  const [picked, setPicked] = useState<string | null>(null);
  const current = picked ?? i18n.language;
  if (LANGUAGES.length < 2) return null;

  function pick(code: Language) {
    if (code === current) return;
    setPicked(code);
    requestAnimationFrame(() =>
      startTransition(() => {
        setLanguage(code);
        setPicked(null);
      }),
    );
  }

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {LANGUAGES.map((code: Language) => {
        const selected = current === code;
        return (
          <PressableScale
            key={code}
            style={[styles.chip, selected && styles.chipOn]}
            onPress={() => pick(code)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLanguage={code}
          >
            <Text style={[styles.label, selected && styles.labelOn, code === 'bg' && styles.labelCyrillic]}>
              {resources[code].translation.language.name}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    // Like the other chips in Settings, so it shows on a section card as well as on the page.
    chip: { backgroundColor: c.surfaceAlt, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
    chipOn: { backgroundColor: c.primary },
    label: { fontFamily: font.medium, fontWeight: '500', fontSize: 13, color: c.text },
    labelOn: { color: c.onPrimary },
    // Its own name in Cyrillic, whatever the app's language (see hooks/useTheme.ts).
    labelCyrillic: { fontFamily: 'Onest_500Medium' },
  });
