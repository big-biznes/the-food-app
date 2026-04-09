import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';
import ShoppingPanel from '@/components/shopping/ShoppingPanel';
import PantryPanel from '@/components/shopping/PantryPanel';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ShoppingScreen() {
  const {
    shoppingItems,
    pantryItems,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearChecked,
    finishShopping,
    addPantryItem,
    deletePantryItem,
  } = useShoppingContext();

  const pantryToastRef = useRef<ConfirmToastHandle>(null);

  const handleFinishShopping = useCallback(() => {
    finishShopping();
    pantryToastRef.current?.show();
  }, [finishShopping]);

  const [activeTab, setActiveTab] = useState<'list' | 'pantry'>('list');
  const [shoppingInput, setShoppingInput] = useState('');
  const [pantryInput, setPantryInput] = useState('');

  const handleAddShoppingItem = useCallback(() => {
    addShoppingItem(shoppingInput);
    setShoppingInput('');
  }, [addShoppingItem, shoppingInput]);

  const handleAddPantryItem = useCallback(() => {
    addPantryItem(pantryInput);
    setPantryInput('');
  }, [addPantryItem, pantryInput]);

  const checked = useMemo(() => shoppingItems.filter(i => i.checked), [shoppingItems]);

  // FAB slides in when there are checked items.
  const fabAnim = useRef(new Animated.Value(80)).current;
  useEffect(() => {
    Animated.spring(fabAnim, {
      toValue: checked.length > 0 ? 0 : 80,
      useNativeDriver: true,
      damping: 20,
      stiffness: 220,
      mass: 1,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked.length > 0]);

  // Animated tab switcher.
  const [pillWidth, setPillWidth] = useState(0);
  const tabProgress = useRef(new Animated.Value(0)).current; // 0 = list, 1 = pantry
  const activeTabRef = useRef<'list' | 'pantry'>('list');

  const tabTranslateX = tabProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH],
    extrapolate: 'clamp',
  });

  const pillTranslateX = tabProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pillWidth],
    extrapolate: 'clamp',
  });

  function switchTab(tab: 'list' | 'pantry') {
    activeTabRef.current = tab;
    setActiveTab(tab);
    Animated.spring(tabProgress, {
      toValue: tab === 'list' ? 0 : 1,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
      mass: 1,
    }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        const base = activeTabRef.current === 'list' ? 0 : 1;
        tabProgress.setValue(Math.max(0, Math.min(1, base - g.dx / SCREEN_WIDTH)));
      },
      onPanResponderRelease: (_, g) => {
        const base = activeTabRef.current === 'list' ? 0 : 1;
        const progress = Math.max(0, Math.min(1, base - g.dx / SCREEN_WIDTH));
        const fastLeft = g.vx < -0.15;
        const fastRight = g.vx > 0.15;
        if ((fastLeft || progress > 0.3) && activeTabRef.current === 'list') {
          switchTab('pantry');
        } else if ((fastRight || progress < 0.7) && activeTabRef.current === 'pantry') {
          switchTab('list');
        } else {
          switchTab(activeTabRef.current);
        }
      },
    }),
  ).current;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ConfirmToast ref={pantryToastRef} message="Ingredients added to pantry" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Shopping</Text>
        </View>

        {/* Animated segment control */}
        <View
          style={styles.segmentWrapper}
          onLayout={e => setPillWidth((e.nativeEvent.layout.width - 8) / 2)}
        >
          <Animated.View
            style={[styles.segmentPill, { width: pillWidth, transform: [{ translateX: pillTranslateX }] }]}
          />
          <TouchableOpacity style={styles.segmentBtn} onPress={() => switchTab('list')} activeOpacity={0.8}>
            <Text style={[styles.segmentText, activeTab === 'list' && styles.segmentTextOn]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.segmentBtn} onPress={() => switchTab('pantry')} activeOpacity={0.8}>
            <Text style={[styles.segmentText, activeTab === 'pantry' && styles.segmentTextOn]}>
              Pantry
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontally sliding panels */}
        <View style={styles.tabContainer} {...panResponder.panHandlers}>
          <Animated.View
            style={[styles.tabSlider, { transform: [{ translateX: tabTranslateX }] }]}
          >
            <ShoppingPanel
              input={shoppingInput}
              onInputChange={setShoppingInput}
              onAdd={handleAddShoppingItem}
              items={shoppingItems}
              checkedCount={checked.length}
              onToggle={toggleShoppingItem}
              onDelete={deleteShoppingItem}
              onClearChecked={clearChecked}
              onFinishShopping={handleFinishShopping}
              fabAnim={fabAnim}
            />
            <PantryPanel
              input={pantryInput}
              onInputChange={setPantryInput}
              onAdd={handleAddPantryItem}
              items={pantryItems}
              onDelete={deletePantryItem}
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },

  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },

  segmentWrapper: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 100,
    padding: 4,
  },
  segmentPill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#111111',
    borderRadius: 100,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 100,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#AAAAAA' },
  segmentTextOn: { color: '#FFFFFF' },

  tabContainer: { flex: 1, overflow: 'hidden' },
  tabSlider: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 2,
  },
});
