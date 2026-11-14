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
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import GoogleButton from '@/components/auth/GoogleButton';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { Trans, useTranslation } from 'react-i18next';
import { authErrorText } from '@/lib/localize';

import { font, type } from '@/constants/type';
export default function RegisterScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordsMatch = password === confirm;
  const canSubmit =
    email.length > 0 && password.length >= 6 && confirm.length > 0 && passwordsMatch && !submitting;

  async function handleRegister() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const message = await register(email, password);
    setSubmitting(false);
    if (message) {
      setError(authErrorText(message));
      return;
    }
    router.push('/(auth)/quiz');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.createSub')}</Text>

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
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={c.textFaint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
              <TextInput
                style={[
                  styles.input,
                  confirm.length > 0 && !passwordsMatch && styles.inputError,
                ]}
                placeholder={t('auth.repeatPassword')}
                placeholderTextColor={c.textFaint}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
              {confirm.length > 0 && !passwordsMatch && (
                <Text style={styles.errorText}>{t('auth.mismatch')}</Text>
              )}
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
                onPress={handleRegister}
                activeOpacity={0.8}
                disabled={!canSubmit}
              >
                <Text style={styles.primaryButtonText}>{t('common.continue')}</Text>
              </PressableScale>
            </View>
            <GoogleButton />
            <Text style={styles.legalText}>
              <Trans
                i18nKey="auth.agree"
                components={{
                  terms: (
                    <Text
                      style={styles.switchLink}
                      accessibilityRole="link"
                      onPress={() => router.push('/legal/terms' as Href)}
                    />
                  ),
                  privacy: (
                    <Text
                      style={styles.switchLink}
                      accessibilityRole="link"
                      onPress={() => router.push('/legal/privacy' as Href)}
                    />
                  ),
                }}
              />
            </Text>
            <PressableScale
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                <Trans i18nKey="auth.haveAccount" components={{ link: <Text style={styles.switchLink} /> }} />
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
  inputError: {
    backgroundColor: c.dangerBg,
  },
  errorText: {
    fontFamily: font.regular, fontSize: 13,
    color: c.danger,
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
  switchText: {
    fontFamily: font.regular, fontSize: 15,
    color: c.textMuted,
  },
  legalText: {
    fontFamily: font.regular, fontSize: 13,
    lineHeight: 19,
    color: c.textMuted,
    textAlign: 'center',
  },
  switchLink: {
    color: c.text,
    fontWeight: '600',
  },
});
