import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { AuthProvider } from '@/contexts/AuthContext';
import { RecipesProvider } from '@/contexts/RecipesContext';
import { ShoppingProvider } from '@/contexts/ShoppingContext';
import { LikesProvider } from '@/contexts/LikesContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
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
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }} />
            </LikesProvider>
          </ShoppingProvider>
        </RecipesProvider>
      </AuthProvider>
    </AccessibilityProvider>
  );
}
