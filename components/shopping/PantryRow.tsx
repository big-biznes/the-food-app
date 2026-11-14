import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PantryItem } from '@/contexts/ShoppingContext';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { shoppingLine } from '@/lib/localize';

import { font } from '@/constants/type';
type Props = {
  item: PantryItem;
  onDelete: (id: string) => void;
};

const DELETE_HIT_SLOP = { top: 14, bottom: 14, left: 14, right: 14 };

const PantryRow = memo(function PantryRow({ item, onDelete }: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const label = shoppingLine(item.name);

  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.name} numberOfLines={2}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        activeOpacity={0.7}
        hitSlop={DELETE_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={t('shop.removeFromPantry', { item: label })}
      >
        <Ionicons name="close" size={18} color={c.textFaint} />
      </TouchableOpacity>
    </View>
  );
});

export default PantryRow;

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 14,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primary,
      marginHorizontal: 7,
    },
    name: { flex: 1, fontSize: 15, color: c.text, fontFamily: font.medium, fontWeight: '500' },
  });
