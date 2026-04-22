import { appConfig, type MediaStorageMode } from '@/lib/config';
import {
  getMediaAssetById,
  isUsableUploadFile,
  mediaStorageRoot,
  readLocalMediaAsset,
  saveLocalMediaFile,
  validateImageUpload,
  type SaveMediaFileInput
} from '@/lib/media/local-storage';
import { getCloudMediaConfig, saveCloudMediaFile } from '@/lib/media/cloud-storage';
import type { MediaAsset, MediaStorageProvider } from '@/types/media';

export { getMediaAssetById, isUsableUploadFile, validateImageUpload };
export type { SaveMediaFileInput };

export type MediaProviderStatus = 'operational' | 'scaffold' | 'misconfigured' | 'inactive';

export type MediaProviderDiagnostics = {
  mode: MediaStorageMode;
  label: string;
  status: MediaProviderStatus;
  activationState: 'local-only' | 'configured-active' | 'configured-inactive' | 'misconfigured';
  externalConfigured: boolean;
  supportsUploads: boolean;
  supportsAppServing: boolean;
  storageRoot?: string;
  publicBaseUrl?: string;
  bucket?: string;
  warnings: string[];
};

export type MediaReadResult =
  | {
      mode: 'bytes';
      bytes: Buffer;
      contentType: string;
      cacheControl: string;
    }
  | {
      mode: 'redirect';
      url: string;
      cacheControl: string;
    };

type MediaStorageAdapter = {
  mode: MediaStorageMode;
  diagnostics: () => MediaProviderDiagnostics;
  saveFile: (input: SaveMediaFileInput) => Promise<MediaAsset>;
  readAsset: (asset: MediaAsset) => Promise<MediaReadResult>;
};

function getCloudConfigWarnings(mode: Exclude<MediaStorageMode, 'local-dev'>) {
  const warnings: string[] = [];
  const config = getCloudMediaConfig(mode);

  if (!appConfig.media.cloud.bucket) {
    warnings.push(`${mode} storage is missing PIXLO_MEDIA_BUCKET.`);
  }

  if (mode === 'r2-ready' && !appConfig.media.cloud.endpoint) {
    warnings.push(`${mode} storage is missing PIXLO_MEDIA_ENDPOINT.`);
  }

  if (mode === 's3-ready' && !appConfig.media.cloud.endpoint && !appConfig.media.cloud.region) {
    warnings.push(`${mode} storage needs PIXLO_MEDIA_REGION when PIXLO_MEDIA_ENDPOINT is not set.`);
  }

  if (!appConfig.media.cloud.publicBaseUrl) {
    warnings.push(`${mode} storage is missing PIXLO_MEDIA_PUBLIC_BASE_URL.`);
  }

  if (!appConfig.media.cloud.accessKeyConfigured || !appConfig.media.cloud.secretKeyConfigured) {
    warnings.push(`${mode} storage credentials are not configured.`);
  }

  if (!config) {
    warnings.push(
      `${mode} uploads remain inactive until the full object-storage config group is present.`
    );
  }

  return warnings;
}

const localAdapter: MediaStorageAdapter = {
  mode: 'local-dev',
  diagnostics() {
    const inactiveCloudConfig = Boolean(
      getCloudMediaConfig('s3-ready') || getCloudMediaConfig('r2-ready')
    );
    const partialCloudConfig = Boolean(
      appConfig.media.cloud.bucket ||
      appConfig.media.cloud.endpoint ||
      appConfig.media.cloud.region ||
      appConfig.media.cloud.publicBaseUrl ||
      appConfig.media.cloud.accessKeyConfigured ||
      appConfig.media.cloud.secretKeyConfigured
    );

    return {
      mode: 'local-dev',
      label: 'Local development storage',
      status: 'operational',
      activationState: inactiveCloudConfig ? 'configured-inactive' : 'local-only',
      externalConfigured: inactiveCloudConfig,
      supportsUploads: true,
      supportsAppServing: true,
      storageRoot: mediaStorageRoot,
      warnings:
        appConfig.productionLike || partialCloudConfig
          ? [
              ...(appConfig.productionLike
                ? ['Local development media storage is selected in production.']
                : []),
              ...(partialCloudConfig
                ? [
                    inactiveCloudConfig
                      ? 'Cloud media config is present, but local-dev media storage is active.'
                      : 'Cloud media config is partially present, but local-dev media storage is active.'
                  ]
                : [])
            ]
          : []
    };
  },
  saveFile: saveLocalMediaFile,
  async readAsset(asset) {
    const media = await readLocalMediaAsset(asset);

    return {
      mode: 'bytes',
      bytes: media.bytes,
      contentType: media.contentType,
      cacheControl: 'public, max-age=31536000, immutable'
    };
  }
};

function createCloudReadyAdapter(
  mode: Exclude<MediaStorageMode, 'local-dev'>
): MediaStorageAdapter {
  return {
    mode,
    diagnostics() {
      const warnings = getCloudConfigWarnings(mode);
      const configured = Boolean(getCloudMediaConfig(mode));

      return {
        mode,
        label:
          mode === 's3-ready' ? 'S3-compatible object storage' : 'R2-compatible object storage',
        status: configured ? 'operational' : 'misconfigured',
        activationState: configured ? 'configured-active' : 'misconfigured',
        externalConfigured: configured,
        supportsUploads: configured,
        supportsAppServing: Boolean(appConfig.media.cloud.publicBaseUrl),
        publicBaseUrl: appConfig.media.cloud.publicBaseUrl,
        bucket: appConfig.media.cloud.bucket,
        warnings
      };
    },
    async saveFile(input) {
      return saveCloudMediaFile(mode, input);
    },
    async readAsset(asset) {
      if (asset.publicUrl.startsWith('http://') || asset.publicUrl.startsWith('https://')) {
        return {
          mode: 'redirect',
          url: asset.publicUrl,
          cacheControl: 'public, max-age=300'
        };
      }

      throw new Error(`${mode} media asset cannot be served without a public cloud URL.`);
    }
  };
}

function getAdapterForMode(mode: MediaStorageProvider | MediaStorageMode): MediaStorageAdapter {
  if (mode === 'local-dev') {
    return localAdapter;
  }

  return createCloudReadyAdapter(mode);
}

export function getActiveMediaStorageAdapter() {
  return getAdapterForMode(appConfig.media.storageProvider);
}

export function getMediaProviderDiagnostics() {
  return getActiveMediaStorageAdapter().diagnostics();
}

export async function saveMediaFile(input: SaveMediaFileInput) {
  return getActiveMediaStorageAdapter().saveFile(input);
}

export async function readMediaAsset(asset: MediaAsset) {
  return getAdapterForMode(asset.storageProvider).readAsset(asset);
}
