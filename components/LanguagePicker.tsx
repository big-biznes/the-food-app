import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import PressableScale from '@/components/PressableScale';
import { Colors } from '@/constants/theme';
import { font } from '@/constants/type';
import { useAuth } from '@/contexts/AuthContext';
import { LANGUAGES, Language, resources } from '@/lib/i18n';
import { useThemedStyles } from '@/hooks/useTheme';

/**
 * Chips for the app's languages, each named in its own language. Nothing is shown while
 * the app has only one language.
 */
export default function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const { i18n } = useTranslation();
  const { setLanguage } = useAuth();
  if (LANGUAGES.length < 2) return null;

  return (
    <View style={[styles.row, compact && styles.rowCompact]} accessibilityRole="radiogroup">
      {LANGUAGES.map((code: Language) => {
        const selected = i18n.language === code;
        return (
          <PressableScale
            key={code}
            style={[styles.chip, compact && styles.chipCompact, selected && styles.chipOn]}
            onPress={() => setLanguage(code)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLanguage={code}
          >
            <Text style={[styles.label, selected && styles.labelOn]}>{resources[code].translation.language.name}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    rowCompact: { justifyContent: 'center' },
    // Like the other chips in Settings, so it shows on a section card as well as on the page.
    chip: { backgroundColor: c.surfaceAlt, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
    chipCompact: { paddingHorizontal: 12, paddingVertical: 6 },
    chipOn: { backgroundColor: c.primary },
    label: { fontFamily: font.medium, fontWeight: '500', fontSize: 13, color: c.text },
    labelOn: { color: c.onPrimary },
  });
