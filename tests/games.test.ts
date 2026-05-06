import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGame } from './fixtures';

vi.mock('@/lib/repositories/content-repository', () => ({
  getGameBySlugFromRepository: vi.fn(),
  listGames: vi.fn()
}));

import { getGameBySlugFromRepository, listGames } from '@/lib/repositories/content-repository';
import {
  getCategoryBySlug,
  getGameBySlug,
  getGamesByIds,
  getRelatedGames,
  listGames as listGamesWithFallback,
  searchGames
} from '@/lib/games';

const mockedListGames = vi.mocked(listGames);
const mockedGetGameBySlug = vi.mocked(getGameBySlugFromRepository);

describe('game discovery selectors', () => {
  beforeEach(() => {
    mockedListGames.mockReset();
    mockedGetGameBySlug.mockReset();
  });

  it('prioritizes related games with category, tag, platform, and editorial overlap', async () => {
    const current = makeGame({
      id: 'game-current',
      slug: 'current-puzzle',
      category: 'Puzzle',
      tags: ['unit-alpha', 'unit-beta', 'unit-gamma', 'unit-delta', 'unit-epsilon'],
      difficulty: 'medium',
      featuredWeight: 10
    });
    const strongMatch = makeGame({
      id: 'game-strong-match',
      slug: 'block-puzzle',
      category: 'Puzzle',
      tags: ['unit-alpha', 'unit-beta', 'unit-gamma', 'unit-delta', 'unit-epsilon'],
      isEditorsPick: true,
      featuredWeight: 20
    });
    const mobileMatch = makeGame({
      id: 'game-mobile-match',
      slug: 'memory-match',
      category: 'Puzzle',
      tags: ['unit-alpha', 'unit-beta', 'unit-gamma', 'unit-delta'],
      difficulty: 'medium',
      featuredWeight: 15
    });
    const popularButUnrelated = makeGame({
      id: 'game-unrelated',
      slug: 'racing-game',
      category: 'Racing',
      tags: ['racing', 'speed'],
      featuredWeight: 999,
      rating: 5,
      plays: 999999
    });

    mockedListGames.mockResolvedValue([current, popularButUnrelated, mobileMatch, strongMatch]);

    const related = await getRelatedGames(current, 2);

    expect(related.map((game) => game.slug)).toEqual(['block-puzzle', 'memory-match']);
  });

  it('searches title, category, tags, and editorial status labels', async () => {
    mockedListGames.mockResolvedValue([
      makeGame({
        id: 'game-memory',
        slug: 'memory-match',
        title: 'Memory Match',
        tags: ['cards', 'logic'],
        isEditorsPick: true
      }),
      makeGame({
        id: 'game-runner',
        slug: 'endless-runner',
        title: 'Endless Runner',
        category: 'Arcade',
        tags: ['runner'],
        isTrending: true
      })
    ]);

    await expect(searchGames('memory')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: 'memory-match' })])
    );
    await expect(searchGames('editors pick')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: 'memory-match' })])
    );
    await expect(searchGames('hot')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: 'endless-runner' })])
    );
    await expect(searchGames('')).resolves.toEqual([]);
  });

  it('resolves categories and repository-backed game lookups', async () => {
    const game = makeGame({ id: 'game-lookup', slug: 'lookup-game' });
    mockedGetGameBySlug.mockResolvedValue(game);

    expect(getCategoryBySlug('puzzle')?.name).toBe('Puzzle');
    await expect(getGameBySlug('lookup-game')).resolves.toEqual(game);
  });

  it('falls back to canonical Panda Mart when the repository lookup misses', async () => {
    mockedGetGameBySlug.mockResolvedValue(undefined);

    await expect(getGameBySlug('panda-mart')).resolves.toMatchObject({
      id: 'game-panda-mart',
      slug: 'panda-mart',
      embedUrl: '/playable-games/panda-mart/index.html',
      source: expect.objectContaining({
        url: '/playable-games/panda-mart/index.html'
      })
    });
  });

  it('keeps repository data authoritative while allowing first-party canonical thumbnail overrides', async () => {
    const databaseGame = makeGame({
      id: 'game-panda-mart-db',
      slug: 'panda-mart',
      title: 'Panda Mart DB',
      embedUrl: '/database/panda-mart/index.html'
    });
    mockedGetGameBySlug.mockResolvedValue(databaseGame);

    await expect(getGameBySlug('panda-mart')).resolves.toEqual({
      ...databaseGame,
      thumbnail: '/playable-games/panda-mart/assets/thumbnail.jpg'
    });
  });

  it('merges missing canonical games into public discovery without duplicating repository games', async () => {
    mockedListGames.mockResolvedValue([
      makeGame({ id: 'game-memory-match', slug: 'memory-match' })
    ]);

    const games = await listGamesWithFallback();
    const pandaMartMatches = games.filter((game) => game.slug === 'panda-mart');
    const memoryMatchMatches = games.filter((game) => game.slug === 'memory-match');

    expect(pandaMartMatches).toHaveLength(1);
    expect(pandaMartMatches[0]).toMatchObject({
      embedUrl: '/playable-games/panda-mart/index.html'
    });
    expect(memoryMatchMatches).toHaveLength(1);
    expect(mockedListGames).toHaveBeenCalledWith({});
  });

  it('returns games by id in the requested order while skipping missing ids', async () => {
    const first = makeGame({ id: 'game-first', slug: 'first' });
    const second = makeGame({ id: 'game-second', slug: 'second' });
    mockedListGames.mockResolvedValue([first, second]);

    const games = await getGamesByIds(['game-second', 'missing', 'game-first']);

    expect(mockedListGames).toHaveBeenCalledWith({ includeInternal: true });
    expect(games.map((game) => game.id)).toEqual(['game-second', 'game-first']);
  });
});
