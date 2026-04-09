import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '@/data/meals';

type Props = { meal: Meal };

export default function CardContent({ meal }: Props) {
  return (
    <View style={styles.cardInner}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{meal.emoji}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.mealName} numberOfLines={2}>
          {meal.name}
        </Text>
        <Text style={styles.mealDescription} numberOfLines={4}>
          {meal.description}
        </Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={12} color="#666666" />
            <Text style={styles.badgeText}>{meal.prepTime} min</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="flame-outline" size={12} color="#666666" />
            <Text style={styles.badgeText}>{meal.calories} kcal</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {meal.mealType[0].toUpperCase() + meal.mealType.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardInner: { flex: 1, justifyContent: 'space-between' },
  emojiWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 140, lineHeight: 160 },
  textBlock: { gap: 10 },
  mealName: { fontSize: 24, fontWeight: '700', color: '#111111', letterSpacing: -0.3 },
  mealDescription: { fontSize: 14, color: '#888888', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBEBEB',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '500', color: '#666666' },
});
