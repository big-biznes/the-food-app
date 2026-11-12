import { useState, useRef, useEffect, useCallback, SetStateAction } from 'react';
import { TouchableOpacity, Text, Animated, Easing, StyleSheet, View } from 'react-native';
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
  planMeals,
  rememberMeals,
  CATEGORIES,
} from '@/data/meals';
import { waitForRecipes } from '@/contexts/RecipesContext';
import { useTargets } from '@/hooks/usePortions';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';
import ConfirmSheet from '@/components/ConfirmSheet';
import PlanToast, { PlanToastHandle } from '@/components/PlanToast';
import LoadingScreen from '@/components/home/LoadingScreen';
import SetupPhase from '@/components/home/SetupPhase';
import PlanPhase from '@/components/home/PlanPhase';
import CravingSheet from '@/components/home/CravingSheet';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';
import { useCloudState } from '@/hooks/useCloudState';

import { font } from '@/constants/type';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LOADING_MS = 1400;
/**
 * Extra time the "Your week is planned" toast stays up for new users: the full amount on their
 * first plan, half on the second, none from the third on.
 */
const FIRST_PLAN_TOAST_EXTRA_MS = 7000;
/** How far the Replan button drops when it steps aside for the plan toast. */
const FAB_HIDDEN_Y = 110;
/** Wrong swap taps in a row, and the time they must fall within, before the explanation opens. */
const SWAP_HELP_AFTER_TAPS = 3;
const SWAP_HELP_WINDOW_MS = 5000;

/** What gets saved to the cloud: the plan plus the eating-out day it was built for. */
/** `focus`: the categories the plan was generated for, so replaced meals stay in theme. */
type SavedPlan = { plan: StructuredWeekPlan; eatingOutDay: string; focus?: string[] };

function getTodayKey(): string {
  return DAY_NAMES[new Date().getDay()];
}

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotionRef();
  const { user, updateProfile } = useAuth();
  const { replacePlanIngredients } = useShoppingContext();
  const { likedIds } = useLikes();
  const targets = useTargets();

  // Snapshot the eating-out day used when the plan was generated.
  // Changing it in settings only takes effect when a new plan is generated.
  const [savedPlan, setSavedPlan] = useCloudState<SavedPlan | null>('plan', null);
  const plan = savedPlan?.plan ?? null;
  // The plan stores full meals, so details / cook can open them before the recipe list loads.
  useEffect(() => {
    if (plan) rememberMeals(planMeals(plan));
  }, [plan]);
  const planEatingOutDay = savedPlan?.eatingOutDay ?? user?.eatingOutDay ?? 'Sun';
  const setPlan = useCallback(
    (update: SetStateAction<StructuredWeekPlan | null>) =>
      setSavedPlan(prev => {
        const next = typeof update === 'function' ? update(prev?.plan ?? null) : update;
        return next ? { plan: next, eatingOutDay: prev?.eatingOutDay ?? 'Sun', focus: prev?.focus } : null;
      }),
    [setSavedPlan],
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

  const [swapSource, setSwapSource] = useState<{ part: WeekPart; day: string; mealType: MealType } | null>(null);
  const swapBannerAnim = useRef(new Animated.Value(0)).current;
  // Times of the latest wrong swap taps in a row; three within SWAP_HELP_WINDOW_MS open the explanation.
  const wrongSwapTaps = useRef<number[]>([]);
  const [swapHelpVisible, setSwapHelpVisible] = useState(false);
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

  // The Replan button steps out of the way while the "week is planned" toast is up,
  // so the two never stack.
  const [toastUp, setToastUp] = useState(false);
  const fabAnim = useRef(new Animated.Value(1)).current; // 1 = shown, 0 = hidden below
  useEffect(() => {
    const toValue = toastUp ? 0 : 1;
    if (reducedMotion.current) {
      fabAnim.setValue(toValue);
      return;
    }
    // Native driver, like the toast: this runs right after a plan is generated, while the
    // JS thread is busy, and a JS-driven slide would skip frames.
    Animated.timing(fabAnim, {
      toValue,
      duration: toastUp ? 200 : 260,
      easing: toastUp ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [toastUp, fabAnim, reducedMotion]);

  const planToastRef = useRef<PlanToastHandle>(null);
  const confirmToastRef = useRef<ConfirmToastHandle>(null);

  const today = getTodayKey();
  const shoppingBanner = shoppingBannerMap[today] ?? null;
  const firstName = user?.name?.split(' ')[0] || 'there';

  function handleAddToShoppingList() {
    planToastRef.current?.dismiss();
    setTimeout(() => confirmToastRef.current?.show(), 50);
    requestAnimationFrame(() => {
      if (plan) replacePlanIngredients(extractPartIngredients(plan, selectedPart, targets));
    });
  }

  function toggleCraving(chip: string) {
    setSelectedCravings(prev =>
      prev.includes(chip) ? prev.filter(x => x !== chip) : [...prev, chip],
    );
  }

  /**
   * What the user asked for, split in two: categories (a chip, or the same word
   * typed) are the plan's focus; any other typed word is matched against ingredients.
   */
  function buildCraving() {
    const words = [
      ...selectedCravings.map(x => x.toLowerCase()),
      ...cravingText.toLowerCase().split(/[\s,]+/).filter(Boolean),
    ];
    return {
      focus: [...new Set(words.filter(w => CATEGORIES.includes(w)))],
      keywords: words.filter(w => !CATEGORIES.includes(w)),
    };
  }

  function applyNewPlan(newPlan: StructuredWeekPlan, focus: string[]) {
    setSavedPlan({ plan: newPlan, eatingOutDay: user?.eatingOutDay ?? 'Sun', focus });
    setSwapSource(null);
    const todayPart = getTodayPart();
    setSelectedPart(todayPart);
    const days = partDays[todayPart];
    setSelectedDay(days.includes(today as Day) ? today : days[0]);

    const plansBefore = user?.plansCreated ?? 0;
    const extraMs = plansBefore === 0 ? FIRST_PLAN_TOAST_EXTRA_MS : plansBefore === 1 ? FIRST_PLAN_TOAST_EXTRA_MS / 2 : 0;
    if (plansBefore < 2) updateProfile({ plansCreated: plansBefore + 1 });
    setTimeout(() => planToastRef.current?.show({ extraMs }), 500);
  }

  /** Generate a plan for the current craving and show it. */
  function createPlan() {
    const { focus, keywords } = buildCraving();
    const newPlan = generateStructuredMealPlan(
      user?.restrictions ?? [],
      keywords,
      user?.eatingOutDay ?? 'Sun',
      likedIds,
      focus,
      targets,
    );
    applyNewPlan(newPlan, focus);
  }

  // Generating needs the full recipe list; on a fresh app start it may still be loading
  // in the background (the "Building your plan" screen covers the short wait).
  async function generateWhenReady() {
    await waitForRecipes();
    createPlan();
  }

  function handleGenerate() {
    runWithLoading(generateWhenReady);
  }

  function handleGenerateFromSheet() {
    setShowSheet(false);
    runWithLoading(generateWhenReady);
  }

  function handlePartChange(part: WeekPart) {
    setSelectedPart(part);
    const days = partDays[part];
    setSelectedDay(days.includes(today as Day) ? today : days[0]);
    setSwapSource(null);
  }

  function handleSwapSelect(part: WeekPart, day: string, mealType: MealType) {
    const eligible =
      !swapSource || (swapSource.mealType === 'breakfast' ? mealType === 'breakfast' : mealType !== 'breakfast');
    if (!eligible) {
      // The card itself shakes and flashes (MealCard). swapSource stays, so the user can pick again.
      const now = Date.now();
      wrongSwapTaps.current = [...wrongSwapTaps.current, now].slice(-SWAP_HELP_AFTER_TAPS);
      if (
        wrongSwapTaps.current.length === SWAP_HELP_AFTER_TAPS &&
        now - wrongSwapTaps.current[0] <= SWAP_HELP_WINDOW_MS
      ) {
        wrongSwapTaps.current = [];
        setSwapHelpVisible(true);
      }
      return;
    }
    // Any other tap ends the run of wrong ones.
    wrongSwapTaps.current = [];

    if (!swapSource) {
      setSwapSource({ part, day, mealType });
      return;
    }

    // Same card → cancel
    if (swapSource.part === part && swapSource.day === day && swapSource.mealType === mealType) {
      setSwapSource(null);
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
      const alternate = getAlternateMeal(plan.C[day].lunch, usedIds, user?.restrictions ?? [], savedPlan?.focus);
      setPlan(prev =>
        prev ? { ...prev, C: { ...prev.C, [day]: { ...prev.C[day], lunch: alternate } } } : prev,
      );
      return;
    }

    const partPlan = plan[part] as Record<string, DayPlan>;
    const alternate = getAlternateMeal(partPlan[day][mealType], usedIds, user?.restrictions ?? [], savedPlan?.focus);
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
        <Animated.View
          style={[
            styles.fabWrap,
            {
              opacity: fabAnim,
              transform: [{ translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [FAB_HIDDEN_Y, 0] }) }],
            },
          ]}
          pointerEvents={toastUp ? 'none' : 'auto'}
          importantForAccessibility={toastUp ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={toastUp}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowSheet(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Replan the week"
          >
            <Text style={styles.fabText}>Replan</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Toasts — always mounted so refs are valid when show() is called */}
      <PlanToast
        ref={planToastRef}
        message="Your week is planned"
        actionLabel="Make shopping list"
        actionIcon="cart-outline"
        onAction={handleAddToShoppingList}
        onVisibleChange={setToastUp}
      />
      <ConfirmToast ref={confirmToastRef} message="Added to shopping list" />

      <ConfirmSheet
        visible={swapHelpVisible}
        title="These two can't be swapped"
        message={
          swapSource?.mealType === 'breakfast'
            ? 'A breakfast can only be swapped with another breakfast. Pick a breakfast from another day, or tap the selected meal again to cancel.'
            : 'Lunches and dinners can be swapped with each other, but not with a breakfast. Pick a lunch or dinner, or tap the selected meal again to cancel.'
        }
        confirmLabel="Got it"
        hideCancel
        onConfirm={() => setSwapHelpVisible(false)}
        onClose={() => setSwapHelpVisible(false)}
      />

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
  fabWrap: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
  },
  fab: {
    backgroundColor: c.primary,
    borderRadius: 100,
    paddingHorizontal: 36,
    paddingVertical: 17,
    // Knockout ring: keeps the button separate from the ink "eating out" card when it scrolls underneath.
    borderWidth: 3,
    borderColor: c.bg,
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
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    // Narrow enough to sit clear of the screen edges; the hint wraps onto two lines.
    maxWidth: 240,
  },
  swapBannerFloatText: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.onPrimary,
    letterSpacing: -0.1,
  },
});
