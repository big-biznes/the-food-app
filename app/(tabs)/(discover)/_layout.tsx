import { Stack } from 'expo-router';

export default function DiscoverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="meal" options={{ animation: 'fade' }} />
      <Stack.Screen name="cook-meal" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
