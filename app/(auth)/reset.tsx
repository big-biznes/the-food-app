import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PressableScale from '@/components/PressableScale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import SigningInOverlay from '@/components/auth/SigningInOverlay';
import { useSignInTransition } from '@/hooks/useSignInTransition';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { authErrorText } from '@/lib/localize';

const MIN_PASSWORD = 6;

/**
 * Forgot password: an emailed code, then a new password. The code is typed in here, so it
 * works whichever device the email is read on.
 */
export default function ResetPasswordScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { requestPasswordReset, resetPassword } = useAuth();
  const { signingIn, begin } = useSignInTransition();

  const [email, setEmail] = useState(params.email ?? '');
  // The address the code was sent to; null until a code has been asked for.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = email.trim().length > 0 && !busy;
  const canSave = code.trim().length >= 6 && password.length >= MIN_PASSWORD && !busy;

  async function sendCode() {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    const message = await requestPasswordReset(email);
    setBusy(false);
    if (message) {
      setError(authErrorText(message));
      return;
    }
    setCode('');
    setSentTo(email.trim());
  }

  async function save() {
    if (!canSave || !sentTo) return;
    setBusy(true);
    setError(null);
    const message = await resetPassword(sentTo, code, password);
    if (message) {
      setBusy(false);
      setError(authErrorText(message));
      return;
    }
    // Signed in with the new password: on to home (or the quiz) once the profile has loaded.
    begin();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <SigningInOverlay visible={signingIn} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} accessibilityRole="header">
            {t('auth.resetTitle')}
          </Text>
          <Text style={styles.subtitle}>{sentTo ? t('auth.codeSent', { email: sentTo }) : t('auth.resetSub')}</Text>

          <View style={styles.form}>
            {sentTo ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.code')}</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="000000"
                    placeholderTextColor={c.textFaint}
                    value={code}
                    onChangeText={text => setCode(text.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    maxLength={10}
                    accessibilityLabel={t('auth.code')}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.newPassword')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor={c.textFaint}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    accessibilityLabel={t('auth.newPassword')}
                  />
                </View>
              </>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={c.textFaint}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  accessibilityLabel={t('auth.email')}
                />
              </View>
            )}
            {error && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {error}
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <PressableScale
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
              >
                <Ionicons name="chevron-back" size={22} color={c.text} />
              </PressableScale>
              {sentTo ? (
                <PressableScale
                  style={[styles.primaryButton, !canSave && styles.primaryButtonDisabled]}
                  onPress={save}
                  activeOpacity={0.8}
                  disabled={!canSave}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>{t(busy ? 'auth.savingPassword' : 'auth.savePassword')}</Text>
                </PressableScale>
              ) : (
                <PressableScale
                  style={[styles.primaryButton, !canSend && styles.primaryButtonDisabled]}
                  onPress={sendCode}
                  activeOpacity={0.8}
                  disabled={!canSend}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>{t(busy ? 'auth.sendingCode' : 'auth.sendCode')}</Text>
                </PressableScale>
              )}
            </View>
            {sentTo && (
              <PressableScale
                onPress={() => {
                  setSentTo(null);
                  setError(null);
                }}
                activeOpacity={0.7}
                disabled={busy}
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>{t('auth.resend')}</Text>
              </PressableScale>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
    title: { ...type.display, fontSize: 36, lineHeight: 37, color: c.text, paddingTop: 8, marginBottom: 6 },
    subtitle: { fontFamily: font.regular, fontSize: 16, lineHeight: 23, color: c.textMuted, marginBottom: 40 },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontFamily: font.medium, fontWeight: '500', color: c.text },
    input: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontFamily: font.regular,
      fontSize: 16,
      color: c.text,
    },
    codeInput: { fontFamily: font.semibold, fontSize: 22, letterSpacing: 6 },
    errorText: { fontFamily: font.regular, fontSize: 13, color: c.danger },
    footer: { marginTop: 40, gap: 20, alignItems: 'center' },
    buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
    backButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: c.bg,
      borderWidth: 1.5,
      borderColor: c.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButton: { flex: 1, backgroundColor: c.primary, borderRadius: 100, paddingVertical: 18, alignItems: 'center' },
    primaryButtonDisabled: { backgroundColor: c.surfaceStrong },
    primaryButtonText: { color: c.onPrimary, fontSize: 16, fontFamily: font.semibold, fontWeight: '600' },
    linkText: { fontFamily: font.medium, fontSize: 15, color: c.text },
  });
