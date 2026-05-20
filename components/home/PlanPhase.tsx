import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  WeekPart,
  Day,
  DayPlan,
  MealType,
  StructuredWeekPlan,
} from '@/data/meals';
import MealCard from '@/components/MealCard';
import PoolView from '@/components/home/PoolView';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

type SwapSource = { part: WeekPart; day: string; mealType: MealType } | null;

type Props = {
  firstName: string;
  plan: StructuredWeekPlan;
  selectedPart: WeekPart;
  selectedDay: string;
  today: string;
  partLabel: Record<WeekPart, string>;
  partDays: Record<WeekPart, Day[]>;
  shoppingBanner: string | null;
  swapSource: SwapSource;
  onPartChange: (part: WeekPart) => void;
  onDayChange: (day: string) => void;
  onAddToShoppingList: () => void;
  onRefreshMeal: (part: WeekPart, day: string, mealType: MealType) => void;
  onSwapSelect: (part: WeekPart, day: string, mealType: MealType) => void;
};

export default function PlanPhase({
  firstName,
  plan,
  selectedPart,
  selectedDay,
  today,
  partLabel,
  partDays,
  shoppingBanner,
  swapSource,
  onPartChange,
  onDayChange,
  onAddToShoppingList,
  onRefreshMeal,
  onSwapSelect,
}: Props) {
  const [viewMode, setViewMode] = useState<'day' | 'pool'>('day');

  useEffect(() => {
    setViewMode('day');
  }, [selectedPart]);

  const selectedPartDays = partDays[selectedPart];
  const validDay = selectedPartDays.includes(selectedDay as Day)
    ? selectedDay
    : selectedPartDays[0];

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {getGreeting()}, {firstName} 👋
        </Text>
        <Text style={styles.subText}>Here's your week</Text>
      </View>

      {/* Part selector */}
      <View style={styles.partRow}>
        {(['A', 'B', 'C'] as WeekPart[]).map(part => {
          const on = selectedPart === part;
          return (
            <TouchableOpacity
              key={part}
              style={[styles.partChip, on && styles.partChipOn]}
              onPress={() => onPartChange(part)}
              activeOpacity={0.7}
            >
              <Text style={[styles.partChipText, on && styles.partChipTextOn]}>
                {partLabel[part]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Shopping banner */}
      {shoppingBanner && (
        <View style={styles.shopBanner}>
          <Ionicons name="cart-outline" size={13} color="#111111" />
          <Text style={styles.shopBannerText}>{shoppingBanner}</Text>
        </View>
      )}

      {/* Day selector + view toggle */}
      <View style={styles.dayRowWrapper}>
        {viewMode === 'day' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}
            style={styles.dayScrollInner}
          >
            {selectedPartDays.map((day, idx) => {
              const on = validDay === day;
              const isToday = day === today;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, on && styles.dayChipOn]}
                  onPress={() => onDayChange(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayChipText, on && styles.dayChipTextOn]}>
                    Day {idx + 1}
                  </Text>
                  {isToday && (
                    <View style={[styles.todayDot, on && styles.todayDotOn]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        {viewMode === 'pool' && <View style={styles.dayScrollInner} />}
        <TouchableOpacity
          style={styles.shopIconBtn}
          onPress={() => setViewMode(v => v === 'day' ? 'pool' : 'day')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={viewMode === 'day' ? 'grid-outline' : 'list-outline'}
            size={19}
            color="#111111"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shopIconBtn}
          onPress={onAddToShoppingList}
          activeOpacity={0.7}
        >
          <Ionicons name="cart-outline" size={19} color="#111111" />
        </TouchableOpacity>
      </View>

      {/* Meal cards — day view */}
      {viewMode === 'day' && (
        <View style={styles.mealList}>
          {selectedPart === 'C' ? (
            <>
              <MealCard
                meal={plan.C[validDay].lunch}
                onRefresh={() => onRefreshMeal('C', validDay, 'lunch')}
              />
              <MealCard meal={plan.C[validDay].dinner} />
            </>
          ) : (
            <>
              <MealCard
                meal={(plan[selectedPart] as Record<string, DayPlan>)[validDay].breakfast}
                onRefresh={() => onRefreshMeal(selectedPart, validDay, 'breakfast')}
              />
              <MealCard
                meal={(plan[selectedPart] as Record<string, DayPlan>)[validDay].lunch}
                onRefresh={() => onRefreshMeal(selectedPart, validDay, 'lunch')}
              />
              <MealCard
                meal={(plan[selectedPart] as Record<string, DayPlan>)[validDay].dinner}
                onRefresh={() => onRefreshMeal(selectedPart, validDay, 'dinner')}
              />
            </>
          )}
        </View>
      )}

      {/* Meal cards — pool view */}
      {viewMode === 'pool' && (
        <PoolView
          plan={plan}
          selectedPart={selectedPart}
          partDays={partDays}
          swapSource={swapSource}
          onRefreshMeal={onRefreshMeal}
          onSwapSelect={onSwapSelect}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  header: { paddingTop: 20, marginBottom: 24 },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  subText: { fontSize: 15, color: '#AAAAAA', marginTop: 4 },

  partRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  partChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  partChipOn: { backgroundColor: '#111111' },
  partChipText: { fontSize: 12, fontWeight: '600', color: '#AAAAAA' },
  partChipTextOn: { color: '#FFFFFF' },

  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  shopBannerText: { fontSize: 13, fontWeight: '500', color: '#111111' },

  dayRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dayScrollInner: { flex: 1 },
  dayRow: { gap: 8 },
  shopIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    minWidth: 52,
  },
  dayChipOn: { backgroundColor: '#111111' },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#AAAAAA' },
  dayChipTextOn: { color: '#FFFFFF' },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#111111',
    marginTop: 3,
  },
  todayDotOn: { backgroundColor: '#FFFFFF' },

  mealList: { gap: 16, marginBottom: 32 },
});
