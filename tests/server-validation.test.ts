import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    mediaAsset: {
      create: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

import { maxImageUploadBytes, validateImageUpload } from '@/lib/media/local-storage';
import {
  createSubmissionFromPayload,
  hashIntakeIdentifier,
  validateGameForServer,
  validateSubmissionPayload
} from '@/lib/server-validation';
import { makeGame } from './fixtures';

const validSubmissionPayload = {
  title: 'Sky Switch',
  shortDescription: 'A polished arcade reflex game for quick browser sessions.',
  description:
    'Sky Switch is a polished HTML5 arcade game with simple controls, fast restarts, and a mobile-friendly browser play loop built for PixloGames review.',
  tags: 'Arcade, Reflex, Mobile, Reflex',
  developerName: 'North Pixel Studio',
  publisherName: 'North Pixel',
  contactEmail: 'TEAM@EXAMPLE.COM',
  category: 'Arcade',
  supportedPlatforms: ['desktop', 'mobile'],
  sourceType: 'html5-package',
  buildUrl: 'https://example.com/build.zip',
  thumbnailUrl: 'https://example.com/thumb.png',
  coverImageUrl: 'https://example.com/cover.png',
  websiteUrl: 'https://example.com',
  submitterNotes: 'Ready for review.',
  termsAccepted: 'on'
};

describe('submission server validation', () => {
  it('normalizes a valid submission payload', () => {
    const result = validateSubmissionPayload(validSubmissionPayload);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.contactEmail).toBe('team@example.com');
      expect(result.data.tags).toEqual(['arcade', 'reflex', 'mobile']);
      expect(result.data.proposedEmbedType).toBe('html5-package');
      expect(result.data.supportedPlatforms).toEqual(['desktop', 'mobile']);
    }
  });

  it('rejects unsafe URLs and missing submission terms', () => {
    const result = validateSubmissionPayload({
      ...validSubmissionPayload,
      buildUrl: 'http://example.com/build.zip',
      termsAccepted: false
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues).toContain('Playable URL or package link must be HTTPS.');
      expect(result.issues).toContain('Submission terms must be accepted.');
    }
  });

  it('rejects malformed required fields and unsupported submission settings', () => {
    const result = validateSubmissionPayload({
      ...validSubmissionPayload,
      title: 'A',
      shortDescription: 'Too short',
      description: 'Still too short',
      developerName: '',
      contactEmail: 'not-an-email',
      category: 'Rhythm',
      sourceType: 'zip-upload',
      supportedPlatforms: []
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues).toContain('Game title must be between 2 and 90 characters.');
      expect(result.issues).toContain('Short description must be between 18 and 180 characters.');
      expect(result.issues).toContain('Full description must be between 60 and 1800 characters.');
      expect(result.issues).toContain('Developer name is required.');
      expect(result.issues).toContain('A valid contact email is required.');
      expect(result.issues).toContain('A supported category is required.');
      expect(result.issues).toContain('A supported source type is required.');
      expect(result.issues).toContain('Select at least one supported platform.');
    }
  });

  it('rejects insecure optional URLs when they are provided', () => {
    const result = validateSubmissionPayload({
      ...validSubmissionPayload,
      sourceUrl: 'http://example.com/source.html',
      thumbnailUrl: 'http://example.com/thumb.png',
      coverImageUrl: 'http://example.com/cover.png',
      websiteUrl: 'http://example.com'
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues).toContain('Source URL must be HTTPS when provided.');
      expect(result.issues).toContain('Thumbnail URL must be HTTPS when provided.');
      expect(result.issues).toContain('Cover image URL must be HTTPS when provided.');
      expect(result.issues).toContain('Developer or game website must be HTTPS when provided.');
    }
  });

  it('warns when discovery tags and artwork are missing, while keeping a valid submission usable', () => {
    const result = validateSubmissionPayload({
      ...validSubmissionPayload,
      tags: '',
      thumbnailUrl: '',
      coverImageUrl: ''
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.warnings).toContain(
        'No tags were provided. Reviewers may need to add discovery tags.'
      );
      expect(result.warnings).toContain(
        'Thumbnail and cover art should be uploaded or provided by URL before publishing.'
      );
    }
  });

  it('creates a pending submission with contextual intake signals', () => {
    const result = createSubmissionFromPayload(validSubmissionPayload, {
      intakeWarnings: ['Potential duplicate detected.'],
      duplicateSignal: 'sub-existing',
      abuseScore: 20,
      submittedIpHash: hashIntakeIdentifier('127.0.0.1'),
      submittedUserAgent: 'vitest'
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.id).toMatch(/^sub-/);
      expect(result.data.status).toBe('pending');
      expect(result.data.duplicateSignal).toBe('sub-existing');
      expect(result.data.abuseScore).toBe(20);
      expect(result.data.intakeWarnings).toContain('Potential duplicate detected.');
      expect(result.data.criteria.mobile).toBe(true);
    }
  });

  it('rejects unsupported image upload types', () => {
    const result = validateImageUpload({
      name: 'cover.svg',
      size: 1024,
      type: 'image/svg+xml'
    } as File);

    expect(result).toEqual({
      ok: false,
      issue: 'Only JPG, PNG, WebP, and GIF image uploads are supported.'
    });
  });

  it('rejects oversized image uploads', () => {
    const result = validateImageUpload({
      name: 'cover.png',
      size: maxImageUploadBytes + 1,
      type: 'image/png'
    } as File);

    expect(result).toEqual({
      ok: false,
      issue: 'Image uploads must be 5 MB or smaller.'
    });
  });

  it('reports publish-facing game consistency issues', () => {
    const issues = validateGameForServer(
      makeGame({
        hasRealEmbed: true,
        source: {
          mode: 'preview',
          embedType: 'html5-package',
          message: 'Preview only.'
        },
        visibility: 'public',
        qaStatus: 'failed'
      })
    );

    expect(issues).toContain('hasRealEmbed requires an embedded source mode.');
    expect(issues).toContain('Failed QA games cannot be public.');
  });
});
