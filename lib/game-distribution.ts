import type { Game } from '@/types/game';

export const GAME_DISTRIBUTION_PROVIDER_NAME = 'GameDistribution';

const gameDistributionGameUrlHost = 'gamedistribution.com';
const gameDistributionEmbedUrlHost = 'html5.gamedistribution.com';
const gameDistributionIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type GameDistributionInput = Pick<Game, 'embedUrl' | 'slug' | 'source'>;

function normalizeGameDistributionId(value: string) {
  const normalized = value.trim().replace(/^\/+|\/+$/g, '');

  return gameDistributionIdPattern.test(normalized) ? normalized : undefined;
}

export function isGameDistributionGame(game: Pick<Game, 'source'>) {
  return (
    game.source.providerName?.trim().toLowerCase() === GAME_DISTRIBUTION_PROVIDER_NAME.toLowerCase()
  );
}

export function extractGameDistributionId(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const directId = normalizeGameDistributionId(trimmed);

  if (directId) {
    return directId;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (host === gameDistributionGameUrlHost && pathParts[0] === 'games') {
      return normalizeGameDistributionId(pathParts[1] ?? '');
    }

    if (host === gameDistributionEmbedUrlHost) {
      return normalizeGameDistributionId(pathParts[0] ?? '');
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function getGameDistributionId(game: Pick<GameDistributionInput, 'embedUrl' | 'source'>) {
  return extractGameDistributionId(game.source.url) ?? extractGameDistributionId(game.embedUrl);
}

export function getCanonicalGameUrl(game: Pick<GameDistributionInput, 'slug'>, siteOrigin: string) {
  try {
    return new URL(`/games/${game.slug}`, siteOrigin).toString();
  } catch {
    return undefined;
  }
}

export function buildGameDistributionEmbedUrl(
  gameDistributionId: string,
  canonicalGameUrl: string
) {
  const normalizedId = normalizeGameDistributionId(gameDistributionId);

  if (!normalizedId) {
    throw new Error('GameDistribution ID must be a URL-safe slug.');
  }

  const canonicalUrl = new URL(canonicalGameUrl).toString();

  return `https://${gameDistributionEmbedUrlHost}/${normalizedId}/?gd_sdk_referrer_url=${encodeURIComponent(canonicalUrl)}`;
}

export function buildGameDistributionEmbedUrlForGame(
  game: GameDistributionInput,
  siteOrigin: string
) {
  const gameDistributionId = getGameDistributionId(game);
  const canonicalGameUrl = getCanonicalGameUrl(game, siteOrigin);

  if (!gameDistributionId || !canonicalGameUrl) {
    return undefined;
  }

  return buildGameDistributionEmbedUrl(gameDistributionId, canonicalGameUrl);
}
