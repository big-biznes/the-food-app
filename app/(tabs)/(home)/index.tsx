import { useState, useRef } from 'react';
import { TouchableOpacity, Text, Animated, Easing, StyleSheet } from 'react-native';
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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getTodayKey(): string {
  return DAY_NAMES[new Date().getDay()];
}

export default function HomeScreen() {
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
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  function runWithLoading(action: () => void) {
    fadeAnim.setValue(0);
    spinAnim.setValue(0);
    setLoading(true);
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
    }, 1400);
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
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip],
    );
  }

  function buildKeywords() {
    return [
      ...selectedCravings.map(c => c.toLowerCase()),
      ...cravingText.toLowerCase().split(/\s+/).filter(Boolean),
    ];
  }

  function applyNewPlan(newPlan: StructuredWeekPlan) {
    setPlanEatingOutDay(user?.eatingOutDay ?? 'Sun');
    setPlan(newPlan);
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
          onPartChange={handlePartChange}
          onDayChange={setSelectedDay}
          onAddToShoppingList={handleAddToShoppingList}
          onRefreshMeal={handleRefreshMeal}
        />
      )}

      {/* FAB — only in plan phase */}
      {!loading && plan && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowSheet(true)} activeOpacity={0.85}>
          <Text style={styles.fabText}>New Plan</Text>
        </TouchableOpacity>
      )}

      {/* Toasts — always mounted so refs are valid when show() is called */}
      <PlanToast
        ref={planToastRef}
        message="Meal plan ready!"
        actionLabel="Prepare shopping list?"
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingHorizontal: 36,
    paddingVertical: 17,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
