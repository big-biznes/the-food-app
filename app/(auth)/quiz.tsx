import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, Goal, Gender, DietaryRestriction } from '@/contexts/AuthContext';

const TOTAL_STEPS = 7;

const GOALS: { value: Goal; label: string; desc: string }[] = [
  { value: 'lose', label: 'Lose weight', desc: 'Reduce body fat' },
  { value: 'gain', label: 'Gain weight', desc: 'Build muscle & mass' },
  { value: 'maintain', label: 'Maintain', desc: 'Stay where I am' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Prefer not to say' },
];

const RESTRICTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'nut-allergy', label: 'Nut allergy' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

export default function QuizScreen() {
  const router = useRouter();
  const { completeProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);

  function canContinue() {
    const n = (v: string) => parseInt(v, 10);
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return goal !== null;
      case 3: return gender !== null;
      case 4: return !isNaN(n(age)) && n(age) >= 1 && n(age) <= 120;
      case 5: return !isNaN(n(height)) && n(height) >= 50 && n(height) <= 300;
      case 6: return !isNaN(n(weight)) && n(weight) >= 20 && n(weight) <= 500;
      case 7: return true;
      default: return false;
    }
  }

  function toggleRestriction(r: DietaryRestriction) {
    setRestrictions(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r],
    );
  }

  function handleNext() {
    if (!canContinue()) return;
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
      return;
    }
    completeProfile({
      name: name.trim(),
      goal: goal!,
      gender: gender!,
      age: parseInt(age, 10),
      heightCm: parseInt(height, 10),
      weightKg: parseInt(weight, 10),
      restrictions,
    });
    router.replace('/(tabs)/(home)');
  }

  function handleBack() {
    if (step > 1) {
      setStep(s => s - 1);
    } else {
      router.back();
    }
  }

  const progress = step / TOTAL_STEPS;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.stepLabel}>{step} / {TOTAL_STEPS}</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%` }]} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 && <StepName name={name} setName={setName} />}
            {step === 2 && <StepGoal goal={goal} setGoal={setGoal} />}
            {step === 3 && <StepGender gender={gender} setGender={setGender} />}
            {step === 4 && (
              <StepNumber
                question="How old are you?"
                unit="years"
                value={age}
                setValue={setAge}
                min={1}
                max={120}
              />
            )}
            {step === 5 && (
              <StepNumber
                question="How tall are you?"
                unit="cm"
                value={height}
                setValue={setHeight}
                min={50}
                max={300}
              />
            )}
            {step === 6 && (
              <StepNumber
                question="How much do you weigh?"
                unit="kg"
                value={weight}
                setValue={setWeight}
                min={20}
                max={500}
              />
            )}
            {step === 7 && (
              <StepRestrictions restrictions={restrictions} toggle={toggleRestriction} />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextButton, !canContinue() && styles.nextButtonDisabled]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={!canContinue()}
            >
              <Text style={styles.nextButtonText}>
                {step === TOTAL_STEPS ? "Let's go" : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step sub-components ─────────────────────────────────────────────────────

function StepName({ name, setName }: { name: string; setName: (v: string) => void }) {
  return (
    <View style={step.wrap}>
      <Text style={step.question}>What's your name?</Text>
      <Text style={step.hint}>We'll use this to personalize your experience</Text>
      <TextInput
        style={step.textInput}
        placeholder="Your name"
        placeholderTextColor="#C5C5C5"
        value={name}
        onChangeText={setName}
        autoFocus
        returnKeyType="done"
      />
    </View>
  );
}

function StepGoal({
  goal,
  setGoal,
}: {
  goal: Goal | null;
  setGoal: (v: Goal) => void;
}) {
  return (
    <View style={step.wrap}>
      <Text style={step.question}>What's your goal?</Text>
      <Text style={step.hint}>This helps us calculate your ideal meals</Text>
      <View style={step.cardList}>
        {GOALS.map(item => {
          const selected = goal === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[step.card, selected && step.cardSelected]}
              onPress={() => setGoal(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[step.cardTitle, selected && step.cardTitleSelected]}>
                {item.label}
              </Text>
              <Text style={[step.cardDesc, selected && step.cardDescSelected]}>
                {item.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function StepGender({
  gender,
  setGender,
}: {
  gender: Gender | null;
  setGender: (v: Gender) => void;
}) {
  return (
    <View style={step.wrap}>
      <Text style={step.question}>What's your gender?</Text>
      <Text style={step.hint}>Used for more accurate meal suggestions</Text>
      <View style={step.chipRow}>
        {GENDERS.map(item => {
          const selected = gender === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[step.chip, selected && step.chipSelected]}
              onPress={() => setGender(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[step.chipText, selected && step.chipTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function StepNumber({
  question,
  unit,
  value,
  setValue,
  min,
  max,
}: {
  question: string;
  unit: string;
  value: string;
  setValue: (v: string) => void;
  min: number;
  max: number;
}) {
  const num = parseInt(value, 10);
  const showError = value.length > 0 && (isNaN(num) || num < min || num > max);

  return (
    <View style={step.wrap}>
      <Text style={step.question}>{question}</Text>
      <View style={step.numberRow}>
        <TextInput
          style={[step.numberInput, showError && step.numberInputError]}
          placeholder="—"
          placeholderTextColor="#C5C5C5"
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          autoFocus
          maxLength={4}
        />
        <Text style={step.unit}>{unit}</Text>
      </View>
      {showError && (
        <Text style={step.errorText}>Enter a value between {min} and {max}</Text>
      )}
    </View>
  );
}

function StepRestrictions({
  restrictions,
  toggle,
}: {
  restrictions: DietaryRestriction[];
  toggle: (r: DietaryRestriction) => void;
}) {
  return (
    <View style={step.wrap}>
      <Text style={step.question}>Any dietary restrictions?</Text>
      <Text style={step.hint}>Select all that apply — you can change these later</Text>
      <View style={step.chipRow}>
        {RESTRICTIONS.map(item => {
          const selected = restrictions.includes(item.value);
          return (
            <TouchableOpacity
              key={item.value}
              style={[step.chip, selected && step.chipSelected]}
              onPress={() => toggle(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[step.chipText, selected && step.chipTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#111111',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginBottom: 36,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#111111',
    borderRadius: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 16,
  },
  footer: {
    paddingTop: 16,
  },
  nextButton: {
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#D0D0D0',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

const step = StyleSheet.create({
  wrap: {
    paddingTop: 4,
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    color: '#AAAAAA',
    marginBottom: 32,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: '#111111',
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardSelected: {
    backgroundColor: '#111111',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 3,
  },
  cardTitleSelected: {
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  cardDescSelected: {
    color: 'rgba(255,255,255,0.55)',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
  },
  chipSelected: {
    backgroundColor: '#111111',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111111',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  numberInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 32,
    fontWeight: '600',
    color: '#111111',
    minWidth: 130,
    textAlign: 'center',
  },
  numberInputError: {
    backgroundColor: '#FFF2F2',
  },
  unit: {
    fontSize: 18,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    marginTop: 10,
  },
});
