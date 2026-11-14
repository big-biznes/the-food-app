import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSignInTransition } from '@/hooks/useSignInTransition';
import SigningInOverlay from './SigningInOverlay';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { authErrorText } from '@/lib/localize';
import { font } from '@/constants/type';

/** "or" divider + "Continue with Google" pill, used on the sign-in and sign-up screens. */
export default function GoogleButton() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { signInWithGoogle } = useAuth();
  const { signingIn, begin, cancel } = useSignInTransition();
  const [error, setError] = useState<string | null>(null);
  // True while the account picker is open (before the loading overlay takes over).
  const [pickerOpen, setPickerOpen] = useState(false);
  const busy = pickerOpen || signingIn;

  async function handlePress() {
    if (busy) return;
    setError(null);
    setPickerOpen(true);
    // The overlay appears only once an account is picked, and stays until home is ready.
    const result = await signInWithGoogle(() => {
      setPickerOpen(false);
      begin();
    });
    setPickerOpen(false);
    if (!result.ok) {
      cancel();
      if (result.error) setError(result.error);
    }
    // On success useSignInTransition navigates once the profile has loaded.
  }

  return (
    <View style={styles.wrap}>
      <SigningInOverlay visible={signingIn} />

      <View style={styles.dividerRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <PressableScale
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={t('auth.google')}
        accessibilityState={{ busy, disabled: busy }}
      >
        {busy ? (
          <ActivityIndicator color={c.text} />
        ) : (
          <>
            <Ionicons name="logo-google" size={18} color={c.text} />
            <Text style={styles.buttonText}>{t('auth.google')}</Text>
          </>
        )}
      </PressableScale>

      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {authErrorText(error)}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    wrap: { width: '100%', gap: 16 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: { fontFamily: font.regular, fontSize: 14, color: c.textMuted },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: 58,
      borderRadius: 100,
      borderWidth: 1.5,
      borderColor: c.primary,
      backgroundColor: c.bg,
    },
    buttonText: { fontFamily: font.semibold, fontWeight: '600', fontSize: 16, color: c.text },
    errorText: { fontFamily: font.regular, fontSize: 13, color: c.danger, textAlign: 'center' },
  });
