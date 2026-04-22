import { apiError, apiOk } from '@/lib/api-response';
import { trackServerEvent } from '@/lib/analytics-server';
import { requireApiPermission } from '@/lib/auth/session';
import {
  addSubmissionReviewNote,
  listSubmissions,
  updateRuntimeSubmissionStatus
} from '@/lib/repositories/content-repository';
import type { SubmissionAdminPatch } from '@/types/schema';
import type { SubmissionStatus } from '@/types/submission';

const actionToStatus: Partial<Record<SubmissionAdminPatch['action'], SubmissionStatus>> = {
  approve: 'approved',
  reject: 'rejected',
  needs_changes: 'needs_changes',
  in_review: 'in_review',
  add_note: undefined
};

export async function GET(request: Request) {
  const access = await requireApiPermission(request, 'review_submissions');

  if (!access.ok) {
    return access.response;
  }

  const submissions = await listSubmissions({ includeRuntime: true });

  return apiOk(submissions, {
    source: 'postgresql',
    durable: true,
    count: submissions.length
  });
}

export async function PATCH(request: Request) {
  const access = await requireApiPermission(request, 'review_submissions');

  if (!access.ok) {
    return access.response;
  }

  const payload = (await request.json().catch(() => undefined)) as SubmissionAdminPatch | undefined;

  if (!payload?.submissionId || !payload.action) {
    return apiError('invalid_submission_action', 'submissionId and action are required.', 400);
  }

  if (payload.action === 'add_note') {
    if (!payload.reviewNote?.trim()) {
      return apiError('missing_review_note', 'A review note is required.', 400);
    }

    const submission = await addSubmissionReviewNote(
      payload.submissionId,
      payload.reviewNote,
      access.session.user.name
    );

    if (!submission) {
      return apiError('submission_not_found', 'Submission not found.', 404);
    }

    await trackServerEvent(
      'submission_reviewed',
      {
        submissionId: payload.submissionId,
        action: 'add_note',
        status: submission.status
      },
      {
        sessionId: access.session.id,
        userId: access.session.user.id
      }
    );

    return apiOk(
      {
        submission,
        actor: access.session.user.email,
        note: 'Review note persisted to PostgreSQL through a protected internal route.'
      },
      {
        source: 'postgresql',
        durable: true,
        count: 1
      }
    );
  }

  const status = actionToStatus[payload.action];

  if (!status) {
    return apiError('unsupported_action', 'Submission action is not supported.', 400);
  }

  const submission = await updateRuntimeSubmissionStatus(
    payload.submissionId,
    status,
    payload.reviewNote,
    access.session.user.name
  );

  if (!submission) {
    return apiError('submission_not_found', 'Submission not found.', 404);
  }

  await trackServerEvent(
    'submission_reviewed',
    {
      submissionId: payload.submissionId,
      action: payload.action,
      status: submission.status
    },
    {
      sessionId: access.session.id,
      userId: access.session.user.id
    }
  );

  return apiOk(
    {
      submission,
      actor: access.session.user.email,
      note: 'Submission action persisted to PostgreSQL through a protected internal route.'
    },
    {
      source: 'postgresql',
      durable: true,
      count: 1
    }
  );
}
