import { createHash, createHmac, randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';
import { appConfig, type MediaStorageMode } from '@/lib/config';
import { mapDbMediaAssetToMediaAsset } from '@/lib/repositories/prisma-mappers';
import { validateImageUpload, type SaveMediaFileInput } from '@/lib/media/local-storage';
import type { MediaAsset } from '@/types/media';

type CloudMediaMode = Exclude<MediaStorageMode, 'local-dev'>;

type CloudMediaConfig = {
  mode: CloudMediaMode;
  bucket: string;
  endpoint?: string;
  region: string;
  publicBaseUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix: string;
  forcePathStyle: boolean;
};

function cleanFilename(filename: string) {
  return (
    filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'upload'
  );
}

function cleanPrefix(prefix: string) {
  return prefix
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => cleanFilename(segment))
    .filter(Boolean)
    .join('/');
}

function encodedPath(pathname: string) {
  return pathname
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function hashHex(value: Buffer | string) {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest('hex');
}

function dateParts(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');

  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8)
  };
}

export function getCloudMediaConfig(mode: CloudMediaMode): CloudMediaConfig | undefined {
  const bucket = appConfig.media.cloud.bucket;
  const publicBaseUrl = appConfig.media.cloud.publicBaseUrl;
  const accessKeyId = process.env.PIXLO_MEDIA_ACCESS_KEY_ID;
  const secretAccessKey = process.env.PIXLO_MEDIA_SECRET_ACCESS_KEY;
  const endpoint = appConfig.media.cloud.endpoint?.replace(/\/+$/, '');
  const region = appConfig.media.cloud.region || (mode === 'r2-ready' ? 'auto' : undefined);

  if (!bucket || !publicBaseUrl || !accessKeyId || !secretAccessKey || !region) {
    return undefined;
  }

  if (mode === 'r2-ready' && !endpoint) {
    return undefined;
  }

  return {
    mode,
    bucket,
    endpoint,
    region,
    publicBaseUrl,
    accessKeyId,
    secretAccessKey,
    prefix: cleanPrefix(appConfig.media.cloud.prefix),
    forcePathStyle: appConfig.media.cloud.forcePathStyle
  };
}

function buildStorageKey(input: SaveMediaFileInput, id: string) {
  const extension =
    input.file.type === 'image/jpeg' ? 'jpg' : (input.file.type.split('/')[1] ?? 'bin');
  const ownerFolder = input.submissionId ?? input.gameId ?? 'unlinked';
  const filename = `${input.assetType}-${id}-${cleanFilename(input.file.name)}.${extension}`;

  return [cleanPrefix(appConfig.media.cloud.prefix), input.uploadSource, ownerFolder, filename]
    .filter(Boolean)
    .join('/');
}

function buildObjectUrl(config: CloudMediaConfig, storageKey: string) {
  const keyPath = encodedPath(storageKey);

  if (!config.endpoint && config.mode === 's3-ready' && !config.forcePathStyle) {
    return new URL(`https://${config.bucket}.s3.${config.region}.amazonaws.com/${keyPath}`);
  }

  const endpoint = config.endpoint ?? `https://s3.${config.region}.amazonaws.com`;

  return new URL(`${endpoint.replace(/\/+$/, '')}/${config.bucket}/${keyPath}`);
}

function buildPublicUrl(config: CloudMediaConfig, storageKey: string) {
  return `${config.publicBaseUrl.replace(/\/+$/, '')}/${encodedPath(storageKey)}`;
}

function signS3PutRequest(input: {
  config: CloudMediaConfig;
  url: URL;
  payloadHash: string;
  contentType: string;
  amzDate: string;
  dateStamp: string;
}) {
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = [
    `content-type:${input.contentType}`,
    `host:${input.url.host}`,
    `x-amz-content-sha256:${input.payloadHash}`,
    `x-amz-date:${input.amzDate}`
  ].join('\n');
  const canonicalRequest = [
    'PUT',
    input.url.pathname,
    '',
    `${canonicalHeaders}\n`,
    signedHeaders,
    input.payloadHash
  ].join('\n');
  const credentialScope = `${input.dateStamp}/${input.config.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    input.amzDate,
    credentialScope,
    hashHex(canonicalRequest)
  ].join('\n');
  const dateKey = hmac(`AWS4${input.config.secretAccessKey}`, input.dateStamp);
  const regionKey = hmac(dateKey, input.config.region);
  const serviceKey = hmac(regionKey, 's3');
  const signingKey = hmac(serviceKey, 'aws4_request');
  const signature = hmacHex(signingKey, stringToSign);

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${input.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  };
}

export async function saveCloudMediaFile(
  mode: CloudMediaMode,
  input: SaveMediaFileInput
): Promise<MediaAsset> {
  const validation = validateImageUpload(input.file);

  if (!validation.ok) {
    throw new Error(validation.issue);
  }

  const config = getCloudMediaConfig(mode);

  if (!config) {
    throw new Error(
      `${mode} media storage is selected but required cloud configuration is incomplete.`
    );
  }

  const id = `media-${randomUUID()}`;
  const storageKey = buildStorageKey(input, id);
  const url = buildObjectUrl(config, storageKey);
  const publicUrl = buildPublicUrl(config, storageKey);
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const payloadHash = hashHex(bytes);
  const { amzDate, dateStamp } = dateParts();
  const signed = signS3PutRequest({
    config,
    url,
    payloadHash,
    contentType: input.file.type,
    amzDate,
    dateStamp
  });
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: signed.authorization,
      'Content-Type': input.file.type,
      'X-Amz-Content-Sha256': payloadHash,
      'X-Amz-Date': amzDate
    },
    body: Uint8Array.from(bytes)
  });

  if (!response.ok) {
    throw new Error(`${mode} object upload failed with ${response.status}.`);
  }

  const row = await prisma.mediaAsset.create({
    data: {
      id,
      assetType: input.assetType,
      originalFilename: input.file.name || cleanFilename(input.file.name),
      mimeType: input.file.type,
      fileSize: input.file.size,
      storageProvider: mode,
      storageKey,
      storagePath: `${mode}://${config.bucket}/${storageKey}`,
      publicUrl,
      uploadSource: input.uploadSource,
      submissionId: input.submissionId,
      gameId: input.gameId
    }
  });

  return mapDbMediaAssetToMediaAsset(row);
}
