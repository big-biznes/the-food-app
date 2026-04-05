import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import {
  WeekPart,
  Day,
  DayPlan,
  generateStructuredMealPlan,
  getWeekStructure,
  getAlternateMeal,
  extractUsedIds,
  extractPartIngredients,
  StructuredWeekPlan,
  MealType,
} from '@/data/meals';
import MealCard from '@/components/MealCard';

const CRAVING_CHIPS = [
  'Spicy', 'Light', 'Hearty', 'Fresh',
  'Asian', 'Italian', 'Mediterranean', 'Mexican',
  'Comfort', 'Quick',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getTodayKey(): string {
  return DAY_NAMES[new Date().getDay()];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { replaceShoppingItems } = useShoppingContext();
  const router = useRouter();

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
  const [selectedPart, setSelectedPart] = useState<WeekPart>(getTodayPart);
  const [selectedDay, setSelectedDay] = useState<string>(getTodayKey);
  const [selectedCravings, setSelectedCravings] = useState<string[]>([]);
  const [cravingText, setCravingText] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('screen').height)).current;

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const toastSlide = useRef(new Animated.Value(100)).current;
  const toastTextWidth = useRef(new Animated.Value(160)).current;
  const toastTextOpacity = useRef(new Animated.Value(1)).current;
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => { toastTimers.current.forEach(clearTimeout); };
  }, []);

  function clearToastTimers() {
    toastTimers.current.forEach(clearTimeout);
    toastTimers.current = [];
  }

  function dismissToast() {
    clearToastTimers();
    Animated.timing(toastSlide, { toValue: 100, duration: 260, useNativeDriver: true }).start(
      () => setToastVisible(false),
    );
  }

  function handleGoShopping() {
    if (plan) {
      replaceShoppingItems(extractPartIngredients(plan, selectedPart));
    }
    dismissToast();
    router.navigate('/(shopping)' as never);
  }

  function triggerPlanToast() {
    clearToastTimers();
    toastSlide.setValue(100);
    toastTextWidth.setValue(160);
    toastTextOpacity.setValue(1);
    setToastVisible(true);

    Animated.spring(toastSlide, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
      mass: 1,
    }).start();

    // Collapse button text to icon-only after 3.5s
    const t1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastTextOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(toastTextWidth, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();
    }, 3500);
    toastTimers.current.push(t1);

    // Auto-dismiss after 7s
    const t2 = setTimeout(dismissToast, 7000);
    toastTimers.current.push(t2);
  }

  const insets = useSafeAreaInsets();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          closeSheet();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            mass: 1,
            stiffness: 220,
          }).start();
        }
      },
    }),
  ).current;
  const firstName = user?.name?.split(' ')[0] || 'there';

  function openSheet() {
    slideAnim.setValue(Dimensions.get('screen').height);
    backdropAnim.setValue(0);
    setShowSheet(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        mass: 1,
        stiffness: 220,
      }),
    ]).start();
  }

  function closeSheet() {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('screen').height,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSheet(false));
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
    // Lock in the eating-out day for this plan so changing the setting
    // mid-plan doesn't shift which days belong to which part.
    setPlanEatingOutDay(user?.eatingOutDay ?? 'Sun');
    setPlan(newPlan);
    const todayPart = getTodayPart();
    setSelectedPart(todayPart);
    const today = getTodayKey();
    const days = partDays[todayPart];
    setSelectedDay(days.includes(today as Day) ? today : days[0]);
    triggerPlanToast();
  }

  function handleGenerate() {
    applyNewPlan(generateStructuredMealPlan(user?.restrictions ?? [], buildKeywords(), user?.eatingOutDay ?? 'Sun'));
  }

  function handleGenerateFromSheet() {
    applyNewPlan(generateStructuredMealPlan(user?.restrictions ?? [], buildKeywords(), user?.eatingOutDay ?? 'Sun'));
    closeSheet();
  }

  function handlePartChange(part: WeekPart) {
    setSelectedPart(part);
    const today = getTodayKey();
    const days = partDays[part];
    setSelectedDay(days.includes(today as Day) ? today : days[0]);
  }

  function handleRefreshMeal(part: WeekPart, day: string, mealType: MealType) {
    if (!plan) return;
    const usedIds = extractUsedIds(plan);

    if (part === 'C') {
      if (mealType !== 'lunch') return;
      const current = plan.C[day].lunch;
      const alternate = getAlternateMeal(current, usedIds, user?.restrictions ?? []);
      setPlan(prev =>
        prev
          ? { ...prev, C: { ...prev.C, [day]: { ...prev.C[day], lunch: alternate } } }
          : prev,
      );
      return;
    }

    const partPlan = plan[part] as Record<string, DayPlan>;
    const current = partPlan[day][mealType];
    const alternate = getAlternateMeal(current, usedIds, user?.restrictions ?? []);
    setPlan(prev =>
      prev
        ? {
            ...prev,
            [part]: {
              ...prev[part],
              [day]: {
                ...(prev[part] as Record<string, DayPlan>)[day],
                [mealType]: alternate,
              },
            },
          }
        : prev,
    );
  }

  // ── Setup phase ──────────────────────────────────────────────────────────────
  if (!plan) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.setupScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.greeting}>Hey {firstName} 👋</Text>
              <Text style={styles.subText}>Let's build your meal plan</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What are you craving?</Text>
              <Text style={styles.sectionHint}>Pick everything that sounds good</Text>
              <View style={styles.chipGrid}>
                {CRAVING_CHIPS.map(chip => {
                  const on = selectedCravings.includes(chip);
                  return (
                    <TouchableOpacity
                      key={chip}
                      style={[styles.chip, on && styles.chipOn]}
                      onPress={() => toggleCraving(chip)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{chip}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Anything specific?</Text>
              <TextInput
                style={styles.cravingInput}
                placeholder="e.g. something with pasta, no mushrooms…"
                placeholderTextColor="#C5C5C5"
                value={cravingText}
                onChangeText={setCravingText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleGenerate}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Generate my meal plan</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Plan phase ───────────────────────────────────────────────────────────────
  const today = getTodayKey();
  const selectedPartDays = partDays[selectedPart];
  const validDay = selectedPartDays.includes(selectedDay as Day) ? selectedDay : selectedPartDays[0];
  const shoppingBanner = shoppingBannerMap[today] ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.planScroll}
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
            const isSelected = selectedPart === part;
            return (
              <TouchableOpacity
                key={part}
                style={[styles.partChip, isSelected && styles.partChipOn]}
                onPress={() => handlePartChange(part)}
                activeOpacity={0.7}
              >
                <Text style={[styles.partChipText, isSelected && styles.partChipTextOn]}>
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

        {/* Day selector */}
        <View style={styles.dayRowWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}
            style={styles.dayScrollInner}
          >
            {selectedPartDays.map(day => {
              const isSelected = validDay === day;
              const isToday = day === today;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, isSelected && styles.dayChipOn]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayChipText, isSelected && styles.dayChipTextOn]}>
                    {day}
                  </Text>
                  {isToday && (
                    <View style={[styles.todayDot, isSelected && styles.todayDotOn]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.shopIconBtn} onPress={handleGoShopping} activeOpacity={0.7}>
            <Ionicons name="cart-outline" size={19} color="#111111" />
          </TouchableOpacity>
        </View>

        {/* Meal cards */}
        <View style={styles.mealList}>
          {selectedPart === 'C' ? (
            <>
              <MealCard
                meal={plan.C[validDay].lunch}
                onRefresh={() => handleRefreshMeal('C', validDay, 'lunch')}
              />
              <MealCard meal={plan.C[validDay].dinner} />
            </>
          ) : (
            <>
              <MealCard
                meal={(plan[selectedPart] as Record<string, DayPlan>)[validDay].breakfast}
                onRefresh={() => handleRefreshMeal(selectedPart, validDay, 'breakfast')}
              />
              <MealCard
                meal={(plan[selectedPart] as Record<string, DayPlan>)[validDay].lunch}
                onRefresh={() => handleRefreshMeal(selectedPart, validDay, 'lunch')}
              />
              <MealCard
                meal={(plan[selectedPart] as Record<string, DayPlan>)[validDay].dinner}
                onRefresh={() => handleRefreshMeal(selectedPart, validDay, 'dinner')}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openSheet}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>New Plan</Text>
      </TouchableOpacity>

      {/* Plan-ready toast */}
      {toastVisible && (
        <Animated.View
          style={[styles.toast, { transform: [{ translateY: toastSlide }] }]}
          pointerEvents="box-none"
        >
          <View style={styles.toastLeft}>
            <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
            <Text style={styles.toastMsg}>Meal plan ready!</Text>
          </View>
          <TouchableOpacity
            style={styles.toastBtn}
            onPress={handleGoShopping}
            activeOpacity={0.75}
            pointerEvents="auto"
          >
            <Ionicons name="cart-outline" size={15} color="#111111" />
            <Animated.View style={{ width: toastTextWidth, overflow: 'hidden' }}>
              <Animated.Text
                style={[styles.toastBtnText, { opacity: toastTextOpacity }]}
                numberOfLines={1}
              >
                {' '}Prepare shopping list?
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Craving sheet modal */}
      <Modal
        visible={showSheet}
        animationType="none"
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        {/* Backdrop — fades in independently */}
        <Animated.View
          style={[sheet.backdrop, { opacity: backdropAnim }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeSheet}
          />
        </Animated.View>

        {/* Card — slides up independently */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={sheet.sheetContainer}
          pointerEvents="box-none"
        >
          <Animated.View
            style={{ transform: [{ translateY: slideAnim }] }}
            pointerEvents="auto"
          >
            <View style={sheet.card}>
              <View style={sheet.dragZone} {...panResponder.panHandlers} hitSlop={{ top: 24 }}>
                <View style={sheet.handle} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={sheet.title}>New plan</Text>
                <Text style={sheet.hint}>What are you craving this week?</Text>

                <View style={sheet.chipGrid}>
                  {CRAVING_CHIPS.map(chip => {
                    const on = selectedCravings.includes(chip);
                    return (
                      <TouchableOpacity
                        key={chip}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => toggleCraving(chip)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{chip}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={sheet.input}
                  placeholder="e.g. something with pasta, no mushrooms…"
                  placeholderTextColor="#C5C5C5"
                  value={cravingText}
                  onChangeText={setCravingText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleGenerateFromSheet}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>Generate</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={{ height: insets.bottom + 8 }} />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },

  setupScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  planScroll: {
    paddingHorizontal: 24,
    paddingBottom: 120, // space for FAB
  },

  header: { paddingTop: 20, marginBottom: 24 },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  subText: { fontSize: 15, color: '#AAAAAA', marginTop: 4 },

  // Setup
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 4 },
  sectionHint: { fontSize: 14, color: '#AAAAAA', marginBottom: 16 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100, backgroundColor: '#F5F5F5' },
  chipOn: { backgroundColor: '#111111' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#111111' },
  chipTextOn: { color: '#FFFFFF' },
  cravingInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: '#111111',
    minHeight: 90,
  },
  primaryBtn: {
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // Part selector
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

  // Shopping banner
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

  // Day selector
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
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#111111', marginTop: 3,
  },
  todayDotOn: { backgroundColor: '#FFFFFF' },

  // Meal list
  mealList: { gap: 16, marginBottom: 32 },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    backgroundColor: '#111111',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  toastLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  toastMsg: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toastBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
  },

  // FAB
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

const sheet = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
  },
  dragZone: {
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 20,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: '#111111',
    minHeight: 80,
    marginBottom: 20,
  },
});
