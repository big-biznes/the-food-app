import { Stack } from 'expo-router';

export default function AuthLayout() {
  // After sign-in, navigation to home / the quiz is handled by useSignInTransition.
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
