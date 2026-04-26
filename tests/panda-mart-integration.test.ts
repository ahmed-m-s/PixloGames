import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { gameCollections } from '@/data/collections';
import { categories, games } from '@/data/games';
import { browseGames } from '@/lib/browse';
import { validateSubmissionPayload } from '@/lib/server-validation';
import type { BrowseState } from '@/types/browse';

const projectRoot = process.cwd();
const pandaMartSlug = 'panda-mart';
const pandaMartId = 'game-panda-mart';

const defaultBrowseState: BrowseState = {
  sort: 'featured',
  multiplayer: false,
  mobile: false,
  isNew: false,
  editorsPick: false
};

function getPandaMart() {
  const game = games.find((candidate) => candidate.slug === pandaMartSlug);

  expect(game, 'Panda Mart should exist in canonical game data').toBeDefined();

  return game!;
}

function publicFileExists(publicPath: string) {
  return existsSync(path.join(projectRoot, 'public', publicPath.replace(/^\/+/, '')));
}

describe('Panda Mart catalog integration', () => {
  it('registers Panda Mart as a first-party playable local HTML5 game', () => {
    const game = getPandaMart();

    expect(game).toMatchObject({
      id: pandaMartId,
      title: 'Panda Mart',
      category: 'Management',
      sourceOrigin: 'first_party',
      embedType: 'html5-package',
      hasRealEmbed: true,
      visibility: 'public',
      status: 'published',
      qaStatus: 'passed',
      mobileSupported: true,
      isEditorsPick: true,
      isTrending: true
    });
    expect(game.embedUrl).toBe('/playable-games/panda-mart/index.html');
    expect(game.embedUrl).not.toBe('/games/panda-mart/index.html');
    expect(game.source).toMatchObject({
      mode: 'embedded',
      embedType: 'html5-package',
      url: game.embedUrl
    });
    expect(game.controls.keyboard).toEqual(
      expect.arrayContaining(['WASD', 'Arrow keys', 'E', 'Space'])
    );
    expect(game.controls.touch).toBe(true);
    expect(game.supportedPlatforms).toEqual(
      expect.arrayContaining(['desktop', 'mobile', 'tablet'])
    );
  });

  it('keeps the Panda Mart package and artwork available at the expected public paths', () => {
    const game = getPandaMart();
    const packageFiles = [
      '/playable-games/panda-mart/index.html',
      '/playable-games/panda-mart/style.css',
      '/playable-games/panda-mart/game.js',
      game.thumbnail,
      game.coverImage
    ];

    for (const publicPath of packageFiles) {
      expect(publicFileExists(publicPath), `Missing Panda Mart asset: ${publicPath}`).toBe(true);
    }
  });

  it('keeps Panda Mart discoverable through category, search, and curated collections', () => {
    const management = categories.find((category) => category.name === 'Management');
    const collectionIds = new Set(
      gameCollections
        .filter((collection) => collection.gameIds.includes(pandaMartId))
        .map((collection) => collection.id)
    );

    expect(management?.slug).toBe('management');
    expect(collectionIds).toEqual(
      new Set(['collection-trending-now', 'collection-editors-picks', 'collection-new-releases'])
    );
    expect(
      browseGames(games, { ...defaultBrowseState, q: 'panda' }).map((game) => game.slug)
    ).toContain(pandaMartSlug);
    expect(
      browseGames(games, { ...defaultBrowseState, category: 'Management' }).map((game) => game.slug)
    ).toContain(pandaMartSlug);
  });

  it('accepts Management as a supported developer submission category', () => {
    const result = validateSubmissionPayload({
      title: 'Cozy Stockroom',
      shortDescription: 'A small shop management game for quick browser sessions.',
      description:
        'Cozy Stockroom is a lightweight HTML5 management game with shop stocking, simple upgrades, and mobile-friendly controls prepared for PixloGames review.',
      tags: 'Management, Shop, Casual',
      developerName: 'Forest Byte Studio',
      contactEmail: 'team@example.com',
      category: 'Management',
      supportedPlatforms: ['desktop', 'mobile'],
      sourceType: 'html5-package',
      buildUrl: 'https://example.com/cozy-stockroom.zip',
      thumbnailUrl: 'https://example.com/thumbnail.png',
      coverImageUrl: 'https://example.com/cover.png',
      termsAccepted: 'on'
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.category).toBe('Management');
      expect(result.data.tags).toEqual(['management', 'shop', 'casual']);
    }
  });
});
