import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import {
  PART_DAYS,
  PART_SHOPPING_DAY,
  WeekPart,
  Day,
  DayPlan,
  generateStructuredMealPlan,
  getAlternateMeal,
  extractUsedIds,
  extractPlanIngredients,
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

function getTodayPart(): WeekPart {
  const today = getTodayKey();
  if (['Mon', 'Tue', 'Wed'].includes(today)) return 'A';
  if (['Thu', 'Fri', 'Sat'].includes(today)) return 'B';
  return 'C';
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const PART_LABEL: Record<WeekPart, string> = {
  A: 'Mon – Wed',
  B: 'Thu – Sat',
  C: 'Sunday',
};

const SHOPPING_BANNER: Partial<Record<string, string>> = {
  Sun: 'Shop today — Part A starts tomorrow',
  Wed: 'Shop today — Part B starts tomorrow',
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { addShoppingItems } = useShoppingContext();

  const [plan, setPlan] = useState<StructuredWeekPlan | null>(null);
  const [selectedPart, setSelectedPart] = useState<WeekPart>(getTodayPart);
  const [selectedDay, setSelectedDay] = useState<string>(getTodayKey);
  const [selectedCravings, setSelectedCravings] = useState<string[]>([]);
  const [cravingText, setCravingText] = useState('');
  const [showSheet, setShowSheet] = useState(false);

  const insets = useSafeAreaInsets();
  const firstName = user?.name?.split(' ')[0] || 'there';

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
    addShoppingItems(extractPlanIngredients(newPlan));
    setPlan(newPlan);
    const todayPart = getTodayPart();
    setSelectedPart(todayPart);
    const today = getTodayKey();
    const days = PART_DAYS[todayPart];
    setSelectedDay(days.includes(today as Day) ? today : days[0]);
  }

  function handleGenerate() {
    applyNewPlan(generateStructuredMealPlan(user?.restrictions ?? [], buildKeywords()));
  }

  function handleGenerateFromSheet() {
    applyNewPlan(generateStructuredMealPlan(user?.restrictions ?? [], buildKeywords()));
    setShowSheet(false);
  }

  function handlePartChange(part: WeekPart) {
    setSelectedPart(part);
    const today = getTodayKey();
    const days = PART_DAYS[part];
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
      <SafeAreaView style={styles.safe}>
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
  const partDays = PART_DAYS[selectedPart];
  const validDay = partDays.includes(selectedDay as Day) ? selectedDay : partDays[0];
  const shoppingBanner = SHOPPING_BANNER[today] ?? null;

  return (
    <SafeAreaView style={styles.safe}>
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
                  {PART_LABEL[part]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Shopping banner */}
        {shoppingBanner && (
          <View style={styles.shopBanner}>
            <Ionicons name="bag-outline" size={13} color="#111111" />
            <Text style={styles.shopBannerText}>{shoppingBanner}</Text>
          </View>
        )}

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayRow}
          style={styles.dayScroll}
        >
          {partDays.map(day => {
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
        onPress={() => setShowSheet(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>New Plan</Text>
      </TouchableOpacity>

      {/* Craving sheet modal */}
      <Modal
        visible={showSheet}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowSheet(false)}
      >
        <View style={sheet.overlay}>
          <TouchableOpacity
            style={sheet.backdrop}
            activeOpacity={1}
            onPress={() => setShowSheet(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={sheet.avoidingView}
          >
            <View style={sheet.card}>
              {/* Handle */}
              <View style={sheet.handle} />

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

              {/* Fills the home-indicator / bottom-nav zone */}
              <View style={{ height: insets.bottom || 34 }} />
            </View>
          </KeyboardAvoidingView>
        </View>
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
  dayScroll: { marginBottom: 24 },
  dayRow: { gap: 8 },
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  avoidingView: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 24,
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
