import {
  getCollectionBySlugFromRepository,
  listCollections,
  listCollectionsForGame,
  resolveCollectionGames
} from '@/lib/repositories/content-repository';
import { isPlayableCatalogGame } from '@/lib/catalog-semantics';
import { listGames } from '@/lib/games';
import { getPlayableHomepageGames, resolveHomepageCollectionGames } from '@/lib/homepage-surfacing';

export async function getPublicGames() {
  return listGames();
}

export async function getCollectionBySlug(slug: string) {
  return getCollectionBySlugFromRepository(slug);
}

export async function getCollectionGamesBySlug(slug: string) {
  const collection = await getCollectionBySlugFromRepository(slug);

  return collection ? resolveCollectionGames(collection) : [];
}

export async function getHomepageData() {
  const [games, collections] = await Promise.all([listGames(), listCollections()]);
  const playableGames = getPlayableHomepageGames(games);
  const collectionGames = new Map(
    collections.map((collection) => [
      collection.slug,
      resolveHomepageCollectionGames(collection.gameIds, playableGames)
    ])
  );
  const homepageEligibleGames = playableGames.sort(
    (a, b) => b.featuredPriority - a.featuredPriority || b.plays - a.plays
  );

  return {
    allGames: games,
    trendingGames: collectionGames.get('trending-now') ?? [],
    quickPlayGames: collectionGames.get('quick-plays') ?? [],
    touchFriendlyGames: collectionGames.get('touch-friendly-picks') ?? [],
    newGames: collectionGames.get('new-releases') ?? [],
    multiplayerGames: collectionGames.get('multiplayer-spotlight') ?? [],
    editorsPickGames: collectionGames.get('editors-picks') ?? [],
    homepageEligibleGames
  };
}

export async function getGameCollections(gameId: string) {
  return listCollectionsForGame(gameId);
}

export async function getHomepageCollections() {
  const [collections, games] = await Promise.all([listCollections(), listGames()]);
  const playableGames = getPlayableHomepageGames(games);

  return collections
    .filter(
      (collection) =>
        collection.visibility === 'public' &&
        collection.placement.includes('homepage') &&
        resolveHomepageCollectionGames(collection.gameIds, playableGames).length > 0
    )
    .sort((a, b) => b.priority - a.priority);
}

export async function getHomepageEligibleGames() {
  const games = await getPublicGames();

  return getPlayableHomepageGames(games).sort(
    (a, b) => b.featuredPriority - a.featuredPriority || b.plays - a.plays
  );
}

export async function getSponsoredEligibleGames() {
  const games = await getPublicGames();

  return games
    .filter(
      (game) => isPlayableCatalogGame(game) && game.adSafe && game.moderationStatus === 'approved'
    )
    .sort(
      (a, b) => b.sponsoredPriority - a.sponsoredPriority || b.featuredWeight - a.featuredWeight
    );
}
