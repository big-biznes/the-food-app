import { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color as string} />;
  }
  return TabIcon;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();

  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.border,
          height: 64 + insets.bottom,
          paddingTop: insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.textFaint,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="(discover)"
        options={{ title: 'Discover', tabBarIcon: tabIcon('sparkles-outline') }}
      />
      <Tabs.Screen
        name="(shopping)"
        options={{ title: 'Shopping', tabBarIcon: tabIcon('cart-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('settings-outline') }}
      />
      {/* Hide auto-discovered groups from tab bar */}
      <Tabs.Screen name="(settings)" options={{ href: null }} />
    </Tabs>
  );
}
