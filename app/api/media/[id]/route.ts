import { apiError } from '@/lib/api-response';
import { getMediaAssetById, readMediaAsset } from '@/lib/media/storage-provider';
import { logError } from '@/lib/observability/logger';

type MediaRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: MediaRouteContext) {
  const { id } = await params;
  const asset = await getMediaAssetById(id);

  if (!asset) {
    return apiError('media_not_found', 'Media asset not found.', 404);
  }

  try {
    const media = await readMediaAsset(asset);

    if (media.mode === 'redirect') {
      return new Response(null, {
        status: 302,
        headers: {
          Location: media.url,
          'Cache-Control': media.cacheControl,
          'X-Pixlo-Storage-Provider': asset.storageProvider
        }
      });
    }

    const body = Uint8Array.from(media.bytes);

    return new Response(body, {
      headers: {
        'Content-Type': media.contentType,
        'Content-Length': String(media.bytes.byteLength),
        'Cache-Control': media.cacheControl,
        'X-Pixlo-Storage-Provider': asset.storageProvider
      }
    });
  } catch (error) {
    logError('media_asset_read_failed', error, {
      mediaAssetId: id,
      storageProvider: asset.storageProvider
    });

    return apiError(
      'media_unavailable',
      'Media metadata exists, but the configured storage provider could not serve it.',
      404
    );
  }
}
