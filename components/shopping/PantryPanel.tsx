import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PantryItem } from '@/contexts/ShoppingContext';
import PantryRow from './PantryRow';

type Props = {
  input: string;
  onInputChange: (text: string) => void;
  onAdd: () => void;
  items: PantryItem[];
  onDelete: (id: string) => void;
};

export default function PantryPanel({ input, onInputChange, onAdd, items, onDelete }: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add to pantry…"
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

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🥫</Text>
            <Text style={styles.emptyText}>Your pantry is empty</Text>
            <Text style={styles.emptyHint}>Track what you have at home</Text>
          </View>
        )}
        {items.map(item => (
          <PantryRow key={item.id} item={item} onDelete={onDelete} />
        ))}
      </ScrollView>
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

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },

  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#111111', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#AAAAAA' },
});
