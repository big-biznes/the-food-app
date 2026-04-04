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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import {
  DAYS,
  generateMealPlan,
  getAlternateMeal,
  WeekPlan,
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

  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(getTodayKey);
  const [selectedCravings, setSelectedCravings] = useState<string[]>([]);
  const [cravingText, setCravingText] = useState('');

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

  function handleGenerate() {
    const newPlan = generateMealPlan(user?.restrictions ?? [], buildKeywords());
    setPlan(newPlan);
    setSelectedDay(getTodayKey());
  }

  function handleRefreshMeal(day: string, mealType: MealType) {
    if (!plan) return;
    const current = plan[day][mealType];
    const alternate = getAlternateMeal(current, plan, user?.restrictions ?? []);
    setPlan(prev =>
      prev
        ? { ...prev, [day]: { ...prev[day], [mealType]: alternate } }
        : prev,
    );
  }

  function handleRegenerate() {
    const newPlan = generateMealPlan(user?.restrictions ?? [], buildKeywords());
    setPlan(newPlan);
  }

  // ── Setup phase ──────────────────────────────────────────────────────────
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
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {chip}
                      </Text>
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

  // ── Plan phase ───────────────────────────────────────────────────────────
  const today = getTodayKey();
  const dayMeals = plan[selectedDay];

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

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayRow}
          style={styles.dayScroll}
        >
          {DAYS.map(day => {
            const isSelected = selectedDay === day;
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
          <MealCard
            meal={dayMeals.breakfast}
            onRefresh={() => handleRefreshMeal(selectedDay, 'breakfast')}
          />
          <MealCard
            meal={dayMeals.lunch}
            onRefresh={() => handleRefreshMeal(selectedDay, 'lunch')}
          />
          <MealCard
            meal={dayMeals.dinner}
            onRefresh={() => handleRefreshMeal(selectedDay, 'dinner')}
          />
        </View>

        {/* Regenerate */}
        <TouchableOpacity
          style={styles.regenBtn}
          onPress={handleRegenerate}
          activeOpacity={0.8}
        >
          <Text style={styles.regenBtnText}>Regenerate full plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },

  // ── Setup ──
  setupScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Plan ──
  planScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Shared ──
  header: {
    paddingTop: 20,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 15,
    color: '#AAAAAA',
    marginTop: 4,
  },

  // ── Setup sections ──
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
  },
  chipOn: {
    backgroundColor: '#111111',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111111',
  },
  chipTextOn: {
    color: '#FFFFFF',
  },
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
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Day selector ──
  dayScroll: {
    marginBottom: 24,
  },
  dayRow: {
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    minWidth: 52,
  },
  dayChipOn: {
    backgroundColor: '#111111',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  dayChipTextOn: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#111111',
    marginTop: 3,
  },
  todayDotOn: {
    backgroundColor: '#FFFFFF',
  },

  // ── Meal list ──
  mealList: {
    gap: 16,
    marginBottom: 32,
  },

  // ── Regenerate ──
  regenBtn: {
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  regenBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
});
