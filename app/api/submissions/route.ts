import { apiError, apiOk } from '@/lib/api-response';
import { trackServerEvent } from '@/lib/analytics-server';
import {
  getMediaProviderDiagnostics,
  isUsableUploadFile,
  saveMediaFile,
  validateImageUpload
} from '@/lib/media/storage-provider';
import {
  createRuntimeSubmission,
  getSubmissionIntakeSignals,
  listSubmissions,
  updateSubmissionAssetUrls
} from '@/lib/repositories/content-repository';
import {
  createSubmissionFromPayload,
  hashIntakeIdentifier,
  type SubmissionIntakePayload
} from '@/lib/server-validation';

export async function GET() {
  const submissions = await listSubmissions({ includeRuntime: true });

  return apiOk(submissions, {
    source: 'postgresql',
    durable: true,
    count: submissions.length
  });
}

function formDataToPayload(formData: FormData): SubmissionIntakePayload {
  return {
    title: formData.get('title'),
    shortDescription: formData.get('shortDescription'),
    description: formData.get('description'),
    tags: formData.get('tags'),
    developerName: formData.get('developerName'),
    publisherName: formData.get('publisherName'),
    contactEmail: formData.get('contactEmail'),
    category: formData.get('category'),
    supportedPlatforms: formData.getAll('supportedPlatforms'),
    sourceType: formData.get('sourceType'),
    sourceUrl: formData.get('sourceUrl'),
    buildUrl: formData.get('buildUrl'),
    thumbnailUrl: formData.get('thumbnailUrl'),
    coverImageUrl: formData.get('coverImageUrl'),
    websiteUrl: formData.get('websiteUrl'),
    submitterNotes: formData.get('submitterNotes'),
    termsAccepted: formData.get('termsAccepted')
  };
}

type SubmissionRequestBody = {
  payload?: SubmissionIntakePayload;
  thumbnailFile?: File;
  coverFile?: File;
};

async function readSubmissionPayload(request: Request): Promise<SubmissionRequestBody> {
  const contentType = request.headers.get('content-type') ?? '';

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    const formData = await request.formData();
    const thumbnailFile = formData.get('thumbnailFile');
    const coverFile = formData.get('coverFile');

    return {
      payload: formDataToPayload(formData),
      thumbnailFile: isUsableUploadFile(thumbnailFile) ? thumbnailFile : undefined,
      coverFile: isUsableUploadFile(coverFile) ? coverFile : undefined
    };
  }

  return {
    payload: (await request.json().catch(() => undefined)) as SubmissionIntakePayload | undefined
  };
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');

  return forwardedFor?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'local-dev';
}

export async function POST(request: Request) {
  const { payload, thumbnailFile, coverFile } = await readSubmissionPayload(request);

  if (!payload || typeof payload !== 'object') {
    return apiError('invalid_submission_body', 'Request body must be JSON or form data.', 400);
  }

  const uploadIssues = [
    thumbnailFile ? validateImageUpload(thumbnailFile) : undefined,
    coverFile ? validateImageUpload(coverFile) : undefined
  ]
    .filter((result): result is { ok: false; issue: string } => Boolean(result && !result.ok))
    .map((result) => result.issue);

  if (uploadIssues.length > 0) {
    return apiError('invalid_media_upload', 'Uploaded media failed validation.', 422, uploadIssues);
  }

  payload.hasThumbnailUpload = Boolean(thumbnailFile);
  payload.hasCoverUpload = Boolean(coverFile);

  const initialResult = createSubmissionFromPayload(payload);

  if (!initialResult.ok) {
    return apiError(
      'invalid_submission',
      'Submission payload failed validation.',
      422,
      initialResult.issues
    );
  }

  const signals = await getSubmissionIntakeSignals({
    title: initialResult.data.title,
    developerName: initialResult.data.developerName,
    contactEmail: initialResult.data.contactEmail,
    buildUrl: initialResult.data.buildUrl
  });

  if (signals.rateLimited) {
    return apiError(
      'submission_rate_limited',
      'Too many submissions were received from this contact email recently.',
      429,
      signals.warnings
    );
  }

  const result = createSubmissionFromPayload(payload, {
    intakeWarnings: signals.warnings,
    duplicateSignal: signals.duplicateSignal,
    abuseScore: signals.abuseScore,
    submittedIpHash: hashIntakeIdentifier(getRequestIp(request)),
    submittedUserAgent: request.headers.get('user-agent') ?? undefined
  });

  if (!result.ok) {
    return apiError(
      'invalid_submission',
      'Submission payload failed validation.',
      422,
      result.issues
    );
  }

  let submission = await createRuntimeSubmission(result.data);
  const assetUrls: {
    thumbnailUrl?: string;
    coverImageUrl?: string;
  } = {};

  try {
    if (thumbnailFile) {
      const thumbnail = await saveMediaFile({
        file: thumbnailFile,
        assetType: 'thumbnail',
        uploadSource: 'developer_submission',
        submissionId: submission.id
      });
      assetUrls.thumbnailUrl = thumbnail.publicUrl;
    }

    if (coverFile) {
      const cover = await saveMediaFile({
        file: coverFile,
        assetType: 'cover',
        uploadSource: 'developer_submission',
        submissionId: submission.id
      });
      assetUrls.coverImageUrl = cover.publicUrl;
    }
  } catch (error) {
    return apiError(
      'media_storage_failed',
      'Submission was received, but the configured media storage provider failed.',
      500,
      undefined,
      {
        submissionId: submission.id,
        mediaProvider: getMediaProviderDiagnostics().mode,
        errorName: error instanceof Error ? error.name : 'unknown'
      }
    );
  }

  if (assetUrls.thumbnailUrl || assetUrls.coverImageUrl) {
    submission = await updateSubmissionAssetUrls(submission.id, assetUrls);
  }

  await trackServerEvent('submission_created', {
    submissionId: submission.id,
    category: submission.category,
    sourceType: submission.sourceType
  });

  return apiOk(submission, {
    source: 'postgresql',
    durable: true,
    count: 1
  });
}
