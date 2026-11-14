import { View, Text, StyleSheet, Image} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useThemedStyles } from '@/hooks/useTheme';

export default function WelcomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { devLogin } = useAuth();

  // Starts a brand-new local account every time: the quiz, then an empty plan.
  function handleDevSkip() {
    devLogin();
    router.replace('/(auth)/quiz');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.brand}>
          <Image
            source={require('@/assets/images/foodapp-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            accessible
            accessibilityLabel="fudapp"
          />
          <Text style={styles.wordmark}>fudapp</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.tiles} accessible={false} importantForAccessibility="no-hide-descendants">
            <View style={[styles.tile, styles.tileButter]}>
              <Text style={styles.tileEmoji}>🥣</Text>
            </View>
            <View style={[styles.tile, styles.tilePea]}>
              <Text style={styles.tileEmoji}>🥪</Text>
            </View>
            <View style={[styles.tile, styles.tileBeet]}>
              <Text style={styles.tileEmoji}>🍝</Text>
            </View>
          </View>
          <Text style={styles.headline} accessibilityRole="header">
            Dinner,{'\n'}decided.
          </Text>
          <Text style={styles.tagline}>
            A week of cheap, quick meals and the shopping list to match. Planned in one tap.
          </Text>
        </View>

        <View style={styles.actions}>
          <PressableScale
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Start planning</Text>
          </PressableScale>
          <PressableScale
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Sign in</Text>
          </PressableScale>

          {__DEV__ && (
            <PressableScale
              style={styles.devButton}
              onPress={handleDevSkip}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.devButtonText}>Dev: skip login</Text>
            </PressableScale>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logo: { width: 36, height: 36, borderRadius: 8 },
    wordmark: { fontFamily: font.extrabold, fontSize: 20, letterSpacing: -0.4, color: c.text },

    hero: { flex: 1, justifyContent: 'center', gap: 18 },
    tiles: { flexDirection: 'row', gap: 10, marginBottom: 6 },
    tile: {
      width: 72,
      height: 72,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileButter: { backgroundColor: c.butter, transform: [{ rotate: '-4deg' }] },
    tilePea: { backgroundColor: c.pea, transform: [{ rotate: '2deg' }] },
    tileBeet: { backgroundColor: c.beet, transform: [{ rotate: '-2deg' }] },
    tileEmoji: { fontSize: 36, lineHeight: 44 },
    headline: { ...type.display, fontSize: 56, lineHeight: 54, letterSpacing: -2, color: c.text },
    tagline: { ...type.body, fontSize: 17, lineHeight: 24, color: c.textSecondary, maxWidth: 320 },

    actions: { gap: 10 },
    primaryButton: {
      backgroundColor: c.primary,
      borderRadius: 100,
      paddingVertical: 18,
      alignItems: 'center',
    },
    primaryButtonText: { fontFamily: font.bold, fontSize: 17, color: c.onPrimary },
    secondaryButton: {
      borderWidth: 1.5,
      borderColor: c.text,
      borderRadius: 100,
      paddingVertical: 17,
      alignItems: 'center',
    },
    secondaryButtonText: { fontFamily: font.bold, fontSize: 17, color: c.text },
    devButton: {
      marginTop: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    devButtonText: { ...type.small, color: c.textMuted },
  });
