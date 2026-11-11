import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ALL_MEALS, Meal } from '@/data/meals';
import { useLikes } from '@/contexts/LikesContext';
import { useAuth } from '@/contexts/AuthContext';
import SwipeCard, { Direction, FlyingCard, SwipeRelease } from '@/components/discover/SwipeCard';
import ReactionsSheet from '@/components/discover/ReactionsSheet';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotion, useScreenReader } from '@/hooks/useReducedMotion';

import { font, type } from '@/constants/type';
const EXPERT_SWIPE_COUNT = 3;
const ACTIONS_BAR_HEIGHT = 100;

export default function DiscoverScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotion();
  const { user, updateProfile } = useAuth();
  const { like, dislike, likedIds, dislikedIds } = useLikes();
  const router = useRouter();

  // Tapping a card for details is a "pro" move: hint at it only until it's been used 3 times.
  const TAP_HINT_UNTIL = 3;
  const detailsOpened = user?.detailsOpened ?? 0;
  // Only re-evaluated when this screen gains focus, so the hint never vanishes in view while the
  // details page is fading in on top of the card — it's simply gone when the user comes back.
  const [showTapHint, setShowTapHint] = useState(detailsOpened < TAP_HINT_UNTIL);
  const detailsOpenedRef = useRef(detailsOpened);
  detailsOpenedRef.current = detailsOpened;
  const navigation = useNavigation();
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        setShowTapHint(detailsOpenedRef.current < TAP_HINT_UNTIL);
      }),
    [navigation],
  );

  function openDetails(meal: Meal) {
    router.push({ pathname: '/meal', params: { id: meal.id, from: 'discover' } });
    if (detailsOpened < TAP_HINT_UNTIL) updateProfile({ detailsOpened: detailsOpened + 1 });
  }

  // Screen-reader users always get the Like / Pass buttons, even in expert mode,
  // so the swipe gesture is never the only way to act.
  const screenReader = useScreenReader();

  const expertMode = user?.discoverExpertMode ?? false;
  const showButtons = !expertMode || screenReader;
  const expertAnim = useRef(new Animated.Value(showButtons ? 1 : 0)).current;

  useEffect(() => {
    expertAnim.setValue(showButtons ? 1 : 0);
  }, [showButtons, expertAnim]);

  const animatedActionsHeight = expertAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ACTIONS_BAR_HEIGHT],
  });

  const swipeOnlyStreak = useRef(0);

  const initialDeck = useMemo<Meal[]>(() => {
    const restrictions = user?.restrictions ?? [];
    const compatible = ALL_MEALS.filter(m =>
      restrictions.every(r => m.dietaryTags.includes(r)),
    );
    return [...compatible].sort(() => Math.random() - 0.5);
  }, [user?.restrictions]);

  const [index, setIndex] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  // Swiped cards still animating off-screen. They sit above the deck but ignore touches.
  const [flying, setFlying] = useState<{ key: number; meal: Meal; direction: Direction; release: SwipeRelease }[]>([]);
  // Scale the new top card starts at (its size as the card underneath), so it grows instead of popping.
  const [enterScale, setEnterScale] = useState(1);
  const flyKey = useRef(0);

  /** Advance to the next card *now* and let the swiped one fly away in its own layer. */
  function advance(meal: Meal, direction: Direction, release: SwipeRelease) {
    if (!reducedMotion) {
      flyKey.current += 1;
      const key = flyKey.current;
      setFlying(prev => [...prev, { key, meal, direction, release }]);
    }
    setEnterScale(release.nextScale);
    setIndex(i => i + 1);
  }

  function removeFlying(key: number) {
    setFlying(prev => prev.filter(f => f.key !== key));
  }

  const current = initialDeck[index];
  const next = initialDeck[index + 1];
  const totalSeen = likedIds.length + dislikedIds.length;

  function handleGestureCommit(direction: Direction, meal: Meal, release: SwipeRelease) {
    advance(meal, direction, release);
    if (direction === 'right') like(meal.id);
    else dislike(meal.id);

    if (!expertMode) {
      swipeOnlyStreak.current += 1;
      if (swipeOnlyStreak.current >= EXPERT_SWIPE_COUNT) {
        updateProfile({ discoverExpertMode: true });
        if (!screenReader) {
          if (reducedMotion) {
            expertAnim.setValue(0);
          } else {
            Animated.timing(expertAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: false,
            }).start();
          }
        }
      }
    }
  }

  function handleButtonSwipe(direction: Direction, meal: Meal) {
    advance(meal, direction, { x: 0, y: 0, vx: 0, nextScale: 0.94 });
    if (direction === 'right') like(meal.id);
    else dislike(meal.id);
    swipeOnlyStreak.current = 0;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            Discover
          </Text>
          <Text style={styles.subText}>Swipe right to save, left to skip</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`Your reactions, ${likedIds.length} liked`}
        >
          <Ionicons name="heart-outline" size={19} color={c.text} />
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
            <Text style={styles.emptyTitle}>You’ve seen them all</Text>
            <Text style={styles.emptyHint}>
              {likedIds.length > 0
                ? 'We’ll work your favourites into your next plan.'
                : 'Like a few to shape your next plan.'}
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setEnterScale(1);
                setIndex(0);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
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
            enterScale={enterScale}
            onSwipeCommit={(dir, release) => handleGestureCommit(dir, current, release)}
            onTap={() => openDetails(current)}
            showTapHint={showTapHint}
          />
        )}

        {flying.map(f => (
          <FlyingCard
            key={f.key}
            meal={f.meal}
            expertMode={expertMode}
            direction={f.direction}
            release={f.release}
            onDone={() => removeFlying(f.key)}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.actionsWrapper,
          { opacity: expertAnim, maxHeight: animatedActionsHeight },
        ]}
        pointerEvents={showButtons ? 'auto' : 'none'}
        importantForAccessibility={showButtons ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!showButtons}
      >
        {current && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPass]}
              onPress={() => handleButtonSwipe('left', current)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Pass on ${current.name}`}
            >
              <Ionicons name="close" size={28} color={c.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionLike]}
              onPress={() => handleButtonSwipe('right', current)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Like ${current.name}`}
            >
              <Ionicons name="heart" size={26} color={c.onPrimary} />
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 20,
      marginBottom: 8,
    },
    headerText: { flex: 1 },
    title: { ...type.display, fontSize: 36, lineHeight: 37, color: c.text },
    subText: { fontFamily: font.regular, fontSize: 15, color: c.textMuted, marginTop: 4 },
    headerBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
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
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { fontSize: 9, fontFamily: font.bold, fontWeight: '700', color: c.onPrimary, fontVariant: ['tabular-nums'] },

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
    },
    actionPass: { backgroundColor: c.surface },
    actionLike: { backgroundColor: c.primary },

    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 32,
    },
    emptyEmoji: { fontFamily: font.regular, fontSize: 56, marginBottom: 4 },
    emptyTitle: { fontSize: 20, fontFamily: font.bold, fontWeight: '700', color: c.text, letterSpacing: -0.2 },
    emptyHint: { fontFamily: font.regular, fontSize: 14, color: c.textMuted, textAlign: 'center', marginBottom: 16 },
    resetBtn: {
      backgroundColor: c.primary,
      borderRadius: 100,
      paddingHorizontal: 28,
      paddingVertical: 14,
    },
    resetBtnText: { color: c.onPrimary, fontSize: 15, fontFamily: font.semibold, fontWeight: '600' },
  });
