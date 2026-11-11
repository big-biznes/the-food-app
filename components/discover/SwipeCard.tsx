import { useEffect, useRef } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '@/data/meals';
import { Colors, tileColor } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';
import CardContent from './CardContent';

import { font } from '@/constants/type';

export type Direction = 'left' | 'right';

/** Where the card was when it was released, handed to the fly-off layer. */
export type SwipeRelease = { x: number; y: number; vx: number; nextScale: number };

/** Scale of the card waiting underneath; it grows to 1 as the top card is dragged away. */
const UNDER_SCALE = 0.94;

type Props = {
  meal: Meal;
  nextMeal: Meal | undefined;
  expertMode: boolean;
  /** Scale this card starts at (the size it had as the card underneath), animated up to 1. */
  enterScale?: number;
  /**
   * Called the moment a swipe is decided. The parent should immediately make the next card
   * the top card and render a FlyingCard from `release`, so the user can grab the next card
   * without waiting for this one to leave the screen.
   */
  onSwipeCommit: (direction: Direction, release: SwipeRelease) => void;
  /** A tap (touch with barely any movement) on the top card, e.g. to open the meal details. */
  onTap?: () => void;
  /** Small "Tap for details" hint in the corner; only shown to users who haven't used it yet. */
  showTapHint?: boolean;
};

/** A touch that moves less than this and lifts quickly counts as a tap, not a swipe. */
const TAP_SLOP = 8;
const TAP_MAX_MS = 300;

export default function SwipeCard({
  meal,
  nextMeal,
  expertMode,
  enterScale = 1,
  onSwipeCommit,
  onTap,
  showTapHint = false,
}: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width: screenWidth } = useWindowDimensions();
  const widthRef = useRef(screenWidth);
  widthRef.current = screenWidth;
  const swipeThreshold = screenWidth * 0.1;
  const reducedMotion = useReducedMotionRef();

  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(enterScale)).current;

  // Grow from the "underneath" size to full size instead of popping.
  useEffect(() => {
    if (enterScale === 1) return;
    if (reducedMotion.current) {
      scale.setValue(1);
      return;
    }
    Animated.timing(scale, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enterScale, scale, reducedMotion]);

  function underScaleFor(x: number) {
    const t = Math.min(Math.abs(x) / widthRef.current, 1);
    return UNDER_SCALE + (1 - UNDER_SCALE) * t;
  }

  function commit(direction: Direction, x = 0, y = 0, vx = 0) {
    onSwipeCommitRef.current(direction, { x, y, vx, nextScale: underScaleFor(x) });
  }

  // Keep latest callbacks stable inside the pan responder.
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const onSwipeCommitRef = useRef(onSwipeCommit);
  onSwipeCommitRef.current = onSwipeCommit;
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const touchStart = useRef(0);
  const thresholdRef = useRef(swipeThreshold);
  thresholdRef.current = swipeThreshold;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        touchStart.current = Date.now();
      },
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        const isTap =
          Math.abs(g.dx) < TAP_SLOP &&
          Math.abs(g.dy) < TAP_SLOP &&
          Date.now() - touchStart.current < TAP_MAX_MS;
        if (isTap) {
          position.setValue({ x: 0, y: 0 });
          onTapRef.current?.();
          return;
        }
        if (g.dx > thresholdRef.current) {
          commitRef.current('right', g.dx, g.dy, g.vx);
        } else if (g.dx < -thresholdRef.current) {
          commitRef.current('left', g.dx, g.dy, g.vx);
        } else if (reducedMotion.current) {
          position.setValue({ x: 0, y: 0 });
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      },
    }),
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, swipeThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-swipeThreshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // The hint shares the corner with the "Like" stamp, so it fades out as soon as the card moves.
  const hintOpacity = position.x.interpolate({
    inputRange: [-swipeThreshold, 0, swipeThreshold],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const nextScale = position.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: [1, UNDER_SCALE, 1],
    extrapolate: 'clamp',
  });

  const cardWidth = { width: screenWidth - 48 };

  return (
    <>
      {nextMeal && (
        <Animated.View
          key={nextMeal.id}
          style={[
            styles.card,
            cardWidth,
            { backgroundColor: tileColor(c, nextMeal.mealType) },
            expertMode && styles.cardExpert,
            { transform: [{ scale: nextScale }] },
          ]}
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <CardContent meal={nextMeal} />
        </Animated.View>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          cardWidth,
          { backgroundColor: tileColor(c, meal.mealType) },
          expertMode && styles.cardExpert,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
              { scale },
            ],
          },
        ]}
        accessible
        accessibilityLabel={`${meal.name}. ${meal.description}. ${meal.prepTime} minutes, ${meal.calories} kilocalories`}
        accessibilityHint="Double tap for details. Swipe right to like, left to pass. Custom actions are available."
        accessibilityActions={[
          { name: 'activate', label: 'Show details' },
          { name: 'like', label: 'Like' },
          { name: 'pass', label: 'Pass' },
        ]}
        onAccessibilityAction={e => {
          if (e.nativeEvent.actionName === 'activate') onTapRef.current?.();
          else if (e.nativeEvent.actionName === 'like') commit('right');
          else if (e.nativeEvent.actionName === 'pass') commit('left');
        }}
      >
        <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
          <Animated.Text style={styles.stampLikeText}>Like</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
          <Animated.Text style={styles.stampNopeText}>Pass</Animated.Text>
        </Animated.View>
        {showTapHint && (
          <Animated.View
            style={[styles.tapHint, { opacity: hintOpacity }]}
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <Ionicons name="hand-left-outline" size={13} color={c.onTile} />
            <Animated.Text style={styles.tapHintText}>Tap for details</Animated.Text>
          </Animated.View>
        )}
        <CardContent meal={meal} />
      </Animated.View>
    </>
  );
}

type FlyingProps = {
  meal: Meal;
  expertMode: boolean;
  direction: Direction;
  release: SwipeRelease;
  onDone: () => void;
};

/**
 * A swiped card leaving the screen. Rendered on top of the deck but ignores touches,
 * so the next card can be dragged while this one is still flying away.
 */
export function FlyingCard({ meal, expertMode, direction, release, onDone }: FlyingProps) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width: screenWidth } = useWindowDimensions();
  const position = useRef(new Animated.ValueXY({ x: release.x, y: release.y })).current;

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const toX = direction === 'right' ? screenWidth * 1.5 : -screenWidth * 1.5;
    // Keep some of the finger's momentum: a fast flick leaves faster.
    const speed = Math.min(Math.abs(release.vx), 3);
    const duration = Math.round(260 - speed * 40);
    Animated.timing(position, {
      toValue: { x: toX, y: release.y + release.y * 0.5 },
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => onDoneRef.current());
    // Runs once per flying card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = position.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        { width: screenWidth - 48 },
        { backgroundColor: tileColor(c, meal.mealType) },
        expertMode && styles.cardExpert,
        { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
      ]}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Animated.View style={[styles.stamp, direction === 'right' ? styles.stampLike : styles.stampNope]}>
        <Animated.Text style={direction === 'right' ? styles.stampLikeText : styles.stampNopeText}>
          {direction === 'right' ? 'Like' : 'Pass'}
        </Animated.Text>
      </Animated.View>
      <CardContent meal={meal} />
    </Animated.View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: {
      position: 'absolute',
      height: '92%',
      maxHeight: 560,
      borderRadius: 24,
      padding: 24,
      overflow: 'hidden',
    },
    cardExpert: { maxHeight: undefined },

    stamp: {
      position: 'absolute',
      top: 28,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 3,
      zIndex: 2,
    },
    tapHint: {
      position: 'absolute',
      top: 20,
      right: 20,
      zIndex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 100,
      borderWidth: 1.5,
      borderColor: c.onTileMuted,
    },
    tapHintText: { fontFamily: font.semibold, fontSize: 12, lineHeight: 15, color: c.onTile },
    stampLike: { right: 24, borderColor: c.onTile, transform: [{ rotate: '14deg' }] },
    stampNope: { left: 24, borderColor: c.onTileMuted, transform: [{ rotate: '-14deg' }] },
    stampLikeText: { fontFamily: font.extrabold, fontSize: 22, color: c.onTile },
    stampNopeText: { fontFamily: font.extrabold, fontSize: 22, color: c.onTileMuted },
  });
