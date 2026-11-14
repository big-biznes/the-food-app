import { Link, Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('nav.notFound') }} />
      <View style={styles.container}>
        <Link href="/">{t('nav.goHome')}</Link>
      </View>
    </>
  );
}
const makeStyles = (c: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

