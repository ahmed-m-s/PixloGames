import type { GameCategory, GameEmbedType, GameSupportedPlatform } from '@/types/game';
import type { MediaAsset } from '@/types/media';

export type SubmissionStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_changes';
export type SubmissionSourceType =
  | 'iframe'
  | 'html5-package'
  | 'external-provider'
  | 'source-reference';
export type SubmissionPublishingStatus = 'not_started' | 'draft_created' | 'published' | 'blocked';

export type SubmissionReviewEntry = {
  id: string;
  submissionId: string;
  action: string;
  note?: string;
  reviewerName?: string;
  createdAt: string;
};

export type GameSubmission = {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  tags?: string[];
  developerName: string;
  publisherName?: string;
  contactEmail: string;
  category: GameCategory;
  submittedAt: string;
  updatedAt: string;
  status: SubmissionStatus;
  proposedEmbedType: GameEmbedType;
  buildUrl: string;
  sourceType?: SubmissionSourceType;
  sourceUrl?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
  submitterNotes?: string;
  intakeWarnings?: string[];
  duplicateSignal?: string;
  abuseScore?: number;
  submittedIpHash?: string;
  submittedUserAgent?: string;
  termsAccepted?: boolean;
  supportedPlatforms: GameSupportedPlatform[];
  reviewOwner: string;
  reviewNotes: string[];
  publishingStatus?: SubmissionPublishingStatus;
  publishedGameId?: string;
  publishedAt?: string;
  publishingNotes?: string[];
  mediaAssets?: MediaAsset[];
  criteria: {
    performance: boolean;
    controls: boolean;
    adSafety: boolean;
    rights: boolean;
    mobile: boolean;
  };
};
