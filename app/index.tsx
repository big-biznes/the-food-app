import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isLoggedIn } = useAuth();
  return <Redirect href={isLoggedIn ? '/(tabs)/(home)' : '/(auth)'} />;
}
