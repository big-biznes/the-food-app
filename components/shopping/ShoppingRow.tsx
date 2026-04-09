import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingItem } from '@/contexts/ShoppingContext';

type Props = {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

const ShoppingRow = memo(function ShoppingRow({ item, onToggle, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.checkbox, item.checked && styles.checkboxChecked]}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {item.checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </TouchableOpacity>
      <Text
        style={[styles.name, item.checked && styles.nameChecked]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      {item.lowStock && !item.checked && (
        <View style={styles.lowStockBadge}>
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

export default ShoppingRow;

const styles = StyleSheet.create({
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
  name: { flex: 1, fontSize: 15, color: '#111111', fontWeight: '500' },
  nameChecked: { color: '#AAAAAA', textDecorationLine: 'line-through' },
  lowStockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
