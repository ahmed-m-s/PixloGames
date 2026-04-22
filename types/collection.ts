import type { GameCategory } from '@/types/game';

export type CollectionType = 'system' | 'editorial' | 'seasonal' | 'sponsored';
export type CollectionVisibility = 'public' | 'internal' | 'scheduled' | 'archived';
export type CollectionPlacement = 'homepage' | 'browse' | 'category' | 'sponsored' | 'internal';

export type GameCollection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: CollectionType;
  visibility: CollectionVisibility;
  placement: CollectionPlacement[];
  gameIds: string[];
  category?: GameCategory;
  priority: number;
  sponsored: boolean;
  startsAt?: string;
  endsAt?: string;
  owner: string;
};
