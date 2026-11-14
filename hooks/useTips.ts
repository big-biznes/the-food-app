import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * One-time tips, each about a feature that is easy to miss. A tip is gone for good once it is
 * closed or once the feature it points at is used; which ones are gone is kept in the profile,
 * so it holds on every device.
 */
export type TipId = 'cart' | 'refresh' | 'grid' | 'swap';

export function useTips() {
  const { user, updateProfile } = useAuth();
  const seen = user?.tipsSeen;

  const isSeen = useCallback((id: TipId) => Boolean(seen?.includes(id)), [seen]);

  const markSeen = useCallback(
    (id: TipId) => {
      if (!user || seen?.includes(id)) return;
      updateProfile({ tipsSeen: [...(seen ?? []), id] });
    },
    [user, seen, updateProfile],
  );

  return { isSeen, markSeen };
}
