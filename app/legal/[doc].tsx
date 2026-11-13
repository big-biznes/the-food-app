import { ScrollView, StyleSheet, Text, View} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PRIVACY, TERMS } from '@/constants/legal';
import { Colors } from '@/constants/theme';
import { type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

/** The Privacy Policy (/legal/privacy) or the Terms of Service (/legal/terms), opened from Settings. */
export default function LegalScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const text = doc === 'terms' ? TERMS : PRIVACY;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PressableScale
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={22} color={c.text} />
      </PressableScale>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} accessibilityRole="header">
          {text.title}
        </Text>
        <Text style={styles.updated}>Last updated {text.updated}</Text>
        <Text style={styles.intro}>{text.intro}</Text>

        {text.sections.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading} accessibilityRole="header">
              {section.heading}
            </Text>
            {section.body.map(paragraph => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      marginLeft: 20,
      marginBottom: 4,
    },
    scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 56 },
    title: { ...type.display, fontSize: 36, lineHeight: 37, color: c.text },
    updated: { ...type.small, color: c.textMuted, marginTop: 8, marginBottom: 20 },
    intro: { ...type.body, color: c.text },
    section: { marginTop: 28, gap: 10 },
    heading: { ...type.heading, color: c.text },
    paragraph: { ...type.body, fontSize: 15, lineHeight: 22, color: c.textSecondary },
  });
