import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { gameCollections } from '@/data/collections';
import { games } from '@/data/games';
import { getCatalogEntryKind } from '@/lib/catalog-semantics';
import { prisma } from '@/lib/db/prisma';
import { listCollections, listGames } from '@/lib/repositories/content-repository';

const expectedPublicGames = games
  .filter((game) => game.visibility === 'public')
  .sort((left, right) => left.slug.localeCompare(right.slug));

const expectedPlayableFirstPartyGames = expectedPublicGames.filter(
  (game) =>
    game.hasRealEmbed && game.embedType === 'html5-package' && game.sourceOrigin === 'first_party'
);

const expectedCollections = [...gameCollections].sort((left, right) =>
  left.slug.localeCompare(right.slug)
);

afterAll(async () => {
  await prisma.$disconnect();
});

describe('runtime catalog drift', () => {
  it('keeps the DB-backed public game catalog aligned with the seeded registry', async () => {
    const runtimeGames = (await listGames()).sort((left, right) =>
      left.slug.localeCompare(right.slug)
    );

    expect(
      runtimeGames.length,
      'Runtime public game count drifted from the seeded registry. Re-run migrations/seed or inspect missing public records.'
    ).toBe(expectedPublicGames.length);
    expect(
      runtimeGames.map((game) => game.slug),
      'Runtime public game slugs drifted from the seeded registry.'
    ).toEqual(expectedPublicGames.map((game) => game.slug));
  });

  it('keeps seeded first-party playable games available through the runtime repository', async () => {
    const runtimeGames = await listGames();
    const runtimeGamesBySlug = new Map(runtimeGames.map((game) => [game.slug, game]));

    for (const expectedGame of expectedPlayableFirstPartyGames) {
      const runtimeGame = runtimeGamesBySlug.get(expectedGame.slug);

      expect(
        runtimeGame,
        `${expectedGame.slug} is missing from the DB-backed runtime catalog.`
      ).toBeDefined();
      expect(
        runtimeGame?.hasRealEmbed,
        `${expectedGame.slug} should remain marked as a real playable embed at runtime.`
      ).toBe(true);
      expect(
        runtimeGame?.source.mode,
        `${expectedGame.slug} should remain embedded at runtime.`
      ).toBe('embedded');
      expect(
        runtimeGame?.embedUrl,
        `${expectedGame.slug} runtime embed URL drifted from the seeded registry.`
      ).toBe(expectedGame.embedUrl);
    }
  });

  it('keeps runtime catalog entry semantics aligned with the seeded registry', async () => {
    const runtimeGames = await listGames();
    const runtimeGamesBySlug = new Map(runtimeGames.map((game) => [game.slug, game]));

    for (const expectedGame of expectedPublicGames) {
      const runtimeGame = runtimeGamesBySlug.get(expectedGame.slug);

      expect(
        runtimeGame,
        `${expectedGame.slug} is missing from the DB-backed runtime catalog.`
      ).toBeDefined();
      expect(
        runtimeGame ? getCatalogEntryKind(runtimeGame) : undefined,
        `${expectedGame.slug} runtime catalog semantics drifted from the seeded registry.`
      ).toBe(getCatalogEntryKind(expectedGame));
    }
  });

  it('keeps seeded collections and memberships aligned with the DB-backed runtime catalog', async () => {
    const runtimeCollections = (await listCollections()).sort((left, right) =>
      left.slug.localeCompare(right.slug)
    );
    const runtimeCollectionsBySlug = new Map(
      runtimeCollections.map((collection) => [collection.slug, collection])
    );

    expect(
      runtimeCollections.length,
      'Runtime collection count drifted from the seeded registry.'
    ).toBe(expectedCollections.length);
    expect(
      runtimeCollections.map((collection) => collection.slug),
      'Runtime collection slugs drifted from the seeded registry.'
    ).toEqual(expectedCollections.map((collection) => collection.slug));

    for (const expectedCollection of expectedCollections) {
      const runtimeCollection = runtimeCollectionsBySlug.get(expectedCollection.slug);

      expect(
        runtimeCollection,
        `${expectedCollection.slug} is missing from the DB-backed runtime catalog.`
      ).toBeDefined();
      expect(
        runtimeCollection?.gameIds,
        `${expectedCollection.slug} membership order drifted from the seeded registry.`
      ).toEqual(expectedCollection.gameIds);
    }
  });
});
