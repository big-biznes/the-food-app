import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MEALS, Meal } from '@/data/meals';
import { useLikes } from '@/contexts/LikesContext';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.10;
const EXPERT_SWIPE_COUNT = 3;

// Height of the actions bar (paddingTop 8 + button 64 + paddingBottom 28)
const ACTIONS_BAR_HEIGHT = 100;

// ── Swipeable card ────────────────────────────────────────────────────────────

type SwipeCardProps = {
  meal: Meal;
  nextMeal: Meal | undefined;
  expertMode: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
};

function SwipeCard({ meal, nextMeal, expertMode, onSwipe }: SwipeCardProps) {
  const position = useRef(new Animated.ValueXY()).current;

  function swipeOff(direction: 'left' | 'right') {
    const toX = direction === 'right' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: 240,
      useNativeDriver: false,
    }).start(() => onSwipe(direction));
  }

  const swipeOffRef = useRef(swipeOff);
  swipeOffRef.current = swipeOff;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          swipeOffRef.current('right');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          swipeOffRef.current('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 6,
          }).start();
        }
      },
    }),
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextScale = position.x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  return (
    <>
      {nextMeal && (
        <Animated.View
          style={[
            styles.card,
            expertMode && styles.cardExpert,
            styles.cardBehind,
            { transform: [{ scale: nextScale }] },
          ]}
          pointerEvents="none"
        >
          <CardContent meal={nextMeal} />
        </Animated.View>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          expertMode && styles.cardExpert,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
            ],
          },
        ]}
      >
        <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
          <Text style={styles.stampLikeText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
          <Text style={styles.stampNopeText}>NOPE</Text>
        </Animated.View>
        <CardContent meal={meal} />
      </Animated.View>
    </>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { user, updateProfile } = useAuth();
  const { like, dislike, likedIds } = useLikes();

  const expertMode = user?.discoverExpertMode ?? false;

  // 1 = buttons fully visible, 0 = buttons gone (expert mode)
  const expertAnim = useRef(
    new Animated.Value(expertMode ? 0 : 1),
  ).current;

  // If already in expert mode on mount, snap to 0 immediately (no animation needed)
  useEffect(() => {
    if (expertMode) {
      expertAnim.setValue(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedActionsHeight = expertAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ACTIONS_BAR_HEIGHT],
  });

  // Consecutive gesture-only swipes this session (resets on any button tap)
  const swipeOnlyStreak = useRef(0);

  const initialDeck = useMemo<Meal[]>(() => {
    const restrictions = user?.restrictions ?? [];
    const compatible = MEALS.filter(m =>
      restrictions.every(r => m.dietaryTags.includes(r)),
    );
    return [...compatible].sort(() => Math.random() - 0.5);
  }, [user?.restrictions]);

  const [index, setIndex] = useState(0);

  const current = initialDeck[index];
  const next = initialDeck[index + 1];

  function handleGestureSwipe(direction: 'left' | 'right', meal: Meal) {
    if (direction === 'right') like(meal.id);
    else dislike(meal.id);
    setIndex(i => i + 1);

    if (!expertMode) {
      swipeOnlyStreak.current += 1;
      if (swipeOnlyStreak.current >= EXPERT_SWIPE_COUNT) {
        updateProfile({ discoverExpertMode: true });
        // Animate immediately — don't wait for the profile state update cycle
        Animated.timing(expertAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    }
  }

  function handleButtonSwipe(direction: 'left' | 'right', meal: Meal) {
    if (direction === 'right') like(meal.id);
    else dislike(meal.id);
    setIndex(i => i + 1);
    swipeOnlyStreak.current = 0;
  }

  function resetDeck() {
    setIndex(0);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subText}>
          Swipe right to save, left to skip · {likedIds.length} liked
        </Text>
      </View>

      <View style={styles.deckArea}>
        {!current && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>You've seen them all</Text>
            <Text style={styles.emptyHint}>
              {likedIds.length > 0
                ? "We'll work your favourites into your next plan."
                : 'Like a few to shape your next plan.'}
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={resetDeck} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Start over</Text>
            </TouchableOpacity>
          </View>
        )}

        {current && (
          <SwipeCard
            key={current.id}
            meal={current}
            nextMeal={next}
            expertMode={expertMode}
            onSwipe={(dir) => handleGestureSwipe(dir, current)}
          />
        )}
      </View>

      {/* Actions bar — always in the tree; animates height + opacity to zero in expert mode */}
      <Animated.View
        style={[
          styles.actionsWrapper,
          {
            opacity: expertAnim,
            maxHeight: animatedActionsHeight,
          },
        ]}
        pointerEvents={expertMode ? 'none' : 'auto'}
      >
        {current && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPass]}
              onPress={() => handleButtonSwipe('left', current)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={28} color="#111111" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionLike]}
              onPress={() => handleButtonSwipe('right', current)}
              activeOpacity={0.85}
            >
              <Ionicons name="heart" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

function CardContent({ meal }: { meal: Meal }) {
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
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 8 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  subText: { fontSize: 15, color: '#AAAAAA', marginTop: 4 },

  deckArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  card: {
    position: 'absolute',
    width: SCREEN_W - 48,
    height: '92%',
    maxHeight: 560,
    backgroundColor: '#F5F5F5',
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
  },
  cardExpert: {
    maxHeight: undefined,
  },
  cardBehind: {
    backgroundColor: '#F0F0F0',
  },
  cardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  emojiWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 140, lineHeight: 160 },
  textBlock: { gap: 10 },
  mealName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  mealDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
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

  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 3,
    zIndex: 2,
  },
  stampLike: {
    right: 24,
    borderColor: '#111111',
    transform: [{ rotate: '14deg' }],
  },
  stampNope: {
    left: 24,
    borderColor: '#AAAAAA',
    transform: [{ rotate: '-14deg' }],
  },
  stampLikeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: 1,
  },
  stampNopeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1,
  },

  actionsWrapper: {
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    paddingBottom: 28,
    paddingTop: 8,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  actionPass: { backgroundColor: '#F5F5F5' },
  actionLike: { backgroundColor: '#111111' },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 4 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.2,
  },
  emptyHint: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  resetBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
