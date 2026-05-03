import { describe, expect, it } from 'vitest';
import { createLocalHtml5Game, getLocalHtml5GamePaths } from '@/lib/game-ingestion';

describe('local HTML5 game ingestion', () => {
  it('builds standard local package paths from the game slug', () => {
    expect(getLocalHtml5GamePaths('color-sort')).toEqual({
      embedUrl: '/games/color-sort/index.html',
      thumbnail: '/games/color-sort/assets/thumbnail.svg',
      coverImage: '/games/color-sort/assets/cover.svg'
    });
  });

  it('supports a non-route static package base path', () => {
    expect(getLocalHtml5GamePaths('panda-mart', '/playable-games')).toEqual({
      embedUrl: '/playable-games/panda-mart/index.html',
      thumbnail: '/playable-games/panda-mart/assets/thumbnail.svg',
      coverImage: '/playable-games/panda-mart/assets/cover.svg'
    });
  });

  it('creates a complete first-party catalog entry with durable defaults', () => {
    const game = createLocalHtml5Game({
      slug: 'test-runner',
      title: 'Test Runner',
      shortDescription: 'A short runner game used by tests.',
      description: 'A complete local HTML5 game package registration used by tests.',
      category: 'Arcade',
      tags: ['runner', 'mobile'],
      controls: {
        keyboard: ['Arrow Up'],
        mouse: true,
        touch: true
      },
      instructions: ['Press up to jump.'],
      rating: 4.6,
      plays: 420,
      releaseDate: '2026-04-22',
      isEditorsPick: true,
      collectionIds: ['collection-new-releases']
    });

    expect(game).toMatchObject({
      id: 'game-test-runner',
      slug: 'test-runner',
      embedUrl: '/games/test-runner/index.html',
      thumbnail: '/games/test-runner/assets/thumbnail.svg',
      coverImage: '/games/test-runner/assets/cover.svg',
      sourceOrigin: 'first_party',
      developerName: 'PixloGames Lab',
      publisherName: 'PixloGames',
      hasRealEmbed: true,
      embedType: 'html5-package',
      visibility: 'public',
      qaStatus: 'passed',
      isFeatured: true
    });
    expect(game.reviewNotes?.join(' ')).toContain(
      'Registered through the local HTML5 game ingestion helper.'
    );
  });

  it('creates first-party catalog entries under the alternate package base path', () => {
    const game = createLocalHtml5Game({
      slug: 'route-safe-shop',
      assetBasePath: '/playable-games',
      title: 'Route Safe Shop',
      shortDescription: 'A local package that avoids app route shadowing.',
      description: 'A local HTML5 game package registered under the playable game asset path.',
      category: 'Management',
      tags: ['shop'],
      controls: {
        keyboard: ['Arrow keys'],
        touch: true
      },
      instructions: ['Move through the shop.'],
      rating: 4.5,
      plays: 120,
      releaseDate: '2026-04-26'
    });

    expect(game).toMatchObject({
      slug: 'route-safe-shop',
      embedUrl: '/playable-games/route-safe-shop/index.html',
      thumbnail: '/playable-games/route-safe-shop/assets/thumbnail.svg',
      coverImage: '/playable-games/route-safe-shop/assets/cover.svg',
      sourceOrigin: 'first_party',
      embedType: 'html5-package'
    });
  });
});
