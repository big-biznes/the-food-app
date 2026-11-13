import { useState } from 'react';
import { Animated, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  WeekPart,
  Day,
  MealType,
  PlanSlot,
  StructuredWeekPlan,
} from '@/data/meals';
import MealCard from '@/components/MealCard';
import PoolView from '@/components/home/PoolView';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';
import { useWiggle } from '@/hooks/useWiggle';
import PressableScale from '@/components/PressableScale';

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

type SwapSource = PlanSlot | null;
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
  /** How many meals no longer fit the eating preferences set in Settings. */
  misfitCount: number;
  onReplaceMisfits: () => void;
  onPartChange: (part: WeekPart) => void;
  onDayChange: (day: string) => void;
  onAddToShoppingList: () => void;
  onRefreshMeal: (part: WeekPart, day: string, mealType: MealType) => void;
  onSwapSelect: (part: WeekPart, day: string, mealType: MealType) => void;
};

const ICON_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };
const PARTS: readonly WeekPart[] = ['A', 'B', 'C'];
const H_PAD = 20;

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
  misfitCount,
  onReplaceMisfits,
  onPartChange,
  onDayChange,
  onAddToShoppingList,
  onRefreshMeal,
  onSwapSelect,
}: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // The cart rocks when it is pressed.
  const cart = useWiggle();

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

  const { translateX, panHandlers, switchTab, width } = useSwipeTabs(PARTS, {
    active: selectedPart,
    onChange: onPartChange,
  });

  /** The day a part shows: the chosen one if it's the open part, else today or its first day. */
  function dayFor(part: WeekPart): Day {
    const days = partDays[part];
    if (part === selectedPart && days.includes(selectedDay as Day)) return selectedDay as Day;
    return days.includes(today as Day) ? (today as Day) : days[0];
  }

  const validDay = dayFor(selectedPart);
  const isToday = validDay === today;

  function renderMeals(part: WeekPart, day: Day) {
    // Meals for the day, in eating order.
    const dayMeals: { mealType: MealType; node: React.ReactNode }[] =
      part === 'C'
        ? [
            {
              mealType: 'lunch',
              node: (
                <MealCard
                  key="lunch"
                  size="hero"
                  meal={plan.C[day].lunch}
                  onRefresh={() => onRefreshMeal('C', day, 'lunch')}
                />
              ),
            },
            {
              mealType: 'dinner',
              node: <MealCard key="dinner" meal={plan.C[day].dinner} />,
            },
          ]
        : (['breakfast', 'lunch', 'dinner'] as const).map(mealType => ({
            mealType,
            node: (
              <MealCard
                key={mealType}
                meal={plan[part][day][mealType]}
                onRefresh={() => onRefreshMeal(part, day, mealType)}
              />
            ),
          }));
    // Only in the plans of people whose day is too big for three meals.
    const snack = plan[part][day].snack;

    const heroType = nextMealType(day === today, dayMeals.map(m => m.mealType));
    const heroMeal = dayMeals.find(m => m.mealType === heroType)!;
    const restMeals = dayMeals.filter(m => m.mealType !== heroType);

    return (
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
        {snack && <MealCard meal={snack} onRefresh={() => onRefreshMeal(part, day, 'snack')} />}
      </View>
    );
  }

  function renderPanel(part: WeekPart) {
    const open = part === selectedPart;
    const mode: ViewMode = open ? viewMode : 'day';
    const day = dayFor(part);

    return (
      <>
        {/* Day tabs + view controls */}
        <View style={styles.dayRowWrapper}>
          {mode === 'day' ? (
            <View style={[styles.flex, styles.dayRow]}>
              {partDays[part].map((d, idx) => {
                const on = day === d;
                const dayIsToday = d === today;
                return (
                  <TouchableOpacity
                    key={d}
                    style={styles.dayTab}
                    onPress={() => onDayChange(d)}
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
            </View>
          ) : (
            <Text style={[styles.flex, styles.poolHint]}>All meals in this part</Text>
          )}
          <PressableScale
            style={styles.iconBtn}
            onPress={toggleViewMode}
            scaleTo={0.9}
            activeOpacity={0.7}
            hitSlop={ICON_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={mode === 'day' ? 'Show all meals in this part' : 'Show meals by day'}
          >
            <Ionicons name={mode === 'day' ? 'grid' : 'calendar'} size={20} color={c.text} />
          </PressableScale>
          <PressableScale
            style={styles.iconBtn}
            onPress={() => {
              cart.wiggle();
              onAddToShoppingList();
            }}
            scaleTo={0.9}
            activeOpacity={0.7}
            hitSlop={ICON_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Add this part to the shopping list"
          >
            <Animated.View style={cart.style}>
              <Ionicons name="cart" size={21} color={c.text} />
            </Animated.View>
          </PressableScale>
        </View>

        {/* Shop-today note */}
        {shoppingBanner && (
          <View
            style={styles.note}
            accessibilityLiveRegion={open ? 'polite' : 'none'}
            accessibilityRole="text"
          >
            <Text style={styles.noteText}>{shoppingBanner}</Text>
          </View>
        )}

        {mode === 'day' ? (
          renderMeals(part, day)
        ) : (
          <PoolView
            plan={plan}
            selectedPart={part}
            partDays={partDays}
            swapSource={swapSource}
            onRefreshMeal={onRefreshMeal}
            onSwapSelect={onSwapSelect}
          />
        )}
      </>
    );
  }

  const pageWidth = width - H_PAD * 2;

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

      {/* Meals that stopped fitting after the eating preferences changed */}
      {misfitCount > 0 && (
        <View style={styles.misfit} accessibilityLiveRegion="polite">
          <Text style={styles.misfitText}>
            {misfitCount === 1 ? '1 meal no longer fits' : `${misfitCount} meals no longer fit`} your eating preferences
          </Text>
          <PressableScale
            style={styles.misfitBtn}
            onPress={onReplaceMisfits}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={misfitCount === 1 ? 'Replace that meal' : 'Replace those meals'}
          >
            <Text style={styles.misfitBtnText}>Replace</Text>
          </PressableScale>
        </View>
      )}

      {/* Part tabs */}
      <View style={styles.tabRow} accessibilityRole="tablist">
        {PARTS.map(part => {
          const on = selectedPart === part;
          return (
            <TouchableOpacity
              key={part}
              style={[styles.tab, on && styles.tabOn]}
              onPress={() => switchTab(part)}
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

      {/* Part panels: swipe sideways to move between parts. Panels sit one
          screen width apart; only the open one is in the layout flow, so the
          page is as tall as what you're looking at. */}
      <View {...panHandlers}>
        <Animated.View style={[styles.slider, { width: pageWidth, transform: [{ translateX }] }]}>
          {PARTS.map((part, i) => {
            const open = part === selectedPart;
            return (
              <View
                key={part}
                style={[
                  open ? styles.panelOpen : styles.panelAside,
                  { width: pageWidth, left: i * width },
                ]}
                importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
                accessibilityElementsHidden={!open}
              >
                {renderPanel(part)}
              </View>
            );
          })}
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
      paddingHorizontal: H_PAD,
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
    dayRow: { flexDirection: 'row', gap: 18, alignItems: 'center' },
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

    misfit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.warningBg,
      borderRadius: 16,
      paddingLeft: 16,
      paddingRight: 8,
      paddingVertical: 8,
      marginBottom: 12,
    },
    misfitText: { flex: 1, fontFamily: font.semibold, fontSize: 14, lineHeight: 18, color: c.text },
    misfitBtn: {
      backgroundColor: c.primary,
      borderRadius: 100,
      paddingHorizontal: 18,
      minHeight: 40,
      justifyContent: 'center',
    },
    misfitBtnText: { fontFamily: font.semibold, fontSize: 14, color: c.onPrimary },

    slider: { overflow: 'visible' },
    panelOpen: { position: 'relative' },
    panelAside: { position: 'absolute', top: 0 },

    mealList: { gap: 12, marginBottom: 32 },
    halfRow: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
  });
