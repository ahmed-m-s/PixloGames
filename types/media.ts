export type MediaAssetType = 'thumbnail' | 'cover' | 'game-build' | 'screenshot' | 'other';

export type MediaUploadSource = 'developer_submission' | 'internal_upload' | 'seed' | 'migration';

export type MediaStorageProvider = 'local-dev' | 's3-ready' | 'r2-ready';

export type MediaAsset = {
  id: string;
  assetType: MediaAssetType;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  storageProvider: MediaStorageProvider;
  storageKey: string;
  storagePath: string;
  publicUrl: string;
  width?: number;
  height?: number;
  uploadSource: MediaUploadSource;
  submissionId?: string;
  gameId?: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaUploadResult = {
  asset: MediaAsset;
  url: string;
};
