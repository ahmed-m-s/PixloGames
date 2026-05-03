import type {
  Game,
  GameCategory,
  GameEmbedType,
  GameOrientation,
  GamePlayMode,
  GameSource,
  GameSupportedPlatform
} from '@/types/game';

type ProductionGameFields =
  | 'developerName'
  | 'publisherName'
  | 'releaseDate'
  | 'updatedAt'
  | 'supportedPlatforms'
  | 'orientation'
  | 'difficulty'
  | 'seoTitle'
  | 'seoDescription'
  | 'contentRating'
  | 'featuredWeight'
  | 'isFeatured'
  | 'isSponsored'
  | 'adSafe'
  | 'status'
  | 'playMode'
  | 'hasRealEmbed'
  | 'embedType'
  | 'source';
type OperationalGameFields =
  | 'submissionStatus'
  | 'moderationStatus'
  | 'reviewNotes'
  | 'featuredPriority'
  | 'sponsoredPriority'
  | 'collectionIds'
  | 'visibility'
  | 'publishAt'
  | 'unpublishAt'
  | 'sourceOrigin'
  | 'ingestionWarnings'
  | 'qaStatus'
  | 'sourceSubmissionId';

export type GameContentInput = Omit<Game, ProductionGameFields | OperationalGameFields> &
  Partial<Omit<Pick<Game, ProductionGameFields | OperationalGameFields>, 'source'>>;

const categoryStudios: Record<GameCategory, { developer: string; publisher: string }> = {
  Action: { developer: 'Kinetic Fox Studio', publisher: 'Pixlo Publishing' },
  Racing: { developer: 'Apex Pixel Works', publisher: 'Pixlo Publishing' },
  Puzzle: { developer: 'Gridwise Labs', publisher: 'Pixlo Select' },
  Adventure: { developer: 'Northstar Play', publisher: 'Pixlo Publishing' },
  Multiplayer: { developer: 'Relay Room Games', publisher: 'Pixlo Arena' },
  Shooting: { developer: 'Orbit Forge', publisher: 'Pixlo Publishing' },
  Sports: { developer: 'Pocket Stadium', publisher: 'Pixlo Sports' },
  Arcade: { developer: 'Cabinet Club', publisher: 'Pixlo Select' },
  Management: { developer: 'PixloGames Lab', publisher: 'PixloGames' }
};

const releaseDates = [
  '2025-11-04',
  '2026-01-18',
  '2025-09-23',
  '2025-07-12',
  '2026-02-07',
  '2025-12-15'
];

function getSupportedPlatforms(game: GameContentInput): GameSupportedPlatform[] {
  const platforms: GameSupportedPlatform[] = ['desktop'];

  if (game.mobileSupported) {
    platforms.push('mobile', 'tablet');
  }

  if (game.controls.gamepad) {
    platforms.push('gamepad');
  }

  return platforms;
}

function getPlayMode(game: GameContentInput): GamePlayMode {
  if (!game.isMultiplayer) {
    return 'single-player';
  }

  return game.category === 'Multiplayer' ? 'multiplayer' : 'local-multiplayer';
}

function getOrientation(game: GameContentInput): GameOrientation {
  if (!game.mobileSupported) {
    return 'landscape';
  }

  return game.category === 'Puzzle' ? 'responsive' : 'landscape';
}

function getGameSource(game: GameContentInput, embedType: GameEmbedType): GameSource {
  if (game.status === 'unavailable') {
    return {
      mode: 'unavailable',
      embedType: 'none',
      message: 'This game is not currently available for play.'
    };
  }

  if (game.hasRealEmbed && embedType !== 'local-preview' && embedType !== 'none') {
    return {
      mode: 'embedded',
      embedType,
      providerName: 'Pixlo Embed',
      url: game.embedUrl,
      message: 'Playable HTML5 embed'
    };
  }

  return {
    mode: 'preview',
    embedType: 'local-preview',
    providerName: 'Pixlo Preview',
    url: game.embedUrl,
    message: 'Local preview until an approved playable embed is connected.'
  };
}

export function prepareGameContent(gameInputs: GameContentInput[]): Game[] {
  return gameInputs.map((game, index) => {
    const studio = categoryStudios[game.category];
    const embedType = game.embedType ?? 'local-preview';
    const releaseDate = game.releaseDate ?? releaseDates[index % releaseDates.length];

    return {
      ...game,
      developerName: game.developerName ?? studio.developer,
      publisherName: game.publisherName ?? studio.publisher,
      releaseDate,
      updatedAt: game.updatedAt ?? '2026-03-28',
      supportedPlatforms: game.supportedPlatforms ?? getSupportedPlatforms(game),
      orientation: game.orientation ?? getOrientation(game),
      difficulty: game.difficulty ?? 'medium',
      seoTitle: game.seoTitle ?? game.title,
      seoDescription: game.seoDescription ?? game.shortDescription,
      contentRating: game.contentRating ?? 'Everyone',
      featuredWeight:
        game.featuredWeight ??
        (game.isEditorsPick ? 90 : 0) + (game.isTrending ? 35 : 0) + (game.isNew ? 20 : 0),
      isFeatured: game.isFeatured ?? game.isEditorsPick,
      isSponsored: game.isSponsored ?? false,
      adSafe: game.adSafe ?? true,
      status: game.status ?? 'published',
      playMode: game.playMode ?? getPlayMode(game),
      hasRealEmbed: game.hasRealEmbed ?? false,
      embedType,
      source: getGameSource(game, embedType),
      submissionStatus: game.submissionStatus ?? 'approved',
      moderationStatus: game.moderationStatus ?? 'approved',
      reviewNotes: game.reviewNotes ?? [],
      featuredPriority: game.featuredPriority ?? (game.isFeatured ? 80 : 0),
      sponsoredPriority: game.sponsoredPriority ?? (game.isSponsored ? 60 : 0),
      collectionIds: game.collectionIds ?? [],
      visibility: game.visibility ?? 'public',
      publishAt: game.publishAt ?? releaseDate,
      unpublishAt: game.unpublishAt,
      sourceOrigin: game.sourceOrigin ?? 'manual_admin',
      ingestionWarnings: game.ingestionWarnings ?? [],
      qaStatus: game.qaStatus ?? 'passed',
      sourceSubmissionId: game.sourceSubmissionId
    };
  });
}
