import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

const DEV_PROFILE = {
  name: 'Alex',
  email: 'dev@test.com',
  goal: 'maintain' as const,
  gender: 'other' as const,
  age: 28,
  heightCm: 175,
  weightKg: 70,
  restrictions: [] as [],
  eatingOutDay: 'Fri',
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { devLogin } = useAuth();

  function handleDevSkip() {
    devLogin(DEV_PROFILE);
    router.replace('/(tabs)/(home)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoChar}>f</Text>
          </View>
          <Text style={styles.title}>foodapp</Text>
          <Text style={styles.tagline}>Smart meals.{'\n'}Zero stress.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign in</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <>
              <View style={styles.devDivider} />
              <TouchableOpacity
                style={styles.devButton}
                onPress={handleDevSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.devButtonText}>DEV  ·  Skip login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoChar: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 27,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
  devDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  devButton: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#BBBBBB',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
