import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import GoogleButton from '@/components/auth/GoogleButton';
import SigningInOverlay from '@/components/auth/SigningInOverlay';
import { useSignInTransition } from '@/hooks/useSignInTransition';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { Trans } from 'react-i18next';
import { useTranslation } from '@/hooks/useTranslation';
import { authErrorText } from '@/lib/localize';

import { font, type } from '@/constants/type';
export default function LoginScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signingIn, begin, cancel } = useSignInTransition();
  const submitting = signingIn;

  const canSubmit = email.length > 0 && password.length > 0 && !submitting;

  async function handleLogin() {
    if (!canSubmit) return;
    setError(null);
    begin();
    const message = await login(email, password);
    if (message) {
      cancel();
      setError(authErrorText(message));
    }
    // On success useSignInTransition goes to home (or the quiz) once the profile has loaded.
  }

  return (
    <SafeAreaView style={styles.safe}>
      <SigningInOverlay visible={signingIn} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('auth.signInSub')}</Text>

          <View style={styles.form}>
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
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={c.textFaint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
              />
            </View>
            {error && (
              <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <PressableScale
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={22} color={c.text} />
              </PressableScale>
              <PressableScale
                style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={!canSubmit}
              >
                <Text style={styles.primaryButtonText}>{submitting ? t('auth.signingIn') : t('auth.signIn')}</Text>
              </PressableScale>
            </View>
            <GoogleButton />
            <PressableScale
              onPress={() => router.replace('/(auth)/register')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                <Trans i18nKey="auth.noAccount" components={{ link: <Text style={styles.switchLink} /> }} />
              </Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: { ...type.display, fontSize: 36, lineHeight: 37, color: c.text, paddingTop: 8, marginBottom: 6 },
  subtitle: {
    fontFamily: font.regular, fontSize: 16,
    color: c.textMuted,
    marginBottom: 40,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: font.medium, fontWeight: '500',
    color: c.text,
  },
  input: {
    backgroundColor: c.surface,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: font.regular, fontSize: 16,
    color: c.text,
  },
  footer: {
    marginTop: 40,
    gap: 20,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
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
  primaryButton: {
    flex: 1,
    backgroundColor: c.primary,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: c.surfaceStrong,
  },
  primaryButtonText: {
    color: c.onPrimary,
    fontSize: 16,
    fontFamily: font.semibold, fontWeight: '600',
  },
  errorText: {
    fontFamily: font.regular, fontSize: 13,
    color: c.danger,
  },
  switchText: {
    fontFamily: font.regular, fontSize: 15,
    color: c.textMuted,
  },
  switchLink: {
    color: c.text,
    fontWeight: '600',
  },
});
