import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ShoppingProvider } from '@/contexts/ShoppingContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ShoppingProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </ShoppingProvider>
    </AuthProvider>
  );
}
