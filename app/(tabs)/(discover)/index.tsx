import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MEALS, Meal } from '@/data/meals';
import { useLikes } from '@/contexts/LikesContext';
import { useAuth } from '@/contexts/AuthContext';
import SwipeCard from '@/components/discover/SwipeCard';
import ReactionsSheet from '@/components/discover/ReactionsSheet';

const EXPERT_SWIPE_COUNT = 3;
const ACTIONS_BAR_HEIGHT = 100;

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

  function handleButtonSwipe(direction: 'left' | 'right', meal: Meal) {
    if (direction === 'right') like(meal.id);
    else dislike(meal.id);
    setIndex(i => i + 1);
    swipeOnlyStreak.current = 0;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subText}>Swipe right to save, left to skip</Text>
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
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => setIndex(0)}
              activeOpacity={0.8}
            >
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
            onSwipe={() => setIndex(i => i + 1)}
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

      <ReactionsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

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

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
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

