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
                <LanguageRow
                  key={code}
                  code={code}
                  selected={selected}
                  onPress={() => pick(code)}
                  styles={styles}
                  checkColor={c.text}
                />
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/**
 * One language in the list. Pressed state is kept here rather than in a style function, which
 * NativeWind's Pressable wrapper does not apply (the rows lost their whole layout).
 */
function LanguageRow({
  code,
  selected,
  onPress,
  styles,
  checkColor,
}: {
  code: Language;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  checkColor: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLanguage={code}
    >
      <View style={[styles.row, (pressed || selected) && styles.rowOn]}>
        <Text style={[styles.name, selected && styles.nameOn, code === 'bg' && (selected ? styles.cyrillicOn : styles.cyrillic)]}>
          {resources[code].translation.language.name}
        </Text>
        {selected && <Ionicons name="checkmark" size={18} color={checkColor} />}
      </View>
    </Pressable>
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
      borderWidth: 1,
      borderColor: c.border,
      padding: 6,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
    },
    // The chosen language sits on a soft tile, so it reads as chosen before the checkmark.
    rowOn: { backgroundColor: c.surface },
    name: { fontFamily: font.medium, fontSize: 16, color: c.textSecondary },
    nameOn: { fontFamily: font.bold, color: c.text },
    // Its own name in Cyrillic, whatever the app's language (see hooks/useTheme.ts).
    cyrillic: { fontFamily: 'Onest_500Medium' },
    cyrillicOn: { fontFamily: 'Onest_700Bold' },
  });
