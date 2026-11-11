import { Redirect, Tabs } from 'expo-router';
import TabBar from '@/components/TabBar';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { isLoading, isLoggedIn } = useAuth();
  // Signed out (logout / account deleted) → back to the welcome screen.
  if (!isLoading && !isLoggedIn) return <Redirect href="/(auth)" />;

  return (
    <Tabs
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        animation: 'none',
        headerShown: false,
      }}
    >
      <Tabs.Screen name="(home)" options={{ title: 'Week' }} />
      <Tabs.Screen name="(discover)" options={{ title: 'Discover' }} />
      <Tabs.Screen name="(shopping)" options={{ title: 'Shopping' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Hide auto-discovered group from the tab bar */}
      <Tabs.Screen name="(settings)" options={{ href: null }} />
    </Tabs>
  );
}
