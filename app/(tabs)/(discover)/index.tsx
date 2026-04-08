import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MEALS, Meal } from '@/data/meals';
import { useLikes } from '@/contexts/LikesContext';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.10;
const EXPERT_SWIPE_COUNT = 3;
const ACTIONS_BAR_HEIGHT = 100;

// ── Swipeable card ────────────────────────────────────────────────────────────

type SwipeCardProps = {
  meal: Meal;
  nextMeal: Meal | undefined;
  expertMode: boolean;
  onSwipeCommit: (direction: 'left' | 'right') => void;
  onSwipe: (direction: 'left' | 'right') => void;
};

function SwipeCard({ meal, nextMeal, expertMode, onSwipeCommit, onSwipe }: SwipeCardProps) {
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
  const onSwipeCommitRef = useRef(onSwipeCommit);
  onSwipeCommitRef.current = onSwipeCommit;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          onSwipeCommitRef.current('right');
          swipeOffRef.current('right');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          onSwipeCommitRef.current('left');
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

// ── Reactions sheet ───────────────────────────────────────────────────────────

type ReactionsSheetProps = {
  visible: boolean;
  onClose: () => void;
};

function ReactionsSheet({ visible, onClose }: ReactionsSheetProps) {
  const { likedIds, dislikedIds, toggle } = useLikes();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 0,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
            damping: 22,
            mass: 1,
            stiffness: 220,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SCREEN_H);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: false,
          damping: 22,
          mass: 1,
          stiffness: 220,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 260,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  const likedMeals = useMemo(
    () => MEALS.filter(m => likedIds.includes(m.id)),
    [likedIds],
  );
  const dislikedMeals = useMemo(
    () => MEALS.filter(m => dislikedIds.includes(m.id)),
    [dislikedIds],
  );

  const totalSeen = likedIds.length + dislikedIds.length;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[sheet.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[sheet.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={sheet.card}>
          {/* Drag handle */}
          <View style={sheet.dragZone} {...panResponder.panHandlers} hitSlop={{ top: 24 }}>
            <View style={sheet.handle} />
          </View>

          <View style={sheet.titleRow}>
            <Text style={sheet.title}>Your reactions</Text>
            <Text style={sheet.titleSub}>{totalSeen} seen</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[sheet.scroll, { paddingBottom: insets.bottom + 24 }]}
          >
            {totalSeen === 0 && (
              <View style={sheet.emptyState}>
                <Text style={sheet.emptyEmoji}>👆</Text>
                <Text style={sheet.emptyText}>Start swiping to see your reactions here</Text>
              </View>
            )}

            {likedMeals.length > 0 && (
              <>
                <View style={sheet.sectionHeader}>
                  <Ionicons name="heart" size={13} color="#111111" />
                  <Text style={sheet.sectionLabel}>Liked · {likedMeals.length}</Text>
                </View>
                {likedMeals.map(meal => (
                  <ReactionRow key={meal.id} meal={meal} liked onToggle={() => toggle(meal.id)} />
                ))}
              </>
            )}

            {dislikedMeals.length > 0 && (
              <>
                <View style={[sheet.sectionHeader, likedMeals.length > 0 && sheet.sectionHeaderSpaced]}>
                  <Ionicons name="close-circle" size={13} color="#AAAAAA" />
                  <Text style={[sheet.sectionLabel, sheet.sectionLabelMuted]}>Passed · {dislikedMeals.length}</Text>
                </View>
                {dislikedMeals.map(meal => (
                  <ReactionRow key={meal.id} meal={meal} liked={false} onToggle={() => toggle(meal.id)} />
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

type ReactionRowProps = {
  meal: Meal;
  liked: boolean;
  onToggle: () => void;
};

function ReactionRow({ meal, liked, onToggle }: ReactionRowProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const likedRef = useRef(liked);

  function handleToggle() {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle();
  }

  likedRef.current = liked;

  return (
    <View style={sheet.row}>
      <Text style={sheet.rowEmoji}>{meal.emoji}</Text>
      <View style={sheet.rowText}>
        <Text style={sheet.rowName} numberOfLines={1}>{meal.name}</Text>
        <Text style={sheet.rowMeta}>
          {meal.mealType[0].toUpperCase() + meal.mealType.slice(1)} · {meal.prepTime} min
        </Text>
      </View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={[sheet.toggleBtn, liked && sheet.toggleBtnActive]}
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

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { user, updateProfile } = useAuth();
  const { like, dislike, likedIds, dislikedIds } = useLikes();

  const expertMode = user?.discoverExpertMode ?? false;

  const expertAnim = useRef(new Animated.Value(expertMode ? 0 : 1)).current;

  useEffect(() => {
    if (expertMode) expertAnim.setValue(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedActionsHeight = expertAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ACTIONS_BAR_HEIGHT],
  });

  const swipeOnlyStreak = useRef(0);

  const initialDeck = useMemo<Meal[]>(() => {
    const restrictions = user?.restrictions ?? [];
    const compatible = MEALS.filter(m =>
      restrictions.every(r => m.dietaryTags.includes(r)),
    );
    return [...compatible].sort(() => Math.random() - 0.5);
  }, [user?.restrictions]);

  const [index, setIndex] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);

  const current = initialDeck[index];
  const next = initialDeck[index + 1];
  const totalSeen = likedIds.length + dislikedIds.length;

  // Fires immediately when swipe threshold is crossed — updates like/dislike count right away.
  function handleGestureCommit(direction: 'left' | 'right', meal: Meal) {
    if (direction === 'right') like(meal.id);
    else dislike(meal.id);

    if (!expertMode) {
      swipeOnlyStreak.current += 1;
      if (swipeOnlyStreak.current >= EXPERT_SWIPE_COUNT) {
        updateProfile({ discoverExpertMode: true });
        Animated.timing(expertAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    }
  }

  // Fires after card fly-off animation completes — advances the deck.
  function handleGestureSwipe() {
    setIndex(i => i + 1);
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
        <View style={styles.headerText}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subText}>
            Swipe right to save, left to skip
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="heart-outline" size={19} color="#111111" />
          {totalSeen > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{likedIds.length}</Text>
            </View>
          )}
        </TouchableOpacity>
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
            onSwipeCommit={(dir) => handleGestureCommit(dir, current)}
            onSwipe={handleGestureSwipe}
          />
        )}
      </View>

      <Animated.View
        style={[
          styles.actionsWrapper,
          { opacity: expertAnim, maxHeight: animatedActionsHeight },
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

      <ReactionsSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
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
        <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
        <Text style={styles.mealDescription} numberOfLines={4}>{meal.description}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.cardBadge}>
            <Ionicons name="time-outline" size={12} color="#666666" />
            <Text style={styles.cardBadgeText}>{meal.prepTime} min</Text>
          </View>
          <View style={styles.cardBadge}>
            <Ionicons name="flame-outline" size={12} color="#666666" />
            <Text style={styles.cardBadgeText}>{meal.calories} kcal</Text>
          </View>
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>
              {meal.mealType[0].toUpperCase() + meal.mealType.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 8,
  },
  headerText: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', color: '#111111', letterSpacing: -0.3 },
  subText: { fontSize: 15, color: '#AAAAAA', marginTop: 4 },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },

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
  cardExpert: { maxHeight: undefined },
  cardBehind: { backgroundColor: '#F0F0F0' },

  cardInner: { flex: 1, justifyContent: 'space-between' },
  emojiWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 140, lineHeight: 160 },
  textBlock: { gap: 10 },
  mealName: { fontSize: 24, fontWeight: '700', color: '#111111', letterSpacing: -0.3 },
  mealDescription: { fontSize: 14, color: '#888888', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBEBEB',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardBadgeText: { fontSize: 12, fontWeight: '500', color: '#666666' },

  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 3,
    zIndex: 2,
  },
  stampLike: { right: 24, borderColor: '#111111', transform: [{ rotate: '14deg' }] },
  stampNope: { left: 24, borderColor: '#AAAAAA', transform: [{ rotate: '-14deg' }] },
  stampLikeText: { fontSize: 22, fontWeight: '800', color: '#111111', letterSpacing: 1 },
  stampNopeText: { fontSize: 22, fontWeight: '800', color: '#AAAAAA', letterSpacing: 1 },

  actionsWrapper: { overflow: 'hidden' },
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

  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111111', letterSpacing: -0.2 },
  emptyHint: { fontSize: 14, color: '#AAAAAA', textAlign: 'center', marginBottom: 16 },
  resetBtn: {
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  resetBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

const sheet = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_H * 0.78,
    paddingHorizontal: 24,
  },
  dragZone: { paddingTop: 12, paddingBottom: 16, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111111', letterSpacing: -0.3 },
  titleSub: { fontSize: 14, color: '#AAAAAA' },
  scroll: { gap: 2 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderSpaced: { marginTop: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#111111', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionLabelMuted: { color: '#AAAAAA' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rowEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#111111' },
  rowMeta: { fontSize: 12, color: '#AAAAAA' },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: '#111111' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14, color: '#AAAAAA', textAlign: 'center' },
});
