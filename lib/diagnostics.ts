import { getAdProviderDiagnostics } from '@/lib/ads/provider';
import { getAnalyticsProviderDiagnostics } from '@/lib/analytics-provider';
import { appConfig, getConfigWarnings } from '@/lib/config';
import { prisma } from '@/lib/db/prisma';
import { getMediaProviderDiagnostics } from '@/lib/media/storage-provider';
import { getAlertProviderDiagnostics } from '@/lib/monitoring/alerts';
import { getBackupReadiness } from '@/lib/operations/backup';
import {
  getDeploymentProfile,
  getDeploymentProviderRequirements,
  getRolloutGate
} from '@/lib/operations/deployment';
import { getHostingTargetReadiness } from '@/lib/operations/hosting';
import { getSecurityReadiness } from '@/lib/operations/security';

export type PublicHealthStatus = 'ok' | 'degraded';

export async function getPublicHealth() {
  const startedAt = performance.now();
  const mediaProvider = getMediaProviderDiagnostics();
  const analyticsProvider = getAnalyticsProviderDiagnostics();
  const adProvider = getAdProviderDiagnostics();
  const alertProvider = getAlertProviderDiagnostics();
  const backup = getBackupReadiness();
  const deployment = getDeploymentProfile();
  const warnings = [
    ...getConfigWarnings(),
    ...mediaProvider.warnings,
    ...analyticsProvider.warnings,
    ...adProvider.warnings,
    ...alertProvider.warnings,
    ...backup.issues.map((issue) => issue.message)
  ];
  const providerRequirements = getDeploymentProviderRequirements({
    mediaStatus: mediaProvider.status,
    mediaActivationState: mediaProvider.activationState,
    analyticsStatus: analyticsProvider.status,
    analyticsActivationState: analyticsProvider.activationState,
    alertStatus: alertProvider.status,
    alertActivationState: alertProvider.activationState,
    adStatus: adProvider.status,
    adActivationState: adProvider.activationState
  });
  try {
    const [publicGames, failedQaGames, submissions, mediaAssets, activeInternalUsers] =
      await Promise.all([
        prisma.game.count({
          where: {
            visibility: 'public'
          }
        }),
        prisma.game.count({
          where: {
            qaStatus: 'failed'
          }
        }),
        prisma.submission.count(),
        prisma.mediaAsset.count(),
        prisma.internalUser.count({
          where: {
            active: true
          }
        })
      ]);
    const rolloutGate = getRolloutGate({
      publicGames,
      failedQaGames,
      activeInternalUsers,
      mediaStatus: mediaProvider.status,
      mediaActivationState: mediaProvider.activationState,
      analyticsStatus: analyticsProvider.status,
      alertStatus: alertProvider.status,
      alertActivationState: alertProvider.activationState,
      backupStatus: backup.status
    });
    const healthWarnings =
      publicGames < appConfig.monitoring.expectedPublicGameCount
        ? [
            `Public game count ${publicGames} is below expected launch threshold ${appConfig.monitoring.expectedPublicGameCount}.`,
            ...warnings
          ]
        : warnings;

    return {
      status: healthWarnings.length > 0 ? ('degraded' as const) : ('ok' as const),
      service: 'pixlogames-web',
      environment: appConfig.environment,
      deployment,
      providerRequirements,
      rollout: {
        status: rolloutGate.status,
        label: rolloutGate.label,
        controlledBetaReady: rolloutGate.controlledBetaReady,
        productionReady: rolloutGate.productionReady,
        blockers: rolloutGate.blockers.length,
        warnings: rolloutGate.warnings.length
      },
      database: 'reachable' as const,
      alertLevel: healthWarnings.some((warning) => warning.toLowerCase().includes('critical'))
        ? ('critical' as const)
        : healthWarnings.length > 0
          ? ('warning' as const)
          : ('ok' as const),
      checks: {
        publicGames,
        expectedPublicGames: appConfig.monitoring.expectedPublicGameCount,
        minBetaPublicGames: appConfig.rollout.minBetaPublicGames,
        minProductionPublicGames: appConfig.rollout.minProductionPublicGames,
        submissions,
        mediaAssets,
        mediaProvider: mediaProvider.mode,
        mediaStatus: mediaProvider.status,
        mediaActivationState: mediaProvider.activationState,
        analyticsProvider: analyticsProvider.mode,
        analyticsStatus: analyticsProvider.status,
        analyticsActivationState: analyticsProvider.activationState,
        adProvider: adProvider.mode,
        adStatus: adProvider.status,
        adActivationState: adProvider.activationState,
        alertProvider: alertProvider.mode,
        alertStatus: alertProvider.status,
        alertActivationState: alertProvider.activationState,
        backupStatus: backup.status,
        responseMs: Math.round(performance.now() - startedAt)
      },
      warnings: healthWarnings
    };
  } catch {
    return {
      status: 'degraded' as const,
      service: 'pixlogames-web',
      environment: appConfig.environment,
      deployment,
      providerRequirements,
      rollout: {
        status: 'production_blocked' as const,
        label: 'Database health check failed',
        controlledBetaReady: false,
        productionReady: false,
        blockers: 1,
        warnings: warnings.length
      },
      database: 'unreachable' as const,
      alertLevel: 'critical' as const,
      checks: {
        publicGames: 0,
        expectedPublicGames: appConfig.monitoring.expectedPublicGameCount,
        submissions: 0,
        mediaAssets: 0,
        mediaProvider: mediaProvider.mode,
        mediaStatus: mediaProvider.status,
        mediaActivationState: mediaProvider.activationState,
        analyticsProvider: analyticsProvider.mode,
        analyticsStatus: analyticsProvider.status,
        analyticsActivationState: analyticsProvider.activationState,
        adProvider: adProvider.mode,
        adStatus: adProvider.status,
        adActivationState: adProvider.activationState,
        alertProvider: alertProvider.mode,
        alertStatus: alertProvider.status,
        alertActivationState: alertProvider.activationState,
        backupStatus: backup.status,
        responseMs: Math.round(performance.now() - startedAt)
      },
      warnings: ['Database health check failed.', ...warnings]
    };
  }
}

export async function getInternalDiagnostics() {
  const [
    totalGames,
    publicGames,
    draftGames,
    failedQaGames,
    activeInternalUsers,
    submissions,
    approvedUnpublished,
    mediaAssets,
    mediaByProvider,
    analyticsEvents,
    analyticsDeliveryFailures,
    adPlacementRows,
    adPlacements
  ] = await Promise.all([
    prisma.game.count(),
    prisma.game.count({
      where: {
        visibility: 'public'
      }
    }),
    prisma.game.count({
      where: {
        OR: [
          {
            status: 'draft'
          },
          {
            visibility: 'internal'
          }
        ]
      }
    }),
    prisma.game.count({
      where: {
        qaStatus: 'failed'
      }
    }),
    prisma.internalUser.count({
      where: {
        active: true
      }
    }),
    prisma.submission.count(),
    prisma.submission.count({
      where: {
        status: 'approved',
        NOT: {
          publishingStatus: 'published'
        }
      }
    }),
    prisma.mediaAsset.count(),
    prisma.mediaAsset.groupBy({
      by: ['storageProvider'],
      _count: {
        _all: true
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        name: 'analytics_delivery_failed',
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      }
    }),
    prisma.adPlacement.findMany({
      orderBy: {
        placementKey: 'asc'
      }
    }),
    prisma.adPlacement.count()
  ]);

  const mediaProvider = getMediaProviderDiagnostics();
  const analyticsProvider = getAnalyticsProviderDiagnostics();
  const alertProvider = getAlertProviderDiagnostics();
  const backup = getBackupReadiness();
  const deployment = getDeploymentProfile();
  const adProvider = getAdProviderDiagnostics(
    adPlacementRows.map((placement) => ({
      enabled: placement.enabled,
      sponsoredOnly: placement.sponsoredOnly
    }))
  );
  const rolloutGate = getRolloutGate({
    publicGames,
    failedQaGames,
    activeInternalUsers,
    mediaStatus: mediaProvider.status,
    mediaActivationState: mediaProvider.activationState,
    analyticsStatus: analyticsProvider.status,
    alertStatus: alertProvider.status,
    alertActivationState: alertProvider.activationState,
    backupStatus: backup.status
  });
  const providerRequirements = getDeploymentProviderRequirements({
    mediaStatus: mediaProvider.status,
    mediaActivationState: mediaProvider.activationState,
    analyticsStatus: analyticsProvider.status,
    analyticsActivationState: analyticsProvider.activationState,
    alertStatus: alertProvider.status,
    alertActivationState: alertProvider.activationState,
    adStatus: adProvider.status,
    adActivationState: adProvider.activationState
  });
  const hostingTargetReadiness = getHostingTargetReadiness({
    publicGames,
    failedQaGames,
    approvedUnpublished,
    activeInternalUsers,
    providerRequirements,
    rolloutGate,
    backupStatus: backup.status
  });
  const securityReadiness = getSecurityReadiness();
  const warnings = [
    ...getConfigWarnings(),
    ...mediaProvider.warnings,
    ...analyticsProvider.warnings,
    ...adProvider.warnings,
    ...alertProvider.warnings,
    ...backup.issues.map((issue) => issue.message)
  ];

  if (approvedUnpublished > 0) {
    warnings.push(`${approvedUnpublished} approved submissions are not published yet.`);
  }

  if (failedQaGames > 0) {
    warnings.push(`${failedQaGames} games have failed QA.`);
  }

  if (analyticsDeliveryFailures > 0) {
    warnings.push(
      `${analyticsDeliveryFailures} analytics delivery failures were recorded in the last 24 hours.`
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    environment: appConfig.environment,
    counts: {
      totalGames,
      publicGames,
      draftGames,
      failedQaGames,
      activeInternalUsers,
      submissions,
      approvedUnpublished,
      mediaAssets,
      analyticsEvents24h: analyticsEvents,
      analyticsDeliveryFailures24h: analyticsDeliveryFailures,
      enabledAdPlacements: adProvider.enabledPlacements,
      sponsoredOnlyAdPlacements: adProvider.sponsoredOnlyPlacements,
      adPlacements
    },
    providers: {
      media: {
        ...mediaProvider,
        assetsByProvider: Object.fromEntries(
          mediaByProvider.map((entry) => [entry.storageProvider, entry._count._all])
        )
      },
      analytics: analyticsProvider,
      alerts: alertProvider,
      ads: adProvider
    },
    deployment,
    providerRequirements,
    hostingTargetReadiness,
    securityReadiness,
    rolloutGate,
    backup,
    warnings
  };
}
