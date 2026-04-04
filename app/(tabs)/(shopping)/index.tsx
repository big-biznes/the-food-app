import { useState, useMemo, memo, useCallback, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useShoppingContext,
  ShoppingItem,
  PantryItem,
} from '@/contexts/ShoppingContext';

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

  const insets = useSafeAreaInsets();
  const toastAnim = useRef(new Animated.Value(-80)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(() => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    Animated.spring(toastAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -80,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }, 2800);
  }, [toastAnim]);

  const handleFinishShopping = useCallback(() => {
    finishShopping();
    showToast();
  }, [finishShopping, showToast]);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Animated.View
        style={[styles.toast, { top: insets.top + 12, transform: [{ translateY: toastAnim }] }]}
        pointerEvents="none"
      >
        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        <Text style={styles.toastText}>Ingredients added to pantry</Text>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Shopping</Text>
        </View>

        {/* Segment tabs */}
        <View style={styles.segmentWrapper}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'list' && styles.segmentBtnOn]}
            onPress={() => setActiveTab('list')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'list' && styles.segmentTextOn]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'pantry' && styles.segmentBtnOn]}
            onPress={() => setActiveTab('pantry')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'pantry' && styles.segmentTextOn]}>
              Pantry
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'list' ? (
          <>
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
              {checked.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>{checked.length} checked</Text>
                  <TouchableOpacity onPress={clearChecked} activeOpacity={0.7}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView
                style={styles.flex}
                contentContainerStyle={[
                  styles.listContent,
                  checked.length > 0 && styles.listContentWithFab,
                ]}
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

              {checked.length > 0 && (
                <TouchableOpacity
                  style={styles.fab}
                  onPress={handleFinishShopping}
                  activeOpacity={0.85}
                >
                  <Text style={styles.fabText}>Finish shopping</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <>
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
          </>
        )}
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
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 100,
  },
  segmentBtnOn: { backgroundColor: '#111111' },
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

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  listContentWithFab: { paddingBottom: 100 },

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

  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#111111', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#AAAAAA' },

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
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  fab: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
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
});
