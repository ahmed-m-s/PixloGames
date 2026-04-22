import type { GameCollection } from '@/types/collection';
import type { Game } from '@/types/game';
import type { MediaAsset } from '@/types/media';
import type { GameSubmission } from '@/types/submission';

export type ApiMeta = {
  source: 'mock' | 'runtime_memory' | 'postgresql' | 'external_provider';
  durable: boolean;
  count?: number;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta: ApiMeta;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    issues?: string[];
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type GameListResponse = ApiSuccess<Game[]>;
export type GameResponse = ApiSuccess<Game>;
export type CollectionListResponse = ApiSuccess<GameCollection[]>;
export type SubmissionListResponse = ApiSuccess<GameSubmission[]>;
export type MediaAssetResponse = ApiSuccess<MediaAsset>;
