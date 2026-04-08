import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 0,
          shadowOpacity: 0,
          shadowColor: 'transparent',
          height: 64 + insets.bottom,
          paddingTop: insets.bottom,
          paddingBottom: insets.bottom,
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
        name="(discover)"
        options={{ tabBarIcon: tabIcon('sparkles-outline') }}
      />
      <Tabs.Screen
        name="(shopping)"
        options={{ tabBarIcon: tabIcon('cart-outline') }}
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
