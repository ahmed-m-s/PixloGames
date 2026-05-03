import { createHash } from 'node:crypto';
import { getGameEmbedSecurityIssues } from '@/lib/embed-security';
import { validateGameContent } from '@/lib/ingestion';
import type { Game, GameEmbedType, GameSupportedPlatform } from '@/types/game';
import type { GameSubmission, SubmissionSourceType } from '@/types/submission';

export type SubmissionIntakePayload = {
  title?: unknown;
  shortDescription?: unknown;
  description?: unknown;
  tags?: unknown;
  developerName?: unknown;
  publisherName?: unknown;
  contactEmail?: unknown;
  category?: unknown;
  supportedPlatforms?: unknown;
  sourceType?: unknown;
  sourceUrl?: unknown;
  buildUrl?: unknown;
  thumbnailUrl?: unknown;
  coverImageUrl?: unknown;
  hasThumbnailUpload?: unknown;
  hasCoverUpload?: unknown;
  websiteUrl?: unknown;
  submitterNotes?: unknown;
  termsAccepted?: unknown;
};

export type SubmissionIntakeContext = {
  intakeWarnings?: string[];
  duplicateSignal?: string;
  abuseScore?: number;
  submittedIpHash?: string;
  submittedUserAgent?: string;
};

export type ValidationResult<T> =
  | {
      ok: true;
      data: T;
      warnings?: string[];
    }
  | {
      ok: false;
      issues: string[];
    };

type ValidatedSubmissionData = Omit<
  GameSubmission,
  'id' | 'submittedAt' | 'updatedAt' | 'status' | 'reviewOwner' | 'reviewNotes' | 'criteria'
>;

const validCategories = new Set([
  'Action',
  'Racing',
  'Puzzle',
  'Adventure',
  'Multiplayer',
  'Shooting',
  'Sports',
  'Arcade',
  'Management'
]);

const validPlatforms = new Set<GameSupportedPlatform>(['desktop', 'mobile', 'tablet', 'gamepad']);

const validSourceTypes = new Set<SubmissionSourceType>([
  'iframe',
  'html5-package',
  'external-provider',
  'source-reference'
]);

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asBoolean(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function normalizeTags(value: unknown) {
  const rawTags = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];

  return Array.from(
    new Set(
      rawTags
        .map((tag) => asString(tag).toLowerCase())
        .filter((tag) => tag.length > 0)
        .map((tag) =>
          tag
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
        )
        .filter(Boolean)
    )
  ).slice(0, 8);
}

function normalizePlatforms(value: unknown) {
  const rawPlatforms = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const platforms = rawPlatforms
    .map((platform) => asString(platform).toLowerCase())
    .filter((platform): platform is GameSupportedPlatform =>
      validPlatforms.has(platform as GameSupportedPlatform)
    );

  return Array.from(new Set(platforms));
}

function normalizeUrl(value: unknown) {
  const url = asString(value);

  return url || undefined;
}

function isHttpsUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function inferEmbedType(sourceType: SubmissionSourceType): GameEmbedType {
  if (sourceType === 'html5-package') return 'html5-package';
  if (sourceType === 'external-provider') return 'external-provider';
  if (sourceType === 'iframe') return 'iframe';
  return 'none';
}

export function hashIntakeIdentifier(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function validateSubmissionPayload(
  payload: SubmissionIntakePayload
): ValidationResult<ValidatedSubmissionData> {
  const title = asString(payload.title);
  const shortDescription = asString(payload.shortDescription);
  const description = asString(payload.description);
  const developerName = asString(payload.developerName);
  const publisherName = asString(payload.publisherName);
  const contactEmail = asString(payload.contactEmail).toLowerCase();
  const category = asString(payload.category);
  const sourceType = asString(payload.sourceType) || 'source-reference';
  const sourceUrl = normalizeUrl(payload.sourceUrl);
  const buildUrl = normalizeUrl(payload.buildUrl) ?? sourceUrl ?? '';
  const thumbnailUrl = normalizeUrl(payload.thumbnailUrl);
  const coverImageUrl = normalizeUrl(payload.coverImageUrl);
  const hasThumbnailUpload = asBoolean(payload.hasThumbnailUpload);
  const hasCoverUpload = asBoolean(payload.hasCoverUpload);
  const websiteUrl = normalizeUrl(payload.websiteUrl);
  const submitterNotes = asString(payload.submitterNotes);
  const tags = normalizeTags(payload.tags);
  const supportedPlatforms = normalizePlatforms(payload.supportedPlatforms);
  const termsAccepted = asBoolean(payload.termsAccepted);
  const issues: string[] = [];
  const warnings: string[] = [];

  if (title.length < 2 || title.length > 90) {
    issues.push('Game title must be between 2 and 90 characters.');
  }

  if (shortDescription.length < 18 || shortDescription.length > 180) {
    issues.push('Short description must be between 18 and 180 characters.');
  }

  if (description.length < 60 || description.length > 1800) {
    issues.push('Full description must be between 60 and 1800 characters.');
  }

  if (developerName.length < 2 || developerName.length > 100) {
    issues.push('Developer name is required.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    issues.push('A valid contact email is required.');
  }

  if (!validCategories.has(category)) {
    issues.push('A supported category is required.');
  }

  if (!validSourceTypes.has(sourceType as SubmissionSourceType)) {
    issues.push('A supported source type is required.');
  }

  if (!isHttpsUrl(buildUrl)) {
    issues.push('Playable URL or package link must be HTTPS.');
  }

  if (sourceUrl && !isHttpsUrl(sourceUrl)) {
    issues.push('Source URL must be HTTPS when provided.');
  }

  if (thumbnailUrl && !isHttpsUrl(thumbnailUrl)) {
    issues.push('Thumbnail URL must be HTTPS when provided.');
  }

  if (coverImageUrl && !isHttpsUrl(coverImageUrl)) {
    issues.push('Cover image URL must be HTTPS when provided.');
  }

  if (websiteUrl && !isHttpsUrl(websiteUrl)) {
    issues.push('Developer or game website must be HTTPS when provided.');
  }

  if (tags.length === 0) {
    warnings.push('No tags were provided. Reviewers may need to add discovery tags.');
  }

  if (supportedPlatforms.length === 0) {
    issues.push('Select at least one supported platform.');
  }

  if (!termsAccepted) {
    issues.push('Submission terms must be accepted.');
  }

  if ((!thumbnailUrl && !hasThumbnailUpload) || (!coverImageUrl && !hasCoverUpload)) {
    warnings.push(
      'Thumbnail and cover art should be uploaded or provided by URL before publishing.'
    );
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    warnings,
    data: {
      title,
      shortDescription,
      description,
      tags,
      developerName,
      publisherName: publisherName || undefined,
      contactEmail,
      category: category as GameSubmission['category'],
      proposedEmbedType: inferEmbedType(sourceType as SubmissionSourceType),
      buildUrl,
      sourceType: sourceType as SubmissionSourceType,
      sourceUrl,
      thumbnailUrl,
      coverImageUrl,
      websiteUrl,
      submitterNotes: submitterNotes || undefined,
      intakeWarnings: warnings,
      supportedPlatforms,
      termsAccepted
    }
  };
}

export function validateGameForServer(game: Game) {
  const issues = validateGameContent(game);
  const sourceIssues: string[] = [];

  if (game.hasRealEmbed && game.source.mode !== 'embedded') {
    sourceIssues.push('hasRealEmbed requires an embedded source mode.');
  }

  sourceIssues.push(...getGameEmbedSecurityIssues(game).map((issue) => issue.message));

  if (game.visibility === 'public' && game.qaStatus === 'failed') {
    sourceIssues.push('Failed QA games cannot be public.');
  }

  return [...issues.map((issue) => issue.message), ...sourceIssues];
}

export function createSubmissionFromPayload(
  payload: SubmissionIntakePayload,
  context: SubmissionIntakeContext = {}
): ValidationResult<GameSubmission> {
  const validated = validateSubmissionPayload(payload);

  if (!validated.ok) {
    return validated;
  }

  const now = new Date().toISOString().slice(0, 10);
  const intakeWarnings = [
    ...(validated.data.intakeWarnings ?? []),
    ...(context.intakeWarnings ?? [])
  ];

  return {
    ok: true,
    warnings: intakeWarnings,
    data: {
      id: `sub-${crypto.randomUUID()}`,
      ...validated.data,
      intakeWarnings,
      duplicateSignal: context.duplicateSignal,
      abuseScore: context.abuseScore ?? 0,
      submittedIpHash: context.submittedIpHash,
      submittedUserAgent: context.submittedUserAgent,
      submittedAt: now,
      updatedAt: now,
      status: 'pending',
      reviewOwner: 'Unassigned',
      reviewNotes: ['Submitted through the PostgreSQL-backed intake API.'],
      criteria: {
        performance: false,
        controls: false,
        adSafety: false,
        rights: false,
        mobile: validated.data.supportedPlatforms.includes('mobile')
      }
    }
  };
}
