export type MediaStorageMode = 'local-dev' | 's3-ready' | 'r2-ready';
export type AnalyticsProviderMode = 'local' | 'external-ready';
export type AdProviderMode = 'disabled' | 'local-placeholder' | 'external-ready';
export type DeploymentTarget = 'local-dev' | 'self-hosted' | 'cloud';
export type HostingTarget = 'local-dev' | 'vps' | 'managed-node' | 'container' | 'platform';
export type EnvironmentMode = 'local' | 'preview' | 'staging' | 'production';
export type RolloutStage = 'local' | 'private_beta' | 'public_beta' | 'production';

const mediaStorageModes: MediaStorageMode[] = ['local-dev', 's3-ready', 'r2-ready'];
const analyticsProviderModes: AnalyticsProviderMode[] = ['local', 'external-ready'];
const adProviderModes: AdProviderMode[] = ['disabled', 'local-placeholder', 'external-ready'];
const deploymentTargets: DeploymentTarget[] = ['local-dev', 'self-hosted', 'cloud'];
const hostingTargets: HostingTarget[] = [
  'local-dev',
  'vps',
  'managed-node',
  'container',
  'platform'
];
const environmentModes: EnvironmentMode[] = ['local', 'preview', 'staging', 'production'];
const rolloutStages: RolloutStage[] = ['local', 'private_beta', 'public_beta', 'production'];

const rawMediaStorageProvider = process.env.PIXLO_MEDIA_STORAGE_PROVIDER?.trim();
const rawAnalyticsProvider = process.env.PIXLO_ANALYTICS_PROVIDER?.trim();
const rawAdProvider = process.env.PIXLO_AD_PROVIDER?.trim();
const rawDeploymentTarget = process.env.PIXLO_DEPLOYMENT_TARGET?.trim();
const rawHostingTarget = process.env.PIXLO_HOSTING_TARGET?.trim();
const rawEnvironmentMode = process.env.PIXLO_ENVIRONMENT_MODE?.trim();
const rawRolloutStage = process.env.PIXLO_ROLLOUT_STAGE?.trim();
const rawAlertWebhookUrl = process.env.PIXLO_MONITORING_WEBHOOK_URL?.trim();
const rawCsrfSecret = process.env.PIXLO_CSRF_SECRET?.trim();
const rawAnalyticsTimeoutMs = Number(process.env.PIXLO_ANALYTICS_TIMEOUT_MS ?? '1500');
const rawAlertTimeoutMs = Number(process.env.PIXLO_MONITORING_ALERT_TIMEOUT_MS ?? '2000');
const rawBackupRetentionDays = Number(process.env.PIXLO_BACKUP_RETENTION_DAYS ?? '7');
const rawExpectedPublicGameCount = Number(process.env.PIXLO_EXPECTED_PUBLIC_GAME_COUNT ?? '1');
const rawMinBetaPublicGames = Number(process.env.PIXLO_MIN_BETA_PUBLIC_GAMES ?? '3');
const rawMinProductionPublicGames = Number(process.env.PIXLO_MIN_PRODUCTION_PUBLIC_GAMES ?? '12');
const environmentMode = normalizeMode<EnvironmentMode>(
  rawEnvironmentMode,
  environmentModes,
  inferEnvironmentMode()
);
const deploymentTarget = normalizeMode<DeploymentTarget>(
  rawDeploymentTarget,
  deploymentTargets,
  'local-dev'
);
const hostingTarget = normalizeMode<HostingTarget>(
  rawHostingTarget,
  hostingTargets,
  inferHostingTarget(deploymentTarget)
);
const rolloutStage = normalizeMode<RolloutStage>(
  rawRolloutStage,
  rolloutStages,
  environmentMode === 'production'
    ? 'production'
    : environmentMode === 'staging'
      ? 'private_beta'
      : 'local'
);

export const appConfig = {
  siteName: 'PixloGames',
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  defaultDescription:
    'Discover premium HTML5 browser games across action, racing, puzzle, arcade, multiplayer, and more.',
  appVersion:
    process.env.PIXLO_APP_VERSION?.trim() || process.env.NEXT_PUBLIC_APP_VERSION?.trim() || '0.1.0',
  buildId: process.env.PIXLO_BUILD_ID?.trim() || process.env.VERCEL_GIT_COMMIT_SHA?.trim(),
  environment: process.env.NODE_ENV ?? 'development',
  environmentMode,
  deploymentTarget,
  hostingTarget,
  rolloutStage,
  publicLaunchEnabled: process.env.PIXLO_PUBLIC_LAUNCH_ENABLED === '1',
  databaseConfigured: Boolean(process.env.DATABASE_URL),
  stagingLike: environmentMode === 'preview' || environmentMode === 'staging',
  productionLike:
    environmentMode === 'production' ||
    process.env.NODE_ENV === 'production' ||
    rawDeploymentTarget === 'self-hosted' ||
    rawDeploymentTarget === 'cloud' ||
    hostingTarget !== 'local-dev',
  rollout: {
    minBetaPublicGames:
      Number.isFinite(rawMinBetaPublicGames) && rawMinBetaPublicGames > 0
        ? rawMinBetaPublicGames
        : 3,
    minProductionPublicGames:
      Number.isFinite(rawMinProductionPublicGames) && rawMinProductionPublicGames > 0
        ? rawMinProductionPublicGames
        : 12,
    requireCloudMediaForProduction: process.env.PIXLO_REQUIRE_CLOUD_MEDIA_FOR_PRODUCTION !== '0',
    requireAlertsForProduction: process.env.PIXLO_REQUIRE_ALERTS_FOR_PRODUCTION !== '0',
    requireExplicitAdminCredentials:
      process.env.PIXLO_REQUIRE_EXPLICIT_ADMIN_FOR_PRODUCTION !== '0',
    requireCanonicalDomainForProduction:
      process.env.PIXLO_REQUIRE_CANONICAL_DOMAIN_FOR_PRODUCTION !== '0'
  },
  internalAuth: {
    adminEmailConfigured: Boolean(process.env.PIXLO_INTERNAL_ADMIN_EMAIL),
    adminPasswordConfigured: Boolean(process.env.PIXLO_INTERNAL_ADMIN_PASSWORD),
    secureCookies: process.env.NODE_ENV === 'production',
    sessionHours: 8
  },
  security: {
    csrfSecretConfigured: Boolean(rawCsrfSecret),
    csrfHeaderName: 'x-pixlo-csrf',
    internalMutationProtection: true
  },
  media: {
    storageProvider: normalizeMode<MediaStorageMode>(
      rawMediaStorageProvider,
      mediaStorageModes,
      'local-dev'
    ),
    localRoot: process.env.PIXLO_LOCAL_MEDIA_ROOT?.trim() || 'storage/media',
    cloud: {
      bucket: process.env.PIXLO_MEDIA_BUCKET?.trim(),
      endpoint: process.env.PIXLO_MEDIA_ENDPOINT?.trim(),
      region: process.env.PIXLO_MEDIA_REGION?.trim(),
      prefix: process.env.PIXLO_MEDIA_PREFIX?.trim() || 'pixlogames/media',
      forcePathStyle: process.env.PIXLO_MEDIA_FORCE_PATH_STYLE === '1',
      publicBaseUrl: normalizeOptionalUrl(process.env.PIXLO_MEDIA_PUBLIC_BASE_URL),
      accessKeyConfigured: Boolean(process.env.PIXLO_MEDIA_ACCESS_KEY_ID),
      secretKeyConfigured: Boolean(process.env.PIXLO_MEDIA_SECRET_ACCESS_KEY)
    }
  },
  analytics: {
    provider: normalizeMode<AnalyticsProviderMode>(
      rawAnalyticsProvider,
      analyticsProviderModes,
      'local'
    ),
    timeoutMs:
      Number.isFinite(rawAnalyticsTimeoutMs) && rawAnalyticsTimeoutMs > 0
        ? rawAnalyticsTimeoutMs
        : 1500,
    databaseLogEnabled: process.env.PIXLO_ANALYTICS_DATABASE_LOG !== '0',
    externalEndpoint: normalizeOptionalUrl(process.env.PIXLO_ANALYTICS_ENDPOINT),
    externalWriteKeyConfigured: Boolean(process.env.PIXLO_ANALYTICS_WRITE_KEY)
  },
  ads: {
    provider: normalizeMode<AdProviderMode>(rawAdProvider, adProviderModes, 'local-placeholder'),
    externalEndpoint: normalizeOptionalUrl(process.env.PIXLO_AD_SERVER_ENDPOINT),
    publisherId: process.env.PIXLO_AD_PUBLISHER_ID?.trim(),
    networkCode: process.env.PIXLO_AD_NETWORK_CODE?.trim()
  },
  backup: {
    directory: process.env.PIXLO_BACKUP_DIRECTORY?.trim() || 'backups',
    pgDumpCommand: process.env.PIXLO_PG_DUMP_PATH?.trim() || 'pg_dump',
    pgRestoreCommand: process.env.PIXLO_PG_RESTORE_PATH?.trim() || 'pg_restore',
    psqlCommand: process.env.PIXLO_PSQL_PATH?.trim() || 'psql',
    retentionDays:
      Number.isFinite(rawBackupRetentionDays) && rawBackupRetentionDays > 0
        ? rawBackupRetentionDays
        : 7
  },
  monitoring: {
    alertWebhookConfigured: Boolean(rawAlertWebhookUrl),
    alertWebhookUrl: normalizeOptionalUrl(rawAlertWebhookUrl),
    alertWebhookSecretConfigured: Boolean(process.env.PIXLO_MONITORING_WEBHOOK_SECRET),
    alertTimeoutMs:
      Number.isFinite(rawAlertTimeoutMs) && rawAlertTimeoutMs > 0 ? rawAlertTimeoutMs : 2000,
    alertEmail: process.env.PIXLO_MONITORING_ALERT_EMAIL?.trim(),
    expectedPublicGameCount:
      Number.isFinite(rawExpectedPublicGameCount) && rawExpectedPublicGameCount > 0
        ? rawExpectedPublicGameCount
        : 1
  }
};

export const localMediaStorageProvider = 'local-dev' satisfies MediaStorageMode;

function normalizeMode<T extends string>(value: string | undefined, allowed: T[], fallback: T) {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function inferEnvironmentMode(): EnvironmentMode {
  const vercelEnv = process.env.VERCEL_ENV?.trim();

  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  if (process.env.NODE_ENV === 'production') return 'production';

  return 'local';
}

function inferHostingTarget(target: DeploymentTarget): HostingTarget {
  if (target === 'self-hosted') return 'vps';
  if (target === 'cloud') return 'platform';

  return 'local-dev';
}

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');

  try {
    return new URL(trimmed).toString().replace(/\/+$/, '');
  } catch {
    return 'http://localhost:3000';
  }
}

function normalizeOptionalUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    return new URL(trimmed).toString().replace(/\/+$/, '');
  } catch {
    return undefined;
  }
}

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${appConfig.siteUrl}${normalizedPath}`;
}

export function getConfigWarnings() {
  const warnings: string[] = [];

  if (!appConfig.databaseConfigured) {
    warnings.push('DATABASE_URL is not configured.');
  }

  if (appConfig.environment === 'production' && appConfig.siteUrl.includes('localhost')) {
    warnings.push('NEXT_PUBLIC_SITE_URL is using a localhost value in production.');
  }

  if (appConfig.productionLike && !appConfig.siteUrl.startsWith('https://')) {
    warnings.push('NEXT_PUBLIC_SITE_URL should use HTTPS for production-like deployments.');
  }

  if (rawDeploymentTarget && !deploymentTargets.includes(rawDeploymentTarget as DeploymentTarget)) {
    warnings.push(
      `PIXLO_DEPLOYMENT_TARGET has unsupported value "${rawDeploymentTarget}". Using local-dev.`
    );
  }

  if (rawHostingTarget && !hostingTargets.includes(rawHostingTarget as HostingTarget)) {
    warnings.push(
      `PIXLO_HOSTING_TARGET has unsupported value "${rawHostingTarget}". Using ${appConfig.hostingTarget}.`
    );
  }

  if (rawEnvironmentMode && !environmentModes.includes(rawEnvironmentMode as EnvironmentMode)) {
    warnings.push(
      `PIXLO_ENVIRONMENT_MODE has unsupported value "${rawEnvironmentMode}". Using ${appConfig.environmentMode}.`
    );
  }

  if (rawRolloutStage && !rolloutStages.includes(rawRolloutStage as RolloutStage)) {
    warnings.push(
      `PIXLO_ROLLOUT_STAGE has unsupported value "${rawRolloutStage}". Using ${appConfig.rolloutStage}.`
    );
  }

  if (appConfig.rolloutStage === 'production' && appConfig.environmentMode !== 'production') {
    warnings.push('Production rollout stage is selected outside production environment mode.');
  }

  if (appConfig.publicLaunchEnabled && appConfig.rolloutStage !== 'production') {
    warnings.push('PIXLO_PUBLIC_LAUNCH_ENABLED is on before production rollout stage.');
  }

  if (appConfig.productionLike && !appConfig.internalAuth.adminEmailConfigured) {
    warnings.push('PIXLO_INTERNAL_ADMIN_EMAIL is not configured for a production-like deployment.');
  }

  if (appConfig.productionLike && !appConfig.internalAuth.adminPasswordConfigured) {
    warnings.push(
      'PIXLO_INTERNAL_ADMIN_PASSWORD is not configured for a production-like deployment.'
    );
  }

  if (appConfig.productionLike && !appConfig.security.csrfSecretConfigured) {
    warnings.push('PIXLO_CSRF_SECRET is not configured for a production-like deployment.');
  }

  if (appConfig.productionLike && !appConfig.internalAuth.secureCookies) {
    warnings.push(
      'Internal session cookies are not using the Secure flag because NODE_ENV is not production.'
    );
  }

  if (
    rawMediaStorageProvider &&
    !mediaStorageModes.includes(rawMediaStorageProvider as MediaStorageMode)
  ) {
    warnings.push(
      `PIXLO_MEDIA_STORAGE_PROVIDER has unsupported value "${rawMediaStorageProvider}". Using local-dev.`
    );
  }

  if (
    rawAnalyticsProvider &&
    !analyticsProviderModes.includes(rawAnalyticsProvider as AnalyticsProviderMode)
  ) {
    warnings.push(
      `PIXLO_ANALYTICS_PROVIDER has unsupported value "${rawAnalyticsProvider}". Using local.`
    );
  }

  if (rawAdProvider && !adProviderModes.includes(rawAdProvider as AdProviderMode)) {
    warnings.push(
      `PIXLO_AD_PROVIDER has unsupported value "${rawAdProvider}". Using local-placeholder.`
    );
  }

  if (appConfig.productionLike && appConfig.media.storageProvider === 'local-dev') {
    warnings.push('Local development media storage is selected for a production-like deployment.');
  }

  if (
    appConfig.media.storageProvider !== 'local-dev' &&
    (!appConfig.media.cloud.bucket ||
      !appConfig.media.cloud.publicBaseUrl ||
      !appConfig.media.cloud.accessKeyConfigured ||
      !appConfig.media.cloud.secretKeyConfigured ||
      (appConfig.media.storageProvider === 'r2-ready' && !appConfig.media.cloud.endpoint) ||
      (appConfig.media.storageProvider === 's3-ready' &&
        !appConfig.media.cloud.endpoint &&
        !appConfig.media.cloud.region))
  ) {
    warnings.push(
      `${appConfig.media.storageProvider} media storage is selected but cloud storage credentials/config are incomplete.`
    );
  }

  if (
    appConfig.analytics.provider === 'external-ready' &&
    (!appConfig.analytics.externalEndpoint || !appConfig.analytics.externalWriteKeyConfigured)
  ) {
    warnings.push(
      'External analytics mode is selected but endpoint or write key config is missing.'
    );
  }

  if (
    appConfig.ads.provider === 'external-ready' &&
    (!appConfig.ads.externalEndpoint || !appConfig.ads.publisherId)
  ) {
    warnings.push(
      'External ad provider mode is selected but endpoint or publisher config is missing.'
    );
  }

  if (appConfig.productionLike && appConfig.backup.directory === 'backups') {
    warnings.push(
      'PIXLO_BACKUP_DIRECTORY is using the local default for a production-like deployment.'
    );
  }

  if (
    appConfig.productionLike &&
    !appConfig.monitoring.alertWebhookUrl &&
    !appConfig.monitoring.alertEmail
  ) {
    warnings.push(
      'No monitoring alert destination is configured for a production-like deployment.'
    );
  }

  if (rawAlertWebhookUrl && !appConfig.monitoring.alertWebhookUrl) {
    warnings.push('PIXLO_MONITORING_WEBHOOK_URL is configured but is not a valid URL.');
  }

  return warnings;
}
