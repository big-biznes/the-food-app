import { Stack } from 'expo-router';
import { DeferredLanguage } from '@/hooks/useTranslation';

export default function DiscoverLayout() {
  // A hidden tab picks up a new language after the open one (hooks/useTranslation.ts).
  return (
    <DeferredLanguage delay={600}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="meal" options={{ animation: 'fade' }} />
        <Stack.Screen name="cook-meal" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </DeferredLanguage>
  );
}
