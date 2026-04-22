import { describe, expect, it } from 'vitest';
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
