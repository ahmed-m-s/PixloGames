'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useClientReady } from '@/hooks/use-client-ready';
import { getClientGamesByIds } from '@/lib/client-game-catalog';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import type { Game, RecentlyPlayedEntry } from '@/types/game';

const RECENTLY_PLAYED_STORAGE_KEY = 'pixlo:recently-played';
const RECENTLY_PLAYED_UPDATED_EVENT = 'pixlo:recently-played-updated';
const RECENTLY_PLAYED_LIMIT = 12;

function subscribeToRecentlyPlayed(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(RECENTLY_PLAYED_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(RECENTLY_PLAYED_UPDATED_EVENT, onStoreChange);
  };
}

function getRecentlyPlayedSnapshot() {
  return window.localStorage.getItem(RECENTLY_PLAYED_STORAGE_KEY) ?? '[]';
}

function getServerRecentlyPlayedSnapshot() {
  return '[]';
}

function isRecentlyPlayedEntry(value: unknown): value is RecentlyPlayedEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'gameId' in value &&
    'playedAt' in value &&
    typeof value.gameId === 'string' &&
    typeof value.playedAt === 'string'
  );
}

function parseRecentlyPlayedEntries(snapshot: string) {
  try {
    const parsed = JSON.parse(snapshot);

    return Array.isArray(parsed) ? parsed.filter(isRecentlyPlayedEntry) : [];
  } catch {
    return [];
  }
}

export function useRecentlyPlayed() {
  const hasLoaded = useClientReady();
  const snapshot = useSyncExternalStore(
    subscribeToRecentlyPlayed,
    getRecentlyPlayedSnapshot,
    getServerRecentlyPlayedSnapshot
  );
  const entries = useMemo(() => parseRecentlyPlayedEntries(snapshot), [snapshot]);

  const persistEntries = useCallback(
    (updater: (currentEntries: RecentlyPlayedEntry[]) => RecentlyPlayedEntry[]) => {
      const currentEntries = readLocalStorage<RecentlyPlayedEntry[]>(
        RECENTLY_PLAYED_STORAGE_KEY,
        []
      );
      const nextEntries = updater(currentEntries).slice(0, RECENTLY_PLAYED_LIMIT);

      writeLocalStorage(RECENTLY_PLAYED_STORAGE_KEY, nextEntries);
      window.dispatchEvent(new Event(RECENTLY_PLAYED_UPDATED_EVENT));
    },
    []
  );

  const recentlyPlayedGames = useMemo(
    () => getClientGamesByIds(entries.map((entry) => entry.gameId)),
    [entries]
  );
  const recentlyPlayedItems = useMemo(
    () =>
      entries
        .map((entry) => ({
          entry,
          game: getClientGamesByIds([entry.gameId])[0]
        }))
        .filter((item): item is { entry: RecentlyPlayedEntry; game: Game } => Boolean(item.game)),
    [entries]
  );

  const addRecentlyPlayed = useCallback(
    (gameId: string) => {
      persistEntries((currentEntries) => [
        {
          gameId,
          playedAt: new Date().toISOString()
        },
        ...currentEntries.filter((entry) => entry.gameId !== gameId)
      ]);
    },
    [persistEntries]
  );

  const clearRecentlyPlayed = useCallback(() => {
    persistEntries(() => []);
  }, [persistEntries]);

  return {
    entries,
    recentlyPlayedGames,
    recentlyPlayedItems,
    hasLoaded,
    addRecentlyPlayed,
    clearRecentlyPlayed
  };
}
