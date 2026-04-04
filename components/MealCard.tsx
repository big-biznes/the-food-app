import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal, MealType } from '@/data/meals';

const TYPE_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_ICON: Record<MealType, IoniconName> = {
  breakfast: 'sunny-outline',
  lunch: 'partly-sunny-outline',
  dinner: 'moon-outline',
};

type Props = {
  meal: Meal;
  onRefresh: () => void;
};

export default function MealCard({ meal, onRefresh }: Props) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  function handleRefresh() {
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

  return (
    <View style={styles.card}>
      {/* Top row: meal type label + refresh button */}
      <View style={styles.topRow}>
        <View style={styles.typeRow}>
          <Ionicons name={TYPE_ICON[meal.mealType]} size={13} color="#BBBBBB" />
          <Text style={styles.typeLabel}>{TYPE_LABEL[meal.mealType]}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="refresh" size={15} color="#555555" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Body: emoji + name + description */}
      <View style={styles.body}>
        <Text style={styles.emoji}>{meal.emoji}</Text>
        <View style={styles.textBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {meal.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {meal.description}
          </Text>
        </View>
      </View>

      {/* Footer badges */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{meal.prepTime} min</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{meal.calories} kcal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BBBBBB',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emoji: {
    fontSize: 38,
    lineHeight: 46,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 19,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#EBEBEB',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
});
