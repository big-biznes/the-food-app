import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index"  options={{headerShown: false}} />
      <Stack.Screen name="details"  options={{headerShown: false, animation: "fade"}} />
      <Stack.Screen name="prep"  options={{headerShown: false}} />
      <Stack.Screen name="cook"  options={{headerShown: false, animation: "slide_from_bottom"}} />
    </Stack>
  );
}

