import type { MediaAsset } from '@/types/media';

export type GameCategory =
  | 'Action'
  | 'Racing'
  | 'Puzzle'
  | 'Adventure'
  | 'Multiplayer'
  | 'Shooting'
  | 'Sports'
  | 'Arcade'
  | 'Management';

export type GameBadge = 'New' | 'Trending' | 'Multiplayer' | "Editor's Pick";

export type GameControls = {
  keyboard: string[];
  mouse?: boolean;
  touch?: boolean;
  gamepad?: boolean;
};

export type GameSupportedPlatform = 'desktop' | 'mobile' | 'tablet' | 'gamepad';
export type GameOrientation = 'landscape' | 'portrait' | 'responsive';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GameContentRating = 'Everyone' | 'Everyone 10+' | 'Teen';
export type GameStatus = 'published' | 'draft' | 'review' | 'unavailable';
export type GamePlayMode = 'single-player' | 'multiplayer' | 'co-op' | 'local-multiplayer';
export type GameEmbedType =
  | 'iframe'
  | 'html5-package'
  | 'external-provider'
  | 'local-preview'
  | 'none';
export type GameSubmissionStatus =
  | 'not_submitted'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'needs_changes';
export type GameModerationStatus = 'unreviewed' | 'approved' | 'flagged' | 'blocked';
export type GameVisibility = 'public' | 'unlisted' | 'internal' | 'scheduled' | 'archived';
export type GameSourceOrigin =
  | 'first_party'
  | 'developer_submission'
  | 'publisher_feed'
  | 'manual_admin';
export type GameQaStatus = 'not_started' | 'passed' | 'needs_testing' | 'failed';

export type GameSource = {
  mode: 'embedded' | 'preview' | 'unavailable';
  embedType: GameEmbedType;
  url?: string;
  providerName?: string;
  message: string;
};

export type Game = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  coverImage: string;
  category: GameCategory;
  tags: string[];
  rating: number;
  plays: number;
  isNew: boolean;
  isTrending: boolean;
  isMultiplayer: boolean;
  isEditorsPick: boolean;
  embedUrl: string;
  controls: GameControls;
  mobileSupported: boolean;
  developerName: string;
  publisherName: string;
  releaseDate: string;
  updatedAt: string;
  supportedPlatforms: GameSupportedPlatform[];
  orientation: GameOrientation;
  difficulty: GameDifficulty;
  seoTitle?: string;
  seoDescription?: string;
  contentRating: GameContentRating;
  featuredWeight: number;
  isFeatured: boolean;
  isSponsored: boolean;
  adSafe: boolean;
  status: GameStatus;
  playMode: GamePlayMode;
  hasRealEmbed: boolean;
  embedType: GameEmbedType;
  source: GameSource;
  submissionStatus: GameSubmissionStatus;
  moderationStatus: GameModerationStatus;
  reviewNotes: string[];
  featuredPriority: number;
  sponsoredPriority: number;
  collectionIds: string[];
  visibility: GameVisibility;
  publishAt?: string;
  unpublishAt?: string;
  sourceOrigin: GameSourceOrigin;
  ingestionWarnings: string[];
  qaStatus: GameQaStatus;
  sourceSubmissionId?: string;
  mediaAssets?: MediaAsset[];
};

export type GameCardVariant = 'default' | 'compact' | 'featured' | 'homepage';

export type RecentlyPlayedEntry = {
  gameId: string;
  playedAt: string;
};
