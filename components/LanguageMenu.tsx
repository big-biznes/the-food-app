import { startTransition, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from '@/components/PressableScale';
import { Colors } from '@/constants/theme';
import { font } from '@/constants/type';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { LANGUAGES, Language, resources } from '@/lib/i18n';

/** Height of the button and its distance from the top of the screen, for placing the list under it. */
const BUTTON_HEIGHT = 40;
const TOP = 12;

/**
 * A small button for a screen's top right corner that shows the app's language and opens
 * a list of the others, each named in its own language. Nothing is shown while the app has
 * only one language.
 */
export default function LanguageMenu() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t, i18n } = useTranslation();
  const { setLanguage } = useAuth();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  if (LANGUAGES.length < 2) return null;
  const current = i18n.language as Language;

  function pick(code: Language) {
    setOpen(false);
    if (code === current) return;
    // The list closes at once; the switch re-renders every screen, so it runs after this frame.
    requestAnimationFrame(() => startTransition(() => setLanguage(code)));
  }

  return (
    <>
      <PressableScale
        style={styles.button}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${t('language.label')}: ${resources[current]?.translation.language.name ?? current}`}
        accessibilityState={{ expanded: open }}
      >
        <Ionicons name="globe-outline" size={17} color={c.text} />
        <Text style={styles.code}>{current.toUpperCase()}</Text>
        <Ionicons name="chevron-down" size={13} color={c.textMuted} />
      </PressableScale>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel={t('common.close')}>
          <View
            style={[styles.list, { top: insets.top + TOP + BUTTON_HEIGHT + 6 }]}
            accessibilityRole="radiogroup"
            accessibilityLabel={t('language.label')}
          >
            {LANGUAGES.map((code: Language) => {
              const selected = code === current;
              return (
                <Pressable
                  key={code}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => pick(code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLanguage={code}
                >
                  <Text style={[styles.name, selected && styles.nameOn, code === 'bg' && (selected ? styles.cyrillicOn : styles.cyrillic)]}>
                    {resources[code].translation.language.name}
                  </Text>
                  {selected && <Ionicons name="checkmark" size={18} color={c.text} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    button: {
      height: BUTTON_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      borderRadius: 100,
      backgroundColor: c.surface,
    },
    code: { fontFamily: font.semibold, fontSize: 13, letterSpacing: 0.4, color: c.text },
    backdrop: { flex: 1 },
    list: {
      position: 'absolute',
      right: 20,
      minWidth: 190,
      backgroundColor: c.bg,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingVertical: 6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    rowPressed: { backgroundColor: c.surface },
    name: { fontFamily: font.medium, fontSize: 16, color: c.textSecondary },
    nameOn: { fontFamily: font.bold, color: c.text },
    // Its own name in Cyrillic, whatever the app's language (see hooks/useTheme.ts).
    cyrillic: { fontFamily: 'Onest_500Medium' },
    cyrillicOn: { fontFamily: 'Onest_700Bold' },
  });
