import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { appConfig } from '@/lib/config';
import { prisma } from '@/lib/db/prisma';
import { mapDbMediaAssetToMediaAsset } from '@/lib/repositories/prisma-mappers';
import type { MediaAsset, MediaAssetType, MediaUploadSource } from '@/types/media';

function getLocalStorageSegments(value: string) {
  const segments = value
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..');

  if (segments[0] === 'storage' && segments[1] === 'media') {
    return segments.slice(2);
  }

  return segments;
}

export const mediaStorageRoot = path.join(
  process.cwd(),
  'storage',
  'media',
  ...getLocalStorageSegments(appConfig.media.localRoot)
);
export const maxImageUploadBytes = 5 * 1024 * 1024;

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

export type MediaValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      issue: string;
    };

export type SaveMediaFileInput = {
  file: File;
  assetType: MediaAssetType;
  uploadSource: MediaUploadSource;
  submissionId?: string;
  gameId?: string;
};

export function isUsableUploadFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== 'undefined' && value instanceof File && value.size > 0;
}

export function validateImageUpload(file: File): MediaValidationResult {
  if (!allowedImageMimeTypes.has(file.type)) {
    return {
      ok: false,
      issue: 'Only JPG, PNG, WebP, and GIF image uploads are supported.'
    };
  }

  if (file.size > maxImageUploadBytes) {
    return {
      ok: false,
      issue: 'Image uploads must be 5 MB or smaller.'
    };
  }

  return {
    ok: true
  };
}

function cleanFilename(filename: string) {
  return (
    filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'upload'
  );
}

function resolveStoragePath(storageKey: string) {
  const resolved = path.resolve(mediaStorageRoot, storageKey);
  const root = path.resolve(mediaStorageRoot);

  if (!resolved.startsWith(root)) {
    throw new Error('Resolved media path escaped the local storage root.');
  }

  return resolved;
}

export async function saveLocalMediaFile({
  file,
  assetType,
  uploadSource,
  submissionId,
  gameId
}: SaveMediaFileInput): Promise<MediaAsset> {
  const validation = validateImageUpload(file);

  if (!validation.ok) {
    throw new Error(validation.issue);
  }

  const id = `media-${randomUUID()}`;
  const extension = extensionByMimeType[file.type] ?? 'bin';
  const safeName = cleanFilename(file.name);
  const ownerFolder = submissionId ?? gameId ?? 'unlinked';
  const storageKey = path.posix.join(
    uploadSource,
    ownerFolder,
    `${assetType}-${id}-${safeName}.${extension}`
  );
  const storagePath = resolveStoragePath(storageKey);
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(path.dirname(storagePath), { recursive: true });
  await writeFile(storagePath, bytes);

  const row = await prisma.mediaAsset.create({
    data: {
      id,
      assetType,
      originalFilename: file.name || safeName,
      mimeType: file.type,
      fileSize: file.size,
      storageProvider: 'local-dev',
      storageKey,
      storagePath,
      publicUrl: `/api/media/${id}`,
      uploadSource,
      submissionId,
      gameId
    }
  });

  return mapDbMediaAssetToMediaAsset(row);
}

export async function getMediaAssetById(assetId: string) {
  const row = await prisma.mediaAsset.findUnique({
    where: {
      id: assetId
    }
  });

  return row ? mapDbMediaAssetToMediaAsset(row) : undefined;
}

export async function readLocalMediaAsset(asset: MediaAsset) {
  if (asset.storageProvider !== 'local-dev') {
    throw new Error('Only local-dev media assets can be served by this route.');
  }

  const storagePath = resolveStoragePath(asset.storageKey);
  const bytes = await readFile(storagePath);

  return {
    bytes,
    contentType: asset.mimeType
  };
}
