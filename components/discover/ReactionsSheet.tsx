import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Modal,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ALL_MEALS, Meal } from '@/data/meals';
import { useLikes } from '@/contexts/LikesContext';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import ReactionRow from './ReactionRow';

import { font, type } from '@/constants/type';
type Props = {
  visible: boolean;
  onClose: () => void;
};

type Section = {
  key: 'liked' | 'passed';
  title: string;
  liked: boolean;
  first: boolean;
  data: Meal[];
};

export default function ReactionsSheet({ visible, onClose }: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { height: screenHeight } = useWindowDimensions();
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

  const sections = useMemo<Section[]>(() => {
    const liked = ALL_MEALS.filter(m => likedIds.includes(m.id));
    const passed = ALL_MEALS.filter(m => dislikedIds.includes(m.id));
    const out: Section[] = [];
    if (liked.length > 0) {
      out.push({ key: 'liked', title: `${liked.length} liked`, liked: true, first: true, data: liked });
    }
    if (passed.length > 0) {
      out.push({
        key: 'passed',
        title: `${passed.length} passed`,
        liked: false,
        first: out.length === 0,
        data: passed,
      });
    }
    return out;
  }, [likedIds, dislikedIds]);

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
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
      </Animated.View>

      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.card, { maxHeight: screenHeight * 0.78 }]}>
          <View
            style={styles.dragZone}
            {...panResponder.panHandlers}
            hitSlop={{ top: 24 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
            accessibilityHint="Drag down or double tap to close"
            onAccessibilityTap={close}
          >
            <View style={styles.handle} />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title} accessibilityRole="header">
              Your reactions
            </Text>
            <Text style={styles.titleSub}>{totalSeen} seen</Text>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={meal => meal.id}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            initialNumToRender={12}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>👆</Text>
                <Text style={styles.emptyText}>Start swiping to see your reactions here</Text>
              </View>
            }
            renderSectionHeader={({ section }) => (
              <View style={[styles.sectionHeader, !section.first && styles.sectionHeaderSpaced]}>
                <Ionicons
                  name={section.liked ? 'heart' : 'close-circle'}
                  size={13}
                  color={section.liked ? c.text : c.textMuted}
                />
                <Text
                  style={[styles.sectionLabel, !section.liked && styles.sectionLabelMuted]}
                  accessibilityRole="header"
                >
                  {section.title}
                </Text>
              </View>
            )}
            renderItem={({ item, section }) => (
              <ReactionRow meal={item} liked={section.liked} onToggle={() => toggle(item.id)} />
            )}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: c.backdrop,
    },
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    card: {
      backgroundColor: c.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
    },
    dragZone: { paddingTop: 12, paddingBottom: 16, alignItems: 'center' },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.surfaceStrong },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
      marginBottom: 20,
    },
    title: { ...type.title, color: c.text },
    titleSub: { fontFamily: font.regular, fontSize: 14, color: c.textMuted, fontVariant: ['tabular-nums'] },
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
      fontFamily: font.bold, fontWeight: '700',
      color: c.text,
      },
    sectionLabelMuted: { color: c.textMuted },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyEmoji: { fontFamily: font.regular, fontSize: 36 },
    emptyText: { fontFamily: font.regular, fontSize: 14, color: c.textMuted, textAlign: 'center' },
  });
