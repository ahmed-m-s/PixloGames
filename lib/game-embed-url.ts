import {
  buildGameDistributionEmbedUrlForGame,
  isGameDistributionGame
} from '@/lib/game-distribution';
import type { Game } from '@/types/game';

function withAutostart(url: string) {
  const [pathAndQuery, hash] = url.split('#');
  const separator = pathAndQuery.includes('?') ? '&' : '?';

  return `${pathAndQuery}${separator}autostart=1${hash ? `#${hash}` : ''}`;
}

function getCurrentBrowserOrigin() {
  return typeof window === 'undefined' ? undefined : window.location.origin;
}

export function getPlayableGameIframeSrc(game: Game, siteOrigin = getCurrentBrowserOrigin()) {
  if (game.source.mode !== 'embedded' || !game.source.url) {
    return '';
  }

  if (isGameDistributionGame(game)) {
    return siteOrigin ? (buildGameDistributionEmbedUrlForGame(game, siteOrigin) ?? '') : '';
  }

  if (game.embedType === 'html5-package') {
    return withAutostart(game.source.url);
  }

  return game.source.url;
}
