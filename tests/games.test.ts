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
      tags: ['logic', 'grid', 'mobile'],
      difficulty: 'medium',
      featuredWeight: 10
    });
    const strongMatch = makeGame({
      id: 'game-strong-match',
      slug: 'block-puzzle',
      category: 'Puzzle',
      tags: ['logic', 'grid', 'casual'],
      isEditorsPick: true,
      featuredWeight: 20
    });
    const mobileMatch = makeGame({
      id: 'game-mobile-match',
      slug: 'memory-match',
      category: 'Puzzle',
      tags: ['memory', 'mobile'],
      difficulty: 'easy',
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

    await expect(searchGames('memory')).resolves.toHaveLength(1);
    await expect(searchGames('editors pick')).resolves.toHaveLength(1);
    await expect(searchGames('hot')).resolves.toHaveLength(1);
    await expect(searchGames('')).resolves.toEqual([]);
  });

  it('resolves categories and repository-backed game lookups', async () => {
    const game = makeGame({ id: 'game-lookup', slug: 'lookup-game' });
    mockedGetGameBySlug.mockResolvedValue(game);

    expect(getCategoryBySlug('puzzle')?.name).toBe('Puzzle');
    await expect(getGameBySlug('lookup-game')).resolves.toEqual(game);
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
