import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '@/data/meals';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

import { font } from '@/constants/type';
type Props = {
  meal: Meal;
  liked: boolean;
  /** Receives the meal id; pass a stable function so memoized rows don't all re-render. */
  onToggle: (mealId: string) => void;
};

function ReactionRow({ meal, liked, onToggle }: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const mealType = meal.mealType[0].toUpperCase() + meal.mealType.slice(1);

  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{meal.emoji}</Text>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={styles.meta}>
          {mealType}, {meal.prepTime} min
        </Text>
      </View>
      {/* No fade on toggle: the heart and the row's section change immediately. */}
      <TouchableOpacity
        style={[styles.btn, liked && styles.btnActive]}
        onPress={() => onToggle(meal.id)}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={liked ? `Unlike ${meal.name}` : `Like ${meal.name}`}
        accessibilityState={{ selected: liked }}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={18}
          color={liked ? c.onPrimary : c.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

// Memoized so toggling one meal doesn't re-render every other row.
export default memo(ReactionRow);

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    emoji: { fontFamily: font.regular, fontSize: 28, width: 36, textAlign: 'center' },
    text: { flex: 1, gap: 2 },
    name: { fontSize: 15, fontFamily: font.semibold, fontWeight: '600', color: c.text },
    meta: { fontFamily: font.regular, fontSize: 12, color: c.textMuted, fontVariant: ['tabular-nums'] },
    btn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnActive: { backgroundColor: c.primary },
  });
