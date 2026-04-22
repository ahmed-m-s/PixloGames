import type { Game } from '@/types/game';
import type { GameSubmission } from '@/types/submission';

export type IngestionSeverity = 'info' | 'warning' | 'error';

export type IngestionIssue = {
  severity: IngestionSeverity;
  field: string;
  message: string;
};

export type GameQualityReport = {
  score: number;
  issues: IngestionIssue[];
  readyForHomepage: boolean;
  readyForSponsored: boolean;
};

const requiredGameFields: (keyof Game)[] = [
  'title',
  'shortDescription',
  'description',
  'thumbnail',
  'coverImage',
  'category',
  'developerName',
  'publisherName',
  'releaseDate',
  'updatedAt',
  'embedType'
];

export function validateGameContent(game: Game): IngestionIssue[] {
  const issues: IngestionIssue[] = [];

  requiredGameFields.forEach((field) => {
    if (!game[field]) {
      issues.push({
        severity: 'error',
        field,
        message: `${String(field)} is required for publishing.`
      });
    }
  });

  if (game.hasRealEmbed && !game.source.url) {
    issues.push({
      severity: 'error',
      field: 'source.url',
      message: 'Real embeds require a playable source URL.'
    });
  }

  if (!game.mobileSupported && game.supportedPlatforms.includes('mobile')) {
    issues.push({
      severity: 'warning',
      field: 'supportedPlatforms',
      message: 'Mobile platform is listed but mobileSupported is false.'
    });
  }

  if (game.visibility === 'public' && game.moderationStatus !== 'approved') {
    issues.push({
      severity: 'error',
      field: 'moderationStatus',
      message: 'Public games must be approved by moderation.'
    });
  }

  if (game.source.mode === 'preview') {
    issues.push({
      severity: 'info',
      field: 'source',
      message: 'Game is in local preview mode until a real embed is connected.'
    });
  }

  game.ingestionWarnings.forEach((warning) => {
    issues.push({
      severity: 'warning',
      field: 'ingestionWarnings',
      message: warning
    });
  });

  return issues;
}

export function getGameQualityReport(game: Game): GameQualityReport {
  const issues = validateGameContent(game);
  const penalty = issues.reduce((total, issue) => {
    if (issue.severity === 'error') return total + 24;
    if (issue.severity === 'warning') return total + 12;
    return total + 4;
  }, 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    issues,
    readyForHomepage:
      score >= 70 &&
      game.visibility === 'public' &&
      game.status === 'published' &&
      game.qaStatus === 'passed',
    readyForSponsored:
      score >= 70 &&
      game.adSafe &&
      game.moderationStatus === 'approved' &&
      game.visibility === 'public'
  };
}

export function getSubmissionReadiness(submission: GameSubmission) {
  const completeCriteria = Object.values(submission.criteria).filter(Boolean).length;
  const totalCriteria = Object.values(submission.criteria).length;
  const metadataChecks = [
    submission.shortDescription,
    submission.description,
    submission.tags?.length,
    submission.sourceUrl ?? submission.buildUrl,
    submission.thumbnailUrl,
    submission.coverImageUrl,
    submission.termsAccepted
  ].filter(Boolean).length;
  const totalChecks = totalCriteria + 7;

  return Math.round(((completeCriteria + metadataChecks) / totalChecks) * 100);
}

export function getSubmissionIntakeIssues(submission: GameSubmission): IngestionIssue[] {
  const issues: IngestionIssue[] = [];

  if (!submission.shortDescription) {
    issues.push({
      severity: 'warning',
      field: 'shortDescription',
      message: 'Short description is missing.'
    });
  }

  if (!submission.description) {
    issues.push({
      severity: 'warning',
      field: 'description',
      message: 'Full gameplay description is missing.'
    });
  }

  if (!submission.tags?.length) {
    issues.push({
      severity: 'warning',
      field: 'tags',
      message: 'Discovery tags are missing.'
    });
  }

  if (!submission.thumbnailUrl || !submission.coverImageUrl) {
    issues.push({
      severity: 'warning',
      field: 'assets',
      message: 'Thumbnail and cover image references should be provided before publishing.'
    });
  }

  if (!submission.termsAccepted) {
    issues.push({
      severity: 'error',
      field: 'termsAccepted',
      message: 'Developer terms acceptance is missing.'
    });
  }

  (submission.intakeWarnings ?? []).forEach((warning) => {
    issues.push({
      severity: 'warning',
      field: 'intakeWarnings',
      message: warning
    });
  });

  return issues;
}
