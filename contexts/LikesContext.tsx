import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

type LikesContextValue = {
  likedIds: string[];
  dislikedIds: string[];
  isLiked: (id: string) => boolean;
  isDisliked: (id: string) => boolean;
  like: (id: string) => void;
  dislike: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
};

const LikesContext = createContext<LikesContextValue | null>(null);

export function LikesProvider({ children }: { children: ReactNode }) {
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [dislikedIds, setDislikedIds] = useState<string[]>([]);

  const like = useCallback((id: string) => {
    setLikedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setDislikedIds(prev => prev.filter(x => x !== id));
  }, []);

  const dislike = useCallback((id: string) => {
    setDislikedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setLikedIds(prev => prev.filter(x => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setLikedIds(prev => {
      if (prev.includes(id)) {
        // liked → disliked
        setDislikedIds(d => (d.includes(id) ? d : [...d, id]));
        return prev.filter(x => x !== id);
      } else {
        // disliked → liked
        setDislikedIds(d => d.filter(x => x !== id));
        return [...prev, id];
      }
    });
  }, []);

  const isLiked = useCallback((id: string) => likedIds.includes(id), [likedIds]);
  const isDisliked = useCallback((id: string) => dislikedIds.includes(id), [dislikedIds]);

  const clear = useCallback(() => {
    setLikedIds([]);
    setDislikedIds([]);
  }, []);

  const value = useMemo(
    () => ({ likedIds, dislikedIds, isLiked, isDisliked, like, dislike, toggle, clear }),
    [likedIds, dislikedIds, isLiked, isDisliked, like, dislike, toggle, clear],
  );

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes() {
  const ctx = useContext(LikesContext);
  if (!ctx) throw new Error('useLikes must be used within LikesProvider');
  return ctx;
}
