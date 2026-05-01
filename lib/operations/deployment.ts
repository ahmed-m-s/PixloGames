import { appConfig } from '@/lib/config';
import type {
  DeploymentProfile,
  OperationalIssue,
  ProviderRequirement,
  RolloutGate
} from '@/types/operations';

type RolloutGateInput = {
  publicPlayableGames: number;
  failedQaGames: number;
  activeInternalUsers: number;
  mediaStatus: string;
  mediaActivationState: string;
  analyticsStatus: string;
  alertStatus: string;
  alertActivationState: string;
  backupStatus: string;
};

type ProviderRequirementInput = {
  mediaStatus: string;
  mediaActivationState: string;
  analyticsStatus: string;
  analyticsActivationState: string;
  alertStatus: string;
  alertActivationState: string;
  adStatus: string;
  adActivationState: string;
};

function issue(
  id: string,
  area: string,
  severity: OperationalIssue['severity'],
  message: string,
  action: string
): OperationalIssue {
  return {
    id,
    area,
    severity,
    message,
    action
  };
}

export function getDeploymentProfile(): DeploymentProfile {
  return {
    environmentMode: appConfig.environmentMode,
    deploymentTarget: appConfig.deploymentTarget,
    hostingTarget: appConfig.hostingTarget,
    rolloutStage: appConfig.rolloutStage,
    publicLaunchEnabled: appConfig.publicLaunchEnabled,
    productionLike: appConfig.productionLike,
    stagingLike: appConfig.stagingLike,
    appVersion: appConfig.appVersion,
    buildId: appConfig.buildId
  };
}

function requirement(input: ProviderRequirement): ProviderRequirement {
  return input;
}

export function getDeploymentProviderRequirements(
  input: ProviderRequirementInput
): ProviderRequirement[] {
  const productionRequired =
    appConfig.environmentMode === 'production' ||
    appConfig.rolloutStage === 'production' ||
    appConfig.publicLaunchEnabled;
  const hostedTarget =
    appConfig.deploymentTarget === 'cloud' ||
    appConfig.deploymentTarget === 'self-hosted' ||
    appConfig.hostingTarget !== 'local-dev' ||
    appConfig.stagingLike ||
    appConfig.productionLike;

  return [
    requirement({
      area: 'media',
      label: 'Media storage',
      mode: appConfig.media.storageProvider,
      activationState: input.mediaActivationState,
      requiredFor: appConfig.rollout.requireCloudMediaForProduction ? 'production' : 'optional',
      status:
        input.mediaStatus === 'misconfigured'
          ? 'blocked'
          : productionRequired &&
              appConfig.rollout.requireCloudMediaForProduction &&
              input.mediaActivationState !== 'configured-active'
            ? 'blocked'
            : hostedTarget && input.mediaActivationState === 'local-only'
              ? 'warning'
              : 'satisfied',
      summary:
        input.mediaActivationState === 'configured-active'
          ? 'Cloud/object storage upload path is configured and active.'
          : input.mediaActivationState === 'configured-inactive'
            ? 'Cloud/object storage config is present, but local media mode is active.'
            : input.mediaStatus === 'misconfigured'
              ? 'Selected media provider is not usable with current config.'
              : 'Local media storage is active.',
      action:
        input.mediaActivationState === 'configured-active'
          ? 'Keep upload credentials scoped and monitor object storage writes.'
          : 'Set PIXLO_MEDIA_STORAGE_PROVIDER to s3-ready or r2-ready with the full cloud config group before production, or explicitly accept local filesystem risk.'
    }),
    requirement({
      area: 'analytics',
      label: 'Analytics dispatch',
      mode: appConfig.analytics.provider,
      activationState: input.analyticsActivationState,
      requiredFor: 'optional',
      status:
        input.analyticsStatus === 'misconfigured'
          ? productionRequired
            ? 'blocked'
            : 'warning'
          : hostedTarget && input.analyticsActivationState === 'local-only'
            ? 'warning'
            : 'satisfied',
      summary:
        input.analyticsActivationState === 'configured-active'
          ? 'External analytics dispatch is active and PostgreSQL logging can remain as fallback.'
          : input.analyticsActivationState === 'configured-inactive'
            ? 'External analytics credentials are present, but local analytics mode is active.'
            : input.analyticsStatus === 'misconfigured'
              ? 'Selected analytics provider is incomplete.'
              : 'Local PostgreSQL analytics logging is active.',
      action:
        input.analyticsActivationState === 'configured-active'
          ? 'Keep analytics dispatch non-blocking and watch delivery failures.'
          : 'Set PIXLO_ANALYTICS_PROVIDER=external-ready with endpoint and write key when external analytics should receive events.'
    }),
    requirement({
      area: 'alerts',
      label: 'Alert delivery',
      mode: input.alertActivationState === 'configured-active' ? 'webhook' : 'inactive',
      activationState: input.alertActivationState,
      requiredFor: appConfig.rollout.requireAlertsForProduction ? 'production' : 'optional',
      status:
        input.alertStatus === 'misconfigured'
          ? 'blocked'
          : productionRequired &&
              appConfig.rollout.requireAlertsForProduction &&
              input.alertActivationState !== 'configured-active'
            ? 'blocked'
            : hostedTarget && input.alertActivationState !== 'configured-active'
              ? 'warning'
              : 'satisfied',
      summary:
        input.alertActivationState === 'configured-active'
          ? 'Webhook alert delivery is active.'
          : input.alertActivationState === 'configured-inactive'
            ? 'A non-webhook alert destination is configured, but active delivery is not wired.'
            : input.alertStatus === 'misconfigured'
              ? 'Alert destination config is invalid.'
              : 'No active external alert destination is configured.',
      action:
        input.alertActivationState === 'configured-active'
          ? 'Use the protected alert test endpoint before go-live.'
          : 'Set PIXLO_MONITORING_WEBHOOK_URL before production or explicitly relax alert requirements.'
    }),
    requirement({
      area: 'monetization',
      label: 'Monetization provider',
      mode: appConfig.ads.provider,
      activationState: input.adActivationState,
      requiredFor: 'optional',
      status:
        input.adStatus === 'misconfigured'
          ? 'warning'
          : hostedTarget && input.adActivationState === 'local-only'
            ? 'warning'
            : 'satisfied',
      summary:
        input.adActivationState === 'configured-active'
          ? 'External ad-serving configuration is present.'
          : input.adActivationState === 'configured-inactive'
            ? 'External ad-serving config is present, but local placeholder mode is active.'
            : input.adStatus === 'misconfigured'
              ? 'Selected ad provider is incomplete.'
              : 'Local sponsorship/ad placement scaffolding is active.',
      action:
        input.adActivationState === 'configured-active'
          ? 'Keep public ad slots non-invasive and verify campaign fill with the eventual ad provider.'
          : 'Keep monetization in placeholder mode until ad server endpoint and publisher identifiers are finalized.'
    })
  ];
}

export function getRolloutGate(input: RolloutGateInput): RolloutGate {
  const betaIssues: OperationalIssue[] = [];
  const productionBlockers: OperationalIssue[] = [];
  const warnings: OperationalIssue[] = [];

  if (!appConfig.databaseConfigured) {
    betaIssues.push(
      issue(
        'rollout-database-missing',
        'deployment',
        'critical',
        'DATABASE_URL is missing.',
        'Configure PostgreSQL before any hosted rollout.'
      )
    );
  }

  if (input.activeInternalUsers === 0) {
    betaIssues.push(
      issue(
        'rollout-no-internal-users',
        'deployment',
        'critical',
        'No active internal operators exist.',
        'Seed or create an internal admin before rollout.'
      )
    );
  }

  if (input.publicPlayableGames < appConfig.rollout.minBetaPublicGames) {
    betaIssues.push(
      issue(
        'rollout-beta-content-threshold',
        'deployment',
        'warning',
        `Only ${input.publicPlayableGames} public playable games are available for beta.`,
        `Publish at least ${appConfig.rollout.minBetaPublicGames} playable QA-passed games for a useful beta.`
      )
    );
  }

  if (input.mediaStatus === 'misconfigured') {
    betaIssues.push(
      issue(
        'rollout-media-misconfigured',
        'deployment',
        'critical',
        'The active media provider is misconfigured.',
        'Fix media provider config or return to local-dev mode before accepting uploads.'
      )
    );
  }

  if (input.analyticsStatus === 'misconfigured') {
    warnings.push(
      issue(
        'rollout-analytics-misconfigured',
        'deployment',
        'warning',
        'Analytics provider config is incomplete.',
        'Use local analytics mode or finish external analytics config before launch.'
      )
    );
  }

  if (input.failedQaGames > 0) {
    warnings.push(
      issue(
        'rollout-failed-qa',
        'deployment',
        'warning',
        `${input.failedQaGames} games have failed QA.`,
        'Resolve failed QA records before production launch.'
      )
    );
  }

  if (input.publicPlayableGames < appConfig.rollout.minProductionPublicGames) {
    productionBlockers.push(
      issue(
        'rollout-production-content-threshold',
        'deployment',
        'critical',
        `Only ${input.publicPlayableGames} public playable games are available for production launch.`,
        `Publish at least ${appConfig.rollout.minProductionPublicGames} playable QA-passed public games, or adjust PIXLO_MIN_PRODUCTION_PUBLIC_GAMES deliberately.`
      )
    );
  }

  if (!appConfig.publicLaunchEnabled) {
    productionBlockers.push(
      issue(
        'rollout-public-launch-disabled',
        'deployment',
        'critical',
        'Public launch switch is not enabled.',
        'Set PIXLO_PUBLIC_LAUNCH_ENABLED=1 only after launch checks pass.'
      )
    );
  }

  if (appConfig.rolloutStage !== 'production') {
    productionBlockers.push(
      issue(
        'rollout-stage-not-production',
        'deployment',
        'critical',
        'Rollout stage is not production.',
        'Set PIXLO_ROLLOUT_STAGE=production for go-live.'
      )
    );
  }

  if (appConfig.environmentMode !== 'production') {
    productionBlockers.push(
      issue(
        'rollout-environment-not-production',
        'deployment',
        'critical',
        'Environment mode is not production.',
        'Set PIXLO_ENVIRONMENT_MODE=production in the production deployment.'
      )
    );
  }

  if (
    appConfig.rollout.requireCanonicalDomainForProduction &&
    appConfig.siteUrl.includes('localhost')
  ) {
    productionBlockers.push(
      issue(
        'rollout-localhost-canonical',
        'deployment',
        'critical',
        'Canonical site URL is still localhost.',
        'Set NEXT_PUBLIC_SITE_URL to the production domain.'
      )
    );
  }

  if (
    appConfig.rollout.requireCloudMediaForProduction &&
    input.mediaActivationState === 'local-only'
  ) {
    productionBlockers.push(
      issue(
        'rollout-local-media',
        'deployment',
        'critical',
        'Media storage is local-only.',
        'Enable S3/R2 media storage or explicitly disable PIXLO_REQUIRE_CLOUD_MEDIA_FOR_PRODUCTION after accepting filesystem backup risk.'
      )
    );
  }

  if (
    appConfig.rollout.requireAlertsForProduction &&
    input.alertActivationState !== 'configured-active'
  ) {
    productionBlockers.push(
      issue(
        'rollout-alerts-inactive',
        'deployment',
        'critical',
        'External alert delivery is not active.',
        'Configure PIXLO_MONITORING_WEBHOOK_URL before production launch.'
      )
    );
  }

  if (
    appConfig.rollout.requireExplicitAdminCredentials &&
    (!appConfig.internalAuth.adminEmailConfigured ||
      !appConfig.internalAuth.adminPasswordConfigured)
  ) {
    productionBlockers.push(
      issue(
        'rollout-admin-seed-default',
        'deployment',
        'critical',
        'Production admin seed credentials are not explicitly configured.',
        'Set PIXLO_INTERNAL_ADMIN_EMAIL and PIXLO_INTERNAL_ADMIN_PASSWORD before production launch.'
      )
    );
  }

  if (input.backupStatus === 'incomplete') {
    productionBlockers.push(
      issue(
        'rollout-backup-incomplete',
        'deployment',
        'critical',
        'Backup readiness is incomplete.',
        'Fix backup configuration and run a dry-run before launch.'
      )
    );
  }

  const criticalBetaIssues = betaIssues.filter((item) => item.severity === 'critical');
  const controlledBetaReady = criticalBetaIssues.length === 0;
  const productionReady = productionBlockers.length === 0;
  const status =
    appConfig.rolloutStage === 'production' || appConfig.publicLaunchEnabled
      ? productionReady
        ? 'production_ready'
        : 'production_blocked'
      : appConfig.rolloutStage === 'private_beta' || appConfig.rolloutStage === 'public_beta'
        ? controlledBetaReady
          ? betaIssues.length + warnings.length > 0
            ? 'beta_watch'
            : 'beta_ready'
          : 'beta_watch'
        : 'local_safe';

  return {
    status,
    label:
      status === 'production_ready'
        ? 'Ready for production launch'
        : status === 'production_blocked'
          ? 'Production launch blocked'
          : status === 'beta_ready'
            ? 'Ready for controlled beta'
            : status === 'beta_watch'
              ? 'Beta needs operator review'
              : 'Local development safe',
    controlledBetaReady,
    productionReady,
    blockers: [...betaIssues, ...productionBlockers],
    warnings,
    notes: [
      'Use private_beta or public_beta for staged rollout validation before enabling production.',
      'Production launch requires the explicit public launch switch plus production environment mode.',
      'Provider requirements can be relaxed with explicit PIXLO_REQUIRE_* env vars, but diagnostics will continue to show the resulting risk.'
    ]
  };
}
