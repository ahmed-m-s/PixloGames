import type { AdPlacementKey } from '@/types/ad';
import type { GameCollection } from '@/types/collection';
import type { Game, GameModerationStatus, GameQaStatus, GameVisibility } from '@/types/game';
import type { GameSubmission, SubmissionStatus } from '@/types/submission';

export type DbId = string;
export type IsoDateString = string;

export type DbGame = Game & {
  createdAt: IsoDateString;
  deletedAt?: IsoDateString;
};

export type DbCollection = GameCollection & {
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type DbSubmission = GameSubmission & {
  sourceIpHash?: string;
  persistedMode: 'seed' | 'postgresql';
};

export type DbReviewer = {
  id: DbId;
  name: string;
  email: string;
  role: 'reviewer' | 'editor' | 'admin';
  active: boolean;
};

export type DbAnalyticsEvent = {
  id: DbId;
  name: string;
  payload: Record<string, string | number | boolean | null>;
  createdAt: IsoDateString;
  sessionId?: string;
  userId?: string;
};

export type DbAdPlacement = {
  id: DbId;
  placementKey: AdPlacementKey;
  label: string;
  enabled: boolean;
  sponsoredOnly: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type GameAdminPatch = {
  visibility?: GameVisibility;
  moderationStatus?: GameModerationStatus;
  qaStatus?: GameQaStatus;
  featuredPriority?: number;
  sponsoredPriority?: number;
  collectionIds?: string[];
};

export type SubmissionAdminAction =
  | 'approve'
  | 'reject'
  | 'needs_changes'
  | 'in_review'
  | 'add_note';

export type SubmissionAdminPatch = {
  submissionId: string;
  action: SubmissionAdminAction;
  reviewNote?: string;
};

export type SubmissionStatusPatch = {
  status: SubmissionStatus;
  reviewNote?: string;
};

export type PublishingAction =
  | 'create_draft_from_submission'
  | 'publish_game'
  | 'unpublish_game'
  | 'save_game_draft'
  | 'promote_featured'
  | 'mark_sponsored_eligible';

export type PublishingPatch = {
  action: PublishingAction;
  submissionId?: string;
  gameId?: string;
  featuredPriority?: number;
  sponsoredPriority?: number;
  reviewNote?: string;
};
