import { apiError, apiOk } from '@/lib/api-response';
import { getGameBySlugFromRepository } from '@/lib/repositories/content-repository';

type GameApiRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, { params }: GameApiRouteContext) {
  const { slug } = await params;
  const game = await getGameBySlugFromRepository(slug);

  if (!game) {
    return apiError('game_not_found', 'Game not found.', 404);
  }

  return apiOk(game, {
    source: 'postgresql',
    durable: true,
    count: 1
  });
}
