'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useClientReady } from '@/hooks/use-client-ready';
import { trackEvent } from '@/lib/analytics';
import { getClientGamesByIds } from '@/lib/client-game-catalog';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';

const FAVORITES_STORAGE_KEY = 'pixlo:favorites';
const FAVORITES_UPDATED_EVENT = 'pixlo:favorites-updated';

function subscribeToFavorites(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(FAVORITES_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(FAVORITES_UPDATED_EVENT, onStoreChange);
  };
}

function getFavoritesSnapshot() {
  return window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]';
}

function getServerFavoritesSnapshot() {
  return '[]';
}

function parseFavoriteIds(snapshot: string) {
  try {
    const parsed = JSON.parse(snapshot);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const hasLoaded = useClientReady();
  const snapshot = useSyncExternalStore(
    subscribeToFavorites,
    getFavoritesSnapshot,
    getServerFavoritesSnapshot
  );
  const favoriteIds = useMemo(() => parseFavoriteIds(snapshot), [snapshot]);

  const persistFavoriteIds = useCallback((updater: (currentIds: string[]) => string[]) => {
    const currentIds = readLocalStorage<string[]>(FAVORITES_STORAGE_KEY, []);
    const nextIds = updater(currentIds);

    writeLocalStorage(FAVORITES_STORAGE_KEY, nextIds);
    window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
  }, []);

  const favoriteGames = useMemo(() => getClientGamesByIds(favoriteIds), [favoriteIds]);

  const isFavorite = useCallback((gameId: string) => favoriteIds.includes(gameId), [favoriteIds]);

  const addFavorite = useCallback(
    (gameId: string) => {
      persistFavoriteIds((currentIds) =>
        currentIds.includes(gameId) ? currentIds : [gameId, ...currentIds]
      );
      trackEvent('favorite_added', { gameId });
    },
    [persistFavoriteIds]
  );

  const removeFavorite = useCallback(
    (gameId: string) => {
      persistFavoriteIds((currentIds) => currentIds.filter((id) => id !== gameId));
      trackEvent('favorite_removed', { gameId });
    },
    [persistFavoriteIds]
  );

  const toggleFavorite = useCallback(
    (gameId: string) => {
      const willRemove = favoriteIds.includes(gameId);
      persistFavoriteIds((currentIds) =>
        currentIds.includes(gameId)
          ? currentIds.filter((id) => id !== gameId)
          : [gameId, ...currentIds]
      );
      trackEvent(willRemove ? 'favorite_removed' : 'favorite_added', { gameId });
    },
    [favoriteIds, persistFavoriteIds]
  );

  return {
    favoriteGames,
    favoriteIds,
    hasLoaded,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite
  };
}
