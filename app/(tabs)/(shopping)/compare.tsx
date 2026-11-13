import { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Animated, StyleSheet} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useShoppingContext } from '@/contexts/ShoppingContext';
import ConfirmToast, { ConfirmToastHandle } from '@/components/ConfirmToast';
import StorePicker from '@/components/shopping/StorePicker';
import StoreCard from '@/components/shopping/StoreCard';
import SegmentTabs from '@/components/SegmentTabs';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useStorePrices } from '@/hooks/useStorePrices';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';
import { chainName, chainsIn } from '@/data/stores';
import ingredientDefs from '@/data/ingredients.json';
import { compare, IngredientDef, StoreTotal } from '@/lib/pricing';
import { toNeed } from '@/lib/parseItem';
import { formatMoney } from '@/lib/format';

const DEFS = ingredientDefs as IngredientDef[];

const MODE_KEYS = ['single', 'split'] as const;

const MODES = [
  { key: 'single', label: 'One store' },
  { key: 'split', label: 'Best prices' },
] as const;

export default function CompareScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user } = useAuth();
  const { shoppingItems, assignStores } = useShoppingContext();
  const toastRef = useRef<ConfirmToastHandle>(null);
  const { active: mode, switchTab: switchMode, progress, translateX, panHandlers, width } = useSwipeTabs(MODE_KEYS);
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
  const ready = result != null && best != null && result.pricedCount > 0;

  const picker = (chainIds.length === 0 || editingStores) && (
    <View style={styles.card}>
      {chainIds.length === 0 && (
        <Text style={styles.intro}>Choose where you shop to see what your list costs at each store.</Text>
      )}
      <StorePicker />
    </View>
  );

  // Shown under both panels.
  const footer = result && (
    <>
      {result.unpriced.length > 0 && (
        <View style={styles.unpriced}>
          <Text style={styles.unpricedTitle}>No price found at your stores</Text>
          <Text style={styles.unpricedText}>{result.unpriced.map(id => labels.get(id)).join(', ')}</Text>
          <Text style={styles.unpricedHint}>The stores may still sell these; we just have no prices for them.</Text>
        </View>
      )}
      <Text style={styles.footnote}>
        {prices.status === 'ready' && prices.updatedAt
          ? `Prices from ${new Date(prices.updatedAt).toLocaleDateString()}. `
          : ''}
        Shelf prices can differ between branches.
      </Text>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ConfirmToast ref={toastRef} message="Stores added to your list" icon="pricetag-outline" />

      <View style={styles.header}>
        <PressableScale
          style={styles.closeBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close price comparison"
        >
          <Ionicons name="close" size={22} color={c.text} />
        </PressableScale>
        <Text style={styles.title} accessibilityRole="header">
          Compare prices
        </Text>
        {chainIds.length > 0 && (
          <PressableScale
            onPress={() => setEditingStores(v => !v)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={editingStores ? 'Done choosing stores' : 'Choose stores'}
          >
            <Text style={styles.headerAction}>{editingStores ? 'Done' : 'Stores'}</Text>
          </PressableScale>
        )}
      </View>

      {ready ? (
        <>
          <View style={styles.fixed}>
            {picker}
            <Text style={styles.summary}>
              {result.pricedCount} of {result.itemCount} items priced. Totals cover priced items only.
            </Text>
          </View>
          <SegmentTabs tabs={MODES} active={mode} onChange={switchMode} progress={progress} />

          {/* Horizontally sliding panels, same as List / Pantry */}
          <View style={styles.panels} {...panHandlers}>
            <Animated.View style={[styles.slider, { width: width * 2, transform: [{ translateX }] }]}>
              <ScrollView
                style={{ width }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                importantForAccessibility={mode === 'single' ? 'auto' : 'no-hide-descendants'}
                accessibilityElementsHidden={mode !== 'single'}
              >
                {result.single.map((s, i) => (
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
                {footer}
              </ScrollView>

              <ScrollView
                style={{ width }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                importantForAccessibility={mode === 'split' ? 'auto' : 'no-hide-descendants'}
                accessibilityElementsHidden={mode !== 'split'}
              >
                {result.split ? (
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
                    <PressableScale
                      style={styles.button}
                      onPress={() => shopAt(result.split!.stores)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityHint="Marks each item on your list with the store to buy it at"
                    >
                      <Text style={styles.buttonText}>Shop this way</Text>
                    </PressableScale>
                  </>
                ) : (
                  <Text style={styles.message}>
                    {chainIds.length < 2
                      ? 'Choose at least two stores to split your list between them.'
                      : `Splitting your list would not save at least €1. ${chainName(best.chainId)} alone is the best deal at ${formatMoney(best.totalCents)}.`}
                  </Text>
                )}
                {footer}
              </ScrollView>
            </Animated.View>
          </View>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {picker}

          {chainIds.length > 0 && prices.status === 'loading' && (
            <ActivityIndicator style={styles.center} color={c.text} accessibilityLabel="Loading prices" />
          )}

          {chainIds.length > 0 && prices.status === 'error' && (
            <View style={styles.center}>
              <Text style={styles.message}>Could not load prices. Check your connection.</Text>
              <PressableScale style={styles.button} onPress={prices.retry} activeOpacity={0.85} accessibilityRole="button">
                <Text style={styles.buttonText}>Try again</Text>
              </PressableScale>
            </View>
          )}

          {result && toBuy.length === 0 && (
            <Text style={[styles.message, styles.center]}>Nothing left to buy on your list.</Text>
          )}

          {result && toBuy.length > 0 && result.pricedCount === 0 && (
            <Text style={[styles.message, styles.center]}>
              None of the items on your list have a store price yet.
            </Text>
          )}
        </ScrollView>
      )}
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
      paddingTop: 12,
      paddingBottom: 16,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { ...type.title, color: c.text, flex: 1 },
    headerAction: { fontSize: 14, fontFamily: font.semibold, fontWeight: '600', color: c.text },
    content: { paddingHorizontal: 20, paddingBottom: 120 },

    card: { backgroundColor: c.surface, borderRadius: 20, padding: 18, marginBottom: 16 },
    intro: { ...type.body, color: c.textSecondary, marginBottom: 16 },

    center: { marginTop: 48, alignItems: 'center' },
    message: { ...type.body, color: c.textSecondary, textAlign: 'center', marginBottom: 16 },
    summary: { ...type.small, color: c.textMuted, marginBottom: 12 },

    fixed: { paddingHorizontal: 20 },
    panels: { flex: 1, overflow: 'hidden' },
    slider: { flex: 1, flexDirection: 'row' },

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
    unpricedHint: { ...type.small, color: c.textMuted, marginTop: 4 },
    footnote: { ...type.small, color: c.textFaint, marginTop: 24 },
  });
