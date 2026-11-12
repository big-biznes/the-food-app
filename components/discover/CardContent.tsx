import { usePersonalMeal } from '@/hooks/usePortions';
import { View, Text, StyleSheet } from 'react-native';
import { Meal } from '@/data/meals';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useThemedStyles } from '@/hooks/useTheme';

type Props = { meal: Meal };

const TYPE_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' } as const;

export default function CardContent({ meal }: Props) {
  const styles = useThemedStyles(makeStyles);
  // Calories for the portion this user will cook.
  const personal = usePersonalMeal(meal);
  return (
    <View style={styles.cardInner}>
      <Text style={styles.kicker}>{TYPE_LABEL[meal.mealType]}</Text>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{meal.emoji}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.mealName} numberOfLines={3}>
          {meal.name}
        </Text>
        <Text style={styles.mealDescription} numberOfLines={3}>
          {meal.description}
        </Text>
        <Text style={styles.meta}>
          {meal.prepTime} min, {personal.calories} kcal
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    cardInner: { flex: 1 },
    kicker: { fontFamily: font.semibold, fontSize: 14, lineHeight: 18, color: c.onTile },
    emojiWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 128, lineHeight: 148 },
    textBlock: { gap: 8 },
    mealName: { ...type.title, fontSize: 30, lineHeight: 31, letterSpacing: -0.9, color: c.onTile },
    mealDescription: { ...type.body, fontSize: 15, lineHeight: 21, color: c.onTileMuted },
    meta: { fontFamily: font.medium, fontSize: 14, lineHeight: 18, color: c.onTile, fontVariant: ['tabular-nums'] },
  });
