import { describe, expect, it } from 'vitest';
import { games } from '@/data/games';
import {
  getCatalogEntryKind,
  isPlayableCatalogGame,
  isPlayableLocalGame,
  isPlayableRemoteGame,
  isPreviewCatalogEntry,
  summarizeCatalogEntries
} from '@/lib/catalog-semantics';
import { makeGame } from '@/tests/fixtures';

function getSeededGame(slug: string) {
  const game = games.find((candidate) => candidate.slug === slug);

  expect(game, `Expected seeded game ${slug} to exist.`).toBeDefined();

  return game!;
}

describe('catalog semantics', () => {
  it('classifies first-party local HTML5 packages as playable local games', () => {
    const game = getSeededGame('endless-runner');

    expect(getCatalogEntryKind(game)).toBe('playable_local');
    expect(isPlayableLocalGame(game)).toBe(true);
    expect(isPlayableCatalogGame(game)).toBe(true);
  });

  it('classifies non-local catalog entries as preview entries until a playable embed is connected', () => {
    const game = makeGame({
      hasRealEmbed: false,
      embedType: 'local-preview',
      sourceOrigin: 'manual_admin',
      source: {
        mode: 'preview',
        embedType: 'local-preview',
        url: 'https://play.pixlogames.local/preview-game',
        message: 'Local preview until an approved playable embed is connected.'
      }
    });

    expect(getCatalogEntryKind(game)).toBe('preview');
    expect(isPreviewCatalogEntry(game)).toBe(true);
    expect(isPlayableCatalogGame(game)).toBe(false);
  });

  it('distinguishes playable remote embeds from local first-party packages', () => {
    const remoteGame = makeGame({
      id: 'game-remote-embed',
      slug: 'remote-embed',
      embedUrl: 'https://cdn.example.com/game/index.html',
      embedType: 'iframe',
      sourceOrigin: 'developer_submission',
      source: {
        mode: 'embedded',
        embedType: 'iframe',
        url: 'https://cdn.example.com/game/index.html',
        message: 'Playable remote embed'
      }
    });

    expect(getCatalogEntryKind(remoteGame)).toBe('playable_remote');
    expect(isPlayableRemoteGame(remoteGame)).toBe(true);
    expect(isPlayableLocalGame(remoteGame)).toBe(false);
    expect(isPlayableCatalogGame(remoteGame)).toBe(true);
  });

  it('summarizes mixed catalog entries without conflating preview entries with playable games', () => {
    const summary = summarizeCatalogEntries([
      getSeededGame('endless-runner'),
      makeGame({
        id: 'game-preview-summary',
        slug: 'preview-summary',
        hasRealEmbed: false,
        embedType: 'local-preview',
        sourceOrigin: 'manual_admin',
        source: {
          mode: 'preview',
          embedType: 'local-preview',
          url: 'https://play.pixlogames.local/preview-summary',
          message: 'Local preview until an approved playable embed is connected.'
        }
      }),
      makeGame({
        id: 'game-remote-summary',
        slug: 'remote-summary',
        embedUrl: 'https://cdn.example.com/remote-summary/index.html',
        embedType: 'iframe',
        sourceOrigin: 'developer_submission',
        source: {
          mode: 'embedded',
          embedType: 'iframe',
          url: 'https://cdn.example.com/remote-summary/index.html',
          message: 'Playable remote embed'
        }
      })
    ]);

    expect(summary).toEqual({
      totalEntries: 3,
      playableEntries: 2,
      playableLocalEntries: 1,
      playableRemoteEntries: 1,
      previewEntries: 1,
      unavailableEntries: 0
    });
  });
});
