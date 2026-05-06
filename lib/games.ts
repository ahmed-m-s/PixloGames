import { categories, games as canonicalGames } from '@/data/games';
import {
  getGameBySlugFromRepository,
  listGames as listGamesFromRepository,
  type GameQuery
} from '@/lib/repositories/content-repository';
import type { Game, GameCategory } from '@/types/game';

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

function canUseCanonicalFallback(game: Game, query: GameQuery = {}) {
  if (query.includeInternal) {
    return true;
  }

  return game.visibility === (query.visibility ?? 'public');
}

function sortCanonicalFallbackGames(a: Game, b: Game) {
  return (
    b.featuredPriority - a.featuredPriority || b.plays - a.plays || a.title.localeCompare(b.title)
  );
}

function applyCanonicalThumbnailOverride(game: Game) {
  const canonicalGame = canonicalGames.find(
    (candidate) => candidate.id === game.id || candidate.slug === game.slug
  );

  if (
    canonicalGame?.sourceOrigin !== 'first_party' ||
    !canonicalGame.thumbnail.startsWith('/')
  ) {
    return game;
  }

  return {
    ...game,
    thumbnail: canonicalGame.thumbnail
  };
}

function mergeCanonicalFallbackGames(repositoryGames: Game[], query: GameQuery = {}) {
  const normalizedRepositoryGames = repositoryGames.map(applyCanonicalThumbnailOverride);
  const gamesById = new Set(normalizedRepositoryGames.map((game) => game.id));
  const gamesBySlug = new Set(normalizedRepositoryGames.map((game) => game.slug));
  const missingCanonicalGames = canonicalGames
    .filter(
      (game) =>
        canUseCanonicalFallback(game, query) &&
        !gamesById.has(game.id) &&
        !gamesBySlug.has(game.slug)
    )
    .sort(sortCanonicalFallbackGames);

  return [...normalizedRepositoryGames, ...missingCanonicalGames];
}

export async function listGames(query: GameQuery = {}) {
  const repositoryGames = await listGamesFromRepository(query);

  return mergeCanonicalFallbackGames(repositoryGames, query);
}

export async function getGameBySlug(slug: string) {
  const repositoryGame = await getGameBySlugFromRepository(slug);

  if (repositoryGame) {
    return applyCanonicalThumbnailOverride(repositoryGame);
  }

  return canonicalGames.find((game) => game.slug === slug && canUseCanonicalFallback(game));
}

export async function getGamesByIds(ids: string[]) {
  const games = await listGames({ includeInternal: true });
  const gameById = new Map(games.map((game) => [game.id, game]));

  return ids.map((id) => gameById.get(id)).filter((game): game is Game => Boolean(game));
}

export async function getRelatedGames(game: Game, limit = 4) {
  const games = await listGames();

  return games
    .filter((candidate) => candidate.id !== game.id)
    .map((candidate) => {
      return {
        game: candidate,
        score: getRelatedGameScore(game, candidate)
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.game.isEditorsPick) - Number(a.game.isEditorsPick) ||
        Number(b.game.isNew) - Number(a.game.isNew) ||
        b.game.featuredWeight - a.game.featuredWeight ||
        b.game.rating - a.game.rating ||
        b.game.plays - a.game.plays
    )
    .slice(0, limit)
    .map(({ game: relatedGame }) => relatedGame);
}

function getRelatedGameScore(game: Game, candidate: Game) {
  const sharedTags = candidate.tags.filter((tag) => game.tags.includes(tag)).length;
  const sharedPlatforms = candidate.supportedPlatforms.filter((platform) =>
    game.supportedPlatforms.includes(platform)
  ).length;
  const sharedKeyboardControls = candidate.controls.keyboard.filter((control) =>
    game.controls.keyboard.includes(control)
  ).length;

  let score = 0;

  if (candidate.category === game.category) score += 5;
  score += sharedTags * 2;
  score += Math.min(sharedPlatforms, 3) * 0.75;

  if (candidate.sourceOrigin === game.sourceOrigin) score += 1.5;
  if (candidate.sourceOrigin === 'first_party') score += 1;
  if (candidate.mobileSupported && game.mobileSupported) score += 1.25;
  if (candidate.difficulty === game.difficulty) score += 1;
  if (candidate.playMode === game.playMode) score += 1;
  if (candidate.orientation === game.orientation) score += 0.75;
  if (candidate.hasRealEmbed) score += 0.75;
  if (candidate.controls.touch && game.controls.touch) score += 0.5;
  if (candidate.controls.mouse && game.controls.mouse) score += 0.5;
  if (sharedKeyboardControls > 0) score += 0.5;
  if (candidate.isEditorsPick) score += 1;
  if (candidate.isNew) score += 0.75;
  if (candidate.isTrending) score += 0.75;

  return score;
}

export async function getGamesByCategory(category: GameCategory) {
  const games = await listGames();

  return games.filter((game) => game.category === category);
}

export async function searchGames(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const games = await listGames();

  return games.filter((game) => {
    const searchableValues = [
      game.title,
      game.category,
      game.shortDescription,
      ...game.tags,
      game.isNew ? 'new' : '',
      game.isTrending ? 'hot trending' : '',
      game.isEditorsPick ? 'editor editors pick curated' : '',
      game.isMultiplayer ? 'multiplayer' : ''
    ].map((value) => value.toLowerCase());

    return searchableValues.some((value) => value.includes(normalizedQuery));
  });
}
