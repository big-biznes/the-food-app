import { Tabs } from 'expo-router';
import TabBar from '@/components/TabBar';

export default function TabLayout() {
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
