import { useRouter, Stack } from 'expo-router';

export default function HomeLayout() {
    const router = useRouter();
  return (
    <Stack>
      <Stack.Screen name="index"  options={{headerShown: false}} />
      <Stack.Screen name="details"  options={{headerShown: false, animation: "fade"}} />
    </Stack>
  );
}

