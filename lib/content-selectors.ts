import {
  getCollectionBySlugFromRepository,
  listCollections,
  listCollectionsForGame,
  resolveCollectionGames
} from '@/lib/repositories/content-repository';
import { listGames } from '@/lib/games';

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
  const gameById = new Map(games.map((game) => [game.id, game]));
  const collectionGames = new Map(
    collections.map((collection) => [
      collection.slug,
      collection.gameIds
        .map((gameId) => gameById.get(gameId))
        .filter((game): game is NonNullable<typeof game> => Boolean(game))
    ])
  );
  const homepageEligibleGames = games
    .filter((game) => game.visibility === 'public' && game.qaStatus === 'passed')
    .sort((a, b) => b.featuredPriority - a.featuredPriority || b.plays - a.plays);

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
  const collections = await listCollections();

  return collections
    .filter(
      (collection) =>
        collection.visibility === 'public' && collection.placement.includes('homepage')
    )
    .sort((a, b) => b.priority - a.priority);
}

export async function getHomepageEligibleGames() {
  const games = await getPublicGames();

  return games
    .filter((game) => game.visibility === 'public' && game.qaStatus === 'passed')
    .sort((a, b) => b.featuredPriority - a.featuredPriority || b.plays - a.plays);
}

export async function getSponsoredEligibleGames() {
  const games = await getPublicGames();

  return games
    .filter((game) => game.adSafe && game.moderationStatus === 'approved')
    .sort(
      (a, b) => b.sponsoredPriority - a.sponsoredPriority || b.featuredWeight - a.featuredWeight
    );
}
