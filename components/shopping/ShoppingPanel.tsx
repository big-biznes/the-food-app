import { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingItem } from '@/contexts/ShoppingContext';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import ShoppingRow from './ShoppingRow';

import { font } from '@/constants/type';
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

function keyExtractor(item: ShoppingItem) {
  return item.id;
}

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
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const hasChecked = checkedCount > 0;

  const renderItem = useCallback(
    ({ item }: { item: ShoppingItem }) => (
      <ShoppingRow item={item} onToggle={onToggle} onDelete={onDelete} />
    ),
    [onToggle, onDelete],
  );

  return (
    <View style={styles.panel}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add an item…"
          placeholderTextColor={c.textFaint}
          value={input}
          onChangeText={onInputChange}
          onSubmitEditing={onAdd}
          returnKeyType="done"
          accessibilityLabel="Add an item to the shopping list"
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAdd}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add item"
        >
          <Ionicons name="add" size={22} color={c.onPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.flex}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{checkedCount} checked</Text>
          <TouchableOpacity
            onPress={onClearChecked}
            activeOpacity={hasChecked ? 0.7 : 1}
            disabled={!hasChecked}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Clear checked items"
            accessibilityState={{ disabled: !hasChecked }}
          >
            <Text style={[styles.clearText, !hasChecked && styles.clearTextDim]}>
              Clear
            </Text>
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
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>Your list is empty</Text>
              <Text style={styles.emptyHint}>Add items above to get started</Text>
            </View>
          }
        />

        <Animated.View
          style={[styles.fabWrap, { transform: [{ translateY: fabAnim }] }]}
          pointerEvents={hasChecked ? 'auto' : 'none'}
          importantForAccessibility={hasChecked ? 'auto' : 'no-hide-descendants'}
          accessibilityElementsHidden={!hasChecked}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={onFinishShopping}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Finish shopping"
            accessibilityHint="Moves checked items to your pantry"
          >
            <Text style={styles.fabText}>Finish shopping</Text>
            <Ionicons name="checkmark-circle" size={20} color={c.onPrimary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
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

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 8,
    },
    sectionLabel: {
      fontSize: 13,
      fontFamily: font.semibold, fontWeight: '600',
      color: c.textMuted,
      fontVariant: ['tabular-nums'],
    },
    clearText: { fontSize: 13, fontFamily: font.semibold, fontWeight: '600', color: c.text },
    clearTextDim: { color: c.textFaint },

    listContent: { paddingHorizontal: 20, paddingBottom: 100 },

    emptyState: { alignItems: 'center', marginTop: 64 },
    emptyIcon: { fontFamily: font.regular, fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 17, fontFamily: font.semibold, fontWeight: '600', color: c.text, marginBottom: 6 },
    emptyHint: { fontFamily: font.regular, fontSize: 14, color: c.textMuted },

    fabWrap: {
      position: 'absolute',
      bottom: 20,
      left: 24,
      right: 24,
    },
    fab: {
      backgroundColor: c.primary,
      borderRadius: 100,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    fabText: { color: c.onPrimary, fontSize: 16, fontFamily: font.semibold, fontWeight: '600' },
  });
