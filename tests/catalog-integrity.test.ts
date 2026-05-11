import { existsSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GameDetail } from '@/components/game/game-detail';
import { GameMetaRow } from '@/components/game/game-meta-row';
import { BrowseControls } from '@/components/ui/browse-controls';
import { gameCollections } from '@/data/collections';
import { gamePageContentByTitle, targetGamePageContentNames } from '@/data/game-page-content';
import { categories, games } from '@/data/games';
import { isPlayableLocalGame } from '@/lib/catalog-semantics';
import { GAME_DISTRIBUTION_PROVIDER_NAME } from '@/lib/game-distribution';
import { createGameDetailPageMetadata } from '@/lib/game-page-metadata';
import { mapCollectionToDbData, mapGameToDbData } from '@/lib/repositories/prisma-mappers';
import { makeGame } from '@/tests/fixtures';
import type { Game } from '@/types/game';

const projectRoot = process.cwd();
const expectedStaticCatalogCount = 37;
const expectedGameDistributionGameCount = 26;
const removedPreviewSlugs = [
  'rocket-rivals',
  'neon-driftline',
  'shadow-sprint',
  'tile-tempo',
  'cabinet-clash',
  'orbit-raiders',
  'crypt-circuits',
  'forest-runner',
  'goalstorm',
  'micro-mayhem',
  'battle-bounce',
  'skyforge-quest'
] as const;
const promptListedPixloOriginalSlugs = [
  'endless-runner',
  'memory-match',
  'block-puzzle',
  'number-merge',
  'panda-mart'
] as const;
const expectedFirstPartyLocalSlugs = [
  '2048',
  'block-puzzle',
  'brick-breaker',
  'color-sort',
  'endless-runner',
  'flappy-flight',
  'memory-match',
  'number-merge',
  'panda-mart',
  'snake',
  'tic-tac-toe'
] as const;
const localPackageFiles = ['index.html', 'style.css', 'game.js'] as const;
const localArtworkFields = ['thumbnail', 'coverImage'] as const;
const localPackageBasePaths = ['/games', '/playable-games'] as const;

function expectUnique(values: string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);

  expect(duplicates, `${label} must be unique`).toEqual([]);
}

function publicFileExists(publicPath: string) {
  return existsSync(path.join(projectRoot, 'public', publicPath.replace(/^\/+/, '')));
}

function isExternalAsset(value: string) {
  return value.startsWith('https://') || value.startsWith('http://');
}

function isLocalHtml5Package(game: Game) {
  return (
    game.embedType === 'html5-package' ||
    localPackageBasePaths.some((basePath) => game.embedUrl.startsWith(`${basePath}/`))
  );
}

function normalizeGameTitle(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getExpectedLocalPackageUrls(game: Game) {
  return localPackageBasePaths.map((basePath) => `${basePath}/${game.slug}/index.html`);
}

function getLocalPackageRoot(game: Game) {
  return game.embedUrl.replace(/\/index\.html$/, '');
}

describe('catalog integrity', () => {
  it('keeps game and collection identifiers unique and convention-safe', () => {
    expectUnique(
      games.map((game) => game.id),
      'game ids'
    );
    expectUnique(
      games.map((game) => game.slug),
      'game slugs'
    );
    expectUnique(
      games.map((game) => normalizeGameTitle(game.title)),
      'game titles'
    );
    expectUnique(
      gameCollections.map((collection) => collection.id),
      'collection ids'
    );
    expectUnique(
      gameCollections.map((collection) => collection.slug),
      'collection slugs'
    );

    for (const game of games) {
      expect(game.id, `${game.title} id should derive from its slug`).toBe(`game-${game.slug}`);
      expect(game.slug, `${game.title} slug should be URL-safe`).toMatch(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      );
    }

    for (const collection of gameCollections) {
      expect(collection.id, `${collection.title} id should derive from its slug`).toBe(
        `collection-${collection.slug}`
      );
      expect(collection.slug, `${collection.title} slug should be URL-safe`).toMatch(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      );
      expectUnique(collection.gameIds, `${collection.title} game ids`);
    }
  });

  it('keeps the expected static catalog and provider counts', () => {
    const gameDistributionGames = games.filter(
      (game) => game.source.providerName === GAME_DISTRIBUTION_PROVIDER_NAME
    );

    expect(games).toHaveLength(expectedStaticCatalogCount);
    expect(gameDistributionGames).toHaveLength(expectedGameDistributionGameCount);
    expect(targetGamePageContentNames).toHaveLength(31);
    expect(games.filter((game) => game.source.mode === 'preview')).toHaveLength(0);
  });

  it('keeps removed preview-entry slugs out of the static catalog', () => {
    const gameSlugs = new Set(games.map((game) => game.slug));

    for (const slug of removedPreviewSlugs) {
      expect(gameSlugs.has(slug), `${slug} should be removed from the canonical catalog`).toBe(
        false
      );
    }
  });

  it('keeps launch metrics reset across all remaining games', () => {
    for (const game of games) {
      expect(game.plays, `${game.title} play count should be reset`).toBe(0);
      expect(game.rating, `${game.title} rating should be reset`).toBe(0);
    }
  });

  it('preserves prompt-listed Pixlo Originals and first-party local playable embeds', () => {
    const gamesBySlug = new Map(games.map((game) => [game.slug, game]));
    const firstPartyLocalSlugs = games
      .filter((game) => game.sourceOrigin === 'first_party' && game.embedType === 'html5-package')
      .map((game) => game.slug)
      .sort((left, right) => left.localeCompare(right));

    expect(firstPartyLocalSlugs).toEqual([...expectedFirstPartyLocalSlugs]);

    for (const slug of promptListedPixloOriginalSlugs) {
      const game = gamesBySlug.get(slug);

      expect(game, `${slug} should remain in the canonical catalog`).toBeDefined();
      if (!game) continue;

      expect(game.sourceOrigin, `${slug} should stay first-party`).toBe('first_party');
      expect(game.embedType, `${slug} should stay a local HTML5 package`).toBe('html5-package');
      expect(game.source.mode, `${slug} should remain embedded`).toBe('embedded');
      expect(game.source.providerName, `${slug} should not be a remote provider embed`).not.toBe(
        GAME_DISTRIBUTION_PROVIDER_NAME
      );
      expect(
        getExpectedLocalPackageUrls(game),
        `${slug} should keep its local/self-hosted package URL`
      ).toContain(game.embedUrl);
      expect(game.source.url, `${slug} source URL should match local embed URL`).toBe(
        game.embedUrl
      );
    }
  });

  it('keeps collections and declared game memberships pointed at real catalog entries', () => {
    const gameIds = new Set(games.map((game) => game.id));
    const collectionIds = new Set(gameCollections.map((collection) => collection.id));
    const collectionById = new Map(
      gameCollections.map((collection) => [collection.id, collection])
    );

    for (const collection of gameCollections) {
      const missingGameIds = collection.gameIds.filter((gameId) => !gameIds.has(gameId));

      expect(missingGameIds, `${collection.title} references unknown games`).toEqual([]);
    }

    for (const game of games) {
      const missingCollectionIds = game.collectionIds.filter(
        (collectionId) => !collectionIds.has(collectionId)
      );
      const unseededCollectionIds = game.collectionIds.filter(
        (collectionId) => !collectionById.get(collectionId)?.gameIds.includes(game.id)
      );

      expect(missingCollectionIds, `${game.title} declares unknown collections`).toEqual([]);
      expect(
        unseededCollectionIds,
        `${game.title} declares memberships that seed data would not create`
      ).toEqual([]);
    }
  });

  it('keeps local HTML5 game packages and artwork available on disk', () => {
    for (const game of games.filter(isLocalHtml5Package)) {
      const packagePublicRoot = getLocalPackageRoot(game);
      const packageRoot = path.join(projectRoot, 'public', packagePublicRoot.replace(/^\/+/, ''));

      expect(
        getExpectedLocalPackageUrls(game),
        `${game.title} should use an approved local package URL`
      ).toContain(game.embedUrl);
      expect(
        isPlayableLocalGame(game),
        `${game.title} should remain classified as a playable local package`
      ).toBe(true);
      expect(game.hasRealEmbed, `${game.title} should be marked playable`).toBe(true);
      expect(game.source.mode, `${game.title} source mode should match playable package`).toBe(
        'embedded'
      );
      expect(game.source.url, `${game.title} source URL should match embed URL`).toBe(
        game.embedUrl
      );

      for (const fileName of localPackageFiles) {
        expect(
          existsSync(path.join(packageRoot, fileName)),
          `${game.title} is missing public${packagePublicRoot}/${fileName}`
        ).toBe(true);
      }

      for (const field of localArtworkFields) {
        expect(
          publicFileExists(game[field]),
          `${game.title} is missing local artwork ${game[field]}`
        ).toBe(true);
      }
    }
  });

  it('keeps all artwork, categories, and discovery-facing values valid', () => {
    const categoryNames = new Set(categories.map((category) => category.name));

    for (const game of games) {
      expect(categoryNames.has(game.category), `${game.title} has an unknown category`).toBe(true);
      expect(game.title.trim(), `${game.id} title is required`).not.toBe('');
      expect(game.shortDescription.trim(), `${game.title} short description is required`).not.toBe(
        ''
      );
      expect(game.description.trim(), `${game.title} description is required`).not.toBe('');
      expect(game.tags.length, `${game.title} needs searchable tags`).toBeGreaterThan(0);
      expect(game.controls.keyboard, `${game.title} controls must include keyboard array`).toEqual(
        expect.any(Array)
      );
      expect(
        game.supportedPlatforms.includes('desktop'),
        `${game.title} should remain desktop playable`
      ).toBe(true);

      for (const field of localArtworkFields) {
        const asset = game[field];

        expect(asset.trim(), `${game.title} ${field} is required`).not.toBe('');

        if (asset.startsWith('/')) {
          expect(publicFileExists(asset), `${game.title} local asset is missing: ${asset}`).toBe(
            true
          );
        } else {
          expect(isExternalAsset(asset), `${game.title} external asset must be HTTP(S)`).toBe(true);
        }
      }
    }
  });

  it('keeps provided game page SEO content attached to the 31 target games', () => {
    const gamesByTitle = new Map(games.map((game) => [normalizeGameTitle(game.title), game]));

    expect(targetGamePageContentNames).toHaveLength(31);

    for (const targetName of targetGamePageContentNames) {
      const normalizedTitle = normalizeGameTitle(targetName);
      const game = gamesByTitle.get(normalizedTitle);
      const content = gamePageContentByTitle.get(normalizedTitle);

      expect(game, `${targetName} should exist in the canonical catalog`).toBeDefined();
      expect(content, `${targetName} should have a provided content block`).toBeDefined();
      expect(game?.seoTitle, `${targetName} SEO title should match provided copy`).toBe(
        content?.seoTitle
      );
      expect(game?.seoDescription, `${targetName} SEO description should match provided copy`).toBe(
        content?.seoDescription
      );
      expect(game?.description, `${targetName} description should match provided copy`).toBe(
        content?.description
      );
    }
  });

  it('keeps all GameDistribution games populated with page SEO content', () => {
    const gameDistributionGames = games.filter(
      (game) => game.source.providerName === 'GameDistribution'
    );

    expect(gameDistributionGames).toHaveLength(26);

    for (const game of gameDistributionGames) {
      expect(game.seoTitle?.trim(), `${game.title} SEO title is required`).not.toBe('');
      expect(game.seoDescription?.trim(), `${game.title} SEO description is required`).not.toBe('');
      expect(game.description.trim(), `${game.title} full description is required`).not.toBe('');
      expect(
        gamePageContentByTitle.has(normalizeGameTitle(game.title)),
        `${game.title} should be backed by provided copy`
      ).toBe(true);
    }
  });

  it('builds game detail metadata from SEO fields with safe fallbacks', () => {
    const targetGame = games.find((game) => game.title === 'Mojicon Spring Connect');

    expect(targetGame).toBeDefined();

    const targetMetadata = createGameDetailPageMetadata(targetGame!);

    expect(targetMetadata.title).toBe(targetGame!.seoTitle);
    expect(targetMetadata.description).toBe(targetGame!.seoDescription);
    expect(targetMetadata.alternates?.canonical).toBe(
      `http://localhost:3000/games/${targetGame!.slug}`
    );

    const fallbackGame = makeGame({
      slug: 'fallback-racer',
      title: 'Fallback Racer',
      shortDescription: 'Fallback browser racing summary.',
      seoTitle: undefined,
      seoDescription: undefined
    });
    const fallbackMetadata = createGameDetailPageMetadata(fallbackGame);

    expect(fallbackMetadata.title).toBe('Fallback Racer - PixloGames');
    expect(fallbackMetadata.description).toBe('Fallback browser racing summary.');
  });

  it('renders the provided full description in the game detail page body', () => {
    const targetGame = games.find((game) => game.title === 'Mojicon Spring Connect');

    expect(targetGame).toBeDefined();

    const html = renderToStaticMarkup(
      createElement(GameDetail, {
        game: targetGame!,
        relatedGames: []
      })
    );

    expect(html).toContain('About this game');
    expect(html).toContain(
      'Mojicon Spring Connect is a relaxing mahjong matching game wrapped in fresh spring visuals'
    );
  });

  it('renders empty metric states for newly launched and unrated games', () => {
    const html = renderToStaticMarkup(
      createElement(GameMetaRow, {
        game: makeGame({
          mobileSupported: false,
          plays: 0,
          rating: 0
        })
      })
    );

    expect(html).toContain('Just launched');
    expect(html).toContain('No ratings yet');
    expect(html).not.toContain('0 plays');
    expect(html).not.toContain('0.0 rating');
  });

  it('hides empty category filter chips from browse controls', () => {
    const html = renderToStaticMarkup(
      createElement(BrowseControls, {
        pathname: '/games',
        showTagFilter: false,
        state: {
          sort: 'featured',
          multiplayer: false,
          mobile: false,
          isNew: false,
          editorsPick: false
        },
        tags: []
      })
    );

    for (const hiddenCategory of ['Action', 'Adventure', 'Multiplayer', 'Shooting', 'Sports']) {
      expect(html).not.toContain(`category=${hiddenCategory}`);
    }

    for (const visibleCategory of ['Puzzle', 'Arcade', 'Racing', 'Management', 'Casual']) {
      expect(html).toContain(`category=${visibleCategory}`);
    }
  });

  it('keeps registry data compatible with Prisma seed mapping', () => {
    for (const game of games) {
      const seedData = mapGameToDbData(game);

      expect(seedData.id).toBe(game.id);
      expect(seedData.slug).toBe(game.slug);
      expect(seedData.embedUrl).toBe(game.embedUrl);
      expect(seedData.sourceMode).toBe(game.source.mode);
      expect(seedData.sourceUrl).toBe(game.source.url);
      expect(seedData.sourceMessage).toBe(game.source.message);
      expect(seedData.visibility).toBe(game.visibility);
      expect(seedData.status).toBe(game.status);
      expect(seedData.qaStatus).toBe(game.qaStatus);
      expect(seedData.publishAt).toBeInstanceOf(Date);
    }

    for (const collection of gameCollections) {
      const seedData = mapCollectionToDbData(collection);

      expect(seedData.id).toBe(collection.id);
      expect(seedData.slug).toBe(collection.slug);
      expect(seedData.visibility).toBe(collection.visibility);
      expect(seedData.placement).toEqual(collection.placement);
    }
  });
});
