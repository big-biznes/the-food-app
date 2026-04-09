import { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '@/data/meals';

type Props = {
  meal: Meal;
  liked: boolean;
  onToggle: () => void;
};

export default function ReactionRow({ meal, liked, onToggle }: Props) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function handleToggle() {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle();
  }

  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{meal.emoji}</Text>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={styles.meta}>
          {meal.mealType[0].toUpperCase() + meal.mealType.slice(1)} · {meal.prepTime} min
        </Text>
      </View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={[styles.btn, liked && styles.btnActive]}
          onPress={handleToggle}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? '#FFFFFF' : '#AAAAAA'}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  emoji: { fontSize: 28, width: 36, textAlign: 'center' },
  text: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: '#111111' },
  meta: { fontSize: 12, color: '#AAAAAA' },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: { backgroundColor: '#111111' },
});
