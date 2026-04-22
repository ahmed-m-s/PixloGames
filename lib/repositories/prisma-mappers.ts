import type {
  Collection,
  Game as PrismaGame,
  GameCollectionMembership,
  MediaAsset as PrismaMediaAsset,
  Prisma,
  Submission as PrismaSubmission,
  SubmissionReview
} from '@/lib/generated/prisma/client';
import type { GameCollection } from '@/types/collection';
import type {
  MediaAsset,
  MediaAssetType,
  MediaStorageProvider,
  MediaUploadSource
} from '@/types/media';
import type {
  Game,
  GameCategory,
  GameControls,
  GameContentRating,
  GameDifficulty,
  GameEmbedType,
  GameModerationStatus,
  GameOrientation,
  GamePlayMode,
  GameQaStatus,
  GameSource,
  GameSourceOrigin,
  GameStatus,
  GameSubmissionStatus,
  GameSupportedPlatform,
  GameVisibility
} from '@/types/game';
import type { GameSubmission, SubmissionReviewEntry, SubmissionStatus } from '@/types/submission';

export type PrismaGameWithCollections = PrismaGame & {
  collections?: Pick<GameCollectionMembership, 'collectionId' | 'position'>[];
  mediaAssets?: PrismaMediaAsset[];
};

export type PrismaCollectionWithGames = Collection & {
  games?: Pick<GameCollectionMembership, 'gameId' | 'position'>[];
};

export type PrismaSubmissionWithPublishedGame = PrismaSubmission & {
  publishedGame?: Pick<PrismaGame, 'id'> | null;
  mediaAssets?: PrismaMediaAsset[];
};

function dateFromString(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function dateToString(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

function normalizeControls(value: unknown): GameControls {
  if (value && typeof value === 'object' && 'keyboard' in value) {
    return value as GameControls;
  }

  return {
    keyboard: []
  };
}

function normalizeSubmissionCriteria(value: unknown): GameSubmission['criteria'] {
  if (value && typeof value === 'object') {
    return value as GameSubmission['criteria'];
  }

  return {
    performance: false,
    controls: false,
    adSafety: false,
    rights: false,
    mobile: false
  };
}

export function mapDbMediaAssetToMediaAsset(asset: PrismaMediaAsset): MediaAsset {
  return {
    id: asset.id,
    assetType: asset.assetType as MediaAssetType,
    originalFilename: asset.originalFilename,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    storageProvider: asset.storageProvider as MediaStorageProvider,
    storageKey: asset.storageKey,
    storagePath: asset.storagePath,
    publicUrl: asset.publicUrl,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
    uploadSource: asset.uploadSource as MediaUploadSource,
    submissionId: asset.submissionId ?? undefined,
    gameId: asset.gameId ?? undefined,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString()
  };
}

export function mapDbGameToGame(game: PrismaGameWithCollections): Game {
  const source: GameSource = {
    mode: game.sourceMode as GameSource['mode'],
    embedType: game.embedType as GameEmbedType,
    providerName: game.sourceProviderName ?? undefined,
    url: game.sourceUrl ?? undefined,
    message: game.sourceMessage
  };

  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    shortDescription: game.shortDescription,
    description: game.description,
    thumbnail: game.thumbnail,
    coverImage: game.coverImage,
    category: game.category as GameCategory,
    tags: game.tags,
    rating: game.rating,
    plays: game.plays,
    isNew: game.isNew,
    isTrending: game.isTrending,
    isMultiplayer: game.isMultiplayer,
    isEditorsPick: game.isEditorsPick,
    embedUrl: game.embedUrl,
    controls: normalizeControls(game.controls),
    mobileSupported: game.mobileSupported,
    developerName: game.developerName,
    publisherName: game.publisherName,
    releaseDate: dateToString(game.releaseDate) ?? '',
    updatedAt: dateToString(game.contentUpdatedAt) ?? '',
    supportedPlatforms: game.supportedPlatforms as GameSupportedPlatform[],
    orientation: game.orientation as GameOrientation,
    difficulty: game.difficulty as GameDifficulty,
    seoTitle: game.seoTitle ?? undefined,
    seoDescription: game.seoDescription ?? undefined,
    contentRating: game.contentRating as GameContentRating,
    featuredWeight: game.featuredWeight,
    isFeatured: game.isFeatured,
    isSponsored: game.isSponsored,
    adSafe: game.adSafe,
    status: game.status as GameStatus,
    playMode: game.playMode as GamePlayMode,
    hasRealEmbed: game.hasRealEmbed,
    embedType: game.embedType as GameEmbedType,
    source,
    submissionStatus: game.submissionStatus as GameSubmissionStatus,
    moderationStatus: game.moderationStatus as GameModerationStatus,
    reviewNotes: game.reviewNotes,
    featuredPriority: game.featuredPriority,
    sponsoredPriority: game.sponsoredPriority,
    collectionIds:
      game.collections
        ?.slice()
        .sort((a, b) => a.position - b.position)
        .map((membership) => membership.collectionId) ?? [],
    visibility: game.visibility as GameVisibility,
    publishAt: dateToString(game.publishAt),
    unpublishAt: dateToString(game.unpublishAt),
    sourceOrigin: game.sourceOrigin as GameSourceOrigin,
    ingestionWarnings: game.ingestionWarnings,
    qaStatus: game.qaStatus as GameQaStatus,
    sourceSubmissionId: game.sourceSubmissionId ?? undefined,
    mediaAssets: game.mediaAssets?.map(mapDbMediaAssetToMediaAsset)
  };
}

export function mapGameToDbData(game: Game) {
  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    shortDescription: game.shortDescription,
    description: game.description,
    thumbnail: game.thumbnail,
    coverImage: game.coverImage,
    category: game.category,
    tags: game.tags,
    rating: game.rating,
    plays: game.plays,
    isNew: game.isNew,
    isTrending: game.isTrending,
    isMultiplayer: game.isMultiplayer,
    isEditorsPick: game.isEditorsPick,
    embedUrl: game.embedUrl,
    controls: game.controls as unknown as Prisma.InputJsonValue,
    mobileSupported: game.mobileSupported,
    developerName: game.developerName,
    publisherName: game.publisherName,
    releaseDate: dateFromString(game.releaseDate) ?? new Date(),
    contentUpdatedAt: dateFromString(game.updatedAt) ?? new Date(),
    supportedPlatforms: game.supportedPlatforms,
    orientation: game.orientation,
    difficulty: game.difficulty,
    seoTitle: game.seoTitle,
    seoDescription: game.seoDescription,
    contentRating: game.contentRating,
    featuredWeight: game.featuredWeight,
    isFeatured: game.isFeatured,
    isSponsored: game.isSponsored,
    adSafe: game.adSafe,
    status: game.status,
    playMode: game.playMode,
    hasRealEmbed: game.hasRealEmbed,
    embedType: game.embedType,
    sourceMode: game.source.mode,
    sourceProviderName: game.source.providerName,
    sourceUrl: game.source.url,
    sourceMessage: game.source.message,
    submissionStatus: game.submissionStatus,
    moderationStatus: game.moderationStatus,
    reviewNotes: game.reviewNotes,
    featuredPriority: game.featuredPriority,
    sponsoredPriority: game.sponsoredPriority,
    visibility: game.visibility,
    publishAt: dateFromString(game.publishAt),
    unpublishAt: dateFromString(game.unpublishAt),
    sourceOrigin: game.sourceOrigin,
    ingestionWarnings: game.ingestionWarnings,
    qaStatus: game.qaStatus,
    sourceSubmissionId: game.sourceSubmissionId
  };
}

export function mapDbCollectionToCollection(collection: PrismaCollectionWithGames): GameCollection {
  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    type: collection.type as GameCollection['type'],
    visibility: collection.visibility as GameCollection['visibility'],
    placement: collection.placement as GameCollection['placement'],
    gameIds:
      collection.games
        ?.slice()
        .sort((a, b) => a.position - b.position)
        .map((membership) => membership.gameId) ?? [],
    category: collection.category as GameCategory | undefined,
    priority: collection.priority,
    sponsored: collection.sponsored,
    startsAt: dateToString(collection.startsAt),
    endsAt: dateToString(collection.endsAt),
    owner: collection.owner
  };
}

export function mapCollectionToDbData(collection: GameCollection) {
  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    type: collection.type,
    visibility: collection.visibility,
    placement: collection.placement,
    category: collection.category,
    priority: collection.priority,
    sponsored: collection.sponsored,
    startsAt: dateFromString(collection.startsAt),
    endsAt: dateFromString(collection.endsAt),
    owner: collection.owner
  };
}

export function mapDbSubmissionToSubmission(
  submission: PrismaSubmissionWithPublishedGame
): GameSubmission {
  return {
    id: submission.id,
    title: submission.title,
    shortDescription: submission.shortDescription ?? undefined,
    description: submission.description ?? undefined,
    tags: submission.tags,
    developerName: submission.developerName,
    publisherName: submission.publisherName ?? undefined,
    contactEmail: submission.contactEmail,
    category: submission.category as GameCategory,
    submittedAt: dateToString(submission.submittedAt) ?? '',
    updatedAt: dateToString(submission.contentUpdatedAt) ?? '',
    status: submission.status as SubmissionStatus,
    proposedEmbedType: submission.proposedEmbedType as GameEmbedType,
    buildUrl: submission.buildUrl,
    sourceType: submission.sourceType as GameSubmission['sourceType'],
    sourceUrl: submission.sourceUrl ?? undefined,
    thumbnailUrl: submission.thumbnailUrl ?? undefined,
    coverImageUrl: submission.coverImageUrl ?? undefined,
    websiteUrl: submission.websiteUrl ?? undefined,
    submitterNotes: submission.submitterNotes ?? undefined,
    intakeWarnings: submission.intakeWarnings,
    duplicateSignal: submission.duplicateSignal ?? undefined,
    abuseScore: submission.abuseScore,
    submittedIpHash: submission.submittedIpHash ?? undefined,
    submittedUserAgent: submission.submittedUserAgent ?? undefined,
    termsAccepted: submission.termsAccepted,
    supportedPlatforms: submission.supportedPlatforms as GameSupportedPlatform[],
    reviewOwner: submission.reviewOwner,
    reviewNotes: submission.reviewNotes,
    publishingStatus: submission.publishingStatus as GameSubmission['publishingStatus'],
    publishedGameId: submission.publishedGame?.id,
    publishedAt: dateToString(submission.publishedAt),
    publishingNotes: submission.publishingNotes,
    mediaAssets: submission.mediaAssets?.map(mapDbMediaAssetToMediaAsset),
    criteria: normalizeSubmissionCriteria(submission.criteria)
  };
}

export function mapSubmissionToDbData(submission: GameSubmission) {
  return {
    id: submission.id,
    title: submission.title,
    shortDescription: submission.shortDescription,
    description: submission.description,
    tags: submission.tags ?? [],
    developerName: submission.developerName,
    publisherName: submission.publisherName,
    contactEmail: submission.contactEmail,
    category: submission.category,
    submittedAt: dateFromString(submission.submittedAt) ?? new Date(),
    contentUpdatedAt: dateFromString(submission.updatedAt) ?? new Date(),
    status: submission.status,
    proposedEmbedType: submission.proposedEmbedType,
    buildUrl: submission.buildUrl,
    sourceType: submission.sourceType ?? 'source-reference',
    sourceUrl: submission.sourceUrl,
    thumbnailUrl: submission.thumbnailUrl,
    coverImageUrl: submission.coverImageUrl,
    websiteUrl: submission.websiteUrl,
    submitterNotes: submission.submitterNotes,
    intakeWarnings: submission.intakeWarnings ?? [],
    duplicateSignal: submission.duplicateSignal,
    abuseScore: submission.abuseScore ?? 0,
    submittedIpHash: submission.submittedIpHash,
    submittedUserAgent: submission.submittedUserAgent,
    termsAccepted: submission.termsAccepted ?? false,
    supportedPlatforms: submission.supportedPlatforms,
    reviewOwner: submission.reviewOwner,
    reviewNotes: submission.reviewNotes,
    publishingStatus: submission.publishingStatus ?? 'not_started',
    publishedAt: dateFromString(submission.publishedAt),
    publishingNotes: submission.publishingNotes ?? [],
    criteria: submission.criteria as unknown as Prisma.InputJsonValue
  };
}

export function mapDbSubmissionReviewToReviewEntry(
  review: SubmissionReview
): SubmissionReviewEntry {
  return {
    id: review.id,
    submissionId: review.submissionId,
    action: review.action,
    note: review.note ?? undefined,
    reviewerName: review.reviewerName ?? undefined,
    createdAt: review.createdAt.toISOString()
  };
}
