import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
  discoverExpertMode: false,
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
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('@/assets/images/foodapp-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>fudapp</Text>
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
    backgroundColor: '#161516',
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
  logoWrapper: {
    backgroundColor: 'transparent',
    borderRadius: 32,
    marginBottom: 4,
    overflow: 'hidden',
  },
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 27,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  devDivider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 4,
  },
  devButton: {
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderStyle: 'dashed',
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
