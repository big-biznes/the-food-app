import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import CravingChips from './CravingChips';

type Props = {
  firstName: string;
  selectedCravings: string[];
  cravingText: string;
  onToggleCraving: (chip: string) => void;
  onCravingTextChange: (text: string) => void;
  onGenerate: () => void;
};

export default function SetupPhase({
  firstName,
  selectedCravings,
  cravingText,
  onToggleCraving,
  onCravingTextChange,
  onGenerate,
}: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hey {firstName}</Text>
          <Text style={styles.headline} accessibilityRole="header">
            What are you craving this week?
          </Text>
          <Text style={styles.sub}>Pick a few. The plan is built around them.</Text>
        </View>

        <View style={styles.section}>
          <CravingChips selected={selectedCravings} onToggle={onToggleCraving} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Anything else?
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. something with pasta, no mushrooms…"
            placeholderTextColor={c.textFaint}
            value={cravingText}
            onChangeText={onCravingTextChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel="Anything else you are craving"
          />
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={onGenerate}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Plan my week</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    header: { paddingTop: 16, marginBottom: 24, gap: 6 },
    greeting: { ...type.label, fontSize: 15, lineHeight: 20, color: c.textMuted },
    headline: { ...type.display, fontSize: 36, lineHeight: 37, color: c.text, maxWidth: 320 },
    sub: { ...type.body, color: c.textSecondary, marginTop: 4 },
    section: { marginBottom: 28 },
    sectionTitle: { ...type.heading, color: c.text, marginBottom: 10 },
    input: {
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontFamily: font.regular,
      fontSize: 16,
      color: c.text,
      minHeight: 90,
    },
    btn: {
      backgroundColor: c.primary,
      borderRadius: 100,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 4,
    },
    btnText: { fontFamily: font.bold, color: c.onPrimary, fontSize: 17 },
  });
