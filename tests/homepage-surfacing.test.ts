import { describe, expect, it } from 'vitest';
import { gameCollections } from '@/data/collections';
import { games } from '@/data/games';
import { getCatalogEntryKind } from '@/lib/catalog-semantics';
import {
  getPlayableHomepageGames,
  pickHomepageLane,
  resolveHomepageCollectionGames
} from '@/lib/homepage-surfacing';
import { makeGame } from '@/tests/fixtures';

function makePreviewGame() {
  return makeGame({
    id: 'game-preview',
    slug: 'preview-game',
    hasRealEmbed: false,
    embedType: 'local-preview',
    source: {
      mode: 'preview',
      embedType: 'local-preview',
      url: 'https://preview.example.com/game',
      message: 'Preview until a playable embed is connected.'
    }
  });
}

function collectionBySlug(slug: string) {
  const collection = gameCollections.find((candidate) => candidate.slug === slug);

  expect(collection, `Expected collection ${slug} to exist.`).toBeDefined();

  return collection!;
}

describe('homepage surfacing', () => {
  it('keeps homepage candidates limited to public QA-passed playable entries', () => {
    const playable = makeGame({ id: 'game-playable', slug: 'playable' });
    const preview = makePreviewGame();
    const failedQa = makeGame({
      id: 'game-failed',
      slug: 'failed',
      qaStatus: 'failed'
    });
    const internal = makeGame({
      id: 'game-internal',
      slug: 'internal',
      visibility: 'internal'
    });

    expect(getPlayableHomepageGames([preview, failedQa, playable, internal])).toEqual([playable]);
  });

  it('resolves collection lanes by curated order while removing duplicates and preview entries', () => {
    const first = makeGame({ id: 'game-first', slug: 'first' });
    const second = makeGame({ id: 'game-second', slug: 'second' });
    const preview = makePreviewGame();

    const resolvedGames = resolveHomepageCollectionGames(
      ['game-preview', 'game-first', 'game-first', 'game-second'],
      [first, second, preview]
    );

    expect(resolvedGames.map((game) => game.id)).toEqual(['game-first', 'game-second']);
  });

  it('keeps active homepage collection lanes playable and duplicate-free', () => {
    const activeHomepageCollections = [
      'trending-now',
      'quick-plays',
      'touch-friendly-picks',
      'editors-picks',
      'new-releases'
    ].map(collectionBySlug);

    for (const collection of activeHomepageCollections) {
      const resolvedGames = resolveHomepageCollectionGames(collection.gameIds, games);
      const resolvedIds = resolvedGames.map((game) => game.id);

      expect(
        resolvedGames.length,
        `${collection.slug} should keep at least three playable homepage candidates.`
      ).toBeGreaterThanOrEqual(3);
      expect(new Set(resolvedIds).size, `${collection.slug} should not repeat games.`).toBe(
        resolvedIds.length
      );
      expect(
        resolvedGames.map(getCatalogEntryKind),
        `${collection.slug} should not surface preview entries on the homepage.`
      ).not.toContain('preview');
    }
  });

  it('avoids repeating games across homepage lanes when enough unique candidates exist', () => {
    const seenGameIds = new Set<string>(['game-first']);
    const first = makeGame({ id: 'game-first', slug: 'first' });
    const second = makeGame({ id: 'game-second', slug: 'second' });
    const third = makeGame({ id: 'game-third', slug: 'third' });

    const lane = pickHomepageLane([first, second, third, second], seenGameIds, {
      limit: 2,
      minVisible: 2
    });

    expect(lane.map((game) => game.id)).toEqual(['game-second', 'game-third']);
    expect(Array.from(seenGameIds).sort()).toEqual(['game-first', 'game-second', 'game-third']);
  });

  it('backfills with existing candidates only when a lane cannot meet its minimum uniquely', () => {
    const first = makeGame({ id: 'game-first', slug: 'first' });
    const second = makeGame({ id: 'game-second', slug: 'second' });
    const seenGameIds = new Set<string>(['game-first', 'game-second']);

    const lane = pickHomepageLane([first, second], seenGameIds, {
      limit: 2,
      minVisible: 2
    });

    expect(lane.map((game) => game.id)).toEqual(['game-first', 'game-second']);
  });
});
