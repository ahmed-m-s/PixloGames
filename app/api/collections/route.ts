import { apiOk } from '@/lib/api-response';
import { listCollections } from '@/lib/repositories/content-repository';

export async function GET() {
  const collections = await listCollections();

  return apiOk(collections, {
    source: 'postgresql',
    durable: true,
    count: collections.length
  });
}
