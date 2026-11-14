import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingItem } from '@/contexts/ShoppingContext';
import { Colors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { shoppingLine } from '@/lib/localize';

import { font } from '@/constants/type';
import { chainName } from '@/data/stores';
type Props = {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

const CHECKBOX_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };
const DELETE_HIT_SLOP = { top: 14, bottom: 14, left: 14, right: 14 };

const ShoppingRow = memo(function ShoppingRow({ item, onToggle, onDelete }: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  // Stored in English for the price matching; shown in the app's language.
  const label = shoppingLine(item.name);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.checkbox, item.checked && styles.checkboxChecked]}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
        hitSlop={CHECKBOX_HIT_SLOP}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: item.checked }}
      >
        {item.checked && <Ionicons name="checkmark" size={14} color={c.onPrimary} />}
      </TouchableOpacity>
      <View style={styles.nameWrap}>
        <Text
          style={[styles.name, item.checked && styles.nameChecked]}
          numberOfLines={2}
        >
          {label}
        </Text>
        {item.store && !item.checked && <Text style={styles.store}>{chainName(item.store)}</Text>}
      </View>
      {item.lowStock && !item.checked && (
        <View
          style={styles.lowStockBadge}
          accessible
          accessibilityLabel={t('shop.lowStock')}
        >
          <Ionicons name="home-outline" size={12} color={c.warning} />
        </View>
      )}
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        activeOpacity={0.7}
        hitSlop={DELETE_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={t('shop.remove', { item: label })}
      >
        <Ionicons name="close" size={18} color={c.textFaint} />
      </TouchableOpacity>
    </View>
  );
});

export default ShoppingRow;

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
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: c.textFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: c.primary, borderColor: c.primary },
    nameWrap: { flex: 1 },
    store: { fontSize: 12, fontFamily: font.medium, color: c.textMuted, marginTop: 2 },
    name: { fontSize: 15, color: c.text, fontFamily: font.medium, fontWeight: '500' },
    nameChecked: { color: c.textMuted, textDecorationLine: 'line-through' },
    lowStockBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.warningBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
