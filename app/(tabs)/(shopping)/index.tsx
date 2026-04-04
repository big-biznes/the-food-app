import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const [activeTab, setActiveTab] = useState<'list' | 'pantry'>('list');
  const [shoppingInput, setShoppingInput] = useState('');
  const [pantryInput, setPantryInput] = useState('');

  function handleAddShoppingItem() {
    addShoppingItem(shoppingInput);
    setShoppingInput('');
  }

  function handleAddPantryItem() {
    addPantryItem(pantryInput);
    setPantryInput('');
  }

  const unchecked = shoppingItems.filter(i => !i.checked);
  const checked = shoppingItems.filter(i => i.checked);

  return (
    <SafeAreaView style={styles.safe}>
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

                {unchecked.map(item => (
                  <ShoppingRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleShoppingItem(item.id)}
                    onDelete={() => deleteShoppingItem(item.id)}
                  />
                ))}

                {checked.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>In cart ({checked.length})</Text>
                      <TouchableOpacity onPress={clearChecked} activeOpacity={0.7}>
                        <Text style={styles.clearText}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                    {checked.map(item => (
                      <ShoppingRow
                        key={item.id}
                        item={item}
                        onToggle={() => toggleShoppingItem(item.id)}
                        onDelete={() => deleteShoppingItem(item.id)}
                      />
                    ))}
                  </>
                )}
              </ScrollView>

              {checked.length > 0 && (
                <TouchableOpacity
                  style={styles.fab}
                  onPress={finishShopping}
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
                  onDelete={() => deletePantryItem(item.id)}
                />
              ))}
            </ScrollView>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ShoppingRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={rowStyles.row}>
      <TouchableOpacity
        style={[rowStyles.checkbox, item.checked && rowStyles.checkboxChecked]}
        onPress={onToggle}
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
        onPress={onDelete}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={18} color="#CCCCCC" />
      </TouchableOpacity>
    </View>
  );
}

function PantryRow({
  item,
  onDelete,
}: {
  item: PantryItem;
  onDelete: () => void;
}) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.pantryDot} />
      <Text style={rowStyles.itemName} numberOfLines={2}>
        {item.name}
      </Text>
      <TouchableOpacity
        onPress={onDelete}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={18} color="#CCCCCC" />
      </TouchableOpacity>
    </View>
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
    marginTop: 24,
    marginBottom: 8,
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
