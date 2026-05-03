import { isPlayableCatalogGame } from '@/lib/catalog-semantics';
import type { Game } from '@/types/game';

export function dedupeGamesById(games: Game[]) {
  const seen = new Set<string>();

  return games.filter((game) => {
    if (seen.has(game.id)) {
      return false;
    }

    seen.add(game.id);
    return true;
  });
}

export function getPlayableHomepageGames(games: Game[]) {
  return games.filter((game) => {
    return (
      game.visibility === 'public' && game.qaStatus === 'passed' && isPlayableCatalogGame(game)
    );
  });
}

export function resolveHomepageCollectionGames(gameIds: string[], games: Game[]) {
  const playableGamesById = new Map(getPlayableHomepageGames(games).map((game) => [game.id, game]));
  const seen = new Set<string>();
  const resolvedGames: Game[] = [];

  for (const gameId of gameIds) {
    if (seen.has(gameId)) {
      continue;
    }

    const game = playableGamesById.get(gameId);

    if (!game) {
      continue;
    }

    seen.add(gameId);
    resolvedGames.push(game);
  }

  return resolvedGames;
}

export function pickHomepageLane(
  games: Game[],
  seenGameIds: Set<string>,
  {
    limit,
    minVisible = Math.min(3, limit)
  }: {
    limit: number;
    minVisible?: number;
  }
) {
  const sourceGames = dedupeGamesById(games);
  const picked = sourceGames.filter((game) => !seenGameIds.has(game.id)).slice(0, limit);

  if (picked.length < minVisible) {
    const pickedIds = new Set(picked.map((game) => game.id));
    const fallbackGames = sourceGames
      .filter((game) => !pickedIds.has(game.id))
      .slice(0, Math.min(limit - picked.length, minVisible - picked.length));

    picked.push(...fallbackGames);
  }

  picked.forEach((game) => seenGameIds.add(game.id));

  return picked;
}
