import { categories, games } from '@/data/games';
import type { BrowseSearchParams, BrowseSort, BrowseState } from '@/types/browse';
import type { Game, GameCategory } from '@/types/game';

export const browseSortOptions: { label: string; value: BrowseSort }[] = [
  { label: 'Featured', value: 'featured' },
  { label: 'Most Played', value: 'most-played' },
  { label: 'Top Rated', value: 'top-rated' },
  { label: 'Newest', value: 'newest' },
  { label: 'Trending', value: 'trending' },
  { label: "Editor's Picks", value: 'editors' },
  { label: 'A-Z', value: 'az' }
];

const categoryNames = new Set<GameCategory>(categories.map((category) => category.name));

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function normalizeBooleanParam(value: string | string[] | undefined) {
  const normalized = normalizeParam(value);

  return normalized === '1' || normalized === 'true';
}

function normalizeSort(value: string | string[] | undefined): BrowseSort {
  const normalized = normalizeParam(value);

  return browseSortOptions.some((option) => option.value === normalized)
    ? (normalized as BrowseSort)
    : 'featured';
}

function normalizeCategory(value: string | string[] | undefined) {
  const normalized = normalizeParam(value);

  return categoryNames.has(normalized as GameCategory) ? (normalized as GameCategory) : undefined;
}

export function parseBrowseState(params: BrowseSearchParams): BrowseState {
  const q = normalizeParam(params.q).trim();
  const tag = normalizeParam(params.tag).trim();

  return {
    q: q || undefined,
    sort: normalizeSort(params.sort),
    category: normalizeCategory(params.category),
    tag: tag || undefined,
    multiplayer: normalizeBooleanParam(params.multiplayer),
    mobile: normalizeBooleanParam(params.mobile),
    isNew: normalizeBooleanParam(params.new),
    editorsPick: normalizeBooleanParam(params.editors)
  };
}

export function getAllTags() {
  return Array.from(new Set(games.flatMap((game) => game.tags))).sort((a, b) => a.localeCompare(b));
}

export function getTagsFromGames(gamesToRead: Game[]) {
  return Array.from(new Set(gamesToRead.flatMap((game) => game.tags))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function sortGames(gamesToSort: Game[], sort: BrowseSort) {
  return [...gamesToSort].sort((a, b) => {
    if (sort === 'featured') {
      return (
        Number(b.isFeatured) - Number(a.isFeatured) ||
        b.featuredPriority - a.featuredPriority ||
        b.featuredWeight - a.featuredWeight ||
        b.plays - a.plays ||
        a.title.localeCompare(b.title)
      );
    }

    if (sort === 'top-rated') {
      return b.rating - a.rating || b.plays - a.plays;
    }

    if (sort === 'newest') {
      return Number(b.isNew) - Number(a.isNew) || b.rating - a.rating || b.plays - a.plays;
    }

    if (sort === 'trending') {
      return Number(b.isTrending) - Number(a.isTrending) || b.plays - a.plays;
    }

    if (sort === 'editors') {
      return Number(b.isEditorsPick) - Number(a.isEditorsPick) || b.rating - a.rating;
    }

    if (sort === 'az') {
      return a.title.localeCompare(b.title);
    }

    return b.plays - a.plays || b.rating - a.rating;
  });
}

export function filterGames(gamesToFilter: Game[], state: BrowseState) {
  return gamesToFilter.filter((game) => {
    if (state.q) {
      const query = state.q.toLowerCase();
      const searchableValues = [
        game.title,
        game.category,
        game.shortDescription,
        ...game.tags,
        game.isNew ? 'new' : '',
        game.isTrending ? 'hot trending' : '',
        game.isEditorsPick ? 'editor editors pick curated' : '',
        game.isMultiplayer ? 'multiplayer' : ''
      ].map((value) => value.toLowerCase());

      if (!searchableValues.some((value) => value.includes(query))) {
        return false;
      }
    }

    if (state.category && game.category !== state.category) {
      return false;
    }

    if (state.tag && !game.tags.includes(state.tag)) {
      return false;
    }

    if (state.multiplayer && !game.isMultiplayer) {
      return false;
    }

    if (state.mobile && !game.mobileSupported) {
      return false;
    }

    if (state.isNew && !game.isNew) {
      return false;
    }

    if (state.editorsPick && !game.isEditorsPick) {
      return false;
    }

    return true;
  });
}

export function browseGames(gamesToBrowse: Game[], state: BrowseState) {
  return sortGames(filterGames(gamesToBrowse, state), state.sort);
}

export function getBrowseHref(
  pathname: string,
  state: BrowseState,
  patch: Partial<BrowseState> = {}
) {
  const nextState = {
    ...state,
    ...patch
  };
  const params = new URLSearchParams();

  if (nextState.q) params.set('q', nextState.q);
  if (nextState.sort !== 'featured') params.set('sort', nextState.sort);
  if (nextState.category) params.set('category', nextState.category);
  if (nextState.tag) params.set('tag', nextState.tag);
  if (nextState.multiplayer) params.set('multiplayer', '1');
  if (nextState.mobile) params.set('mobile', '1');
  if (nextState.isNew) params.set('new', '1');
  if (nextState.editorsPick) params.set('editors', '1');

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function getResetBrowseState(state: BrowseState, keepQuery = false): BrowseState {
  return {
    q: keepQuery ? state.q : undefined,
    sort: 'featured',
    category: undefined,
    tag: undefined,
    multiplayer: false,
    mobile: false,
    isNew: false,
    editorsPick: false
  };
}

export function hasActiveBrowseFilters(state: BrowseState, includeQuery = true) {
  return Boolean(
    (includeQuery && state.q) ||
    state.sort !== 'featured' ||
    state.category ||
    state.tag ||
    state.multiplayer ||
    state.mobile ||
    state.isNew ||
    state.editorsPick
  );
}
