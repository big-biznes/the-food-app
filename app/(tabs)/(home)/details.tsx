import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { findMeal, MealType, Ingredient, formatIngredient } from '@/data/meals';
import { DietaryRestriction } from '@/contexts/AuthContext';
import { Colors, tileColor } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

import { font, type } from '@/constants/type';
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
  if (ing.label) return ing.label;
  if (!ing.unit) {
    return ing.amount > 1 ? `x${ing.amount}` : '';
  }
  if (ing.unit === 'g' || ing.unit === 'ml' || ing.unit === 'kg' || ing.unit === 'l') {
    return `${ing.amount}${ing.unit}`;
  }
  return `${ing.amount} ${ing.unit}`;
}

export default function DetailsScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // `from: 'discover'` when opened from a Discover card: Cook then stays in the Discover tab.
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const router = useRouter();
  const meal = findMeal(id);

  if (!meal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={22} color={c.text} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: tileColor(c, meal.mealType) }]}>
          <View style={styles.typeRow}>
            <Ionicons name={TYPE_ICON[meal.mealType]} size={14} color={c.onTile} />
            <Text style={styles.typeLabel}>{TYPE_LABEL[meal.mealType]}</Text>
          </View>
          <Text style={styles.heroEmoji}>{meal.emoji}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {meal.name}
          </Text>
          <Text style={styles.description}>{meal.description}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color={c.text} />
            <Text style={styles.statValue}>{meal.prepTime} min</Text>
            <Text style={styles.statLabel}>Prep time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={20} color={c.text} />
            <Text style={styles.statValue}>{meal.calories}</Text>
            <Text style={styles.statLabel}>Calories (approx.)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={20} color={c.text} />
            <Text style={styles.statValue}>{meal.ingredients.length}</Text>
            <Text style={styles.statLabel}>Ingredients</Text>
          </View>
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{meal.proteinG}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{meal.carbsG}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{meal.fatG}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{meal.fiberG}g</Text>
            <Text style={styles.macroLabel}>Fiber</Text>
          </View>
        </View>

        {/* Extra nutrition */}
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{meal.sugarG}g</Text>
            <Text style={styles.macroLabel}>Sugar</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{meal.sodiumMg}mg</Text>
            <Text style={styles.macroLabel}>Sodium</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{meal.difficulty}</Text>
            <Text style={styles.macroLabel}>Difficulty</Text>
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
          {meal.seasonings && meal.seasonings.length > 0 && (
            <Text style={styles.footnote}>From the cupboard: {meal.seasonings.join(', ')}</Text>
          )}
          <Text style={styles.footnote}>
            Nutrition is per serving, estimated from the raw ingredient amounts above. Seasonings are not counted.
          </Text>
        </View>
      </ScrollView>

      {/* Floating cook button */}
      {meal.instructions.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: from === 'discover' ? '/cook-meal' : '/cook', params: { id: meal.id } })
          }
        >
          <Ionicons name="restaurant-outline" size={18} color={c.onPrimary} />
          <Text style={styles.fabText}>Cook</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginLeft: 20,
    marginBottom: 4,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Hero
  hero: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 6,
  },
  heroEmoji: {
    fontSize: 64,
    lineHeight: 76,
    marginTop: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.onTile,
  },
  title: {
    ...type.display,
    fontSize: 34,
    lineHeight: 35,
    color: c.onTile,
  },
  description: {
    ...type.body,
    fontSize: 15,
    lineHeight: 21,
    color: c.onTileMuted,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: c.surface,
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
    backgroundColor: c.surfaceAlt,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: font.bold, fontWeight: '700',
    color: c.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: font.medium, fontWeight: '500',
    color: c.textMuted,
    },

  // Macros row
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: c.surface,
    borderRadius: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  macroDivider: {
    width: 1,
    backgroundColor: c.surfaceAlt,
    marginVertical: 4,
  },
  macroValue: {
    fontSize: 16,
    fontFamily: font.bold, fontWeight: '700',
    color: c.text,
    letterSpacing: -0.2,
  },
  macroLabel: {
    fontSize: 11,
    fontFamily: font.medium, fontWeight: '500',
    color: c.textMuted,
    },

  // Dietary tags
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  tag: {
    backgroundColor: c.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagText: {
    fontSize: 13,
    fontFamily: font.medium, fontWeight: '500',
    color: c.textSecondary,
  },

  // Ingredients
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: font.bold, fontWeight: '700',
    color: c.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.regular,
    color: c.textMuted,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  ingredientList: {
    backgroundColor: c.surface,
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
    borderTopColor: c.border,
  },
  ingredientName: {
    fontSize: 15,
    fontFamily: font.medium, fontWeight: '500',
    color: c.text,
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 14,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.textMuted,
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
    backgroundColor: c.primary,
    borderRadius: 100,
    paddingHorizontal: 32,
    paddingVertical: 17,
  },
  fabText: {
    fontSize: 16,
    fontFamily: font.bold, fontWeight: '700',
    color: c.onPrimary,
    letterSpacing: -0.2,
  },
});
