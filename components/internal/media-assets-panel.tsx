import Image from 'next/image';
import { StatusBadge } from '@/components/ui/status-badge';
import type { MediaAsset } from '@/types/media';

type MediaAssetsPanelProps = {
  assets?: MediaAsset[];
  title?: string;
  emptyCopy?: string;
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function MediaAssetsPanel({
  assets = [],
  title = 'Uploaded media',
  emptyCopy = 'No binary media has been uploaded yet.'
}: MediaAssetsPanelProps) {
  const thumbnails = assets.filter((asset) => asset.assetType === 'thumbnail').length;
  const covers = assets.filter((asset) => asset.assetType === 'cover').length;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xl font-bold text-foreground">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Media is served through PixloGames provider routes and tracked in PostgreSQL. Local/dev
            storage is active by default, with cloud storage adapters scaffolded for production.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={`${thumbnails} thumbnail`}
            tone={thumbnails > 0 ? 'success' : 'warning'}
          />
          <StatusBadge label={`${covers} cover`} tone={covers > 0 ? 'success' : 'warning'} />
        </div>
      </div>

      {assets.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {assets.map((asset) => (
            <article
              className="overflow-hidden rounded-lg border border-white/10 bg-black/[0.2]"
              key={asset.id}
            >
              <div className="aspect-video bg-black/[0.25]">
                <Image
                  alt={`${asset.assetType} asset ${asset.originalFilename}`}
                  className="h-full w-full object-cover"
                  height={360}
                  src={asset.publicUrl}
                  unoptimized
                  width={640}
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={asset.assetType} tone="brand" />
                  <StatusBadge label={asset.storageProvider} tone="neutral" />
                </div>
                <div>
                  <p className="break-all text-sm font-bold text-foreground">
                    {asset.originalFilename}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-muted">
                    {asset.mimeType} - {formatBytes(asset.fileSize)}
                  </p>
                </div>
                <a
                  className="inline-flex text-xs font-bold text-aqua transition hover:text-brand"
                  href={asset.publicUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open served media
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-white/10 bg-black/[0.18] p-4 text-sm leading-6 text-muted">
          {emptyCopy}
        </p>
      )}
    </section>
  );
}
