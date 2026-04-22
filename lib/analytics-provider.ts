import { appConfig } from '@/lib/config';
import { prisma } from '@/lib/db/prisma';
import { logError } from '@/lib/observability/logger';
import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsPayload,
  AnalyticsProvider,
  AnalyticsScalar
} from '@/lib/analytics';

export type AnalyticsProviderStatus = 'operational' | 'scaffold' | 'misconfigured';
export type AnalyticsProviderActivationState =
  | 'local-only'
  | 'configured-active'
  | 'configured-inactive'
  | 'misconfigured';

export type AnalyticsProviderDiagnostics = {
  mode: typeof appConfig.analytics.provider;
  label: string;
  status: AnalyticsProviderStatus;
  activationState: AnalyticsProviderActivationState;
  databaseLogEnabled: boolean;
  externalConfigured: boolean;
  timeoutMs: number;
  warnings: string[];
};

export type AnalyticsDispatchResult = {
  databaseAttempted: boolean;
  databaseLogged: boolean;
  databaseError?: string;
  externalAttempted: boolean;
  externalDelivered: boolean;
  externalError?: string;
};

function sanitizePayload(
  payload: AnalyticsPayload
): Record<string, Exclude<AnalyticsScalar, undefined>> {
  return Object.fromEntries(
    Object.entries(payload).filter(
      (entry): entry is [string, Exclude<AnalyticsScalar, undefined>] => entry[1] !== undefined
    )
  );
}

const databaseProvider: AnalyticsProvider = {
  name: 'postgresql-analytics-log',
  async track(event) {
    await prisma.analyticsEvent.create({
      data: {
        name: event.name,
        payload: sanitizePayload(event.payload),
        sessionId: event.payload.sessionId ? String(event.payload.sessionId) : undefined,
        userId: event.payload.userId ? String(event.payload.userId) : undefined
      }
    });
  }
};

const externalHttpProvider: AnalyticsProvider = {
  name: 'external-http-ready',
  async track(event) {
    const writeKey = process.env.PIXLO_ANALYTICS_WRITE_KEY;

    if (!appConfig.analytics.externalEndpoint || !writeKey) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), appConfig.analytics.timeoutMs);

    try {
      const response = await fetch(appConfig.analytics.externalEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${writeKey}`
        },
        body: JSON.stringify({
          service: 'pixlogames-web',
          event
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Analytics provider responded with ${response.status}.`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
};

async function recordAnalyticsDeliveryFailure(
  sourceEvent: AnalyticsEventName,
  provider: string,
  error: unknown
) {
  try {
    await databaseProvider.track({
      name: 'analytics_delivery_failed',
      payload: {
        sourceEvent,
        provider,
        reason: error instanceof Error ? error.message : 'unknown'
      },
      timestamp: new Date().toISOString()
    });
  } catch (failureLogError) {
    logError('analytics_delivery_failure_log_failed', failureLogError, {
      analyticsEvent: sourceEvent,
      provider
    });
  }
}

export function getAnalyticsProviderDiagnostics(): AnalyticsProviderDiagnostics {
  const warnings: string[] = [];
  const externalConfigured = Boolean(
    appConfig.analytics.externalEndpoint && appConfig.analytics.externalWriteKeyConfigured
  );

  if (!appConfig.analytics.databaseLogEnabled) {
    warnings.push('PostgreSQL analytics event logging is disabled.');
  }

  if (appConfig.analytics.provider === 'external-ready' && !externalConfigured) {
    warnings.push(
      'External analytics provider mode is selected but endpoint or write key is missing.'
    );
  }

  if (appConfig.analytics.provider === 'local' && externalConfigured) {
    warnings.push('External analytics config is present, but local analytics mode is active.');
  }

  return {
    mode: appConfig.analytics.provider,
    label:
      appConfig.analytics.provider === 'external-ready'
        ? 'External analytics HTTP provider'
        : 'PostgreSQL local analytics log',
    status:
      appConfig.analytics.provider === 'external-ready'
        ? externalConfigured
          ? 'operational'
          : 'misconfigured'
        : appConfig.analytics.databaseLogEnabled
          ? 'operational'
          : 'misconfigured',
    activationState:
      appConfig.analytics.provider === 'external-ready'
        ? externalConfigured
          ? 'configured-active'
          : 'misconfigured'
        : externalConfigured
          ? 'configured-inactive'
          : 'local-only',
    databaseLogEnabled: appConfig.analytics.databaseLogEnabled,
    externalConfigured,
    timeoutMs: appConfig.analytics.timeoutMs,
    warnings
  };
}

export async function dispatchServerAnalyticsEvent(
  event: AnalyticsEvent
): Promise<AnalyticsDispatchResult> {
  const result: AnalyticsDispatchResult = {
    databaseAttempted: appConfig.analytics.databaseLogEnabled,
    databaseLogged: false,
    externalAttempted:
      appConfig.analytics.provider === 'external-ready' &&
      Boolean(
        appConfig.analytics.externalEndpoint && appConfig.analytics.externalWriteKeyConfigured
      ),
    externalDelivered: false
  };

  if (appConfig.analytics.databaseLogEnabled) {
    try {
      await databaseProvider.track(event);
      result.databaseLogged = true;
    } catch (error) {
      result.databaseError =
        error instanceof Error ? error.message : 'Analytics database logging failed.';
      logError('analytics_event_persist_failed', error, {
        analyticsEvent: event.name
      });
    }
  }

  if (appConfig.analytics.provider !== 'external-ready') {
    return result;
  }

  if (!appConfig.analytics.externalEndpoint || !appConfig.analytics.externalWriteKeyConfigured) {
    return result;
  }

  try {
    await externalHttpProvider.track(event);
    result.externalDelivered = true;
  } catch (error) {
    result.externalError =
      error instanceof Error ? error.message : 'External analytics delivery failed.';
    logError('analytics_external_delivery_failed', error, {
      analyticsEvent: event.name,
      provider: externalHttpProvider.name
    });
    await recordAnalyticsDeliveryFailure(event.name, externalHttpProvider.name, error);
  }

  return result;
}

export async function testAnalyticsProvider(requestedBy?: string) {
  const diagnostics = getAnalyticsProviderDiagnostics();
  const dispatch = await dispatchServerAnalyticsEvent({
    name: 'analytics_provider_test',
    payload: {
      mode: diagnostics.mode,
      externalConfigured: diagnostics.externalConfigured,
      requestedBy
    },
    timestamp: new Date().toISOString()
  });
  const localOk = diagnostics.databaseLogEnabled ? dispatch.databaseLogged : true;
  const externalRequired = diagnostics.mode === 'external-ready';
  const externalOk = externalRequired ? dispatch.externalDelivered : true;

  return {
    ok: diagnostics.status === 'operational' && localOk && externalOk,
    diagnostics,
    dispatch,
    message:
      diagnostics.mode === 'external-ready'
        ? externalOk
          ? 'External analytics dispatch completed.'
          : 'External analytics dispatch did not complete.'
        : diagnostics.externalConfigured
          ? 'Local analytics is active; external analytics config is present but inactive.'
          : 'Local analytics logging completed.'
  };
}
