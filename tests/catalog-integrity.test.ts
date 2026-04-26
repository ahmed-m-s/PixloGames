import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { gameCollections } from '@/data/collections';
import { categories, games } from '@/data/games';
import { mapCollectionToDbData, mapGameToDbData } from '@/lib/repositories/prisma-mappers';
import type { Game } from '@/types/game';

const projectRoot = process.cwd();
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
