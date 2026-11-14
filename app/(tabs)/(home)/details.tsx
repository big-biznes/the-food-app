import { useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { findMeal, MealType } from '@/data/meals';
import { canLeaveOut } from '@/data/portions';
import { usePlan } from '@/contexts/PlanContext';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';
import { useShoppingListSync } from '@/hooks/useShoppingListSync';
import { useMealPrep } from '@/hooks/usePrep';
import { ingredientAmount, ingredientName } from '@/lib/localize';
import { useTranslation } from 'react-i18next';
import { Colors, tileColor } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { usePersonalMeal, useTargets } from '@/hooks/usePortions';

import { font, type } from '@/constants/type';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_ICON: Record<MealType, IoniconName> = {
  breakfast: 'sunny-outline',
  lunch: 'partly-sunny-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

export default function DetailsScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t, i18n } = useTranslation();
  const names = (list: { name: string }[]) => list.map(i => ingredientName(i.name)).join(', ');
  // `from: 'discover'` when opened from a Discover card: Cook then stays in the Discover tab.
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const router = useRouter();
  // The recipe with amounts and nutrition sized for this user.
  const recipe = findMeal(id);
  const meal = usePersonalMeal(recipe);
  const targets = useTargets();
  // What was, or could be, prepared ahead for this meal (only for a meal of the week plan).
  const prep = useMealPrep(recipe);
  // A meal of the week plan can be edited: ingredients ticked off are left out of it.
  const { inPlan, toggleIngredient, without } = usePlan();
  // After an edit here that the shopping list does not have yet, offer to update the list.
  const { stale, update } = useShoppingListSync();
  const toastRef = useRef<ConfirmToastHandle>(null);
  const updateRef = useRef(update);
  updateRef.current = update;
  const edits = recipe ? without[recipe.id] : undefined;
  const shownFor = useRef(edits);
  useEffect(() => {
    if (shownFor.current === edits) return;
    shownFor.current = edits;
    if (!stale) {
      // The edit was undone: there is nothing to update any more.
      toastRef.current?.dismiss();
      return;
    }
    toastRef.current?.show({
      message: t('list.outOfDate'),
      actionLabel: t('common.update'),
      icon: 'cart',
      doneMessage: t('list.updated'),
      onAction: () => updateRef.current(),
    });
  }, [edits, stale, t]);
  const editable = Boolean(recipe && inPlan(recipe.id));
  // The recipe's own order, so a row stays where it is when it is ticked off.
  const rows = meal && recipe
    ? recipe.ingredients.map(base => {
        const kept = meal.ingredients.find(i => i.name === base.name);
        return { ing: kept ?? meal.removed?.find(i => i.name === base.name) ?? base, kept: Boolean(kept) };
      })
    : [];

  if (!meal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <PressableScale style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </PressableScale>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Back button */}
      <PressableScale style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={22} color={c.text} />
      </PressableScale>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: tileColor(c, meal.mealType) }]}>
          <View style={styles.typeRow}>
            <Ionicons name={TYPE_ICON[meal.mealType]} size={14} color={c.onTile} />
            <Text style={styles.typeLabel}>{t(`meals.${meal.mealType}`)}</Text>
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
            <Text style={styles.statValue}>{t('common.minutes', { count: prep?.time ?? meal.prepTime })}</Text>
            <Text style={styles.statLabel}>{prep && prep.done.length > 0 ? t('details.withPrep') : t('details.time')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={20} color={c.text} />
            <Text style={styles.statValue}>{meal.calories}</Text>
            <Text style={styles.statLabel}>{t('details.calories')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={20} color={c.text} />
            <Text style={styles.statValue}>{meal.ingredients.length}</Text>
            <Text style={styles.statLabel}>{t('details.ingredients')}</Text>
          </View>
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{t('details.grams', { count: meal.proteinG })}</Text>
            <Text style={styles.macroLabel}>{t('details.protein')}</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{t('details.grams', { count: meal.carbsG })}</Text>
            <Text style={styles.macroLabel}>{t('details.carbs')}</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{t('details.grams', { count: meal.fatG })}</Text>
            <Text style={styles.macroLabel}>{t('details.fat')}</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{t('details.grams', { count: meal.fiberG })}</Text>
            <Text style={styles.macroLabel}>{t('details.fiber')}</Text>
          </View>
        </View>

        {/* Extra nutrition */}
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{t('details.grams', { count: meal.sugarG })}</Text>
            <Text style={styles.macroLabel}>{t('details.sugar')}</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{t('details.milligrams', { count: meal.sodiumMg })}</Text>
            <Text style={styles.macroLabel}>{t('details.sodium')}</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{i18n.exists(`difficulty.${meal.difficulty}`) ? t(`difficulty.${meal.difficulty}` as 'difficulty.quick') : meal.difficulty}</Text>
            <Text style={styles.macroLabel}>{t('details.difficulty')}</Text>
          </View>
        </View>

        {/* Dietary tags */}
        {meal.dietaryTags.length > 0 && (
          <View style={styles.tagRow}>
            {meal.dietaryTags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag === 'nut-allergy' ? t('dietTag.nut-allergy') : t(`diet.${tag}`)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('details.ingredients')}</Text>
          {editable && (
            <Text style={styles.editHint}>{t('details.editHint')}</Text>
          )}
          <View style={styles.ingredientList}>
            {rows.map(({ ing, kept }, i) => {
              const amount = ingredientAmount(ing);
              const name = ingredientName(ing.name);
              const rowStyle = [styles.ingredientRow, i > 0 && styles.ingredientRowBorder];
              const content = (
                <>
                  <Text style={[styles.ingredientName, !kept && styles.ingredientOff]}>{name}</Text>
                  {kept && amount ? <Text style={styles.ingredientAmount}>{amount}</Text> : null}
                  {!kept && <Text style={styles.ingredientAmount}>{t('details.leftOut')}</Text>}
                </>
              );
              if (!editable) {
                return (
                  <View key={ing.name} style={rowStyle}>
                    {content}
                  </View>
                );
              }
              // The dish is built around its main ingredient, so that one stays.
              // Asked of the recipe as written: the edited meal no longer lists what was left out.
              const locked = !recipe || !canLeaveOut(recipe, ing.name);
              return (
                <PressableScale
                  key={ing.name}
                  style={rowStyle}
                  onPress={() => toggleIngredient(meal.id, ing.name)}
                  disabled={locked}
                  activeOpacity={0.7}
                  scaleTo={1}
                  accessibilityRole="checkbox"
                  accessibilityLabel={amount ? `${name}, ${amount}` : name}
                  accessibilityHint={locked ? t('details.mainLocked') : undefined}
                  accessibilityState={{ checked: kept, disabled: locked }}
                >
                  <View style={[styles.checkbox, kept && styles.checkboxOn, locked && styles.checkboxLocked]}>
                    {kept && <Ionicons name={locked ? 'lock-closed' : 'checkmark'} size={locked ? 12 : 16} color={c.onPrimary} />}
                  </View>
                  {content}
                </PressableScale>
              );
            })}
          </View>
          {meal.removed && (
            <Text style={styles.footnote}>
              {t('details.leftOutNote', { count: meal.removed.length, items: names(meal.removed) })}
            </Text>
          )}
          {prep && prep.done.length > 0 && (
            <Text style={styles.footnote}>
              {t('details.prepped', {
                items: names(prep.done.map(task => ({ name: task.ingredient }))),
                saved: meal.prepTime - prep.time,
                total: meal.prepTime,
              })}
            </Text>
          )}
          {prep && prep.done.length === 0 && prep.bestTime < meal.prepTime && (
            <Text style={styles.footnote}>
              {t('details.prepAhead', {
                items: names(prep.tasks.map(task => ({ name: task.ingredient }))),
                best: prep.bestTime,
                total: meal.prepTime,
              })}
            </Text>
          )}
          {meal.seasonings && meal.seasonings.length > 0 && (
            <Text style={styles.footnote}>{t('details.cupboard', { items: meal.seasonings.join(', ') })}</Text>
          )}
          {targets && meal.portion != null && (
            <Text style={styles.footnote}>
              {meal.portion === 1
                ? t('details.fitsDay', { kcal: targets.kcal.toLocaleString(i18n.language) })
                : t('details.sized', { portion: meal.portion, kcal: targets.kcal.toLocaleString(i18n.language) })}
            </Text>
          )}
          <Text style={styles.footnote}>{t('details.nutritionNote')}</Text>
        </View>
      </ScrollView>

      <ConfirmToast ref={toastRef} message={t('list.updated')} />

      {/* Floating cook button */}
      {meal.instructions.length > 0 && (
        <PressableScale
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: from === 'discover' ? '/cook-meal' : '/cook', params: { id: meal.id } })
          }
        >
          <Ionicons name="restaurant-outline" size={18} color={c.onPrimary} />
          <Text style={styles.fabText}>{t('details.cook')}</Text>
        </PressableScale>
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
  ingredientOff: {
    color: c.textMuted,
    textDecorationLine: 'line-through',
  },
  editHint: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.regular,
    color: c.textMuted,
    marginTop: -6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: c.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxOn: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  checkboxLocked: {
    backgroundColor: c.textFaint,
    borderColor: c.textFaint,
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
