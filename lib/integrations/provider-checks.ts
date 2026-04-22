import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getAdProviderDiagnostics } from '@/lib/ads/provider';
import { getAnalyticsProviderDiagnostics, testAnalyticsProvider } from '@/lib/analytics-provider';
import { appConfig } from '@/lib/config';
import { prisma } from '@/lib/db/prisma';
import { mediaStorageRoot } from '@/lib/media/local-storage';
import { getMediaProviderDiagnostics } from '@/lib/media/storage-provider';
import { getAlertProviderDiagnostics, sendOperationalAlert } from '@/lib/monitoring/alerts';
import {
  getDeploymentProfile,
  getDeploymentProviderRequirements
} from '@/lib/operations/deployment';

export type ProviderCheckStatus = 'pass' | 'fail' | 'skipped';

export type ProviderActivationCheck = {
  provider: 'media' | 'analytics' | 'alerts';
  status: ProviderCheckStatus;
  mode: string;
  activationState: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
};

function checkPathInsideRoot(target: string) {
  const root = path.resolve(mediaStorageRoot);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(root, resolvedTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Provider check path escaped the configured media storage root.');
  }
}

export async function testMediaProviderActivation(): Promise<ProviderActivationCheck> {
  const diagnostics = getMediaProviderDiagnostics();

  if (diagnostics.status === 'misconfigured') {
    return {
      provider: 'media',
      status: 'fail',
      mode: diagnostics.mode,
      activationState: diagnostics.activationState,
      message: diagnostics.warnings[0] ?? 'Media provider config is incomplete.'
    };
  }

  if (diagnostics.mode !== 'local-dev') {
    return {
      provider: 'media',
      status: diagnostics.activationState === 'configured-active' ? 'pass' : 'fail',
      mode: diagnostics.mode,
      activationState: diagnostics.activationState,
      message:
        diagnostics.activationState === 'configured-active'
          ? 'Cloud media provider is configured and active. Synthetic object writes are not performed by this check.'
          : 'Cloud media provider is selected but not active.',
      details: {
        bucket: diagnostics.bucket ?? null,
        publicBaseUrl: diagnostics.publicBaseUrl ?? null,
        supportsUploads: diagnostics.supportsUploads
      }
    };
  }

  const checkDirectory = path.join(mediaStorageRoot, '.provider-check');
  const checkFile = path.join(checkDirectory, 'write-test.txt');

  try {
    checkPathInsideRoot(checkFile);
    await mkdir(checkDirectory, { recursive: true });
    await writeFile(checkFile, `pixlogames media provider check ${new Date().toISOString()}`);
    await rm(checkDirectory, { recursive: true, force: true });

    return {
      provider: 'media',
      status: 'pass',
      mode: diagnostics.mode,
      activationState: diagnostics.activationState,
      message: 'Local media storage accepted a controlled write/delete check.',
      details: {
        storageRoot: diagnostics.storageRoot ?? mediaStorageRoot,
        fallbackMode: diagnostics.activationState !== 'configured-active'
      }
    };
  } catch (error) {
    return {
      provider: 'media',
      status: 'fail',
      mode: diagnostics.mode,
      activationState: diagnostics.activationState,
      message: error instanceof Error ? error.message : 'Local media storage write check failed.',
      details: {
        storageRoot: diagnostics.storageRoot ?? mediaStorageRoot
      }
    };
  }
}

export async function testAlertProviderActivation(
  actorEmail?: string
): Promise<ProviderActivationCheck> {
  const diagnostics = getAlertProviderDiagnostics();

  if (diagnostics.activationState !== 'configured-active') {
    return {
      provider: 'alerts',
      status: diagnostics.status === 'misconfigured' ? 'fail' : 'skipped',
      mode: diagnostics.mode,
      activationState: diagnostics.activationState,
      message:
        diagnostics.status === 'misconfigured'
          ? (diagnostics.warnings[0] ?? 'Alert provider config is invalid.')
          : 'No active webhook alert destination is configured, so delivery test was skipped.'
    };
  }

  const result = await sendOperationalAlert({
    level: 'info',
    title: 'PixloGames integration activation test',
    message: 'Internal operator requested a Phase 17 provider activation test.',
    context: {
      actor: actorEmail,
      deploymentTarget: appConfig.deploymentTarget,
      environmentMode: appConfig.environmentMode
    }
  });

  return {
    provider: 'alerts',
    status: result.ok ? 'pass' : 'fail',
    mode: diagnostics.mode,
    activationState: diagnostics.activationState,
    message: result.ok ? 'Webhook alert delivery completed.' : result.message,
    details: {
      statusCode: result.ok ? result.statusCode : (result.statusCode ?? null)
    }
  };
}

export async function testAnalyticsProviderActivation(
  actorEmail?: string
): Promise<ProviderActivationCheck> {
  const result = await testAnalyticsProvider(actorEmail);

  return {
    provider: 'analytics',
    status: result.ok ? 'pass' : 'fail',
    mode: result.diagnostics.mode,
    activationState: result.diagnostics.activationState,
    message: result.message,
    details: {
      databaseLogged: result.dispatch.databaseLogged,
      externalAttempted: result.dispatch.externalAttempted,
      externalDelivered: result.dispatch.externalDelivered
    }
  };
}

export async function runProviderActivationTests(actorEmail?: string) {
  const [media, analytics, alerts] = await Promise.all([
    testMediaProviderActivation(),
    testAnalyticsProviderActivation(actorEmail),
    testAlertProviderActivation(actorEmail)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    checks: [media, analytics, alerts],
    summary: {
      pass: [media, analytics, alerts].filter((check) => check.status === 'pass').length,
      fail: [media, analytics, alerts].filter((check) => check.status === 'fail').length,
      skipped: [media, analytics, alerts].filter((check) => check.status === 'skipped').length
    }
  };
}

export async function getIntegrationActivationSummary() {
  const [adPlacements, analyticsFailures24h] = await Promise.all([
    prisma.adPlacement.findMany({
      select: {
        enabled: true,
        sponsoredOnly: true
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        name: 'analytics_delivery_failed',
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      }
    })
  ]);
  const media = getMediaProviderDiagnostics();
  const analytics = getAnalyticsProviderDiagnostics();
  const alerts = getAlertProviderDiagnostics();
  const ads = getAdProviderDiagnostics(adPlacements);
  const requirements = getDeploymentProviderRequirements({
    mediaStatus: media.status,
    mediaActivationState: media.activationState,
    analyticsStatus: analytics.status,
    analyticsActivationState: analytics.activationState,
    alertStatus: alerts.status,
    alertActivationState: alerts.activationState,
    adStatus: ads.status,
    adActivationState: ads.activationState
  });

  return {
    generatedAt: new Date().toISOString(),
    deployment: getDeploymentProfile(),
    providers: {
      media,
      analytics: {
        ...analytics,
        deliveryFailures24h: analyticsFailures24h
      },
      alerts,
      ads
    },
    requirements,
    summary: {
      blocked: requirements.filter((requirement) => requirement.status === 'blocked').length,
      warning: requirements.filter((requirement) => requirement.status === 'warning').length,
      satisfied: requirements.filter((requirement) => requirement.status === 'satisfied').length
    }
  };
}
