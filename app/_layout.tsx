import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ShoppingProvider } from '@/contexts/ShoppingContext';
import { LikesProvider } from '@/contexts/LikesContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ShoppingProvider>
        <LikesProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </LikesProvider>
      </ShoppingProvider>
    </AuthProvider>
  );
}
