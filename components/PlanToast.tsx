import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type PlanToastHandle = {
  show: () => void;
  dismiss: () => void;
};

type Props = {
  message: string;
  actionLabel: string;
  actionIcon: React.ComponentProps<typeof Ionicons>['name'];
  onAction: () => void;
};

const PlanToast = forwardRef<PlanToastHandle, Props>(function PlanToast(
  { message, actionLabel, actionIcon, onAction },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(100)).current;
  const textWidth = useRef(new Animated.Value(160)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function dismissInternal() {
    clearTimers();
    Animated.timing(slideAnim, { toValue: 100, duration: 260, useNativeDriver: false }).start(
      () => setVisible(false),
    );
  }

  useImperativeHandle(ref, () => ({
    show() {
      clearTimers();
      slideAnim.setValue(100);
      textWidth.setValue(160);
      textOpacity.setValue(1);
      setVisible(true);

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        damping: 22,
        stiffness: 220,
        mass: 1,
      }).start();

      // Collapse button text to icon-only after 3.5s
      const t1 = setTimeout(() => {
        Animated.parallel([
          Animated.timing(textOpacity, { toValue: 0, duration: 280, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(textWidth, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]).start();
      }, 3500);
      timers.current.push(t1);

      // Auto-dismiss after 7s
      const t2 = setTimeout(dismissInternal, 7000);
      timers.current.push(t2);
    },
    dismiss() {
      dismissInternal();
    },
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.toast, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.left}>
        <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
        <Text style={styles.message}>{message}</Text>
      </View>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onAction}
        activeOpacity={0.75}
      >
        <Ionicons name={actionIcon} size={15} color="#111111" />
        <Animated.View style={{ width: textWidth, overflow: 'hidden' }}>
          <Animated.Text
            style={[styles.actionBtnText, { opacity: textOpacity }]}
            numberOfLines={1}
          >
            {' '}{actionLabel}
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default PlanToast;

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    backgroundColor: '#111111',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
  },
});
