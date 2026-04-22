import type { GameContentInput } from '@/lib/content';
import type {
  GameCategory,
  GameControls,
  GameDifficulty,
  GameOrientation,
  GamePlayMode,
  GameSourceOrigin,
  GameStatus,
  GameSupportedPlatform
} from '@/types/game';

type LocalGameCollectionId =
  | 'collection-trending-now'
  | 'collection-editors-picks'
  | 'collection-new-releases'
  | 'collection-multiplayer-spotlight'
  | 'collection-seasonal-picks'
  | 'collection-sponsored-highlights';

export type LocalHtml5GameRegistration = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: GameCategory;
  tags: string[];
  controls: GameControls;
  instructions: string[];
  rating: number;
  plays: number;
  isNew?: boolean;
  isTrending?: boolean;
  isEditorsPick?: boolean;
  mobileSupported?: boolean;
  fullscreenSupported?: boolean;
  difficulty?: GameDifficulty;
  orientation?: GameOrientation;
  releaseDate: string;
  updatedAt?: string;
  featuredWeight?: number;
  featuredPriority?: number;
  collectionIds?: LocalGameCollectionId[];
  supportedPlatforms?: GameSupportedPlatform[];
  playMode?: GamePlayMode;
  sourceOrigin?: GameSourceOrigin;
  status?: GameStatus;
  seoTitle?: string;
  seoDescription?: string;
  thumbnail?: string;
  coverImage?: string;
};

export function getLocalHtml5GamePaths(slug: string) {
  return {
    embedUrl: `/games/${slug}/index.html`,
    thumbnail: `/games/${slug}/assets/thumbnail.svg`,
    coverImage: `/games/${slug}/assets/cover.svg`
  };
}

/**
 * Standard registration helper for local HTML5 packages.
 *
 * Future first-party games should live at:
 * public/games/[slug]/index.html
 * public/games/[slug]/game.js
 * public/games/[slug]/style.css
 *
 * Then add one createLocalHtml5Game({ ... }) entry to data/games.ts.
 */
export function createLocalHtml5Game(input: LocalHtml5GameRegistration): GameContentInput {
  const paths = getLocalHtml5GamePaths(input.slug);
  const isOriginal = input.sourceOrigin !== 'developer_submission';
  const fullscreenNote =
    input.fullscreenSupported === false ? 'Fullscreen not supported.' : 'Fullscreen verified.';

  return {
    id: `game-${input.slug}`,
    slug: input.slug,
    title: input.title,
    shortDescription: input.shortDescription,
    description: input.description,
    thumbnail: input.thumbnail ?? paths.thumbnail,
    coverImage: input.coverImage ?? paths.coverImage,
    category: input.category,
    tags: input.tags,
    rating: input.rating,
    plays: input.plays,
    isNew: input.isNew ?? true,
    isTrending: input.isTrending ?? false,
    isMultiplayer: false,
    isEditorsPick: input.isEditorsPick ?? false,
    embedUrl: paths.embedUrl,
    controls: input.controls,
    mobileSupported: input.mobileSupported ?? true,
    developerName: isOriginal ? 'PixloGames Lab' : undefined,
    publisherName: isOriginal ? 'PixloGames' : undefined,
    releaseDate: input.releaseDate,
    updatedAt: input.updatedAt ?? input.releaseDate,
    supportedPlatforms:
      input.supportedPlatforms ??
      (input.mobileSupported === false ? ['desktop'] : ['desktop', 'mobile', 'tablet']),
    orientation: input.orientation ?? 'responsive',
    difficulty: input.difficulty ?? 'medium',
    seoTitle: input.seoTitle ?? `${input.title} - Play Instantly on PixloGames`,
    seoDescription: input.seoDescription ?? input.shortDescription,
    contentRating: 'Everyone',
    featuredWeight: input.featuredWeight,
    isFeatured: input.isEditorsPick ?? false,
    isSponsored: false,
    adSafe: true,
    status: input.status ?? 'published',
    playMode: input.playMode ?? 'single-player',
    hasRealEmbed: true,
    embedType: 'html5-package',
    submissionStatus: 'approved',
    moderationStatus: 'approved',
    reviewNotes: [
      'Registered through the local HTML5 game ingestion helper.',
      fullscreenNote,
      `Instructions: ${input.instructions.join(' ')}`
    ],
    featuredPriority: input.featuredPriority,
    sponsoredPriority: 0,
    collectionIds: input.collectionIds ?? [],
    visibility: 'public',
    publishAt: input.releaseDate,
    sourceOrigin: input.sourceOrigin ?? 'first_party',
    ingestionWarnings: [],
    qaStatus: 'passed'
  };
}
