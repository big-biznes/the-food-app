import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { BaseUnit, Offer } from '@/lib/pricing';

const CACHE_PREFIX = 'prices:v1:';
/** Within this window the saved copy is used as is; after it, prices are re-fetched in the background. */
const FRESH_MS = 10 * 60 * 1000;
/** Products the ingestion has not seen for this long are treated as gone. */
const STALE_MS = 7 * 24 * 60 * 60 * 1000;
/** A promo price is only trusted while the row is this fresh. */
const PROMO_FRESH_MS = 2 * 24 * 60 * 60 * 1000;

type Row = {
  chain_id: string;
  external_id: string;
  ingredient_key: string;
  name: string;
  pack_amount: number;
  pack_unit: BaseUnit;
  by_weight: boolean;
  price_cents: number;
  promo_price_cents: number | null;
  updated_at: string;
};

type Cached = { savedAt: number; offers: Offer[]; updatedAt: string | null };

export type StorePrices =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; offers: Offer[]; updatedAt: string | null };

function toOffer(r: Row, now: number): Offer {
  const promoValid = r.promo_price_cents != null && now - Date.parse(r.updated_at) < PROMO_FRESH_MS;
  return {
    chainId: r.chain_id,
    productId: r.external_id,
    ingredientKey: r.ingredient_key,
    name: r.name,
    packAmount: Number(r.pack_amount),
    packUnit: r.pack_unit,
    byWeight: r.by_weight,
    priceCents: promoValid ? (r.promo_price_cents as number) : r.price_cents,
  };
}

async function fetchOffers(chainIds: string[]): Promise<Cached> {
  const now = Date.now();
  const { data, error } = await supabase
    .from('products')
    .select('chain_id, external_id, ingredient_key, name, pack_amount, pack_unit, by_weight, price_cents, promo_price_cents, updated_at')
    .in('chain_id', chainIds)
    .gte('updated_at', new Date(now - STALE_MS).toISOString())
    .range(0, 4999);
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const updatedAt = rows.reduce<string | null>((max, r) => (!max || r.updated_at > max ? r.updated_at : max), null);
  return { savedAt: now, offers: rows.map(r => toOffer(r, now)), updatedAt };
}

/**
 * Current product prices for the given chains. The copy saved on the device is
 * shown immediately (and is what you get offline); unless it is only minutes
 * old, fresh prices are fetched and replace it.
 */
export function useStorePrices(chainIds: string[]): StorePrices & { retry: () => void } {
  const key = [...chainIds].sort().join(',');
  const [state, setState] = useState<StorePrices>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const cacheKey = CACHE_PREFIX + key;
    setState({ status: 'loading' });

    (async () => {
      let cached: Cached | null = null;
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) cached = JSON.parse(raw) as Cached;
      } catch {}
      if (cancelled) return;
      // Show the saved copy straight away. Unless it was saved minutes ago,
      // carry on and replace it with current prices.
      if (cached && cached.offers.length > 0) {
        setState({ status: 'ready', offers: cached.offers, updatedAt: cached.updatedAt });
        if (Date.now() - cached.savedAt < FRESH_MS) return;
      }
      try {
        const fresh = await fetchOffers(key.split(','));
        if (cancelled) return;
        setState({ status: 'ready', offers: fresh.offers, updatedAt: fresh.updatedAt });
        if (fresh.offers.length > 0) AsyncStorage.setItem(cacheKey, JSON.stringify(fresh)).catch(() => {});
      } catch (e) {
        console.warn('[prices] fetch failed', e);
        if (cancelled) return;
        setState(cached ? { status: 'ready', offers: cached.offers, updatedAt: cached.updatedAt } : { status: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  return { ...state, retry };
}
