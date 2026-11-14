import { Stack } from 'expo-router';
import { DeferredLanguage } from '@/hooks/useTranslation';

export default function HomeLayout() {
  // A hidden tab picks up a new language after the open one (hooks/useTranslation.ts).
  return (
    <DeferredLanguage delay={300}>
      <Stack>
        <Stack.Screen name="index"  options={{headerShown: false}} />
        <Stack.Screen name="details"  options={{headerShown: false, animation: "fade"}} />
        <Stack.Screen name="prep"  options={{headerShown: false}} />
        <Stack.Screen name="cook"  options={{headerShown: false, animation: "slide_from_bottom"}} />
      </Stack>
    </DeferredLanguage>
  );
}

