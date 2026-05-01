import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveMediaFileInput } from '@/lib/media/storage-provider';
import type { SubmissionIntakePayload } from '@/lib/server-validation';

const mocks = vi.hoisted(() => ({
  createRuntimeSubmission: vi.fn(),
  getSubmissionIntakeSignals: vi.fn(),
  listSubmissions: vi.fn(),
  saveMediaFile: vi.fn(),
  trackServerEvent: vi.fn(),
  updateSubmissionAssetUrls: vi.fn()
}));

vi.mock('@/lib/analytics-server', () => ({
  trackServerEvent: mocks.trackServerEvent
}));

vi.mock('@/lib/media/storage-provider', () => ({
  getMediaProviderDiagnostics: () => ({
    mode: 'local-dev'
  }),
  isUsableUploadFile: (value: FormDataEntryValue | null) =>
    typeof File !== 'undefined' && value instanceof File && value.size > 0,
  saveMediaFile: mocks.saveMediaFile,
  validateImageUpload: (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      return {
        ok: false,
        issue: 'Only JPG, PNG, WebP, and GIF image uploads are supported.'
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        ok: false,
        issue: 'Image uploads must be 5 MB or smaller.'
      };
    }

    return {
      ok: true
    };
  }
}));

vi.mock('@/lib/repositories/content-repository', () => ({
  createRuntimeSubmission: mocks.createRuntimeSubmission,
  getSubmissionIntakeSignals: mocks.getSubmissionIntakeSignals,
  listSubmissions: mocks.listSubmissions,
  updateSubmissionAssetUrls: mocks.updateSubmissionAssetUrls
}));

import { POST as createSubmission } from '@/app/api/submissions/route';

function makeValidSubmissionPayload(
  overrides: Partial<SubmissionIntakePayload> = {}
): SubmissionIntakePayload {
  return {
    title: 'Sky Switch',
    shortDescription: 'A polished arcade reflex game for quick browser sessions.',
    description:
      'Sky Switch is a polished HTML5 arcade game with simple controls, fast restarts, and a mobile-friendly browser play loop built for PixloGames review.',
    tags: 'Arcade, Reflex, Mobile',
    developerName: 'North Pixel Studio',
    publisherName: 'North Pixel',
    contactEmail: 'team@example.com',
    category: 'Arcade',
    supportedPlatforms: ['desktop', 'mobile'],
    sourceType: 'html5-package',
    buildUrl: 'https://example.com/build.zip',
    thumbnailUrl: 'https://example.com/thumb.png',
    coverImageUrl: 'https://example.com/cover.png',
    websiteUrl: 'https://example.com',
    submitterNotes: 'Ready for review.',
    termsAccepted: 'on',
    ...overrides
  };
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

describe('submission intake route validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSubmissionIntakeSignals.mockResolvedValue({
      recentCount: 0,
      duplicateSignal: undefined,
      warnings: [],
      abuseScore: 0,
      rateLimited: false
    });
    mocks.createRuntimeSubmission.mockImplementation(async (submission) => submission);
    mocks.saveMediaFile.mockImplementation(async (input: SaveMediaFileInput) => ({
      id: `media-${input.assetType}`,
      assetType: input.assetType,
      originalFilename: input.file.name,
      mimeType: input.file.type,
      fileSize: input.file.size,
      storageProvider: 'local-dev',
      storageKey: `${input.assetType}/${input.file.name}`,
      publicUrl: `/api/media/media-${input.assetType}`,
      uploadSource: input.uploadSource,
      submissionId: input.submissionId,
      gameId: input.gameId,
      createdAt: '2026-04-22',
      updatedAt: '2026-04-22'
    }));
    mocks.updateSubmissionAssetUrls.mockImplementation(async (_submissionId, assetUrls) => ({
      ...assetUrls
    }));
  });

  it('rejects malformed submission bodies before validation starts', async () => {
    const response = await createSubmission(
      new Request('https://pixlogames.test/api/submissions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: '{'
      })
    );

    const body = await readJson<{
      ok: boolean;
      error: { code: string; message: string };
    }>(response);

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_submission_body');
    expect(mocks.getSubmissionIntakeSignals).not.toHaveBeenCalled();
    expect(mocks.createRuntimeSubmission).not.toHaveBeenCalled();
  });

  it('rejects invalid media uploads with a clear API validation error', async () => {
    const formData = new FormData();
    const payload = makeValidSubmissionPayload();

    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    }

    formData.append(
      'thumbnailFile',
      new File(['<svg></svg>'], 'cover.svg', { type: 'image/svg+xml' })
    );

    const response = await createSubmission(
      new Request('https://pixlogames.test/api/submissions', {
        method: 'POST',
        body: formData
      })
    );

    const body = await readJson<{
      ok: boolean;
      error: { code: string; issues?: string[] };
    }>(response);

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_media_upload');
    expect(body.error.issues).toContain(
      'Only JPG, PNG, WebP, and GIF image uploads are supported.'
    );
    expect(mocks.getSubmissionIntakeSignals).not.toHaveBeenCalled();
    expect(mocks.createRuntimeSubmission).not.toHaveBeenCalled();
  });

  it('blocks rate-limited submissions before persistence', async () => {
    mocks.getSubmissionIntakeSignals.mockResolvedValueOnce({
      recentCount: 5,
      duplicateSignal: 'sub-existing',
      warnings: ['Multiple submissions from this contact email in the last hour.'],
      abuseScore: 60,
      rateLimited: true
    });

    const response = await createSubmission(
      new Request('https://pixlogames.test/api/submissions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(makeValidSubmissionPayload())
      })
    );

    const body = await readJson<{
      ok: boolean;
      error: { code: string; issues?: string[] };
    }>(response);

    expect(response.status).toBe(429);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('submission_rate_limited');
    expect(body.error.issues).toContain(
      'Multiple submissions from this contact email in the last hour.'
    );
    expect(mocks.createRuntimeSubmission).not.toHaveBeenCalled();
  });

  it('accepts a valid submission and carries duplicate signals into the stored intake data', async () => {
    mocks.getSubmissionIntakeSignals.mockResolvedValueOnce({
      recentCount: 1,
      duplicateSignal: 'sub-existing',
      warnings: ['Potential duplicate of submission sub-existing.'],
      abuseScore: 20,
      rateLimited: false
    });

    const response = await createSubmission(
      new Request('https://pixlogames.test/api/submissions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'vitest',
          'x-forwarded-for': '203.0.113.24'
        },
        body: JSON.stringify(makeValidSubmissionPayload())
      })
    );

    const body = await readJson<{
      ok: boolean;
      data: {
        duplicateSignal?: string;
        intakeWarnings?: string[];
        abuseScore?: number;
      };
      meta: {
        count: number;
      };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.meta.count).toBe(1);
    expect(body.data.duplicateSignal).toBe('sub-existing');
    expect(body.data.abuseScore).toBe(20);
    expect(body.data.intakeWarnings).toContain('Potential duplicate of submission sub-existing.');
    expect(mocks.createRuntimeSubmission).toHaveBeenCalledTimes(1);
    expect(mocks.trackServerEvent).toHaveBeenCalledWith('submission_created', {
      submissionId: expect.any(String),
      category: 'Arcade',
      sourceType: 'html5-package'
    });
  });
});
