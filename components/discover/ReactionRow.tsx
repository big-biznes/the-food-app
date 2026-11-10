import { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '@/data/meals';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

import { font } from '@/constants/type';
type Props = {
  meal: Meal;
  liked: boolean;
  onToggle: () => void;
};

export default function ReactionRow({ meal, liked, onToggle }: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function handleToggle() {
    if (!reducedMotion) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }
    onToggle();
  }

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
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={[styles.btn, liked && styles.btnActive]}
          onPress={handleToggle}
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
      </Animated.View>
    </View>
  );
}

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
