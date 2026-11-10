import { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, Text, Animated, Easing, StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import { useLikes } from '@/contexts/LikesContext';
import {
  WeekPart,
  Day,
  DayPlan,
  MealType,
  StructuredWeekPlan,
  generateStructuredMealPlan,
  getWeekStructure,
  getAlternateMeal,
  extractUsedIds,
  extractPartIngredients,
} from '@/data/meals';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';
import PlanToast, { PlanToastHandle } from '@/components/PlanToast';
import LoadingScreen from '@/components/home/LoadingScreen';
import SetupPhase from '@/components/home/SetupPhase';
import PlanPhase from '@/components/home/PlanPhase';
import CravingSheet from '@/components/home/CravingSheet';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

import { font } from '@/constants/type';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LOADING_MS = 1400;

function getTodayKey(): string {
  return DAY_NAMES[new Date().getDay()];
}

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotionRef();
  const { user } = useAuth();
  const { replacePlanIngredients } = useShoppingContext();
  const { likedIds } = useLikes();

  // Snapshot the eating-out day used when the plan was generated.
  // Changing it in settings only takes effect when a new plan is generated.
  const [planEatingOutDay, setPlanEatingOutDay] = useState<string>(
    user?.eatingOutDay ?? 'Sun',
  );

  const { partDays, partShoppingDay, partLabel } = getWeekStructure(planEatingOutDay);

  function getTodayPart(): WeekPart {
    const today = getTodayKey();
    if (partDays.A.includes(today as Day)) return 'A';
    if (partDays.B.includes(today as Day)) return 'B';
    return 'C';
  }

  const shoppingBannerMap: Partial<Record<string, string>> = {
    [partShoppingDay.A]: `Shop today — ${partLabel.A} starts tomorrow`,
    [partShoppingDay.B]: `Shop today — ${partLabel.B} starts tomorrow`,
  };

  const [plan, setPlan] = useState<StructuredWeekPlan | null>(null);
  const [swapSource, setSwapSource] = useState<{ part: WeekPart; day: string; mealType: MealType } | null>(null);
  const swapBannerAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const toValue = swapSource ? 1 : 0;
    if (reducedMotion.current) {
      swapBannerAnim.setValue(toValue);
      return;
    }
    Animated.spring(swapBannerAnim, {
      toValue,
      useNativeDriver: true,
      speed: 18,
      bounciness: 5,
    }).start();
  }, [swapSource, swapBannerAnim, reducedMotion]);

  function runWithLoading(action: () => void) {
    setLoading(true);
    if (reducedMotion.current) {
      fadeAnim.setValue(1);
      spinAnim.setValue(0);
      setTimeout(() => {
        setLoading(false);
        action();
      }, LOADING_MS);
      return;
    }
    fadeAnim.setValue(0);
    spinAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    spinLoopRef.current = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    spinLoopRef.current.start();
    setTimeout(() => {
      spinLoopRef.current?.stop();
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setLoading(false);
        action();
      });
    }, LOADING_MS);
  }

  const [selectedPart, setSelectedPart] = useState<WeekPart>(getTodayPart);
  const [selectedDay, setSelectedDay] = useState<string>(getTodayKey);
  const [selectedCravings, setSelectedCravings] = useState<string[]>([]);
  const [cravingText, setCravingText] = useState('');
  const [showSheet, setShowSheet] = useState(false);

  const planToastRef = useRef<PlanToastHandle>(null);
  const confirmToastRef = useRef<ConfirmToastHandle>(null);

  const today = getTodayKey();
  const shoppingBanner = shoppingBannerMap[today] ?? null;
  const firstName = user?.name?.split(' ')[0] || 'there';

  function handleAddToShoppingList() {
    planToastRef.current?.dismiss();
    setTimeout(() => confirmToastRef.current?.show(), 50);
    requestAnimationFrame(() => {
      if (plan) replacePlanIngredients(extractPartIngredients(plan, selectedPart));
    });
  }

  function toggleCraving(chip: string) {
    setSelectedCravings(prev =>
      prev.includes(chip) ? prev.filter(x => x !== chip) : [...prev, chip],
    );
  }

  function buildKeywords() {
    return [
      ...selectedCravings.map(x => x.toLowerCase()),
      ...cravingText.toLowerCase().split(/\s+/).filter(Boolean),
    ];
  }

  function applyNewPlan(newPlan: StructuredWeekPlan) {
    setPlanEatingOutDay(user?.eatingOutDay ?? 'Sun');
    setPlan(newPlan);
    setSwapSource(null);
    const todayPart = getTodayPart();
    setSelectedPart(todayPart);
    const days = partDays[todayPart];
    setSelectedDay(days.includes(today as Day) ? today : days[0]);
    setTimeout(() => planToastRef.current?.show(), 500);
  }

  function generatePlan() {
    return generateStructuredMealPlan(
      user?.restrictions ?? [],
      buildKeywords(),
      user?.eatingOutDay ?? 'Sun',
      likedIds,
    );
  }

  function handleGenerate() {
    runWithLoading(() => applyNewPlan(generatePlan()));
  }

  function handleGenerateFromSheet() {
    setShowSheet(false);
    runWithLoading(() => applyNewPlan(generatePlan()));
  }

  function handlePartChange(part: WeekPart) {
    setSelectedPart(part);
    const days = partDays[part];
    setSelectedDay(days.includes(today as Day) ? today : days[0]);
    setSwapSource(null);
  }

  function handleSwapSelect(part: WeekPart, day: string, mealType: MealType) {
    if (!swapSource) {
      setSwapSource({ part, day, mealType });
      return;
    }

    // Same card → cancel
    if (swapSource.part === part && swapSource.day === day && swapSource.mealType === mealType) {
      setSwapSource(null);
      return;
    }

    // Ineligible → alert, keep swapSource active so user can pick again
    const eligible = swapSource.mealType === 'breakfast'
      ? mealType === 'breakfast'
      : mealType !== 'breakfast';
    if (!eligible) {
      Alert.alert('Cannot swap', 'Breakfasts can only be swapped with other breakfasts.');
      return;
    }

    const src = swapSource;
    setSwapSource(null);

    setPlan(prev => {
      if (!prev) return prev;
      const srcDayPlan = (prev[src.part] as Record<string, DayPlan>)[src.day];
      const dstDayPlan = (prev[part] as Record<string, DayPlan>)[day];
      const srcMeal = srcDayPlan[src.mealType];
      const dstMeal = dstDayPlan[mealType];

      if (src.part === part) {
        // Same part — merge both day updates into one spread to avoid key collision
        return {
          ...prev,
          [part]: {
            ...prev[part],
            [src.day]: { ...srcDayPlan, [src.mealType]: dstMeal },
            [day]: { ...dstDayPlan, [mealType]: srcMeal },
          },
        };
      }

      return {
        ...prev,
        [src.part]: {
          ...prev[src.part],
          [src.day]: { ...srcDayPlan, [src.mealType]: dstMeal },
        },
        [part]: {
          ...prev[part],
          [day]: { ...dstDayPlan, [mealType]: srcMeal },
        },
      };
    });
  }

  function handleRefreshMeal(part: WeekPart, day: string, mealType: MealType) {
    if (!plan) return;
    const usedIds = extractUsedIds(plan);

    if (part === 'C') {
      if (mealType !== 'lunch') return;
      const alternate = getAlternateMeal(plan.C[day].lunch, usedIds, user?.restrictions ?? []);
      setPlan(prev =>
        prev ? { ...prev, C: { ...prev.C, [day]: { ...prev.C[day], lunch: alternate } } } : prev,
      );
      return;
    }

    const partPlan = plan[part] as Record<string, DayPlan>;
    const alternate = getAlternateMeal(partPlan[day][mealType], usedIds, user?.restrictions ?? []);
    setPlan(prev =>
      prev
        ? {
            ...prev,
            [part]: {
              ...prev[part],
              [day]: { ...(prev[part] as Record<string, DayPlan>)[day], [mealType]: alternate },
            },
          }
        : prev,
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {loading && <LoadingScreen fadeAnim={fadeAnim} spinAnim={spinAnim} />}

      {!loading && !plan && (
        <SetupPhase
          firstName={firstName}
          selectedCravings={selectedCravings}
          cravingText={cravingText}
          onToggleCraving={toggleCraving}
          onCravingTextChange={setCravingText}
          onGenerate={handleGenerate}
        />
      )}

      {!loading && plan && (
        <PlanPhase
          firstName={firstName}
          plan={plan}
          selectedPart={selectedPart}
          selectedDay={selectedDay}
          today={today}
          partLabel={partLabel}
          partDays={partDays}
          shoppingBanner={shoppingBanner}
          swapSource={swapSource}
          onPartChange={handlePartChange}
          onDayChange={setSelectedDay}
          onAddToShoppingList={handleAddToShoppingList}
          onRefreshMeal={handleRefreshMeal}
          onSwapSelect={handleSwapSelect}
        />
      )}

      {/* Floating swap tip */}
      <Animated.View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        importantForAccessibility={swapSource ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!swapSource}
        style={[
          styles.swapBannerFloat,
          {
            opacity: swapBannerAnim,
            transform: [
              {
                translateY: swapBannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.swapBannerFloatInner}>
          <Text style={styles.swapBannerFloatText}>Tap another meal to swap, or the same one to cancel</Text>
        </View>
      </Animated.View>

      {/* FAB — only in plan phase */}
      {!loading && plan && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowSheet(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Replan the week"
        >
          <Text style={styles.fabText}>Replan</Text>
        </TouchableOpacity>
      )}

      {/* Toasts — always mounted so refs are valid when show() is called */}
      <PlanToast
        ref={planToastRef}
        message="Your week is planned"
        actionLabel="Make shopping list"
        actionIcon="cart-outline"
        onAction={handleAddToShoppingList}
      />
      <ConfirmToast ref={confirmToastRef} message="Added to shopping list" />

      <CravingSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        selectedCravings={selectedCravings}
        cravingText={cravingText}
        onToggleCraving={toggleCraving}
        onCravingTextChange={setCravingText}
        onGenerate={handleGenerateFromSheet}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: c.primary,
    borderRadius: 100,
    paddingHorizontal: 36,
    paddingVertical: 17,
  },
  fabText: {
    fontSize: 16,
    fontFamily: font.bold, fontWeight: '700',
    color: c.onPrimary,
    letterSpacing: -0.2,
  },
  swapBannerFloat: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  swapBannerFloatInner: {
    backgroundColor: c.primary,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  swapBannerFloatText: {
    fontSize: 13,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.onPrimary,
    letterSpacing: -0.1,
  },
});
