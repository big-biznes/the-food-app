import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { font } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Press feedback. All are instant (no animated transition), no ripple.
 *  - 'tile'    butter tile snaps behind the active icon, icon fills (recommended)
 *  - 'fill'    icon switches outline → filled, nothing else
 *  - 'label'   like 'fill', plus a short label under the active icon
 */
const FEEDBACK: 'tile' | 'fill' | 'label' = 'tile';
const HAPTICS = true;

const TABS: Record<string, { label: string; icon: IoniconName; active: IoniconName }> = {
  '(home)': { label: 'Week', icon: 'home-outline', active: 'home' },
  '(discover)': { label: 'Discover', icon: 'sparkles-outline', active: 'sparkles' },
  '(shopping)': { label: 'Shopping', icon: 'cart-outline', active: 'cart' },
  settings: { label: 'Settings', icon: 'settings-outline', active: 'settings' },
};

export default function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 4 }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;

        function onPress() {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (HAPTICS) Haptics.selectionAsync().catch(() => {});
            navigateToTab(route.key);
          }
        }

        const showTile = FEEDBACK === 'tile' && focused;
        const showLabel = FEEDBACK === 'label' && focused;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            hitSlop={{ top: 10, bottom: 10 }}
          >
            <View style={[styles.iconWrap, showTile && styles.iconWrapTile]}>
              <Ionicons
                name={focused ? tab.active : tab.icon}
                size={26}
                color={showTile ? c.onTile : focused ? c.text : c.textMuted}
              />
            </View>
            {showLabel && <Text style={styles.label}>{tab.label}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: c.bg,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 6,
      paddingHorizontal: 24,
      justifyContent: 'center',
      gap: 8,
    },
    item: {
      width: 68,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
      gap: 2,
    },
    itemPressed: {
      transform: [{ scale: 0.9 }],
    },
    iconWrap: {
      width: 56,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapTile: {
      backgroundColor: c.butter,
      transform: [{ rotate: '-3deg' }],
    },
    label: {
      fontFamily: font.semibold,
      fontSize: 11,
      lineHeight: 14,
      color: c.text,
    },
  });
