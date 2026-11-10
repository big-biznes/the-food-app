import { useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PantryItem } from '@/contexts/ShoppingContext';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import PantryRow from './PantryRow';

import { font } from '@/constants/type';
type Props = {
  input: string;
  onInputChange: (text: string) => void;
  onAdd: () => void;
  items: PantryItem[];
  onDelete: (id: string) => void;
};

function keyExtractor(item: PantryItem) {
  return item.id;
}

export default function PantryPanel({ input, onInputChange, onAdd, items, onDelete }: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const renderItem = useCallback(
    ({ item }: { item: PantryItem }) => <PantryRow item={item} onDelete={onDelete} />,
    [onDelete],
  );

  return (
    <View style={styles.panel}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add to pantry…"
          placeholderTextColor={c.textFaint}
          value={input}
          onChangeText={onInputChange}
          onSubmitEditing={onAdd}
          returnKeyType="done"
          accessibilityLabel="Add to pantry"
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAdd}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add to pantry"
        >
          <Ionicons name="add" size={22} color={c.onPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.flex}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={16}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🥫</Text>
            <Text style={styles.emptyText}>Your pantry is empty</Text>
            <Text style={styles.emptyHint}>Track what you have at home</Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    panel: { flex: 1 },
    flex: { flex: 1 },

    addRow: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 16,
      gap: 10,
    },
    addInput: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 100,
      paddingHorizontal: 18,
      paddingVertical: 14,
      fontFamily: font.regular, fontSize: 15,
      color: c.text,
    },
    addBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },

    emptyState: { alignItems: 'center', marginTop: 64 },
    emptyIcon: { fontFamily: font.regular, fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 17, fontFamily: font.semibold, fontWeight: '600', color: c.text, marginBottom: 6 },
    emptyHint: { fontFamily: font.regular, fontSize: 14, color: c.textMuted },
  });
