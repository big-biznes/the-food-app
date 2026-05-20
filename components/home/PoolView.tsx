import { View, Text, StyleSheet } from 'react-native';
import { WeekPart, Day, DayPlan, MealType, StructuredWeekPlan } from '@/data/meals';
import MealCard from '@/components/MealCard';

type SwapSource = { part: WeekPart; day: string; mealType: MealType } | null;

type Props = {
  plan: StructuredWeekPlan;
  selectedPart: WeekPart;
  partDays: Record<WeekPart, Day[]>;
  swapSource: SwapSource;
  onRefreshMeal: (part: WeekPart, day: string, mealType: MealType) => void;
  onSwapSelect: (part: WeekPart, day: string, mealType: MealType) => void;
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
const SECTION_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfasts',
  lunch: 'Lunches',
  dinner: 'Dinners',
};

function canSwapWith(a: MealType, b: MealType): boolean {
  if (a === 'breakfast') return b === 'breakfast';
  return b !== 'breakfast';
}

export default function PoolView({
  plan,
  selectedPart,
  partDays,
  swapSource,
  onRefreshMeal,
  onSwapSelect,
}: Props) {
  const days = partDays[selectedPart];

  if (selectedPart === 'C') {
    const day = days[0];
    return (
      <View style={styles.container}>
        <MealCard
          meal={plan.C[day].lunch}
          dayLabel="Day 1"
          onRefresh={() => onRefreshMeal('C', day, 'lunch')}
        />
        <MealCard meal={plan.C[day].dinner} dayLabel="Day 1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {MEAL_TYPES.map(mealType => (
        <View key={mealType} style={styles.section}>
          <Text style={styles.sectionLabel}>{SECTION_LABEL[mealType]}</Text>
          {days.map((day, idx) => {
            const dayPlan = (plan[selectedPart] as Record<string, DayPlan>)[day];
            const meal = dayPlan[mealType];
            const isSelected =
              swapSource?.part === selectedPart &&
              swapSource.day === day &&
              swapSource.mealType === mealType;
            const eligible = !swapSource || isSelected || canSwapWith(swapSource.mealType, mealType);
            const swapFn = () => onSwapSelect(selectedPart, day, mealType);

            return (
              <MealCard
                key={day}
                meal={meal}
                dayLabel={`Day ${idx + 1}`}
                selected={isSelected}
                onRefresh={!swapSource ? () => onRefreshMeal(selectedPart, day, mealType) : undefined}
                onSwapSelect={!swapSource || isSelected ? swapFn : undefined}
                onCardTap={swapSource ? swapFn : undefined}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 32,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BBBBBB',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
});
