import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';
import ShoppingPanel from '@/components/shopping/ShoppingPanel';
import PantryPanel from '@/components/shopping/PantryPanel';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';

import { font, type } from '@/constants/type';
type Tab = 'list' | 'pantry';

const FAB_HIDDEN_Y = 80;

export default function ShoppingScreen() {
  const styles = useThemedStyles(makeStyles);
  const { width: screenWidth } = useWindowDimensions();
  const widthRef = useRef(screenWidth);
  widthRef.current = screenWidth;
  const reducedMotion = useReducedMotionRef();

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
    undoLastRemoval,
  } = useShoppingContext();

  const pantryToastRef = useRef<ConfirmToastHandle>(null);
  const undoToastRef = useRef<ConfirmToastHandle>(null);

  const handleFinishShopping = useCallback(() => {
    finishShopping();
    pantryToastRef.current?.show();
  }, [finishShopping]);

  const [activeTab, setActiveTab] = useState<Tab>('list');
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

  // Refs so the row callbacks stay referentially stable and memoized rows don't re-render on every change.
  const shoppingItemsRef = useRef(shoppingItems);
  shoppingItemsRef.current = shoppingItems;
  const pantryItemsRef = useRef(pantryItems);
  pantryItemsRef.current = pantryItems;
  const checkedCountRef = useRef(checked.length);
  checkedCountRef.current = checked.length;

  // Destructive actions are undoable from the toast instead of gated behind a confirm.
  const showUndo = useCallback(
    (message: string) => {
      undoToastRef.current?.show({
        message,
        actionLabel: 'Undo',
        onAction: () => {
          undoLastRemoval();
        },
      });
    },
    [undoLastRemoval],
  );

  const handleDeleteShoppingItem = useCallback(
    (id: string) => {
      const item = shoppingItemsRef.current.find(i => i.id === id);
      deleteShoppingItem(id);
      showUndo(item ? `Removed ${item.name}` : 'Item removed');
    },
    [deleteShoppingItem, showUndo],
  );

  const handleClearChecked = useCallback(() => {
    const n = checkedCountRef.current;
    if (n === 0) return;
    clearChecked();
    showUndo(n === 1 ? 'Cleared 1 item' : `Cleared ${n} items`);
  }, [clearChecked, showUndo]);

  const handleDeletePantryItem = useCallback(
    (id: string) => {
      const item = pantryItemsRef.current.find(i => i.id === id);
      deletePantryItem(id);
      showUndo(item ? `Removed ${item.name}` : 'Item removed');
    },
    [deletePantryItem, showUndo],
  );

  // FAB slides in when there are checked items.
  const fabAnim = useRef(new Animated.Value(FAB_HIDDEN_Y)).current;
  const hasChecked = checked.length > 0;
  useEffect(() => {
    const toValue = hasChecked ? 0 : FAB_HIDDEN_Y;
    if (reducedMotion.current) {
      fabAnim.setValue(toValue);
      return;
    }
    // JS driver: with the native driver the button ignores taps until the slide ends.
    Animated.timing(fabAnim, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [hasChecked, fabAnim, reducedMotion]);

  // Animated tab switcher.
  const [pillWidth, setPillWidth] = useState(0);
  const tabProgress = useRef(new Animated.Value(0)).current; // 0 = list, 1 = pantry
  const activeTabRef = useRef<Tab>('list');

  const tabTranslateX = tabProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenWidth],
    extrapolate: 'clamp',
  });

  const pillTranslateX = tabProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pillWidth],
    extrapolate: 'clamp',
  });

  function switchTab(tab: Tab) {
    activeTabRef.current = tab;
    setActiveTab(tab);
    const toValue = tab === 'list' ? 0 : 1;
    if (reducedMotion.current) {
      tabProgress.setValue(toValue);
      return;
    }
    // JS driver so the list/pantry rows are tappable immediately, not only after the slide ends.
    Animated.timing(tabProgress, {
      toValue,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        const base = activeTabRef.current === 'list' ? 0 : 1;
        tabProgress.setValue(Math.max(0, Math.min(1, base - g.dx / widthRef.current)));
      },
      onPanResponderRelease: (_, g) => {
        const base = activeTabRef.current === 'list' ? 0 : 1;
        const progress = Math.max(0, Math.min(1, base - g.dx / widthRef.current));
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
      onPanResponderTerminate: () => {
        switchTab(activeTabRef.current);
      },
    }),
  ).current;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ConfirmToast ref={pantryToastRef} message="Ingredients added to pantry" />
      <ConfirmToast ref={undoToastRef} message="Item removed" icon="trash-outline" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Shopping
          </Text>
        </View>

        {/* Animated segment control */}
        <View
          style={styles.segmentWrapper}
          onLayout={e => setPillWidth(e.nativeEvent.layout.width / 2)}
          accessibilityRole="tablist"
        >
          <Animated.View
            style={[styles.segmentPill, { width: pillWidth, transform: [{ translateX: pillTranslateX }] }]}
          />
          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => switchTab('list')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityLabel="List"
            accessibilityState={{ selected: activeTab === 'list' }}
          >
            <Text style={[styles.segmentText, activeTab === 'list' && styles.segmentTextOn]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => switchTab('pantry')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityLabel="Pantry"
            accessibilityState={{ selected: activeTab === 'pantry' }}
          >
            <Text style={[styles.segmentText, activeTab === 'pantry' && styles.segmentTextOn]}>
              Pantry
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontally sliding panels */}
        <View style={styles.tabContainer} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.tabSlider,
              { width: screenWidth * 2, transform: [{ translateX: tabTranslateX }] },
            ]}
          >
            <View
              style={{ width: screenWidth }}
              importantForAccessibility={activeTab === 'list' ? 'auto' : 'no-hide-descendants'}
              accessibilityElementsHidden={activeTab !== 'list'}
            >
              <ShoppingPanel
                input={shoppingInput}
                onInputChange={setShoppingInput}
                onAdd={handleAddShoppingItem}
                items={shoppingItems}
                checkedCount={checked.length}
                onToggle={toggleShoppingItem}
                onDelete={handleDeleteShoppingItem}
                onClearChecked={handleClearChecked}
                onFinishShopping={handleFinishShopping}
                fabAnim={fabAnim}
              />
            </View>
            <View
              style={{ width: screenWidth }}
              importantForAccessibility={activeTab === 'pantry' ? 'auto' : 'no-hide-descendants'}
              accessibilityElementsHidden={activeTab !== 'pantry'}
            >
              <PantryPanel
                input={pantryInput}
                onInputChange={setPantryInput}
                onAdd={handleAddPantryItem}
                items={pantryItems}
                onDelete={handleDeletePantryItem}
              />
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },

    header: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 16,
    },
    title: { ...type.display, fontSize: 36, lineHeight: 37, color: c.text },

    segmentWrapper: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    segmentPill: {
      position: 'absolute',
      bottom: -1,
      left: 0,
      height: 2,
      backgroundColor: c.text,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
    },
    segmentText: { fontSize: 14, fontFamily: font.semibold, fontWeight: '600', color: c.textMuted },
    segmentTextOn: { color: c.text },

    tabContainer: { flex: 1, overflow: 'hidden' },
    tabSlider: {
      flex: 1,
      flexDirection: 'row',
    },
  });
