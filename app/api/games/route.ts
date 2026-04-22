import { apiOk } from '@/lib/api-response';
import { listGames } from '@/lib/repositories/content-repository';

export async function GET() {
  const games = await listGames();

  return apiOk(games, {
    source: 'postgresql',
    durable: true,
    count: games.length
  });
}
