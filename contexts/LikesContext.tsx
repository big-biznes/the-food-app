import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

type LikesContextValue = {
  likedIds: string[];
  isLiked: (id: string) => boolean;
  like: (id: string) => void;
  dislike: (id: string) => void;
  clear: () => void;
};

const LikesContext = createContext<LikesContextValue | null>(null);

export function LikesProvider({ children }: { children: ReactNode }) {
  const [likedIds, setLikedIds] = useState<string[]>([]);

  const like = useCallback((id: string) => {
    setLikedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const dislike = useCallback((id: string) => {
    setLikedIds(prev => prev.filter(x => x !== id));
  }, []);

  const isLiked = useCallback((id: string) => likedIds.includes(id), [likedIds]);

  const clear = useCallback(() => setLikedIds([]), []);

  const value = useMemo(
    () => ({ likedIds, isLiked, like, dislike, clear }),
    [likedIds, isLiked, like, dislike, clear],
  );

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes() {
  const ctx = useContext(LikesContext);
  if (!ctx) throw new Error('useLikes must be used within LikesProvider');
  return ctx;
}
