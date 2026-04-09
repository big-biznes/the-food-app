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
          <Text style={styles.greeting}>Hey {firstName} 👋</Text>
          <Text style={styles.subText}>Let's build your meal plan</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you craving?</Text>
          <Text style={styles.sectionHint}>Pick everything that sounds good</Text>
          <CravingChips selected={selectedCravings} onToggle={onToggleCraving} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anything specific?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. something with pasta, no mushrooms…"
            placeholderTextColor="#C5C5C5"
            value={cravingText}
            onChangeText={onCravingTextChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={onGenerate} activeOpacity={0.8}>
          <Text style={styles.btnText}>Generate my meal plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: { paddingTop: 20, marginBottom: 24 },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  subText: { fontSize: 15, color: '#AAAAAA', marginTop: 4 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 4 },
  sectionHint: { fontSize: 14, color: '#AAAAAA', marginBottom: 16 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: '#111111',
    minHeight: 90,
  },
  btn: {
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
