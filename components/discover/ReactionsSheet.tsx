import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ALL_MEALS } from '@/data/meals';
import { useLikes } from '@/contexts/LikesContext';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import ReactionRow from './ReactionRow';

const SCREEN_H = Dimensions.get('window').height;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ReactionsSheet({ visible, onClose }: Props) {
  const { likedIds, dislikedIds, toggle } = useLikes();
  const insets = useSafeAreaInsets();

  // Keep Modal mounted during the close animation.
  const [modalVisible, setModalVisible] = useState(false);

  const { slideAnim, backdropAnim, panResponder, open, close } = useBottomSheet(() => {
    setModalVisible(false);
    onClose();
  });

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      open();
    } else {
      close();
    }
  // open/close are stable refs — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const likedMeals = useMemo(
    () => ALL_MEALS.filter(m => likedIds.includes(m.id)),
    [likedIds],
  );
  const dislikedMeals = useMemo(
    () => ALL_MEALS.filter(m => dislikedIds.includes(m.id)),
    [dislikedIds],
  );

  const totalSeen = likedIds.length + dislikedIds.length;

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={close}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={close}
        />
      </Animated.View>

      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.card}>
          <View style={styles.dragZone} {...panResponder.panHandlers} hitSlop={{ top: 24 }}>
            <View style={styles.handle} />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>Your reactions</Text>
            <Text style={styles.titleSub}>{totalSeen} seen</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          >
            {totalSeen === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>👆</Text>
                <Text style={styles.emptyText}>
                  Start swiping to see your reactions here
                </Text>
              </View>
            )}

            {likedMeals.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="heart" size={13} color="#111111" />
                  <Text style={styles.sectionLabel}>Liked · {likedMeals.length}</Text>
                </View>
                {likedMeals.map(meal => (
                  <ReactionRow
                    key={meal.id}
                    meal={meal}
                    liked
                    onToggle={() => toggle(meal.id)}
                  />
                ))}
              </>
            )}

            {dislikedMeals.length > 0 && (
              <>
                <View
                  style={[
                    styles.sectionHeader,
                    likedMeals.length > 0 && styles.sectionHeaderSpaced,
                  ]}
                >
                  <Ionicons name="close-circle" size={13} color="#AAAAAA" />
                  <Text style={[styles.sectionLabel, styles.sectionLabelMuted]}>
                    Passed · {dislikedMeals.length}
                  </Text>
                </View>
                {dislikedMeals.map(meal => (
                  <ReactionRow
                    key={meal.id}
                    meal={meal}
                    liked={false}
                    onToggle={() => toggle(meal.id)}
                  />
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionLabelMuted: { color: '#AAAAAA' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14, color: '#AAAAAA', textAlign: 'center' },
});
