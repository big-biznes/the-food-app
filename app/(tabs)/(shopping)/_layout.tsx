import { Stack } from 'expo-router';

export default function ShoppingLayout() {
  return (
    <Stack>
      <Stack.Screen name="index"  options={{headerShown: false}} />
      <Stack.Screen name="compare"  options={{headerShown: false, animation: "slide_from_bottom"}} />
    </Stack>
  );
}

