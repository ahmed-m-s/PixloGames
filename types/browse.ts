import type { GameCategory } from '@/types/game';

export type BrowseSort =
  | 'featured'
  | 'most-played'
  | 'top-rated'
  | 'newest'
  | 'trending'
  | 'editors'
  | 'az';

export type BrowseSearchParams = Record<string, string | string[] | undefined>;

export type BrowseState = {
  q?: string;
  sort: BrowseSort;
  category?: GameCategory;
  tag?: string;
  multiplayer: boolean;
  mobile: boolean;
  isNew: boolean;
  editorsPick: boolean;
};

export type BrowseFilterKey =
  | 'q'
  | 'sort'
  | 'category'
  | 'tag'
  | 'multiplayer'
  | 'mobile'
  | 'isNew'
  | 'editorsPick';

export type ActiveBrowseFilter = {
  key: BrowseFilterKey;
  label: string;
  href: string;
};
