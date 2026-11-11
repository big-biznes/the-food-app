import { useState } from 'react';
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
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

const DAY_NAME: Record<Day, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Which meal is "up next" for a day: by the clock if it's today, else breakfast. */
function nextMealType(isToday: boolean, available: MealType[]): MealType {
  if (!isToday) return available[0];
  const h = new Date().getHours();
  const wanted: MealType = h < 10 ? 'breakfast' : h < 15 ? 'lunch' : 'dinner';
  if (available.includes(wanted)) return wanted;
  return wanted === 'breakfast' ? available[0] : available[available.length - 1];
}

type SwapSource = { part: WeekPart; day: string; mealType: MealType } | null;
type ViewMode = 'day' | 'pool';

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

const ICON_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

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
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // View mode is scoped to the part it was chosen for, so switching parts
  // falls back to the day view without an effect.
  const [viewState, setViewState] = useState<{ part: WeekPart; mode: ViewMode }>({
    part: selectedPart,
    mode: 'day',
  });
  const viewMode: ViewMode = viewState.part === selectedPart ? viewState.mode : 'day';

  function toggleViewMode() {
    setViewState({ part: selectedPart, mode: viewMode === 'day' ? 'pool' : 'day' });
  }

  const selectedPartDays = partDays[selectedPart];
  const validDay = (
    selectedPartDays.includes(selectedDay as Day) ? selectedDay : selectedPartDays[0]
  ) as Day;
  const isToday = validDay === today;

  // Meals for the selected day, in eating order.
  const dayMeals: { mealType: MealType; node: React.ReactNode }[] =
    selectedPart === 'C'
      ? [
          {
            mealType: 'lunch',
            node: (
              <MealCard
                key="lunch"
                size="hero"
                meal={plan.C[validDay].lunch}
                onRefresh={() => onRefreshMeal('C', validDay, 'lunch')}
              />
            ),
          },
          {
            mealType: 'dinner',
            node: <MealCard key="dinner" meal={plan.C[validDay].dinner} />,
          },
        ]
      : (['breakfast', 'lunch', 'dinner'] as MealType[]).map(mealType => ({
          mealType,
          node: (
            <MealCard
              key={mealType}
              meal={(plan[selectedPart] as Record<string, DayPlan>)[validDay][mealType]}
              onRefresh={() => onRefreshMeal(selectedPart, validDay, mealType)}
            />
          ),
        }));

  const heroType = nextMealType(isToday, dayMeals.map(m => m.mealType));
  const heroMeal = dayMeals.find(m => m.mealType === heroType)!;
  const restMeals = dayMeals.filter(m => m.mealType !== heroType);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {getGreeting()}, {firstName}
        </Text>
        <Text style={styles.headline} accessibilityRole="header">
          {viewMode === 'pool' ? partLabel[selectedPart] : isToday ? 'Today' : DAY_NAME[validDay]}
        </Text>
      </View>

      {/* Part tabs */}
      <View style={styles.tabRow} accessibilityRole="tablist">
        {(['A', 'B', 'C'] as WeekPart[]).map(part => {
          const on = selectedPart === part;
          return (
            <TouchableOpacity
              key={part}
              style={[styles.tab, on && styles.tabOn]}
              onPress={() => onPartChange(part)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6 }}
              accessibilityRole="tab"
              accessibilityLabel={partLabel[part]}
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{partLabel[part]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day tabs + view controls */}
      <View style={styles.dayRowWrapper}>
        {viewMode === 'day' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}
            style={styles.flex}
          >
            {selectedPartDays.map((day, idx) => {
              const on = validDay === day;
              const dayIsToday = day === today;
              return (
                <TouchableOpacity
                  key={day}
                  style={styles.dayTab}
                  onPress={() => onDayChange(day)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6 }}
                  accessibilityRole="tab"
                  accessibilityLabel={dayIsToday ? `Day ${idx + 1}, today` : `Day ${idx + 1}`}
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.dayTabText, on && styles.dayTabTextOn]}>
                    Day {idx + 1}
                  </Text>
                  {dayIsToday && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={[styles.flex, styles.poolHint]}>All meals in this part</Text>
        )}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={toggleViewMode}
          activeOpacity={0.7}
          hitSlop={ICON_HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={viewMode === 'day' ? 'Show all meals in this part' : 'Show meals by day'}
        >
          <Ionicons
            name={viewMode === 'day' ? 'grid' : 'calendar'}
            size={20}
            color={c.text}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onAddToShoppingList}
          activeOpacity={0.7}
          hitSlop={ICON_HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Add this part to the shopping list"
        >
          <Ionicons name="cart" size={21} color={c.text} />
        </TouchableOpacity>
      </View>

      {/* Shop-today note */}
      {shoppingBanner && (
        <View style={styles.note} accessibilityLiveRegion="polite" accessibilityRole="text">
          <Text style={styles.noteText}>{shoppingBanner}</Text>
        </View>
      )}

      {viewMode === 'day' ? (
        <View style={styles.mealList}>
          {heroMeal.node}
          {restMeals.length > 0 && (
            <View style={styles.halfRow}>
              {restMeals.map(m => (
                <View key={m.mealType} style={styles.half}>
                  {m.node}
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },

    header: { paddingTop: 16, marginBottom: 16, gap: 4 },
    greeting: { ...type.label, fontSize: 15, lineHeight: 20, color: c.textMuted },
    headline: { ...type.display, color: c.text },

    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      marginBottom: 12,
    },
    tab: {
      paddingVertical: 10,
      paddingRight: 20,
      marginBottom: -1,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabOn: { borderBottomColor: c.text },
    tabText: { fontFamily: font.semibold, fontSize: 15, lineHeight: 19, color: c.textMuted },
    tabTextOn: { color: c.text },

    dayRowWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    dayRow: { gap: 18, alignItems: 'center' },
    dayTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
    dayTabText: { fontFamily: font.medium, fontSize: 15, lineHeight: 19, color: c.textMuted },
    dayTabTextOn: { color: c.text, fontFamily: font.bold },
    todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.butter },
    poolHint: { ...type.small, color: c.textMuted },
    // Same treatment as the buttons on the meal tiles: soft fill, no ring, heavier icon.
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    note: {
      backgroundColor: c.butter,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignSelf: 'flex-start',
      marginBottom: 16,
      transform: [{ rotate: '-1deg' }],
    },
    noteText: { fontFamily: font.semibold, fontSize: 14, lineHeight: 18, color: c.onTile },

    mealList: { gap: 12, marginBottom: 32 },
    halfRow: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
  });
