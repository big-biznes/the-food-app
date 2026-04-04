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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.length > 0 && password.length > 0;

  function handleLogin() {
    if (!canSubmit) return;
    login(email, password);
    router.replace('/(tabs)/(home)');
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

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
                placeholder="••••••••"
                placeholderTextColor="#C5C5C5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={22} color="#111111" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={!canSubmit}
              >
                <Text style={styles.primaryButtonText}>Sign in</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/register')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                No account?{' '}
                <Text style={styles.switchLink}>Register</Text>
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
  title: {
    paddingTop: 8,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
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
