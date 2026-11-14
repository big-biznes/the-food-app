import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import CravingChips from './CravingChips';

import { font, type } from '@/constants/type';
type Props = {
  visible: boolean;
  onClose: () => void;
  selectedCravings: string[];
  cravingText: string;
  onToggleCraving: (chip: string) => void;
  onCravingTextChange: (text: string) => void;
  onGenerate: () => void;
};

export default function CravingSheet({
  visible,
  onClose,
  selectedCravings,
  cravingText,
  onToggleCraving,
  onCravingTextChange,
  onGenerate,
}: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
        <PressableScale
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetContainer}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <View style={styles.card}>
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.title} accessibilityRole="header">
                {t('setup.newPlan')}
              </Text>
              <Text style={styles.hint}>{t('setup.question')}</Text>

              <View style={styles.chipsWrapper}>
                <CravingChips selected={selectedCravings} onToggle={onToggleCraving} />
              </View>

              <TextInput
                style={styles.input}
                placeholder={t('setup.placeholder')}
                placeholderTextColor={c.textFaint}
                value={cravingText}
                onChangeText={onCravingTextChange}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel={t('setup.anythingSpecific')}
              />

              <PressableScale
                style={styles.btn}
                onPress={onGenerate}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.btnText}>{t('setup.generate')}</Text>
              </PressableScale>
            </ScrollView>

            <View style={{ height: insets.bottom + 8 }} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: c.backdrop,
    },
    sheetContainer: {
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
    dragZone: {
      paddingTop: 12,
      paddingBottom: 16,
      alignItems: 'center',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.surfaceStrong,
    },
    title: { ...type.title, color: c.text, marginBottom: 4 },
    hint: {
      fontFamily: font.regular, fontSize: 14,
      color: c.textMuted,
      marginBottom: 20,
    },
    chipsWrapper: { marginBottom: 20 },
    input: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontFamily: font.regular, fontSize: 15,
      color: c.text,
      minHeight: 80,
      marginBottom: 20,
    },
    btn: {
      backgroundColor: c.primary,
      borderRadius: 100,
      paddingVertical: 18,
      alignItems: 'center',
    },
    btnText: { color: c.onPrimary, fontSize: 16, fontFamily: font.semibold, fontWeight: '600' },
  });
