import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
import { Meal } from '@/data/meals';
import { Colors, tileColor } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';
import CardContent from './CardContent';

import { font } from '@/constants/type';
type Direction = 'left' | 'right';

type Props = {
  meal: Meal;
  nextMeal: Meal | undefined;
  expertMode: boolean;
  onSwipeCommit: (direction: Direction) => void;
  onSwipe: () => void;
};

export default function SwipeCard({
  meal,
  nextMeal,
  expertMode,
  onSwipeCommit,
  onSwipe,
}: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width: screenWidth } = useWindowDimensions();
  const widthRef = useRef(screenWidth);
  widthRef.current = screenWidth;
  const swipeThreshold = screenWidth * 0.1;
  const reducedMotion = useReducedMotionRef();

  const position = useRef(new Animated.ValueXY()).current;

  function swipeOff(direction: Direction) {
    if (reducedMotion.current) {
      onSwipe();
      return;
    }
    const w = widthRef.current;
    const toX = direction === 'right' ? w * 1.5 : -w * 1.5;
    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: 240,
      useNativeDriver: true,
    }).start(onSwipe);
  }

  function commit(direction: Direction) {
    onSwipeCommitRef.current(direction);
    swipeOffRef.current(direction);
  }

  // Keep latest callbacks stable inside the pan responder.
  const swipeOffRef = useRef(swipeOff);
  swipeOffRef.current = swipeOff;
  const onSwipeCommitRef = useRef(onSwipeCommit);
  onSwipeCommitRef.current = onSwipeCommit;
  const thresholdRef = useRef(swipeThreshold);
  thresholdRef.current = swipeThreshold;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > thresholdRef.current) {
          onSwipeCommitRef.current('right');
          swipeOffRef.current('right');
        } else if (g.dx < -thresholdRef.current) {
          onSwipeCommitRef.current('left');
          swipeOffRef.current('left');
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

  const nextScale = position.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  const cardWidth = { width: screenWidth - 48 };

  return (
    <>
      {nextMeal && (
        <Animated.View
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
            ],
          },
        ]}
        accessible
        accessibilityLabel={`${meal.name}. ${meal.description}. ${meal.prepTime} minutes, ${meal.calories} kilocalories`}
        accessibilityHint="Swipe right to like, left to pass. Custom actions are available."
        accessibilityActions={[
          { name: 'like', label: 'Like' },
          { name: 'pass', label: 'Pass' },
        ]}
        onAccessibilityAction={e => {
          if (e.nativeEvent.actionName === 'like') commit('right');
          else if (e.nativeEvent.actionName === 'pass') commit('left');
        }}
      >
        <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
          <Animated.Text style={styles.stampLikeText}>Like</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
          <Animated.Text style={styles.stampNopeText}>Pass</Animated.Text>
        </Animated.View>
        <CardContent meal={meal} />
      </Animated.View>
    </>
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
    stampLike: { right: 24, borderColor: c.onTile, transform: [{ rotate: '14deg' }] },
    stampNope: { left: 24, borderColor: c.onTileMuted, transform: [{ rotate: '-14deg' }] },
    stampLikeText: { fontFamily: font.extrabold, fontSize: 22, color: c.onTile },
    stampNopeText: { fontFamily: font.extrabold, fontSize: 22, color: c.onTileMuted },
  });
