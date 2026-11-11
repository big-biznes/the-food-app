import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { chainName } from '@/data/stores';
import type { ItemChoice, StoreTotal } from '@/lib/pricing';
import { formatAmount, formatMoney } from '@/lib/format';

type Props = {
  store: StoreTotal;
  /** Item id → the text on the shopping list. */
  labels: Map<string, string>;
  /** Total items on the list; shows "9 of 14 items" when given. */
  itemCount?: number;
  badge?: string;
  initiallyOpen?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

/** One store's basket: total, and the product chosen for each list item. */
export default function StoreCard({ store, labels, itemCount, badge, initiallyOpen = false, actionLabel, onAction }: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(initiallyOpen);
  const name = chainName(store.chainId);
  const count = itemCount != null ? `${store.found.length} of ${itemCount} items` : `${store.found.length} items`;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.head}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${formatMoney(store.totalCents)}, ${count}`}
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.headText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.count}>{count}</Text>
        </View>
        <Text style={styles.total}>{formatMoney(store.totalCents)}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          {store.found.map(item => (
            <ItemLine key={item.itemId} item={item} label={labels.get(item.itemId) ?? item.label} />
          ))}
          {store.missing.length > 0 && (
            <Text style={styles.missing}>
              Not sold here: {store.missing.map(id => labels.get(id) ?? id).join(', ')}
            </Text>
          )}
          {actionLabel && onAction && (
            <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.actionText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function ItemLine({ item, label }: { item: ItemChoice; label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.line}>
      <View style={styles.lineText}>
        <Text style={styles.lineLabel}>{label}</Text>
        {item.lines.map(l => (
          <Text key={l.productId} style={styles.lineProduct}>
            {item.byWeight
              ? `${l.productName} · loose, ${formatMoney(l.priceCents)} per ${formatAmount(l.packAmount, l.packUnit)}`
              : `${l.packs} × ${l.productName} · ${formatMoney(l.priceCents)} each`}
          </Text>
        ))}
        {item.leftover > 0 && (
          <Text style={styles.lineLeftover}>{formatAmount(item.leftover, item.leftoverUnit)} left over</Text>
        )}
      </View>
      <Text style={styles.lineCost}>{formatMoney(item.costCents)}</Text>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: c.surface, borderRadius: 20, marginBottom: 12 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
    headText: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { ...type.heading, color: c.text },
    badge: { backgroundColor: c.pea, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { fontSize: 12, fontFamily: font.semibold, fontWeight: '600', color: c.onTile },
    count: { ...type.small, color: c.textMuted, marginTop: 2 },
    total: { ...type.heading, color: c.text, fontVariant: ['tabular-nums'] },

    body: { paddingHorizontal: 18, paddingBottom: 18 },
    line: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    lineText: { flex: 1 },
    lineLabel: { fontSize: 15, fontFamily: font.medium, fontWeight: '500', color: c.text },
    lineProduct: { ...type.small, color: c.textSecondary, marginTop: 2 },
    lineLeftover: { ...type.small, color: c.textMuted, marginTop: 2 },
    lineCost: { fontSize: 15, fontFamily: font.semibold, fontWeight: '600', color: c.text, fontVariant: ['tabular-nums'] },
    missing: { ...type.small, color: c.warning, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },

    action: { backgroundColor: c.primary, borderRadius: 100, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
    actionText: { color: c.onPrimary, fontSize: 15, fontFamily: font.semibold, fontWeight: '600' },
  });
