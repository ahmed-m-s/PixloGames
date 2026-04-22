import { apiOk } from '@/lib/api-response';
import { getPublicHealth } from '@/lib/diagnostics';

export async function GET() {
  const health = await getPublicHealth();

  return apiOk(health, {
    source: 'postgresql',
    durable: true,
    count: health.checks.publicGames
  });
}
