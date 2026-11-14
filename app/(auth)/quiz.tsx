import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, Goal, Gender, Activity, DietaryRestriction } from '@/contexts/AuthContext';
import { BODY_LIMITS } from '@/data/portions';
import { NO_EATING_OUT } from '@/data/meals';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

import { font, type } from '@/constants/type';
const TOTAL_STEPS = 9;

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** The same limits Settings uses, so a profile made here always gets its portions sized. */
const within = (n: number, { min, max }: { min: number; max: number }) => !isNaN(n) && n >= min && n <= max;

const GOALS: Goal[] = ['lose', 'gain', 'maintain'];
const ACTIVITIES: Activity[] = ['low', 'light', 'active', 'very'];
const GENDERS: Gender[] = ['male', 'female', 'other'];
const RESTRICTIONS: DietaryRestriction[] = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-allergy', 'halal', 'kosher'];

/** Answers the quiz starts with for a dev account, so testing only takes tapping Next. */
const DEV_ANSWERS = {
  name: 'Alex',
  goal: 'maintain' as Goal,
  gender: 'other' as Gender,
  age: '28',
  height: '175',
  weight: '70',
  activity: 'light' as Activity,
  restrictions: [] as DietaryRestriction[],
  eatingOutDay: 'Sun',
};

export default function QuizScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { completeProfile, logout, isDevAccount } = useAuth();
  const { t } = useTranslation();
  const prefill = __DEV__ && isDevAccount ? DEV_ANSWERS : null;

  const [step, setStep] = useState(1);
  const [name, setName] = useState(prefill?.name ?? '');
  const [goal, setGoal] = useState<Goal | null>(prefill?.goal ?? null);
  const [gender, setGender] = useState<Gender | null>(prefill?.gender ?? null);
  const [age, setAge] = useState(prefill?.age ?? '');
  const [height, setHeight] = useState(prefill?.height ?? '');
  const [weight, setWeight] = useState(prefill?.weight ?? '');
  const [activity, setActivity] = useState<Activity | null>(prefill?.activity ?? null);
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>(prefill?.restrictions ?? []);
  const [eatingOutDay, setEatingOutDay] = useState<string | null>(prefill?.eatingOutDay ?? null);

  function canContinue() {
    const n = (v: string) => parseInt(v, 10);
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return goal !== null;
      case 3: return gender !== null;
      case 4: return within(n(age), BODY_LIMITS.age);
      case 5: return within(n(height), BODY_LIMITS.heightCm);
      case 6: return within(n(weight), BODY_LIMITS.weightKg);
      case 7: return activity !== null;
      case 8: return true;
      case 9: return eatingOutDay !== null;
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
      activity: activity!,
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
                question={t('quiz.ageQ')}
                unit={t('settings.years')}
                value={age}
                setValue={setAge}
                min={BODY_LIMITS.age.min}
                max={BODY_LIMITS.age.max}
              />
            )}
            {step === 5 && (
              <StepNumber
                question={t('quiz.heightQ')}
                unit="cm"
                value={height}
                setValue={setHeight}
                min={BODY_LIMITS.heightCm.min}
                max={BODY_LIMITS.heightCm.max}
              />
            )}
            {step === 6 && (
              <StepNumber
                question={t('quiz.weightQ')}
                unit="kg"
                value={weight}
                setValue={setWeight}
                min={BODY_LIMITS.weightKg.min}
                max={BODY_LIMITS.weightKg.max}
              />
            )}
            {step === 7 && <StepActivity activity={activity} setActivity={setActivity} />}
            {step === 8 && (
              <StepRestrictions restrictions={restrictions} toggle={toggleRestriction} />
            )}
            {step === 9 && (
              <StepEatingOutDay day={eatingOutDay} setDay={setEatingOutDay} />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <PressableScale
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={22} color={c.text} />
              </PressableScale>
              <PressableScale
                style={[styles.nextButton, !canContinue() && styles.nextButtonDisabled]}
                onPress={handleNext}
                activeOpacity={0.8}
                disabled={!canContinue()}
              >
                <Text style={styles.nextButtonText}>
                  {step === TOTAL_STEPS ? t('quiz.letsGo') : t('common.continue')}
                </Text>
              </PressableScale>
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
  const { t } = useTranslation();
  return (
    <View style={step.wrap}>
      <Text style={step.question}>{t('quiz.nameQ')}</Text>
      <Text style={step.hint}>{t('quiz.nameHint')}</Text>
      <TextInput
        style={step.textInput}
        placeholder={t('quiz.namePlaceholder')}
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
  const { t } = useTranslation();
  return (
    <View style={step.wrap}>
      <Text style={step.question}>{t('quiz.goalQ')}</Text>
      <Text style={step.hint}>{t('quiz.goalHint')}</Text>
      <View style={step.cardList}>
        {GOALS.map(value => {
          const selected = goal === value;
          return (
            <PressableScale
              key={value}
              style={[step.card, selected && step.cardSelected]}
              onPress={() => setGoal(value)}
              activeOpacity={0.7}
            >
              <Text style={[step.cardTitle, selected && step.cardTitleSelected]}>
                {t(`goal.${value}`)}
              </Text>
              <Text style={[step.cardDesc, selected && step.cardDescSelected]}>
                {t(`goal.${value}Desc`)}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

function StepActivity({
  activity,
  setActivity,
}: {
  activity: Activity | null;
  setActivity: (v: Activity) => void;
}) {
  const step = useThemedStyles(makeStep);
  const { t } = useTranslation();
  return (
    <View style={step.wrap}>
      <Text style={step.question}>{t('quiz.activityQ')}</Text>
      <Text style={step.hint}>{t('settings.activityHint')}</Text>
      <View style={step.cardList}>
        {ACTIVITIES.map(value => {
          const selected = activity === value;
          return (
            <PressableScale
              key={value}
              style={[step.card, selected && step.cardSelected]}
              onPress={() => setActivity(value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[step.cardTitle, selected && step.cardTitleSelected]}>
                {t(`activity.${value}`)}
              </Text>
              <Text style={[step.cardDesc, selected && step.cardDescSelected]}>
                {t(`activity.${value}Desc`)}
              </Text>
            </PressableScale>
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
  const { t } = useTranslation();
  return (
    <View style={step.wrap}>
      <Text style={step.question}>{t('quiz.genderQ')}</Text>
      <Text style={step.hint}>{t('quiz.genderHint')}</Text>
      <View style={step.chipRow}>
        {GENDERS.map(value => {
          const selected = gender === value;
          return (
            <PressableScale
              key={value}
              style={[step.chip, selected && step.chipSelected]}
              onPress={() => setGender(value)}
              activeOpacity={0.7}
            >
              <Text style={[step.chipText, selected && step.chipTextSelected]}>
                {t(`gender.${value}`)}
              </Text>
            </PressableScale>
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
  const { t } = useTranslation();
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
        <Text style={step.errorText}>{t('quiz.between', { min, max })}</Text>
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
  const { t } = useTranslation();
  return (
    <View style={step.wrap}>
      <Text style={step.question}>{t('quiz.restrictionsQ')}</Text>
      <Text style={step.hint}>{t('quiz.restrictionsHint')}</Text>
      <View style={step.chipRow}>
        {RESTRICTIONS.map(value => {
          const selected = restrictions.includes(value);
          return (
            <PressableScale
              key={value}
              style={[step.chip, selected && step.chipSelected]}
              onPress={() => toggle(value)}
              activeOpacity={0.7}
            >
              <Text style={[step.chipText, selected && step.chipTextSelected]}>
                {t(`diet.${value}`)}
              </Text>
            </PressableScale>
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
  const { t } = useTranslation();
  return (
    <View style={step.wrap}>
      <Text style={step.question}>{t('quiz.eatOutQ')}</Text>
      <Text style={step.hint}>{t('quiz.eatOutHint')}</Text>
      <View style={step.chipRow}>
        {DAYS_OF_WEEK.map(d => {
          const selected = day === d;
          return (
            <PressableScale
              key={d}
              style={[step.chip, selected && step.chipSelected]}
              onPress={() => setDay(d)}
              activeOpacity={0.7}
            >
              <Text style={[step.chipText, selected && step.chipTextSelected]}>{t(`daysShort.${d}`)}</Text>
            </PressableScale>
          );
        })}
        <PressableScale
          style={[step.chip, day === NO_EATING_OUT && step.chipSelected]}
          onPress={() => setDay(NO_EATING_OUT)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: day === NO_EATING_OUT }}
        >
          <Text style={[step.chipText, day === NO_EATING_OUT && step.chipTextSelected]}>{t('settings.noEatingOut')}</Text>
        </PressableScale>
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
