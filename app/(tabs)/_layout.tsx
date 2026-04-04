import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0F0F0',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#CCCCCC',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{ tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="(shopping)"
        options={{ tabBarIcon: tabIcon('bag-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ tabBarIcon: tabIcon('settings-outline') }}
      />
      {/* Hide auto-discovered groups from tab bar */}
      <Tabs.Screen name="(settings)" options={{ href: null }} />
    </Tabs>
  );
}
