import { useState, useRef, useEffect, useCallback, useMemo, SetStateAction } from 'react';
import { Text, Animated, Easing, StyleSheet, View} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import { useLikes } from '@/contexts/LikesContext';
import {
  WeekPart,
  Day,
  MealType,
  PlanSlot,
  StructuredWeekPlan,
  generateStructuredMealPlan,
  getWeekStructure,
  getAlternateMeal,
  extractUsedIds,
  extractPartIngredients,
  fitsRestrictions,
  mealAt,
  planSlots,
  swapGroup,
  withMeal,
  withoutSnack,
  addSnacks,
  removeSnacks,
  CATEGORIES,
} from '@/data/meals';
import { usePlan } from '@/contexts/PlanContext';
import { useRecipes, waitForRecipes } from '@/contexts/RecipesContext';
import { useTargets } from '@/hooks/usePortions';
import { useShoppingListSync } from '@/hooks/useShoppingListSync';
import { SNACK_FROM_KCAL, dailyTargets } from '@/data/portions';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';
import ConfirmSheet from '@/components/ConfirmSheet';
import PlanToast, { PlanToastHandle } from '@/components/PlanToast';
import LoadingScreen from '@/components/home/LoadingScreen';
import SetupPhase from '@/components/home/SetupPhase';
import PlanPhase, { PlanNotice } from '@/components/home/PlanPhase';
import CravingSheet from '@/components/home/CravingSheet';
import PlanIntroSheet from '@/components/home/PlanIntroSheet';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

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
  const { savedPlan, setSavedPlan, without } = usePlan();
  const plan = savedPlan?.plan ?? null;
  const planEatingOutDay = savedPlan?.eatingOutDay ?? user?.eatingOutDay ?? 'Sun';
  const setPlan = useCallback(
    (update: SetStateAction<StructuredWeekPlan | null>) =>
      setSavedPlan(prev => {
        const next = typeof update === 'function' ? update(prev?.plan ?? null) : update;
        // Everything else saved with the plan (its focus, edited recipes) stays.
        return next ? { eatingOutDay: 'Sun', ...prev, plan: next } : null;
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
    [partShoppingDay.A]: `Shop and prep today — ${partLabel.A} starts tomorrow`,
    [partShoppingDay.B]: `Shop and prep today — ${partLabel.B} starts tomorrow`,
  };

  const [swapSource, setSwapSource] = useState<PlanSlot | null>(null);
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

  // A meal was replaced, moved to another part or dropped after the shopping list was
  // made: offer to update the list. (Recipe edits get the same offer on the recipe page.)
  const { stale: listStale, update: updateList } = useShoppingListSync();
  const updateListRef = useRef(updateList);
  updateListRef.current = updateList;
  const offeredFor = useRef(plan);
  useEffect(() => {
    if (offeredFor.current === plan) return;
    offeredFor.current = plan;
    if (!listStale) return;
    confirmToastRef.current?.show({
      message: 'Shopping list is out of date',
      actionLabel: 'Update',
      icon: 'cart',
      doneMessage: 'Shopping list updated',
      onAction: () => updateListRef.current(),
    });
  }, [plan, listStale]);

  const today = getTodayKey();
  const shoppingBanner = shoppingBannerMap[today] ?? null;
  const firstName = user?.name?.split(' ')[0] || 'there';

  function handleAddToShoppingList() {
    planToastRef.current?.dismiss();
    setTimeout(() => confirmToastRef.current?.show(), 50);
    if (!plan) return;
    const needs = extractPartIngredients(plan, selectedPart, targets, without);
    requestAnimationFrame(() => replacePlanIngredients(needs));
    // Remembered so the list can be brought up to date when the plan changes later.
    setSavedPlan(prev => (prev ? { ...prev, list: { part: selectedPart, needs } } : prev));
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
    if (plansBefore === 0) {
      // First plan: how it works comes first, the "Make shopping list" toast once that is closed.
      toastAfterIntro.current = extraMs;
      // Tips wait for the explainer: it is about the whole plan, they are about single buttons.
      setIntroPending(true);
      setTimeout(() => {
        setIntroPending(false);
        setShowIntro(true);
      }, 600);
      return;
    }
    setTimeout(() => planToastRef.current?.show({ extraMs }), 500);
  }

  const [showIntro, setShowIntro] = useState(false);
  const [introPending, setIntroPending] = useState(false);
  const toastAfterIntro = useRef<number | null>(null);

  function closeIntro() {
    setShowIntro(false);
    const extraMs = toastAfterIntro.current;
    toastAfterIntro.current = null;
    if (extraMs != null) setTimeout(() => planToastRef.current?.show({ extraMs }), 200);
  }

  /** Generate a plan for the current craving and show it. */
  function createPlan(planTargets = targets) {
    const { focus, keywords } = buildCraving();
    const newPlan = generateStructuredMealPlan(
      user?.restrictions ?? [],
      keywords,
      user?.eatingOutDay ?? 'Sun',
      likedIds,
      focus,
      planTargets,
    );
    applyNewPlan(newPlan, focus);
  }

  // Generating needs the full recipe list; on a fresh app start it may still be loading
  // in the background (the "Building your plan" screen covers the short wait).
  async function generateWhenReady(planTargets = targets) {
    await waitForRecipes();
    createPlan(planTargets);
  }

  // A big day is easier with a snack, but that is the person's call: they are asked once,
  // before the first plan made after their target got that big. Settings can change it later.
  const [askSnack, setAskSnack] = useState(false);
  const snackAnswered = useRef(false);

  function startGenerating() {
    if (user && user.snacks === undefined && targets && targets.kcal >= SNACK_FROM_KCAL) {
      snackAnswered.current = false;
      setAskSnack(true);
      return;
    }
    runWithLoading(() => generateWhenReady());
  }

  function answerSnack(snacks: boolean) {
    if (snackAnswered.current || !user) return;
    snackAnswered.current = true;
    setAskSnack(false);
    updateProfile({ snacks });
    // The profile update lands after this render, so this plan gets the answer directly.
    const planTargets = dailyTargets({ ...user, snacks });
    runWithLoading(() => generateWhenReady(planTargets));
  }

  function handleGenerate() {
    startGenerating();
  }

  function handleGenerateFromSheet() {
    setShowSheet(false);
    startGenerating();
  }

  function handlePartChange(part: WeekPart) {
    setSelectedPart(part);
    const days = partDays[part];
    setSelectedDay(days.includes(today as Day) ? today : days[0]);
    setSwapSource(null);
  }

  function handleSwapSelect(part: WeekPart, day: string, mealType: MealType) {
    const eligible = !swapSource || swapGroup(swapSource.mealType) === swapGroup(mealType);
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

    const dst = { part, day, mealType };
    setPlan(prev => {
      if (!prev) return prev;
      const srcMeal = mealAt(prev, src);
      const dstMeal = mealAt(prev, dst);
      if (!srcMeal || !dstMeal) return prev;
      return withMeal(withMeal(prev, src, dstMeal), dst, srcMeal);
    });
  }

  function handleRefreshMeal(part: WeekPart, day: string, mealType: MealType) {
    if (!plan) return;
    const slot = { part, day, mealType };
    const current = mealAt(plan, slot);
    if (!current) return;
    const alternate = getAlternateMeal(current, extractUsedIds(plan), restrictions, savedPlan?.focus);
    setPlan(prev => (prev ? withMeal(prev, slot, alternate) : prev));
  }

  // Meals that stopped fitting after the eating preferences were changed in Settings.
  const restrictions = useMemo(() => user?.restrictions ?? [], [user?.restrictions]);
  const misfitCount = useMemo(
    () => (plan ? planSlots(plan).filter(slot => !fitsRestrictions(slot.meal, restrictions)).length : 0),
    [plan, restrictions],
  );

  /** Swap every meal that no longer fits the eating preferences for one that does. */
  async function handleReplaceMisfits() {
    await waitForRecipes();
    setPlan(prev => {
      if (!prev) return prev;
      let next = prev;
      const usedIds = extractUsedIds(prev);
      for (const slot of planSlots(prev)) {
        if (fitsRestrictions(slot.meal, restrictions)) continue;
        const alternate = getAlternateMeal(slot.meal, usedIds, restrictions, savedPlan?.focus);
        if (fitsRestrictions(alternate, restrictions)) {
          usedIds.add(alternate.id);
          next = withMeal(next, slot, alternate);
        } else if (slot.mealType === 'snack') {
          // No snack fits: the day goes without one.
          next = withoutSnack(next, slot.part, slot.day);
        }
      }
      return next;
    });
    setSwapSource(null);
  }

  // The daily snack was switched on or off in Settings after this plan was made.
  const { meals: cookbook } = useRecipes();
  const planHasSnacks = useMemo(() => (plan ? planSlots(plan).some(slot => slot.mealType === 'snack') : false), [plan]);
  const snacksToAdd = useMemo(
    () =>
      Boolean(plan && targets?.snack && !planHasSnacks) &&
      cookbook.some(m => m.mealType === 'snack' && fitsRestrictions(m, restrictions)),
    [plan, targets, planHasSnacks, cookbook, restrictions],
  );

  const notices: PlanNotice[] = [];
  if (misfitCount > 0) {
    notices.push({
      key: 'misfits',
      text: `${misfitCount === 1 ? '1 meal no longer fits' : `${misfitCount} meals no longer fit`} your eating preferences`,
      action: 'Replace',
      onPress: handleReplaceMisfits,
    });
  }
  if (snacksToAdd) {
    notices.push({
      key: 'snacks-add',
      text: 'You switched on a daily snack. This plan has none yet.',
      action: 'Add',
      onPress: () => setPlan(prev => (prev ? addSnacks(prev, restrictions) : prev)),
    });
  }
  if (plan && planHasSnacks && targets && !targets.snack) {
    notices.push({
      key: 'snacks-remove',
      text: 'You switched off the daily snack. This plan still has them.',
      action: 'Remove',
      onPress: () => setPlan(prev => (prev ? removeSnacks(prev) : prev)),
    });
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
          notices={notices}
          onPartChange={handlePartChange}
          onDayChange={setSelectedDay}
          onAddToShoppingList={handleAddToShoppingList}
          onRefreshMeal={handleRefreshMeal}
          onSwapSelect={handleSwapSelect}
          tipsPaused={introPending || showIntro}
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
          <PressableScale
            style={styles.fab}
            onPress={() => setShowSheet(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Replan the week"
          >
            <Text style={styles.fabText}>Replan</Text>
          </PressableScale>
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
            : swapSource?.mealType === 'snack'
              ? 'A snack can only be swapped with another snack. Pick a snack from another day, or tap the selected one again to cancel.'
              : 'Lunches and dinners can be swapped with each other, but not with a breakfast or a snack. Pick a lunch or dinner, or tap the selected meal again to cancel.'
        }
        confirmLabel="Got it"
        hideCancel
        onConfirm={() => setSwapHelpVisible(false)}
        onClose={() => setSwapHelpVisible(false)}
      />

      <ConfirmSheet
        visible={askSnack}
        title="Add a daily snack?"
        message={`Your days are about ${(targets?.kcal ?? 0).toLocaleString('en')} kcal, which makes for three big meals. A snack each day takes some of that, so the meals get smaller. You can change this in Settings.`}
        confirmLabel="Yes, add a snack"
        cancelLabel="No, three meals"
        onConfirm={() => answerSnack(true)}
        // Also runs after "Yes"; answerSnack ignores the second call.
        onClose={() => answerSnack(false)}
      />

      <PlanIntroSheet visible={showIntro} onClose={closeIntro} />

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
