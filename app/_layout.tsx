import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ShoppingProvider } from '@/contexts/ShoppingContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ShoppingProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ShoppingProvider>
    </AuthProvider>
  );
}
