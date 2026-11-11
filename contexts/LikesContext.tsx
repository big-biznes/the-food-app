import { createContext, useCallback, useContext, useMemo, ReactNode } from 'react';
import { useCloudState } from '@/hooks/useCloudState';

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
  const [likes, setLikes] = useCloudState<{ liked: string[]; disliked: string[] }>('likes', EMPTY_LIKES);
  const likedIds = likes.liked;
  const dislikedIds = likes.disliked;

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
