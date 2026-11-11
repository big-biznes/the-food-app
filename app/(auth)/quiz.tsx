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
import { Ionicons } from '@expo/vector-icons';
import { useAuth, Goal, Gender, DietaryRestriction } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

import { font, type } from '@/constants/type';
const TOTAL_STEPS = 8;

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { completeProfile, logout } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);
  const [eatingOutDay, setEatingOutDay] = useState<string | null>(null);

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
      case 8: return eatingOutDay !== null;
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
      eatingOutDay: eatingOutDay!,
      discoverExpertMode: false,
    });
    router.replace('/(tabs)/(home)');
  }

  function handleBack() {
    if (step > 1) {
      setStep(s => s - 1);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      // Opened straight into the quiz (e.g. right after Google sign-in): back means
      // "not now", so sign out and return to the welcome screen.
      logout().then(() => router.replace('/(auth)'));
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
            {step === 8 && (
              <StepEatingOutDay day={eatingOutDay} setDay={setEatingOutDay} />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={22} color={c.text} />
              </TouchableOpacity>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step sub-components ─────────────────────────────────────────────────────

function StepName({ name, setName }: { name: string; setName: (v: string) => void }) {
  const { colors: c } = useTheme();
  const step = useThemedStyles(makeStep);
  return (
    <View style={step.wrap}>
      <Text style={step.question}>What’s your name?</Text>
      <Text style={step.hint}>We’ll use this to personalize your experience</Text>
      <TextInput
        style={step.textInput}
        placeholder="Your name"
        placeholderTextColor={c.textFaint}
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
  const step = useThemedStyles(makeStep);
  return (
    <View style={step.wrap}>
      <Text style={step.question}>What’s your goal?</Text>
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
  const step = useThemedStyles(makeStep);
  return (
    <View style={step.wrap}>
      <Text style={step.question}>What’s your gender?</Text>
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
  const { colors: c } = useTheme();
  const step = useThemedStyles(makeStep);
  const num = parseInt(value, 10);
  const showError = value.length > 0 && (isNaN(num) || num < min || num > max);

  return (
    <View style={step.wrap}>
      <Text style={step.question}>{question}</Text>
      <View style={step.numberRow}>
        <TextInput
          style={[step.numberInput, showError && step.numberInputError]}
          placeholder="—"
          placeholderTextColor={c.textFaint}
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
  const step = useThemedStyles(makeStep);
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

function StepEatingOutDay({
  day,
  setDay,
}: {
  day: string | null;
  setDay: (v: string) => void;
}) {
  const step = useThemedStyles(makeStep);
  return (
    <View style={step.wrap}>
      <Text style={step.question}>Which day do you eat out?</Text>
      <Text style={step.hint}>We’ll skip meal planning for that day</Text>
      <View style={step.chipRow}>
        {DAYS_OF_WEEK.map(d => {
          const selected = day === d;
          return (
            <TouchableOpacity
              key={d}
              style={[step.chip, selected && step.chipSelected]}
              onPress={() => setDay(d)}
              activeOpacity={0.7}
            >
              <Text style={[step.chipText, selected && step.chipTextSelected]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: 8,
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: font.medium, fontWeight: '500',
    color: c.textMuted,
  },
  progressTrack: {
    height: 3,
    backgroundColor: c.surfaceAlt,
    borderRadius: 2,
    marginBottom: 36,
  },
  progressFill: {
    height: 3,
    backgroundColor: c.primary,
    borderRadius: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 16,
  },
  footer: {
    paddingTop: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: c.bg,
    borderWidth: 1.5,
    borderColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    backgroundColor: c.primary,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: c.surfaceStrong,
  },
  nextButtonText: {
    color: c.onPrimary,
    fontSize: 16,
    fontFamily: font.semibold, fontWeight: '600',
  },
});

const makeStep = (c: Colors) => StyleSheet.create({
  wrap: {
    paddingTop: 4,
  },
  question: { ...type.display, fontSize: 32, lineHeight: 33, letterSpacing: -0.9, color: c.text, marginBottom: 8 },
  hint: {
    fontFamily: font.regular, fontSize: 15,
    color: c.textMuted,
    marginBottom: 32,
  },
  textInput: {
    backgroundColor: c.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontFamily: font.regular, fontSize: 18,
    color: c.text,
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardSelected: {
    backgroundColor: c.primary,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.text,
    marginBottom: 3,
  },
  cardTitleSelected: {
    color: c.onPrimary,
  },
  cardDesc: {
    fontFamily: font.regular, fontSize: 13,
    color: c.textMuted,
  },
  cardDescSelected: {
    color: c.onPrimaryMuted,
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
    backgroundColor: c.surface,
  },
  chipSelected: {
    backgroundColor: c.primary,
  },
  chipText: {
    fontSize: 14,
    fontFamily: font.medium, fontWeight: '500',
    color: c.text,
  },
  chipTextSelected: {
    color: c.onPrimary,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  numberInput: {
    backgroundColor: c.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 32,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.text,
    minWidth: 130,
    textAlign: 'center',
  },
  numberInputError: {
    backgroundColor: c.dangerBg,
  },
  unit: {
    fontSize: 18,
    color: c.textMuted,
    fontFamily: font.medium, fontWeight: '500',
  },
  errorText: {
    fontFamily: font.regular, fontSize: 13,
    color: c.danger,
    marginTop: 10,
  },
});
