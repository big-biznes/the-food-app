import { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';
import StorePicker from '@/components/shopping/StorePicker';
import StoreCard from '@/components/shopping/StoreCard';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useStorePrices } from '@/hooks/useStorePrices';
import { chainName, chainsIn } from '@/data/stores';
import ingredientDefs from '@/data/ingredients.json';
import { compare, IngredientDef, StoreTotal } from '@/lib/pricing';
import { toNeed } from '@/lib/parseItem';
import { formatMoney } from '@/lib/format';

type Mode = 'single' | 'split';

const DEFS = ingredientDefs as IngredientDef[];

export default function CompareScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user } = useAuth();
  const { shoppingItems, assignStores } = useShoppingContext();
  const toastRef = useRef<ConfirmToastHandle>(null);
  const [mode, setMode] = useState<Mode>('single');
  const [editingStores, setEditingStores] = useState(false);

  // Only chains that exist for the chosen country, in case the saved list is older.
  const chainIds = useMemo(() => {
    const valid = new Set(user?.country ? chainsIn(user.country).map(ch => ch.id) : []);
    return (user?.stores ?? []).filter(id => valid.has(id));
  }, [user?.country, user?.stores]);

  const prices = useStorePrices(chainIds);
  const offers = prices.status === 'ready' ? prices.offers : null;

  const toBuy = useMemo(() => shoppingItems.filter(i => !i.checked), [shoppingItems]);
  const labels = useMemo(() => new Map(toBuy.map(i => [i.id, i.name])), [toBuy]);
  const result = useMemo(
    () => (offers ? compare(toBuy.map(i => toNeed(i.id, i.name, DEFS)), offers, chainIds, DEFS) : null),
    [offers, toBuy, chainIds],
  );

  function shopAt(stores: StoreTotal[]) {
    const byItem: Record<string, string> = {};
    for (const s of stores) for (const f of s.found) byItem[f.itemId] = s.chainId;
    assignStores(byItem);
    toastRef.current?.show();
  }

  const best = result?.single[0];
  const showPicker = chainIds.length === 0 || editingStores;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ConfirmToast ref={toastRef} message="Stores added to your list" icon="pricetag-outline" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to shopping list"
        >
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">
          Compare prices
        </Text>
        {chainIds.length > 0 && (
          <TouchableOpacity
            onPress={() => setEditingStores(v => !v)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={editingStores ? 'Done choosing stores' : 'Choose stores'}
          >
            <Text style={styles.headerAction}>{editingStores ? 'Done' : 'Stores'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showPicker && (
          <View style={styles.card}>
            {chainIds.length === 0 && (
              <Text style={styles.intro}>Choose where you shop to see what your list costs at each store.</Text>
            )}
            <StorePicker />
          </View>
        )}

        {chainIds.length > 0 && prices.status === 'loading' && (
          <ActivityIndicator style={styles.center} color={c.text} accessibilityLabel="Loading prices" />
        )}

        {chainIds.length > 0 && prices.status === 'error' && (
          <View style={styles.center}>
            <Text style={styles.message}>Could not load prices. Check your connection.</Text>
            <TouchableOpacity style={styles.button} onPress={prices.retry} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.buttonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {result && toBuy.length === 0 && <Text style={[styles.message, styles.center]}>Nothing left to buy on your list.</Text>}

        {result && toBuy.length > 0 && result.pricedCount === 0 && (
          <Text style={[styles.message, styles.center]}>
            None of the items on your list have a store price yet.
          </Text>
        )}

        {result && best && result.pricedCount > 0 && (
          <>
            <Text style={styles.summary}>
              {result.pricedCount} of {result.itemCount} items priced. Totals cover priced items only.
            </Text>

            <View style={styles.segment} accessibilityRole="tablist">
              {(['single', 'split'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.segmentBtn, mode === m && styles.segmentBtnOn]}
                  onPress={() => setMode(m)}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === m }}
                >
                  <Text style={[styles.segmentText, mode === m && styles.segmentTextOn]}>
                    {m === 'single' ? 'One store' : 'Best prices'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'single' &&
              result.single.map((s, i) => (
                <StoreCard
                  key={s.chainId}
                  store={s}
                  itemCount={result.itemCount}
                  labels={labels}
                  badge={i === 0 && result.single.length > 1 ? 'Cheapest' : undefined}
                  initiallyOpen={i === 0}
                  actionLabel="Shop here"
                  onAction={() => shopAt([s])}
                />
              ))}

            {mode === 'split' && !result.split && (
              <Text style={styles.message}>
                {chainIds.length < 2
                  ? 'Choose at least two stores to split your list between them.'
                  : `Splitting your list would not save at least €1. ${chainName(best.chainId)} alone is the best deal at ${formatMoney(best.totalCents)}.`}
              </Text>
            )}

            {mode === 'split' && result.split && (
              <>
                <View style={styles.splitSummary}>
                  <Text style={styles.splitTotal}>{formatMoney(result.split.totalCents)}</Text>
                  <Text style={styles.splitNote}>
                    {result.split.savingCents > 0
                      ? `${formatMoney(result.split.savingCents)} less than ${chainName(best.chainId)} alone`
                      : `Covers ${best.missing.length - result.split.missing.length} more items than ${chainName(best.chainId)} alone`}
                  </Text>
                </View>
                {result.split.stores.map(s => (
                  <StoreCard key={s.chainId} store={s} labels={labels} initiallyOpen />
                ))}
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => shopAt(result.split!.stores)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityHint="Marks each item on your list with the store to buy it at"
                >
                  <Text style={styles.buttonText}>Shop this way</Text>
                </TouchableOpacity>
              </>
            )}

            {result.unpriced.length > 0 && (
              <View style={styles.unpriced}>
                <Text style={styles.unpricedTitle}>No price found</Text>
                <Text style={styles.unpricedText}>{result.unpriced.map(id => labels.get(id)).join(', ')}</Text>
              </View>
            )}

            <Text style={styles.footnote}>
              {prices.status === 'ready' && prices.updatedAt
                ? `Prices from ${new Date(prices.updatedAt).toLocaleDateString()}. `
                : ''}
              Shelf prices can differ between branches.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    title: { ...type.title, color: c.text, flex: 1 },
    headerAction: { fontSize: 14, fontFamily: font.semibold, fontWeight: '600', color: c.text },
    content: { paddingHorizontal: 20, paddingBottom: 120 },

    card: { backgroundColor: c.surface, borderRadius: 20, padding: 18, marginBottom: 16 },
    intro: { ...type.body, color: c.textSecondary, marginBottom: 16 },

    center: { marginTop: 48, alignItems: 'center' },
    message: { ...type.body, color: c.textSecondary, textAlign: 'center', marginBottom: 16 },
    summary: { ...type.small, color: c.textMuted, marginBottom: 12 },

    segment: { flexDirection: 'row', backgroundColor: c.surface, borderRadius: 100, padding: 4, marginBottom: 16 },
    segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 100, alignItems: 'center' },
    segmentBtnOn: { backgroundColor: c.primary },
    segmentText: { fontSize: 14, fontFamily: font.semibold, fontWeight: '600', color: c.textMuted },
    segmentTextOn: { color: c.onPrimary },

    splitSummary: { marginBottom: 16 },
    splitTotal: { ...type.display, color: c.text, fontVariant: ['tabular-nums'] },
    splitNote: { ...type.body, color: c.textSecondary, marginTop: 4 },

    button: {
      backgroundColor: c.primary,
      borderRadius: 100,
      paddingVertical: 16,
      paddingHorizontal: 28,
      alignItems: 'center',
      marginTop: 4,
    },
    buttonText: { color: c.onPrimary, fontSize: 16, fontFamily: font.semibold, fontWeight: '600' },

    unpriced: { marginTop: 24 },
    unpricedTitle: { ...type.label, color: c.textMuted, marginBottom: 4 },
    unpricedText: { ...type.small, color: c.textSecondary },
    footnote: { ...type.small, color: c.textFaint, marginTop: 24 },
  });
