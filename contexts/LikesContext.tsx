import { createContext, useCallback, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useCloudState } from '@/hooks/useCloudState';
import { useRecipes } from '@/contexts/RecipesContext';

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

const EMPTY_LIKES = { liked: [] as string[], disliked: [] as string[] };

export function LikesProvider({ children }: { children: ReactNode }) {
  const [likes, setLikes, loaded] = useCloudState<{ liked: string[]; disliked: string[] }>('likes', EMPTY_LIKES);
  const likedIds = likes.liked;
  const dislikedIds = likes.disliked;

  // Reactions to recipes that have left the cookbook are dropped, once the current
  // cookbook has been fetched (a saved copy on the device may be out of date).
  const { meals, fresh } = useRecipes();
  useEffect(() => {
    if (!fresh || !loaded) return;
    const known = new Set(meals.map(m => m.id));
    if ([...likedIds, ...dislikedIds].every(id => known.has(id))) return;
    setLikes(prev => {
      const liked = prev.liked.filter(id => known.has(id));
      const disliked = prev.disliked.filter(id => known.has(id));
      return liked.length === prev.liked.length && disliked.length === prev.disliked.length ? prev : { liked, disliked };
    });
  }, [fresh, loaded, meals, likedIds, dislikedIds, setLikes]);

  // Both lists live in one cloud document; these keep the original two-setter logic.
  const setLikedIds = useCallback(
    (update: (prev: string[]) => string[]) => setLikes(prev => ({ ...prev, liked: update(prev.liked) })),
    [setLikes],
  );
  const setDislikedIds = useCallback(
    (update: (prev: string[]) => string[]) => setLikes(prev => ({ ...prev, disliked: update(prev.disliked) })),
    [setLikes],
  );

  const like = useCallback((id: string) => {
    setLikedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setDislikedIds(prev => prev.filter(x => x !== id));
  }, [setLikedIds, setDislikedIds]);

  const dislike = useCallback((id: string) => {
    setDislikedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setLikedIds(prev => prev.filter(x => x !== id));
  }, [setLikedIds, setDislikedIds]);

  const toggle = useCallback((id: string) => {
    setLikes(prev =>
      prev.liked.includes(id)
        ? // liked → disliked
          {
            liked: prev.liked.filter(x => x !== id),
            disliked: prev.disliked.includes(id) ? prev.disliked : [...prev.disliked, id],
          }
        : // disliked → liked
          { liked: [...prev.liked, id], disliked: prev.disliked.filter(x => x !== id) },
    );
  }, [setLikes]);

  const isLiked = useCallback((id: string) => likedIds.includes(id), [likedIds]);
  const isDisliked = useCallback((id: string) => dislikedIds.includes(id), [dislikedIds]);

  const clear = useCallback(() => {
    setLikes(EMPTY_LIKES);
  }, [setLikes]);

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
