import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingItem } from '@/contexts/ShoppingContext';
import ShoppingRow from './ShoppingRow';

type Props = {
  input: string;
  onInputChange: (text: string) => void;
  onAdd: () => void;
  items: ShoppingItem[];
  checkedCount: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClearChecked: () => void;
  onFinishShopping: () => void;
  fabAnim: Animated.Value;
};

export default function ShoppingPanel({
  input,
  onInputChange,
  onAdd,
  items,
  checkedCount,
  onToggle,
  onDelete,
  onClearChecked,
  onFinishShopping,
  fabAnim,
}: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add an item…"
          placeholderTextColor="#C5C5C5"
          value={input}
          onChangeText={onInputChange}
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.flex}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{checkedCount} checked</Text>
          <TouchableOpacity
            onPress={onClearChecked}
            activeOpacity={checkedCount > 0 ? 0.7 : 1}
            disabled={checkedCount === 0}
          >
            <Text style={[styles.clearText, checkedCount === 0 && styles.clearTextDim]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {items.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>Your list is empty</Text>
              <Text style={styles.emptyHint}>Add items above to get started</Text>
            </View>
          )}
          {items.map(item => (
            <ShoppingRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ScrollView>

        <Animated.View
          style={[styles.fabWrap, { transform: [{ translateY: fabAnim }] }]}
          pointerEvents={checkedCount > 0 ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={onFinishShopping}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>Finish shopping</Text>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1 },
  flex: { flex: 1 },

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

  listContent: { paddingHorizontal: 24, paddingBottom: 100 },

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
