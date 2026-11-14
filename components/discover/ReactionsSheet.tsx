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
import { Meal } from '@/data/meals';
import { useRecipes } from '@/contexts/RecipesContext';
import { useLikes } from '@/contexts/LikesContext';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();
  const { likedIds, dislikedIds, toggle } = useLikes();
  // From context (not ALL_MEALS directly) so the list fills in once recipes finish loading.
  const { meals: allMeals } = useRecipes();
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
    // Sets make this O(meals) instead of O(meals × reactions), so a toggle re-sorts instantly.
    const likedSet = new Set(likedIds);
    const dislikedSet = new Set(dislikedIds);
    const liked = allMeals.filter(m => likedSet.has(m.id));
    const passed = allMeals.filter(m => dislikedSet.has(m.id));
    const out: Section[] = [];
    if (liked.length > 0) {
      out.push({ key: 'liked', title: t('discover.likedCount', { count: liked.length }), liked: true, first: true, data: liked });
    }
    if (passed.length > 0) {
      out.push({
        key: 'passed',
        title: t('discover.passedCount', { count: passed.length }),
        liked: false,
        first: out.length === 0,
        data: passed,
      });
    }
    return out;
  }, [likedIds, dislikedIds, allMeals, t]);

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
          accessibilityLabel={t('common.close')}
        />
      </Animated.View>

      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.card, { maxHeight: screenHeight * 0.78 }]}>
          <View
            style={styles.dragZone}
            {...panResponder.panHandlers}
            hitSlop={{ top: 24 }}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            accessibilityHint={t('common.closeHint')}
            onAccessibilityTap={close}
          >
            <View style={styles.handle} />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title} accessibilityRole="header">
              {t('discover.reactions')}
            </Text>
            <Text style={styles.titleSub}>{t('shopMore.seen', { count: totalSeen })}</Text>
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
                <Text style={styles.emptyText}>{t('discover.reactionsEmpty')}</Text>
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
              <ReactionRow meal={item} liked={section.liked} onToggle={toggle} />
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
