import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isLoading, isLoggedIn, needsProfile } = useAuth();
  if (isLoading) return null;
  if (isLoggedIn) return <Redirect href="/(tabs)/(home)" />;
  if (needsProfile) return <Redirect href="/(auth)/quiz" />;
  return <Redirect href="/(auth)" />;
}
