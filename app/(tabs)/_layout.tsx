import { Redirect, Tabs } from 'expo-router';
import TabBar from '@/components/TabBar';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { isLoading, isLoggedIn } = useAuth();
  const { t } = useTranslation();
  // Signed out (logout / account deleted) → back to the welcome screen.
  if (!isLoading && !isLoggedIn) return <Redirect href="/(auth)" />;

  return (
    <Tabs
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        animation: 'none',
        headerShown: false,
        // Build every tab up front so switching never waits for a screen to mount…
        lazy: false,
        // …and pause hidden tabs so they don't re-render on every state change.
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen name="(home)" options={{ title: t('nav.week') }} />
      <Tabs.Screen name="(discover)" options={{ title: t('nav.discover') }} />
      <Tabs.Screen name="(shopping)" options={{ title: t('nav.shopping') }} />
      <Tabs.Screen name="settings" options={{ title: t('nav.settings') }} />
      {/* Hide auto-discovered group from the tab bar */}
    </Tabs>
  );
}
