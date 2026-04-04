import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const passwordsMatch = password === confirm;
  const canSubmit = email.length > 0 && password.length >= 6 && confirm.length > 0 && passwordsMatch;

  function handleRegister() {
    if (!canSubmit) return;
    register(email, password);
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
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>A quick profile setup follows</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#C5C5C5"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="min. 6 characters"
                placeholderTextColor="#C5C5C5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={[
                  styles.input,
                  confirm.length > 0 && !passwordsMatch && styles.inputError,
                ]}
                placeholder="repeat password"
                placeholderTextColor="#C5C5C5"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
              {confirm.length > 0 && !passwordsMatch && (
                <Text style={styles.errorText}>Passwords don't match</Text>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={!canSubmit}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                Have an account?{' '}
                <Text style={styles.switchLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 8,
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#111111',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
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
    fontWeight: '500',
    color: '#111111',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111111',
  },
  inputError: {
    backgroundColor: '#FFF2F2',
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
  },
  footer: {
    marginTop: 40,
    gap: 20,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonDisabled: {
    backgroundColor: '#D0D0D0',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    fontSize: 15,
    color: '#AAAAAA',
  },
  switchLink: {
    color: '#111111',
    fontWeight: '600',
  },
});
