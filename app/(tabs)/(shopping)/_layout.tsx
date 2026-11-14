import { Stack } from 'expo-router';
import { DeferredLanguage } from '@/hooks/useTranslation';

export default function ShoppingLayout() {
  // A hidden tab picks up a new language after the open one (hooks/useTranslation.ts).
  return (
    <DeferredLanguage delay={900}>
      <Stack>
        <Stack.Screen name="index"  options={{headerShown: false}} />
        <Stack.Screen name="compare"  options={{headerShown: false, animation: "slide_from_bottom"}} />
      </Stack>
    </DeferredLanguage>
  );
}

