import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PantryItem } from '@/contexts/ShoppingContext';

type Props = {
  item: PantryItem;
  onDelete: (id: string) => void;
};

const PantryRow = memo(function PantryRow({ item, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.name} numberOfLines={2}>
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

export default PantryRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111111',
    marginHorizontal: 7,
  },
  name: { flex: 1, fontSize: 15, color: '#111111', fontWeight: '500' },
});
