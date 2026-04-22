import type { IngestionIssue } from '@/lib/ingestion';
import { getGameEmbedSecurityIssues } from '@/lib/embed-security';
import type {
  Game,
  GameEmbedType,
  GameOrientation,
  GamePlayMode,
  GameSupportedPlatform
} from '@/types/game';
import type { GameSubmission } from '@/types/submission';

export type PublishingReadiness = {
  eligible: boolean;
  score: number;
  issues: IngestionIssue[];
};

const requiredReviewCriteria: (keyof GameSubmission['criteria'])[] = [
  'performance',
  'controls',
  'adSafety',
  'rights'
];

function isHttpsUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function readinessFromIssues(issues: IngestionIssue[]): PublishingReadiness {
  const penalty = issues.reduce((total, issue) => {
    if (issue.severity === 'error') return total + 28;
    if (issue.severity === 'warning') return total + 12;
    return total + 4;
  }, 0);

  return {
    eligible: !issues.some((issue) => issue.severity === 'error'),
    score: Math.max(0, Math.min(100, 100 - penalty)),
    issues
  };
}

export function slugifyTitle(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'untitled-game';
}

export function getSubmissionPublishingReadiness(
  submission: GameSubmission,
  existingGameId?: string
): PublishingReadiness {
  const issues: IngestionIssue[] = [];

  if (submission.status !== 'approved') {
    issues.push({
      severity: 'error',
      field: 'status',
      message: 'Submission must be approved before a game draft can be created.'
    });
  }

  if (existingGameId) {
    issues.push({
      severity: 'error',
      field: 'publishedGame',
      message: 'A game record already exists for this submission.'
    });
  }

  if (!submission.shortDescription) {
    issues.push({
      severity: 'error',
      field: 'shortDescription',
      message: 'Short description is required for publishable game metadata.'
    });
  }

  if (!submission.description) {
    issues.push({
      severity: 'error',
      field: 'description',
      message: 'Full description is required before a game draft can be created.'
    });
  }

  if (!submission.thumbnailUrl || !submission.coverImageUrl) {
    issues.push({
      severity: 'error',
      field: 'assets',
      message: 'Thumbnail and cover image assets are required before publishing.'
    });
  }

  if (!isHttpsUrl(submission.sourceUrl ?? submission.buildUrl)) {
    issues.push({
      severity: 'error',
      field: 'source',
      message: 'Playable source must be an HTTPS URL.'
    });
  }

  if (!submission.termsAccepted) {
    issues.push({
      severity: 'error',
      field: 'termsAccepted',
      message: 'Developer submission terms must be accepted.'
    });
  }

  requiredReviewCriteria.forEach((criterion) => {
    if (!submission.criteria[criterion]) {
      issues.push({
        severity: 'error',
        field: criterion,
        message: `${criterion} review must pass before publishing.`
      });
    }
  });

  if (!submission.supportedPlatforms.length) {
    issues.push({
      severity: 'error',
      field: 'supportedPlatforms',
      message: 'At least one supported platform is required.'
    });
  }

  if (!submission.tags?.length) {
    issues.push({
      severity: 'warning',
      field: 'tags',
      message: 'Discovery tags are recommended before publication.'
    });
  }

  return readinessFromIssues(issues);
}

export function getGamePublishingReadiness(game: Game): PublishingReadiness {
  const issues: IngestionIssue[] = [];

  if (!game.title || !game.shortDescription || !game.description) {
    issues.push({
      severity: 'error',
      field: 'metadata',
      message: 'Title, short description, and description are required.'
    });
  }

  if (!game.thumbnail || !game.coverImage) {
    issues.push({
      severity: 'error',
      field: 'assets',
      message: 'Thumbnail and cover artwork are required.'
    });
  }

  if (game.moderationStatus !== 'approved') {
    issues.push({
      severity: 'error',
      field: 'moderationStatus',
      message: 'Game moderation must be approved.'
    });
  }

  if (game.qaStatus !== 'passed') {
    issues.push({
      severity: 'error',
      field: 'qaStatus',
      message: 'QA status must be passed before public publishing.'
    });
  }

  if (game.status === 'unavailable' || game.source.mode === 'unavailable') {
    issues.push({
      severity: 'error',
      field: 'source',
      message: 'Unavailable games cannot be published.'
    });
  }

  if (!game.embedUrl || game.embedType === 'none') {
    issues.push({
      severity: 'error',
      field: 'embed',
      message: 'A playable or preview source is required.'
    });
  }

  if (!game.adSafe && game.sponsoredPriority > 0) {
    issues.push({
      severity: 'error',
      field: 'adSafe',
      message: 'Sponsored games must be marked ad safe.'
    });
  }

  if (game.source.mode === 'preview') {
    issues.push({
      severity: 'info',
      field: 'source',
      message: 'This game uses the honest local preview shell until a real embed is connected.'
    });
  }

  getGameEmbedSecurityIssues(game).forEach((issue) => {
    issues.push({
      severity: 'error',
      field: issue.field,
      message: issue.message
    });
  });

  return readinessFromIssues(issues);
}

function inferOrientation(platforms: GameSupportedPlatform[]): GameOrientation {
  return platforms.includes('mobile') || platforms.includes('tablet') ? 'responsive' : 'landscape';
}

function inferPlayMode(submission: GameSubmission): GamePlayMode {
  return submission.category === 'Multiplayer' ? 'multiplayer' : 'single-player';
}

function inferEmbedType(submission: GameSubmission): GameEmbedType {
  if (submission.proposedEmbedType === 'none') {
    return 'local-preview';
  }

  return submission.proposedEmbedType;
}

export function buildDraftGameFromSubmission(submission: GameSubmission, slug: string): Game {
  const embedType = inferEmbedType(submission);
  const sourceUrl = submission.sourceUrl ?? submission.buildUrl;
  const hasRealEmbed =
    submission.sourceType !== 'source-reference' && embedType !== 'local-preview';
  const today = new Date().toISOString().slice(0, 10);
  const supportsMobile =
    submission.supportedPlatforms.includes('mobile') ||
    submission.supportedPlatforms.includes('tablet');

  return {
    id: `game-${slug}`,
    slug,
    title: submission.title,
    shortDescription: submission.shortDescription ?? '',
    description: submission.description ?? '',
    thumbnail: submission.thumbnailUrl ?? '',
    coverImage: submission.coverImageUrl ?? submission.thumbnailUrl ?? '',
    category: submission.category,
    tags: submission.tags ?? [],
    rating: 0,
    plays: 0,
    isNew: false,
    isTrending: false,
    isMultiplayer: submission.category === 'Multiplayer',
    isEditorsPick: false,
    embedUrl: sourceUrl,
    controls: {
      keyboard: ['Arrow keys'],
      touch: supportsMobile
    },
    mobileSupported: supportsMobile,
    developerName: submission.developerName,
    publisherName: submission.publisherName ?? submission.developerName,
    releaseDate: today,
    updatedAt: today,
    supportedPlatforms: submission.supportedPlatforms,
    orientation: inferOrientation(submission.supportedPlatforms),
    difficulty: submission.category === 'Puzzle' ? 'easy' : 'medium',
    seoTitle: submission.title,
    seoDescription: submission.shortDescription ?? submission.description ?? '',
    contentRating: 'Everyone',
    featuredWeight: 0,
    isFeatured: false,
    isSponsored: false,
    adSafe: submission.criteria.adSafety,
    status: 'draft',
    playMode: inferPlayMode(submission),
    hasRealEmbed,
    embedType,
    source: {
      mode: hasRealEmbed ? 'embedded' : 'preview',
      embedType: hasRealEmbed ? embedType : 'local-preview',
      providerName: 'Developer submission',
      url: sourceUrl,
      message: hasRealEmbed
        ? 'Playable source supplied through developer intake.'
        : 'Draft uses a source reference until a playable embed is connected.'
    },
    submissionStatus: 'approved',
    moderationStatus: 'approved',
    reviewNotes: [`Created from approved submission ${submission.id}.`],
    featuredPriority: 0,
    sponsoredPriority: 0,
    collectionIds: [],
    visibility: 'internal',
    publishAt: undefined,
    unpublishAt: undefined,
    sourceOrigin: 'developer_submission',
    ingestionWarnings: submission.intakeWarnings ?? [],
    qaStatus: 'needs_testing',
    sourceSubmissionId: submission.id
  };
}
