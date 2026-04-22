import { apiError, apiOk } from '@/lib/api-response';
import { trackServerEvent } from '@/lib/analytics-server';
import { requireApiPermission } from '@/lib/auth/session';
import {
  createGameDraftFromSubmission,
  updateGamePublishingState
} from '@/lib/repositories/content-repository';
import type { PublishingPatch } from '@/types/schema';

const gamePublishingActions = new Set<PublishingPatch['action']>([
  'publish_game',
  'unpublish_game',
  'save_game_draft',
  'promote_featured',
  'mark_sponsored_eligible'
]);

export async function POST(request: Request) {
  const access = await requireApiPermission(request, 'publish_games');

  if (!access.ok) {
    return access.response;
  }

  const payload = (await request.json().catch(() => undefined)) as PublishingPatch | undefined;

  if (!payload?.action) {
    return apiError('invalid_publishing_action', 'Publishing action is required.', 400);
  }

  if (payload.action === 'create_draft_from_submission') {
    if (!payload.submissionId) {
      return apiError('missing_submission_id', 'submissionId is required.', 400);
    }

    const result = await createGameDraftFromSubmission(
      payload.submissionId,
      access.session.user.name
    );

    if (!result.ok) {
      return apiError(result.code, result.message, 422, result.issues);
    }

    await trackServerEvent(
      'submission_reviewed',
      {
        submissionId: payload.submissionId,
        action: 'create_draft_from_submission',
        status: 'draft_created'
      },
      {
        sessionId: access.session.id,
        userId: access.session.user.id
      }
    );

    return apiOk(
      {
        game: result.game,
        actor: access.session.user.email,
        note: result.message
      },
      {
        source: 'postgresql',
        durable: true,
        count: 1
      }
    );
  }

  if (!gamePublishingActions.has(payload.action)) {
    return apiError('unsupported_publishing_action', 'Publishing action is not supported.', 400);
  }

  if (!payload.gameId) {
    return apiError('missing_game_id', 'gameId is required.', 400);
  }

  const result = await updateGamePublishingState({
    gameId: payload.gameId,
    action: payload.action,
    featuredPriority: payload.featuredPriority,
    sponsoredPriority: payload.sponsoredPriority,
    reviewNote: payload.reviewNote,
    reviewerName: access.session.user.name
  });

  if (!result.ok) {
    return apiError(result.code, result.message, 422, result.issues);
  }

  if (payload.action === 'publish_game' || payload.action === 'unpublish_game') {
    await trackServerEvent(
      payload.action === 'publish_game' ? 'game_published' : 'game_unpublished',
      {
        gameId: result.game.id,
        slug: result.game.slug,
        sourceSubmissionId: result.game.sourceSubmissionId
      },
      {
        sessionId: access.session.id,
        userId: access.session.user.id
      }
    );
  }

  return apiOk(
    {
      game: result.game,
      actor: access.session.user.email,
      note: result.message
    },
    {
      source: 'postgresql',
      durable: true,
      count: 1
    }
  );
}
