import { View, Text, StyleSheet } from 'react-native';
import { WeekPart, Day, Meal, MealType, PlanSlot, StructuredWeekPlan, swapGroup } from '@/data/meals';
import MealCard from '@/components/MealCard';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

import { font } from '@/constants/type';
type SwapSource = PlanSlot | null;

type Props = {
  plan: StructuredWeekPlan;
  selectedPart: WeekPart;
  partDays: Record<WeekPart, Day[]>;
  swapSource: SwapSource;
  onRefreshMeal: (part: WeekPart, day: string, mealType: MealType) => void;
  onSwapSelect: (part: WeekPart, day: string, mealType: MealType) => void;
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const SECTION_LABEL = {
  breakfast: 'meals.breakfasts',
  lunch: 'meals.lunches',
  dinner: 'meals.dinners',
  snack: 'meals.snacks',
} as const;
const BLOCKED_REASON = {
  breakfast: 'pool.onlyBreakfast',
  snack: 'pool.onlySnack',
  main: 'pool.onlyMain',
} as const;

export default function PoolView({
  plan,
  selectedPart,
  partDays,
  swapSource,
  onRefreshMeal,
  onSwapSelect,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const days = partDays[selectedPart];

  if (selectedPart === 'C') {
    const day = days[0];
    const { breakfast, lunch, dinner, snack } = plan.C[day];
    const cooked = (meal: Meal, mealType: MealType) => (
      <MealCard key={mealType} meal={meal} dayLabel={t('plan.day', { n: 1 })} onRefresh={() => onRefreshMeal('C', day, mealType)} />
    );
    return (
      <View style={styles.container}>
        {breakfast && cooked(breakfast, 'breakfast')}
        {cooked(lunch, 'lunch')}
        {'isEatingOut' in dinner ? <MealCard meal={dinner} dayLabel={t('plan.day', { n: 1 })} /> : cooked(dinner, 'dinner')}
        {snack && cooked(snack, 'snack')}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {MEAL_TYPES.filter(type => days.some(day => plan[selectedPart][day][type])).map(mealType => (
        <View key={mealType} style={styles.section}>
          <Text style={styles.sectionLabel} accessibilityRole="header">
            {t(SECTION_LABEL[mealType])}
          </Text>
          {days.map((day, idx) => {
            const meal = plan[selectedPart][day][mealType];
            if (!meal) return null;
            const isSelected =
              swapSource?.part === selectedPart &&
              swapSource.day === day &&
              swapSource.mealType === mealType;
            const swapFn = () => onSwapSelect(selectedPart, day, mealType);
            // Breakfasts only swap with breakfasts, snacks with snacks, lunches and dinners with each other.
            const blocked = swapSource != null && swapGroup(swapSource.mealType) !== swapGroup(mealType);

            return (
              <MealCard
                key={day}
                meal={meal}
                dayLabel={t('plan.day', { n: idx + 1 })}
                selected={isSelected}
                onRefresh={!swapSource ? () => onRefreshMeal(selectedPart, day, mealType) : undefined}
                onSwapSelect={!swapSource || isSelected ? swapFn : undefined}
                onCardTap={swapSource ? swapFn : undefined}
                swapBlockedReason={blocked ? t(BLOCKED_REASON[swapGroup(swapSource.mealType)]) : undefined}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: {
      gap: 16,
      marginBottom: 32,
    },
    section: {
      gap: 10,
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: font.bold, fontWeight: '700',
      color: c.textMuted,
      marginLeft: 4,
    },
  });
