import * as Sentry from '@sentry/nextjs';
import { appConfig } from '@/lib/config';

export type SentryDiagnostics = {
  status: 'operational' | 'partial' | 'inactive';
  activationState: 'configured-active' | 'server-only' | 'not-configured';
  runtimeServerDsnConfigured: boolean;
  privateServerDsnConfigured: boolean;
  browserDsnConfigured: boolean;
  sourceMapUploadConfigured: boolean;
  serverEnvironment: string;
  browserEnvironment: string;
  warnings: string[];
};

export type SentryVerificationResult =
  | {
      ok: true;
      eventId: string;
      flushCompleted: boolean;
    }
  | {
      ok: false;
      code: 'sentry_not_configured' | 'sentry_flush_timeout';
      message: string;
    };

function hasConfiguredValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function getSentryDiagnostics(): SentryDiagnostics {
  const privateServerDsnConfigured = hasConfiguredValue(process.env.SENTRY_DSN);
  const browserDsnConfigured = hasConfiguredValue(process.env.NEXT_PUBLIC_SENTRY_DSN);
  const runtimeServerDsnConfigured = privateServerDsnConfigured || browserDsnConfigured;
  const sourceMapUploadConfigured =
    hasConfiguredValue(process.env.SENTRY_AUTH_TOKEN) &&
    hasConfiguredValue(process.env.SENTRY_ORG) &&
    hasConfiguredValue(process.env.SENTRY_PROJECT);
  const serverEnvironment =
    process.env.PIXLO_ENVIRONMENT_MODE?.trim() || process.env.NODE_ENV || 'development';
  const browserEnvironment =
    process.env.NEXT_PUBLIC_PIXLO_ENVIRONMENT_MODE?.trim() || process.env.NODE_ENV || 'development';
  const warnings: string[] = [];

  if (!runtimeServerDsnConfigured) {
    warnings.push('No Sentry DSN is configured for server-side event capture.');
  }

  if (!browserDsnConfigured) {
    warnings.push(
      'NEXT_PUBLIC_SENTRY_DSN is not configured, so client-side errors will not reach Sentry.'
    );
  }

  if (!privateServerDsnConfigured && browserDsnConfigured) {
    warnings.push(
      'SENTRY_DSN is not configured, so server-side capture falls back to the public browser DSN.'
    );
  }

  if (
    appConfig.stagingLike &&
    !hasConfiguredValue(process.env.NEXT_PUBLIC_PIXLO_ENVIRONMENT_MODE)
  ) {
    warnings.push(
      'NEXT_PUBLIC_PIXLO_ENVIRONMENT_MODE is not configured, so client-side staging events will be labeled with NODE_ENV.'
    );
  }

  const sourceMapInputs = [
    process.env.SENTRY_AUTH_TOKEN?.trim(),
    process.env.SENTRY_ORG?.trim(),
    process.env.SENTRY_PROJECT?.trim()
  ].filter(Boolean).length;

  if (sourceMapInputs > 0 && !sourceMapUploadConfigured) {
    warnings.push(
      'Sentry source map upload config is partial. Set SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT together.'
    );
  }

  return {
    status: runtimeServerDsnConfigured
      ? browserDsnConfigured
        ? 'operational'
        : 'partial'
      : 'inactive',
    activationState: runtimeServerDsnConfigured
      ? browserDsnConfigured
        ? 'configured-active'
        : 'server-only'
      : 'not-configured',
    runtimeServerDsnConfigured,
    privateServerDsnConfigured,
    browserDsnConfigured,
    sourceMapUploadConfigured,
    serverEnvironment,
    browserEnvironment,
    warnings
  };
}

export async function sendSentryVerificationEvent(
  actorLabel?: string
): Promise<SentryVerificationResult> {
  const diagnostics = getSentryDiagnostics();

  if (!diagnostics.runtimeServerDsnConfigured) {
    return {
      ok: false,
      code: 'sentry_not_configured',
      message: 'No runtime Sentry DSN is configured for server-side verification.'
    };
  }

  const eventId = Sentry.captureMessage('PixloGames staging Sentry verification', {
    level: 'info',
    tags: {
      pixlo_verification: 'staging_observability',
      environment_mode: appConfig.environmentMode,
      deployment_target: appConfig.deploymentTarget
    },
    extra: {
      actor: actorLabel ?? 'internal_operator',
      browserEnvironment: diagnostics.browserEnvironment,
      serverEnvironment: diagnostics.serverEnvironment,
      sourceMapUploadConfigured: diagnostics.sourceMapUploadConfigured
    }
  });
  const flushCompleted = await Sentry.flush(2000);

  if (!flushCompleted) {
    return {
      ok: false,
      code: 'sentry_flush_timeout',
      message: 'Sentry accepted the verification event but did not flush it before the timeout.'
    };
  }

  return {
    ok: true,
    eventId,
    flushCompleted
  };
}
