import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';
import ShoppingPanel from '@/components/shopping/ShoppingPanel';
import PantryPanel from '@/components/shopping/PantryPanel';
import SegmentTabs from '@/components/SegmentTabs';
import { Colors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';

import { type } from '@/constants/type';

const TABS = [
  { key: 'list', label: 'List' },
  { key: 'pantry', label: 'Pantry' },
] as const;

const TAB_KEYS = ['list', 'pantry'] as const;

const FAB_HIDDEN_Y = 130;

export default function ShoppingScreen() {
  const styles = useThemedStyles(makeStyles);
  const {
    active: activeTab,
    switchTab,
    progress: tabProgress,
    translateX: tabTranslateX,
    panHandlers,
    width: screenWidth,
  } = useSwipeTabs(TAB_KEYS);
  const reducedMotion = useReducedMotionRef();
  const router = useRouter();
  const handleComparePrices = useCallback(() => router.push('/compare'), [router]);

  const {
    shoppingItems,
    pantryItems,
    addShoppingItem,
    toggleShoppingItem,
    setAllChecked,
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

        <SegmentTabs tabs={TABS} active={activeTab} onChange={switchTab} progress={tabProgress} />

        {/* Horizontally sliding panels */}
        <View style={styles.tabContainer} {...panHandlers}>
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
                onSetAllChecked={setAllChecked}
                onDelete={handleDeleteShoppingItem}
                onClearChecked={handleClearChecked}
                onFinishShopping={handleFinishShopping}
                onComparePrices={handleComparePrices}
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

    tabContainer: { flex: 1, overflow: 'hidden' },
    tabSlider: {
      flex: 1,
      flexDirection: 'row',
    },
  });
