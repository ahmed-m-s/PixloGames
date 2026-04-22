import { apiOk } from '@/lib/api-response';
import { getPublicHealth } from '@/lib/diagnostics';

export async function GET() {
  const health = await getPublicHealth();

  return apiOk(
    {
      status: health.status,
      alertLevel: health.alertLevel,
      service: health.service,
      environment: health.environment,
      deployment: {
        environmentMode: health.deployment.environmentMode,
        deploymentTarget: health.deployment.deploymentTarget,
        hostingTarget: health.deployment.hostingTarget,
        rolloutStage: health.deployment.rolloutStage,
        publicLaunchEnabled: health.deployment.publicLaunchEnabled,
        appVersion: health.deployment.appVersion,
        buildId: health.deployment.buildId
      },
      rollout: health.rollout,
      database: health.database,
      providerModes: {
        media: health.checks.mediaProvider,
        analytics: health.checks.analyticsProvider,
        ads: health.checks.adProvider,
        alerts: health.checks.alertProvider
      },
      providerStatuses: {
        media: health.checks.mediaStatus,
        analytics: health.checks.analyticsStatus,
        ads: health.checks.adStatus,
        alerts: health.checks.alertStatus
      },
      activationStates: {
        media: health.checks.mediaActivationState,
        analytics: health.checks.analyticsActivationState,
        ads: health.checks.adActivationState,
        alerts: health.checks.alertActivationState
      },
      providerRequirements: {
        blocked: health.providerRequirements.filter(
          (requirement) => requirement.status === 'blocked'
        ).length,
        warning: health.providerRequirements.filter(
          (requirement) => requirement.status === 'warning'
        ).length,
        satisfied: health.providerRequirements.filter(
          (requirement) => requirement.status === 'satisfied'
        ).length,
        items: health.providerRequirements
      },
      backupStatus: health.checks.backupStatus,
      warnings: health.warnings
    },
    {
      source: 'postgresql',
      durable: true,
      count: health.warnings.length
    }
  );
}
