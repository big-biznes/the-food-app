import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{animation: "fade"}}>
      <Tabs.Screen name="(home)" options={{headerShown: false}} />
      <Tabs.Screen name="settings"  options={{headerShown: false}} />
    </Tabs>
  );
}

