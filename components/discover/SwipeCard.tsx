import { useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet } from 'react-native';
import { Meal } from '@/data/meals';
import CardContent from './CardContent';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.1;

type Props = {
  meal: Meal;
  nextMeal: Meal | undefined;
  expertMode: boolean;
  onSwipeCommit: (direction: 'left' | 'right') => void;
  onSwipe: () => void;
};

export default function SwipeCard({
  meal,
  nextMeal,
  expertMode,
  onSwipeCommit,
  onSwipe,
}: Props) {
  const position = useRef(new Animated.ValueXY()).current;

  function swipeOff(direction: 'left' | 'right') {
    const toX = direction === 'right' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: 240,
      useNativeDriver: false,
    }).start(onSwipe);
  }

  // Keep latest callbacks stable inside the pan responder.
  const swipeOffRef = useRef(swipeOff);
  swipeOffRef.current = swipeOff;
  const onSwipeCommitRef = useRef(onSwipeCommit);
  onSwipeCommitRef.current = onSwipeCommit;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
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
          <Animated.Text style={styles.stampLikeText}>LIKE</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
          <Animated.Text style={styles.stampNopeText}>NOPE</Animated.Text>
        </Animated.View>
        <CardContent meal={meal} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
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
});
