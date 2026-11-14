import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, View} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSheet, SheetMotion } from '@/hooks/useBottomSheet';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { font, type } from '@/constants/type';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Red confirm button for irreversible actions. */
  destructive?: boolean;
  /** Leave out the Cancel button, for a sheet that only explains something ("Got it"). */
  hideCancel?: boolean;
  /** What the second button says, when "Cancel" is not what it does. */
  cancelLabel?: string;
  /** May be async: the button shows a spinner until it settles. Return an error message to show it in the sheet. */
  onConfirm: () => void | string | null | Promise<void | string | null>;
  onClose: () => void;
  /** Animation curves for the slide; see useBottomSheet. */
  motion?: SheetMotion;
};

/** In-app replacement for the native Alert confirm dialog, styled like the app's other bottom sheets. */
export default function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  hideCancel = false,
  cancelLabel,
  onConfirm,
  onClose,
  motion = 'ios',
}: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { slideAnim, backdropAnim, panResponder, open, close } = useBottomSheet(() => {
    setModalVisible(false);
    onClose();
  }, motion);

  useEffect(() => {
    if (visible) {
      setBusy(false);
      setError(null);
      setModalVisible(true);
      open();
    } else {
      close();
    }
    // open/close are stable refs — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await onConfirm();
      if (typeof result === 'string' && result) {
        setError(result);
        setBusy(false);
      }
    } catch (e) {
      setError((e as Error)?.message ?? t('common.somethingWrong'));
      setBusy(false);
    }
  }

  const dismiss = busy ? () => {} : close;

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <PressableScale
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        />
      </Animated.View>

      <View style={styles.sheetContainer} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <View style={styles.card} accessibilityViewIsModal>
            <View
              style={styles.dragZone}
              {...(busy ? {} : panResponder.panHandlers)}
              hitSlop={{ top: 24 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              accessibilityHint={t('common.closeHint')}
              onAccessibilityTap={dismiss}
            >
              <View style={styles.handle} />
            </View>

            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.message}>{message}</Text>

            {error && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {error}
              </Text>
            )}

            <PressableScale
              style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ busy, disabled: busy }}
            >
              {busy ? (
                <ActivityIndicator color={c.onPrimary} />
              ) : (
                <Text style={styles.confirmText}>
                  {confirmLabel}
                </Text>
              )}
            </PressableScale>

            {!hideCancel && (
              <PressableScale
                style={styles.cancelBtn}
                onPress={dismiss}
                activeOpacity={0.7}
                disabled={busy}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>{cancelLabel ?? t('common.cancel')}</Text>
              </PressableScale>
            )}

            <View style={{ height: insets.bottom + 8 }} />
          </View>
        </Animated.View>
      </View>
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
    title: { ...type.title, color: c.text, marginBottom: 8 },
    message: {
      fontFamily: font.regular,
      fontSize: 15,
      lineHeight: 21,
      color: c.textMuted,
      marginBottom: 24,
    },
    errorText: {
      fontFamily: font.regular,
      fontSize: 13,
      color: c.danger,
      marginTop: -12,
      marginBottom: 16,
    },
    confirmBtn: {
      backgroundColor: c.primary,
      borderRadius: 100,
      minHeight: 58,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnDestructive: {
      backgroundColor: c.danger,
    },
    confirmText: { color: c.onPrimary, fontSize: 16, fontFamily: font.semibold, fontWeight: '600' },
    cancelBtn: {
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    cancelText: { color: c.text, fontSize: 16, fontFamily: font.medium, fontWeight: '500' },
  });
