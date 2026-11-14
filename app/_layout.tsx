import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
// Bricolage Grotesque has no Cyrillic; Bulgarian uses Onest in the same weights (hooks/useTheme.ts).
import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  Onest_800ExtraBold,
} from '@expo-google-fonts/onest';
// Sets up translations before the first screen renders.
import '@/lib/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { RecipesProvider } from '@/contexts/RecipesContext';
import { ShoppingProvider } from '@/contexts/ShoppingContext';
import { LikesProvider } from '@/contexts/LikesContext';
import { PlanProvider } from '@/contexts/PlanContext';
import ShoppingReminders from '@/components/ShoppingReminders';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
    Onest_800ExtraBold,
    // Icon font too, so icons are drawn from the first frame instead of popping in after load.
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AccessibilityProvider>
      <AuthProvider>
        <RecipesProvider>
          <ShoppingProvider>
            <LikesProvider>
              <PlanProvider>
                <ShoppingReminders />
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }} />
              </PlanProvider>
            </LikesProvider>
          </ShoppingProvider>
        </RecipesProvider>
      </AuthProvider>
    </AccessibilityProvider>
  );
}
