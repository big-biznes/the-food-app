import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Meal, EatingOutEntry, MealType } from '@/data/meals';
import { Colors, tileColor } from '@/constants/theme';
import { font } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const TYPE_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

type Size = 'tile' | 'hero';

type Props =
  | {
      meal: Meal;
      size?: Size;
      onRefresh?: () => void;
      dayLabel?: string;
      selected?: boolean;
      onSwapSelect?: () => void;
      onCardTap?: () => void;
    }
  | {
      meal: EatingOutEntry;
      size?: Size;
      onRefresh?: never;
      dayLabel?: string;
      selected?: never;
      onSwapSelect?: never;
      onCardTap?: never;
    };

function kicker(dayLabel: string | undefined, typeLabel: string) {
  return dayLabel ? `${dayLabel}, ${typeLabel.toLowerCase()}` : typeLabel;
}

export default function MealCard({
  meal,
  size = 'tile',
  onRefresh,
  dayLabel,
  selected,
  onSwapSelect,
  onCardTap,
}: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotion();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const hero = size === 'hero';

  function handleRefresh() {
    if (!onRefresh) return;
    if (reducedMotion) {
      onRefresh();
      return;
    }
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start(() => {
      spinAnim.setValue(0);
      onRefresh();
    });
  }

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if ('isEatingOut' in meal) {
    return (
      <View
        style={[styles.card, styles.cardInk, hero && styles.cardHero]}
        accessible
        accessibilityLabel={`${kicker(dayLabel, 'Dinner')}, eating out: ${meal.name}. ${meal.description}`}
      >
        <View style={styles.topRow}>
          <Text style={[styles.kicker, styles.onInkMuted]}>{kicker(dayLabel, 'Dinner')}</Text>
          <View style={styles.inkBadge}>
            <Text style={styles.inkBadgeText}>Eating out</Text>
          </View>
        </View>
        <Text style={[styles.emoji, hero && styles.emojiHero]}>{meal.emoji}</Text>
        <Text style={[styles.name, hero && styles.nameHero, styles.onInk]} numberOfLines={2}>
          {meal.name}
        </Text>
        <Text style={[styles.meta, styles.onInkMuted]} numberOfLines={2}>
          {meal.description}
        </Text>
      </View>
    );
  }

  const typeLabel = TYPE_LABEL[meal.mealType];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: tileColor(c, meal.mealType) },
        hero && styles.cardHero,
        selected && styles.cardSelected,
      ]}
      activeOpacity={0.85}
      onPress={() => {
        if (onCardTap) {
          onCardTap();
          return;
        }
        router.push({ pathname: '/details', params: { id: meal.id } });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${kicker(dayLabel, typeLabel)}: ${meal.name}, ${meal.prepTime} minutes, ${meal.calories} kilocalories`}
      accessibilityHint={onCardTap ? 'Swaps with the selected meal' : 'Opens the recipe'}
      accessibilityState={{ selected: Boolean(selected) }}
    >
      <View style={styles.topRow}>
        <Text style={styles.kicker} numberOfLines={1}>
          {kicker(dayLabel, typeLabel)}
        </Text>
        <View style={styles.actionRow}>
          {onSwapSelect !== undefined && (
            <TouchableOpacity
              style={[styles.actionBtn, selected && styles.actionBtnSelected]}
              onPress={onSwapSelect}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={selected ? 'Cancel swap' : 'Swap this meal'}
              accessibilityState={{ selected: Boolean(selected) }}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={15}
                color={selected ? tileColor(c, meal.mealType) : c.onTile}
              />
            </TouchableOpacity>
          )}
          {onRefresh && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleRefresh}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Replace with another meal"
            >
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <Ionicons name="refresh" size={15} color={c.onTile} />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={[styles.emoji, hero && styles.emojiHero]}>{meal.emoji}</Text>
      <Text style={[styles.name, hero && styles.nameHero]} numberOfLines={hero ? 3 : 2}>
        {meal.name}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {meal.prepTime} min, {meal.calories} kcal
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      padding: 16,
      gap: 6,
      minHeight: 150,
    },
    cardHero: {
      padding: 20,
      minHeight: 240,
      gap: 8,
    },
    cardInk: {
      backgroundColor: c.primary,
    },
    cardSelected: {
      borderWidth: 2,
      borderColor: c.onTile,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 32,
    },
    kicker: {
      flex: 1,
      fontFamily: font.semibold,
      fontSize: 13,
      lineHeight: 17,
      color: c.onTile,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.onTile,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionBtnSelected: {
      backgroundColor: c.onTile,
    },
    inkBadge: {
      backgroundColor: c.primarySurface,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    inkBadgeText: {
      fontFamily: font.semibold,
      fontSize: 12,
      color: c.onPrimary,
    },
    emoji: {
      fontSize: 36,
      lineHeight: 44,
      marginTop: 4,
    },
    emojiHero: {
      fontSize: 64,
      lineHeight: 76,
      marginTop: 8,
    },
    name: {
      fontFamily: font.extrabold,
      fontSize: 19,
      lineHeight: 21,
      letterSpacing: -0.4,
      color: c.onTile,
      marginTop: 'auto',
    },
    nameHero: {
      fontSize: 32,
      lineHeight: 33,
      letterSpacing: -1,
    },
    meta: {
      fontFamily: font.medium,
      fontSize: 13,
      lineHeight: 17,
      color: c.onTileMuted,
      fontVariant: ['tabular-nums'],
    },
    onInk: { color: c.onPrimary },
    onInkMuted: { color: c.onPrimaryMuted },
  });
