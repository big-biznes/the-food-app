import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ALL_MEALS, MealType, Ingredient, formatIngredient } from '@/data/meals';
import { DietaryRestriction } from '@/contexts/AuthContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_ICON: Record<MealType, IoniconName> = {
  breakfast: 'sunny-outline',
  lunch: 'partly-sunny-outline',
  dinner: 'moon-outline',
};

const TYPE_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const RESTRICTION_LABEL: Record<DietaryRestriction, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
  'dairy-free': 'Dairy-free',
  'nut-allergy': 'Nut-free',
  halal: 'Halal',
  kosher: 'Kosher',
};

function formatAmount(ing: Ingredient): string {
  if (!ing.unit) {
    return ing.amount > 1 ? `x${ing.amount}` : '';
  }
  if (ing.unit === 'g' || ing.unit === 'ml' || ing.unit === 'kg' || ing.unit === 'l') {
    return `${ing.amount}${ing.unit}`;
  }
  return `${ing.amount} ${ing.unit}`;
}

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const meal = ALL_MEALS.find(m => m.id === id);

  if (!meal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#111111" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={22} color="#111111" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{meal.emoji}</Text>
          <View style={styles.typeRow}>
            <Ionicons name={TYPE_ICON[meal.mealType]} size={14} color="#AAAAAA" />
            <Text style={styles.typeLabel}>{TYPE_LABEL[meal.mealType]}</Text>
          </View>
          <Text style={styles.title}>{meal.name}</Text>
          <Text style={styles.description}>{meal.description}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color="#111111" />
            <Text style={styles.statValue}>{meal.prepTime} min</Text>
            <Text style={styles.statLabel}>Prep time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={20} color="#111111" />
            <Text style={styles.statValue}>{meal.calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={20} color="#111111" />
            <Text style={styles.statValue}>{meal.ingredients.length}</Text>
            <Text style={styles.statLabel}>Ingredients</Text>
          </View>
        </View>

        {/* Dietary tags */}
        {meal.dietaryTags.length > 0 && (
          <View style={styles.tagRow}>
            {meal.dietaryTags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{RESTRICTION_LABEL[tag]}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientList}>
            {meal.ingredients.map((ing, i) => {
              const amount = formatAmount(ing);
              return (
                <View key={ing.name} style={[styles.ingredientRow, i > 0 && styles.ingredientRowBorder]}>
                  <Text style={styles.ingredientName}>{ing.name}</Text>
                  {amount ? <Text style={styles.ingredientAmount}>{amount}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating cook button */}
      {meal.instructions.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/cook', params: { id: meal.id } })}
        >
          <Ionicons name="restaurant-outline" size={18} color="#FFFFFF" />
          <Text style={styles.fabText}>Cook</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginLeft: 20,
    marginBottom: 4,
  },

  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 28,
  },
  heroEmoji: {
    fontSize: 72,
    lineHeight: 88,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AAAAAA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#AAAAAA',
    lineHeight: 22,
    textAlign: 'center',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#AAAAAA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Dietary tags
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555555',
  },

  // Ingredients
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  ingredientList: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 18,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  ingredientRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111111',
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAAAAA',
    marginLeft: 12,
  },

  // Floating cook button
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingHorizontal: 32,
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
