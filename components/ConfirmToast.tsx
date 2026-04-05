import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ConfirmToastHandle = {
  show: () => void;
};

type Props = {
  message: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

const ConfirmToast = forwardRef<ConfirmToastHandle, Props>(function ConfirmToast(
  { message, icon = 'checkmark-circle' },
  ref,
) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(-80)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    show() {
      if (timer.current) clearTimeout(timer.current);
      anim.setValue(-80);
      setVisible(true);
      Animated.spring(anim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: -80, duration: 260, useNativeDriver: true }).start(
          () => setVisible(false),
        );
      }, 2800);
    },
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.toast, { top: insets.top + 12, transform: [{ translateY: anim }] }]}
      pointerEvents="none"
    >
      <Ionicons name={icon} size={18} color="#FFFFFF" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
});

export default ConfirmToast;

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111111',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 100,
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
