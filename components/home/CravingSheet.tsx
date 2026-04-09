import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import CravingChips from './CravingChips';

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
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={close}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetContainer}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <View style={styles.card}>
            <View style={styles.dragZone} {...panResponder.panHandlers} hitSlop={{ top: 24 }}>
              <View style={styles.handle} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.title}>New plan</Text>
              <Text style={styles.hint}>What are you craving this week?</Text>

              <View style={styles.chipsWrapper}>
                <CravingChips selected={selectedCravings} onToggle={onToggleCraving} />
              </View>

              <TextInput
                style={styles.input}
                placeholder="e.g. something with pasta, no mushrooms…"
                placeholderTextColor="#C5C5C5"
                value={cravingText}
                onChangeText={onCravingTextChange}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.btn} onPress={onGenerate} activeOpacity={0.8}>
                <Text style={styles.btnText}>Generate</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={{ height: insets.bottom + 8 }} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#E0E0E0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 20,
  },
  chipsWrapper: { marginBottom: 20 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: '#111111',
    minHeight: 80,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
