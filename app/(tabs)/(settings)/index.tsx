import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text>Settings</Text>
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

