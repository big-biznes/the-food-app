import { usePersonalMeal } from '@/hooks/usePortions';
import { useMealPrep } from '@/hooks/usePrep';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, View, Text, StyleSheet, Animated} from 'react-native';
import PressableScale from '@/components/PressableScale';
import * as Haptics from 'expo-haptics';
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
  snack: 'Snack',
};

type Size = 'tile' | 'hero';

/**
 * What a tap does on a card that cannot be swapped with the selected meal. Off: nothing,
 * the greyed-out card says enough. On: the card shakes and flashes red, and the home
 * screen explains the rule after a few wrong taps in a row.
 */
const SWAP_REJECT_FEEDBACK = false;
/** How faded a card is while it cannot be swapped with the selected meal. */
const BLOCKED_OPACITY = 0.4;

type Props =
  | {
      meal: Meal;
      size?: Size;
      onRefresh?: () => void;
      dayLabel?: string;
      selected?: boolean;
      onSwapSelect?: () => void;
      onCardTap?: () => void;
      /** Set while a swap is being picked and this card can't take part: a tap shakes it and says why. */
      swapBlockedReason?: string;
    }
  | {
      meal: EatingOutEntry;
      size?: Size;
      onRefresh?: never;
      dayLabel?: string;
      selected?: never;
      onSwapSelect?: never;
      onCardTap?: never;
      swapBlockedReason?: never;
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
  swapBlockedReason,
}: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Calories for the portion this user will cook.
  const personal = usePersonalMeal('isEatingOut' in meal ? undefined : meal);
  // Shorter when its chopping or its rice was done ahead (the prep list of its part).
  const prep = useMealPrep('isEatingOut' in meal ? undefined : meal);
  const reducedMotion = useReducedMotion();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const hero = size === 'hero';
  // 0 → 1 over one "not allowed" shake; drives both the sideways shake and the red flash.
  const rejectAnim = useRef(new Animated.Value(0)).current;

  // Greyed out while a swap is being picked and this card cannot take part in it.
  const blocked = Boolean(swapBlockedReason);
  const dimAnim = useRef(new Animated.Value(blocked ? BLOCKED_OPACITY : 1)).current;
  useEffect(() => {
    const toValue = blocked ? BLOCKED_OPACITY : 1;
    if (reducedMotion) {
      dimAnim.setValue(toValue);
      return;
    }
    // JS driver, like the shake: both are on the view that holds the card's buttons.
    Animated.timing(dimAnim, { toValue, duration: 180, useNativeDriver: false }).start();
  }, [blocked, dimAnim, reducedMotion]);

  function reject(reason: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    AccessibilityInfo.announceForAccessibility(reason);
    rejectAnim.setValue(0);
    // JS driver: the animated container holds buttons (see the app's performance conventions).
    Animated.timing(rejectAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }

  const shakeX = reducedMotion
    ? 0
    : rejectAnim.interpolate({
        inputRange: [0, 0.15, 0.35, 0.55, 0.75, 1],
        outputRange: [0, -8, 7, -5, 3, 0],
      });
  const flashOpacity = rejectAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.45, 0],
  });

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
    <Animated.View style={{ opacity: dimAnim, transform: [{ translateX: shakeX }] }}>
      <PressableScale
        style={[
          styles.card,
          { backgroundColor: tileColor(c, meal.mealType) },
          hero && styles.cardHero,
          selected && styles.cardSelected,
        ]}
        activeOpacity={0.9}
        scaleTo={0.98}
        onPress={() => {
          if (swapBlockedReason) {
            if (!SWAP_REJECT_FEEDBACK) return;
            reject(swapBlockedReason);
            // Still reported, so the screen can count repeated wrong taps.
            onCardTap?.();
            return;
          }
          if (onCardTap) {
            onCardTap();
            return;
          }
          router.push({ pathname: '/details', params: { id: meal.id } });
        }}
        accessibilityRole="button"
        accessibilityLabel={`${kicker(dayLabel, typeLabel)}: ${meal.name}, ${prep?.time ?? meal.prepTime} minutes${
          prep && prep.done.length > 0 ? ' with your prep' : ''
        }, ${(personal ?? meal).calories} kilocalories${
          personal?.removed ? `, without ${personal.removed.map(i => i.name).join(', ')}` : ''
        }`}
        accessibilityHint={swapBlockedReason ?? (onCardTap ? 'Swaps with the selected meal' : 'Opens the recipe')}
        // Disabled also switches the touch off, so only when a tap is meant to do nothing.
        accessibilityState={{ selected: Boolean(selected), disabled: blocked && !SWAP_REJECT_FEEDBACK }}
      >
        <View style={styles.topRow}>
          <Text style={styles.kicker} numberOfLines={1}>
            {kicker(dayLabel, typeLabel)}
          </Text>
          <View style={styles.actionRow}>
            {onSwapSelect !== undefined && (
              <PressableScale
                style={[styles.actionBtn, selected && styles.actionBtnSelected]}
                onPress={onSwapSelect}
                activeOpacity={0.7}
                scaleTo={0.88}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={selected ? 'Cancel swap' : 'Swap this meal'}
                accessibilityState={{ selected: Boolean(selected) }}
              >
                <Ionicons name="swap-horizontal" size={19} color={selected ? tileColor(c, meal.mealType) : c.onTile} />
              </PressableScale>
            )}
            {onRefresh && (
              <PressableScale
                style={styles.actionBtn}
                onPress={handleRefresh}
                activeOpacity={0.7}
                scaleTo={0.88}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Replace with another meal"
              >
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                  <Ionicons name="refresh" size={19} color={c.onTile} />
                </Animated.View>
              </PressableScale>
            )}
          </View>
        </View>

        <Text style={[styles.emoji, hero && styles.emojiHero]}>{meal.emoji}</Text>
        <Text style={[styles.name, hero && styles.nameHero]} numberOfLines={hero ? 3 : 2}>
          {meal.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {prep?.time ?? meal.prepTime} min{prep && prep.done.length > 0 ? ' prepped' : ''}, {(personal ?? meal).calories} kcal
          {personal?.removed ? ', edited' : ''}
        </Text>
        <Animated.View style={[styles.rejectFlash, { opacity: flashOpacity }]} pointerEvents="none" />
      </PressableScale>
    </Animated.View>
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
    // A step lighter than the ink used for buttons and toasts, so those stay
    // distinct when they float over this card.
    cardInk: {
      backgroundColor: c.primarySurface,
    },
    cardSelected: {
      borderWidth: 2,
      borderColor: c.onTile,
    },
    // Red wash over the whole card for a moment when a swap isn't allowed here.
    rejectFlash: {
      ...StyleSheet.absoluteFill,
      borderRadius: 16,
      backgroundColor: c.danger,
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
    // No ring: a soft wash marks it as a button, and the icon is drawn larger so it reads as bold.
    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.onTileWash,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionBtnSelected: {
      backgroundColor: c.onTile,
    },
    inkBadge: {
      backgroundColor: c.primary,
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
    onInkMuted: { color: c.onPrimarySurfaceMuted },
  });
