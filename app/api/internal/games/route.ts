import { apiError, apiOk } from '@/lib/api-response';
import { requireApiPermission } from '@/lib/auth/session';
import { listGames, updateGameAdminFields } from '@/lib/repositories/content-repository';
import { validateGameForServer } from '@/lib/server-validation';
import type { GameAdminPatch } from '@/types/schema';

export async function GET(request: Request) {
  const access = await requireApiPermission(request, 'manage_games');

  if (!access.ok) {
    return access.response;
  }

  const games = await listGames({ includeInternal: true });
  const validation = games.map((game) => ({
    gameId: game.id,
    slug: game.slug,
    issues: validateGameForServer(game)
  }));

  return apiOk(
    {
      games,
      validation
    },
    {
      source: 'postgresql',
      durable: true,
      count: games.length
    }
  );
}

export async function PATCH(request: Request) {
  const access = await requireApiPermission(request, 'manage_games');

  if (!access.ok) {
    return access.response;
  }

  const payload = (await request.json().catch(() => undefined)) as
    | ({ gameId?: string } & GameAdminPatch)
    | undefined;

  if (!payload?.gameId) {
    return apiError('missing_game_id', 'gameId is required for admin game actions.', 400);
  }

  const { gameId, ...patch } = payload;

  if (patch.visibility === 'public') {
    return apiError(
      'use_publishing_workflow',
      'Public visibility must be set through the protected publishing workflow.',
      409
    );
  }

  const game = await updateGameAdminFields(gameId, patch);

  if (!game) {
    return apiError('game_not_found', 'Game not found.', 404);
  }

  return apiOk(
    {
      game,
      requestedPatch: patch,
      actor: access.session.user.email,
      note: 'Admin action persisted to PostgreSQL through a protected internal route.'
    },
    {
      source: 'postgresql',
      durable: true,
      count: 1
    }
  );
}
