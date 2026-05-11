import { describe, expect, it } from 'vitest';
import {
  buildGameDistributionEmbedUrl,
  buildGameDistributionEmbedUrlForGame,
  extractGameDistributionId,
  GAME_DISTRIBUTION_PROVIDER_NAME,
  getGameDistributionId,
  isGameDistributionGame
} from '@/lib/game-distribution';
import { games } from '@/data/games';
import { getPlayableGameIframeSrc } from '@/lib/game-embed-url';
import {
  getGameEmbedSecurityIssues,
  getGameEmbedTrustLevel,
  getGameIframePolicy
} from '@/lib/embed-security';
import { makeGame } from '@/tests/fixtures';

function makeGameDistributionGame(
  sourceUrl = 'https://gamedistribution.com/games/mojicon-spring-connect/'
) {
  return makeGame({
    id: 'game-mojicon-spring-connect',
    slug: 'mojicon-spring-connect',
    title: 'Mojicon Spring Connect',
    embedUrl: sourceUrl,
    embedType: 'external-provider',
    sourceOrigin: 'publisher_feed',
    source: {
      mode: 'embedded',
      embedType: 'external-provider',
      providerName: GAME_DISTRIBUTION_PROVIDER_NAME,
      url: sourceUrl,
      message: 'Playable GameDistribution embed.'
    }
  });
}

describe('GameDistribution embeds', () => {
  it('extracts provider IDs from GameDistribution page URLs, embed URLs, and direct slugs', () => {
    expect(
      extractGameDistributionId('https://gamedistribution.com/games/mojicon-spring-connect/')
    ).toBe('mojicon-spring-connect');
    expect(
      extractGameDistributionId(
        'https://html5.gamedistribution.com/sudoku-master-1/?gd_sdk_referrer_url=https%3A%2F%2Fpixlogames.test%2Fgames%2Fsudoku-master'
      )
    ).toBe('sudoku-master-1');
    expect(extractGameDistributionId('pizza-maker-1')).toBe('pizza-maker-1');
    expect(extractGameDistributionId('not a safe slug')).toBeUndefined();
  });

  it('builds the official GameDistribution iframe URL with an encoded canonical game URL', () => {
    expect(
      buildGameDistributionEmbedUrl(
        'mojicon-spring-connect',
        'https://pixlogames.test/games/mojicon-spring-connect'
      )
    ).toBe(
      'https://html5.gamedistribution.com/mojicon-spring-connect/?gd_sdk_referrer_url=https%3A%2F%2Fpixlogames.test%2Fgames%2Fmojicon-spring-connect'
    );
  });

  it('resolves GameDistribution catalog entries through the provider helper', () => {
    const game = makeGameDistributionGame();

    expect(isGameDistributionGame(game)).toBe(true);
    expect(getGameDistributionId(game)).toBe('mojicon-spring-connect');
    expect(buildGameDistributionEmbedUrlForGame(game, 'https://pixlogames.test')).toBe(
      'https://html5.gamedistribution.com/mojicon-spring-connect/?gd_sdk_referrer_url=https%3A%2F%2Fpixlogames.test%2Fgames%2Fmojicon-spring-connect'
    );
    expect(getPlayableGameIframeSrc(game, 'https://pixlogames.test')).toBe(
      'https://html5.gamedistribution.com/mojicon-spring-connect/?gd_sdk_referrer_url=https%3A%2F%2Fpixlogames.test%2Fgames%2Fmojicon-spring-connect'
    );
  });

  it('resolves every GameDistribution catalog entry to the official iframe URL format', () => {
    const gameDistributionGames = games.filter(
      (game) => game.source.providerName === GAME_DISTRIBUTION_PROVIDER_NAME
    );
    const siteOrigins = [
      'http://localhost:3000',
      'https://pixlogames-git-preview.vercel.app',
      'https://pixlogames.com'
    ];

    expect(gameDistributionGames).toHaveLength(26);

    for (const game of gameDistributionGames) {
      const gameDistributionId = getGameDistributionId(game);

      expect(gameDistributionId, `${game.title} should expose a provider ID`).toBeDefined();

      for (const siteOrigin of siteOrigins) {
        const canonicalGameUrl = new URL(`/games/${game.slug}`, siteOrigin).toString();

        expect(getPlayableGameIframeSrc(game, siteOrigin), `${game.title} ${siteOrigin}`).toBe(
          `https://html5.gamedistribution.com/${gameDistributionId}/?gd_sdk_referrer_url=${encodeURIComponent(canonicalGameUrl)}`
        );
      }
    }
  });

  it('keeps actual first-party local catalog embeds on local package URLs', () => {
    const firstPartyLocalGames = games.filter(
      (game) => game.sourceOrigin === 'first_party' && game.embedType === 'html5-package'
    );

    expect(firstPartyLocalGames.length).toBeGreaterThan(0);

    for (const game of firstPartyLocalGames) {
      expect(getPlayableGameIframeSrc(game, 'https://pixlogames.test')).toBe(
        `${game.source.url}?autostart=1`
      );
    }
  });

  it('keeps GameDistribution games inside the existing third-party sandbox boundary', () => {
    const game = makeGameDistributionGame();
    const policy = getGameIframePolicy(game);

    expect(getGameEmbedTrustLevel(game)).toBe('sandboxed-third-party');
    expect(policy.sandbox.split(' ')).toContain('allow-scripts');
    expect(policy.sandbox.split(' ')).not.toContain('allow-same-origin');
    expect(policy.sandbox.split(' ')).not.toContain('allow-forms');
    expect(getGameEmbedSecurityIssues(game)).toEqual([]);
  });

  it('keeps actual GameDistribution catalog entries in the third-party sandbox boundary', () => {
    const gameDistributionGames = games.filter(
      (game) => game.source.providerName === GAME_DISTRIBUTION_PROVIDER_NAME
    );

    expect(gameDistributionGames).toHaveLength(26);

    for (const game of gameDistributionGames) {
      const policy = getGameIframePolicy(game);

      expect(getGameEmbedTrustLevel(game), game.title).toBe('sandboxed-third-party');
      expect(policy.sandbox.split(' '), game.title).not.toContain('allow-same-origin');
      expect(policy.allow, game.title).toContain('fullscreen');
      expect(getGameEmbedSecurityIssues(game), game.title).toEqual([]);
    }
  });

  it('keeps first-party local package URLs unchanged except for autostart', () => {
    const game = makeGame({
      embedUrl: '/games/endless-runner/index.html',
      embedType: 'html5-package',
      source: {
        mode: 'embedded',
        embedType: 'html5-package',
        url: '/games/endless-runner/index.html',
        message: 'Playable HTML5 embed'
      }
    });

    expect(getPlayableGameIframeSrc(game, 'https://pixlogames.test')).toBe(
      '/games/endless-runner/index.html?autostart=1'
    );
  });

  it('flags malformed GameDistribution provider URLs before publishing', () => {
    const game = makeGameDistributionGame('https://gamedistribution.com/not-a-game-page/');

    expect(getGameEmbedSecurityIssues(game)).toEqual([
      {
        field: 'source.url',
        message:
          'GameDistribution games require a valid GameDistribution game URL, embed URL, or provider slug.'
      }
    ]);
  });
});
