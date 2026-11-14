import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PressableScale from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { findMeal, formatIngredient } from '@/data/meals';
import { stepIngredients } from '@/data/portions';
import { usePersonalMeal } from '@/hooks/usePortions';
import { useMealPrep } from '@/hooks/usePrep';
import { cooksAlone } from '@/data/prep';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

import { font, type } from '@/constants/type';

export default function CookScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Steps and amounts for the portion this user cooks.
  const meal = usePersonalMeal(findMeal(id));

  const recipe = findMeal(id);
  const prep = useMealPrep(recipe);
  const [step, setStep] = useState(0);

  if (!meal || meal.instructions.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <PressableScale style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={c.text} />
        </PressableScale>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🍳</Text>
          <Text style={styles.emptyTitle}>No instructions</Text>
          <Text style={styles.emptyHint}>This recipe doesn’t have cooking steps yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const steps = meal.instructions;
  const total = steps.length;
  const progress = (step + 1) / total;
  const isLast = step === total - 1;
  // How much of each ingredient this step uses, in the user's portion.
  const used = stepIngredients(steps[step], meal.ingredients).map(formatIngredient);
  // Ingredients the user left out of this meal that the step still talks about.
  const skipped = stepIngredients(steps[step], meal.removed ?? []).map(ing => ing.name);
  // Ingredients of this step that were cut or cooked ahead.
  const ready = stepIngredients(steps[step], meal.ingredients)
    .filter(ing => prep?.done.some(t => t.ingredient === ing.name))
    .map(ing => ing.name);
  // The whole step is cooking a staple that was cooked ahead: nothing to do but warm it up.
  const cookedAhead = prep?.done.find(t => t.kind === 'cook' && cooksAlone(steps[step], t.ingredient, meal.ingredients));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={c.text} />
        </PressableScale>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{meal.name}</Text>
          <Text style={styles.headerSub}>Step {step + 1} of {total}</Text>
        </View>
        <View style={styles.closeBtnPlaceholder} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Step content */}
      <View style={styles.content}>
        <View style={styles.stepNumberWrap}>
          <Text style={styles.stepNumber}>{step + 1}</Text>
        </View>
        <Text style={styles.stepText}>{steps[step]}</Text>
        {used.length > 0 && (
          <Text style={styles.stepAmounts} accessibilityLabel={`For this step: ${used.join(', ')}`}>
            {used.join('  ·  ')}
          </Text>
        )}
        {cookedAhead ? (
          <Text style={styles.stepReady}>
            You cooked the {cookedAhead.ingredient} ahead. Skip this step and reheat it until steaming hot before serving.
          </Text>
        ) : (
          ready.length > 0 && <Text style={styles.stepReady}>Already prepped: {ready.join(', ')}.</Text>
        )}
        {skipped.length > 0 && (
          <Text style={styles.stepSkipped}>You left out the {skipped.join(' and the ')}: skip that part.</Text>
        )}
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomBar}>
        {step > 0 ? (
          <PressableScale
            style={styles.backStepBtn}
            onPress={() => setStep(s => s - 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={c.text} />
            <Text style={styles.backStepText}>Back</Text>
          </PressableScale>
        ) : (
          <View style={styles.backStepPlaceholder} />
        )}

        <PressableScale
          style={[styles.nextBtn, isLast && styles.doneBtn]}
          onPress={() => {
            if (isLast) router.back();
            else setStep(s => s + 1);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'Done' : 'Next step'}</Text>
          {!isLast && <Ionicons name="chevron-forward" size={18} color={c.onPrimary} />}
          {isLast && <Ionicons name="checkmark" size={18} color={c.onPrimary} />}
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPlaceholder: { width: 40 },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: font.bold, fontWeight: '700',
    color: c.text,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontFamily: font.regular, fontSize: 13,
    color: c.textMuted,
    marginTop: 2,
  },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: c.surfaceAlt,
    marginHorizontal: 24,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: c.butter,
    borderRadius: 2,
  },

  // Step content
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  stepNumberWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: c.butter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 22,
    fontFamily: font.extrabold, fontWeight: '800',
    color: c.onTile,
  },
  stepText: {
    ...type.title,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.5,
    color: c.text,
  },
  stepAmounts: {
    fontFamily: font.medium,
    fontSize: 15,
    lineHeight: 22,
    color: c.textMuted,
    marginTop: 18,
  },

  stepReady: {
    fontFamily: font.semibold,
    fontSize: 15,
    lineHeight: 21,
    color: c.textSecondary,
  },
  stepSkipped: {
    fontFamily: font.semibold,
    fontSize: 15,
    lineHeight: 21,
    color: c.warning,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  backStepPlaceholder: { width: 72 },
  backStepText: {
    fontSize: 15,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.text,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: c.primary,
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  doneBtn: {
    backgroundColor: c.primary,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: font.bold, fontWeight: '700',
    color: c.onPrimary,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontFamily: font.regular, fontSize: 56, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontFamily: font.bold, fontWeight: '700', color: c.text },
  emptyHint: { fontFamily: font.regular, fontSize: 14, color: c.textMuted, textAlign: 'center' },
});
