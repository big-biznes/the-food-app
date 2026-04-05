import { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useShoppingContext,
  ShoppingItem,
  PantryItem,
} from '@/contexts/ShoppingContext';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';

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

  const fabAnim = useRef(new Animated.Value(80)).current;
  useEffect(() => {
    Animated.spring(fabAnim, {
      toValue: checked.length > 0 ? 0 : 80,
      useNativeDriver: true,
      damping: 20,
      stiffness: 220,
      mass: 1,
    }).start();
  }, [checked.length > 0]);

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
        const fastLeft = g.vx < -0.3;
        const fastRight = g.vx > 0.3;
        if ((fastLeft || progress > 0.5) && activeTabRef.current === 'list') {
          switchTab('pantry');
        } else if ((fastRight || progress < 0.5) && activeTabRef.current === 'pantry') {
          switchTab('list');
        } else {
          switchTab(activeTabRef.current);
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ConfirmToast ref={pantryToastRef} message="Ingredients added to pantry" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Shopping</Text>
        </View>

        {/* Segment tabs */}
        <View
          style={styles.segmentWrapper}
          onLayout={e => setPillWidth((e.nativeEvent.layout.width - 8) / 2)}
        >
          <Animated.View
            style={[styles.segmentPill, { width: pillWidth, transform: [{ translateX: pillTranslateX }] }]}
          />
          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => switchTab('list')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'list' && styles.segmentTextOn]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => switchTab('pantry')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'pantry' && styles.segmentTextOn]}>
              Pantry
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer} {...panResponder.panHandlers}>
          <Animated.View
            style={[styles.tabSlider, { transform: [{ translateX: tabTranslateX }] }]}
          >
            {/* List panel */}
            <View style={styles.tabPanel}>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="Add an item…"
                  placeholderTextColor="#C5C5C5"
                  value={shoppingInput}
                  onChangeText={setShoppingInput}
                  onSubmitEditing={handleAddShoppingItem}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddShoppingItem} activeOpacity={0.8}>
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.flex}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>{checked.length} checked</Text>
                  <TouchableOpacity
                    onPress={clearChecked}
                    activeOpacity={checked.length > 0 ? 0.7 : 1}
                    disabled={checked.length === 0}
                  >
                    <Text style={[styles.clearText, checked.length === 0 && styles.clearTextDim]}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.flex}
                  contentContainerStyle={styles.listContentWithFab}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {shoppingItems.length === 0 && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyIcon}>🛒</Text>
                      <Text style={styles.emptyText}>Your list is empty</Text>
                      <Text style={styles.emptyHint}>Add items above to get started</Text>
                    </View>
                  )}
                  {shoppingItems.map(item => (
                    <ShoppingRow
                      key={item.id}
                      item={item}
                      onToggle={toggleShoppingItem}
                      onDelete={deleteShoppingItem}
                    />
                  ))}
                </ScrollView>

                <Animated.View
                  style={[styles.fabWrap, { transform: [{ translateY: fabAnim }] }]}
                  pointerEvents={checked.length > 0 ? 'auto' : 'none'}
                >
                  <TouchableOpacity
                    style={styles.fab}
                    onPress={handleFinishShopping}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.fabText}>Finish shopping</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Pantry panel */}
            <View style={styles.tabPanel}>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="Add to pantry…"
                  placeholderTextColor="#C5C5C5"
                  value={pantryInput}
                  onChangeText={setPantryInput}
                  onSubmitEditing={handleAddPantryItem}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddPantryItem} activeOpacity={0.8}>
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {pantryItems.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🥫</Text>
                    <Text style={styles.emptyText}>Your pantry is empty</Text>
                    <Text style={styles.emptyHint}>Track what you have at home</Text>
                  </View>
                )}
                {pantryItems.map(item => (
                  <PantryRow
                    key={item.id}
                    item={item}
                    onDelete={deletePantryItem}
                  />
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ShoppingRow = memo(function ShoppingRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={rowStyles.row}>
      <TouchableOpacity
        style={[rowStyles.checkbox, item.checked && rowStyles.checkboxChecked]}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {item.checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </TouchableOpacity>
      <Text
        style={[rowStyles.itemName, item.checked && rowStyles.itemNameChecked]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      {item.lowStock && !item.checked && (
        <View style={rowStyles.lowStockBadge}>
          <Ionicons name="home-outline" size={12} color="#E07B00" />
        </View>
      )}
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={18} color="#CCCCCC" />
      </TouchableOpacity>
    </View>
  );
});

const PantryRow = memo(function PantryRow({
  item,
  onDelete,
}: {
  item: PantryItem;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.pantryDot} />
      <Text style={rowStyles.itemName} numberOfLines={2}>
        {item.name}
      </Text>
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={18} color="#CCCCCC" />
      </TouchableOpacity>
    </View>
  );
});

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

  addRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111111',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  tabSlider: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 2,
  },
  tabPanel: {
    flex: 1,
  },

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  listContentWithFab: { paddingHorizontal: 24, paddingBottom: 100 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAAAAA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: { fontSize: 13, fontWeight: '600', color: '#111111' },
  clearTextDim: { color: '#DDDDDD' },

  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#111111', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#AAAAAA' },

  fabWrap: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
  },
  fab: {
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#111111', borderColor: '#111111' },
  pantryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111111',
    marginHorizontal: 7,
  },
  itemName: { flex: 1, fontSize: 15, color: '#111111', fontWeight: '500' },
  itemNameChecked: { color: '#AAAAAA', textDecorationLine: 'line-through' },
  lowStockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
