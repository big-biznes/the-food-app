import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Meal, EatingOutEntry, MealType } from '@/data/meals';

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

type Props =
  | { meal: Meal; onRefresh: () => void }
  | { meal: EatingOutEntry; onRefresh?: never };

export default function MealCard({ meal, onRefresh }: Props) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  function handleRefresh() {
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start(() => {
      spinAnim.setValue(0);
      onRefresh?.();
    });
  }

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if ('isEatingOut' in meal) {
    return (
      <View style={[styles.card, styles.cardEatingOut]}>
        <View style={styles.topRow}>
          <View style={styles.typeRow}>
            <Ionicons name="moon-outline" size={13} color="#888888" />
            <Text style={[styles.typeLabel, styles.typeLabelLight]}>Dinner</Text>
          </View>
          <View style={styles.eatingOutBadge}>
            <Text style={styles.eatingOutBadgeText}>Eating out</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.emoji}>{meal.emoji}</Text>
          <View style={styles.textBlock}>
            <Text style={[styles.name, styles.nameLight]}>{meal.name}</Text>
            <Text style={[styles.description, styles.descriptionLight]}>
              {meal.description}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push({ pathname: '/details', params: { id: meal.id } })}
    >
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

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{meal.prepTime} min</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{meal.calories} kcal</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  cardEatingOut: {
    backgroundColor: '#111111',
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
  typeLabelLight: {
    color: '#666666',
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eatingOutBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  eatingOutBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  nameLight: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 19,
  },
  descriptionLight: {
    color: '#666666',
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
