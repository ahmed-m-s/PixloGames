import { appConfig } from '@/lib/config';
import { logError, logInfo } from '@/lib/observability/logger';

export type AlertProviderStatus = 'operational' | 'scaffold' | 'inactive' | 'misconfigured';
export type AlertLevel = 'info' | 'warning' | 'critical';

export type AlertProviderDiagnostics = {
  mode: 'inactive' | 'webhook' | 'email-scaffold';
  label: string;
  status: AlertProviderStatus;
  activationState: 'not-configured' | 'configured-active' | 'configured-inactive' | 'misconfigured';
  webhookConfigured: boolean;
  emailConfigured: boolean;
  timeoutMs: number;
  warnings: string[];
};

export type OperationalAlertInput = {
  level: AlertLevel;
  title: string;
  message: string;
  context?: Record<string, string | number | boolean | null | undefined>;
};

export type AlertDeliveryResult =
  | {
      ok: true;
      provider: 'webhook';
      statusCode: number;
    }
  | {
      ok: false;
      provider: 'none' | 'webhook';
      code:
        | 'alert_destination_not_configured'
        | 'alert_destination_misconfigured'
        | 'alert_delivery_failed';
      message: string;
      statusCode?: number;
    };

export function getAlertProviderDiagnostics(): AlertProviderDiagnostics {
  const warnings: string[] = [];
  const webhookConfigured = Boolean(appConfig.monitoring.alertWebhookUrl);
  const emailConfigured = Boolean(appConfig.monitoring.alertEmail);

  if (appConfig.monitoring.alertWebhookConfigured && !appConfig.monitoring.alertWebhookUrl) {
    warnings.push('Monitoring webhook URL is present but invalid.');
  }

  if (!webhookConfigured && emailConfigured) {
    warnings.push(
      'Alert email is configured, but email delivery is a scaffold until a mail provider is connected.'
    );
  }

  if (appConfig.productionLike && !webhookConfigured && !emailConfigured) {
    warnings.push(
      'No external alert destination is configured for this production-like deployment.'
    );
  }

  return {
    mode: webhookConfigured ? 'webhook' : emailConfigured ? 'email-scaffold' : 'inactive',
    label: webhookConfigured
      ? 'Webhook alert delivery'
      : emailConfigured
        ? 'Email alert delivery scaffold'
        : 'No external alert destination',
    status: webhookConfigured
      ? 'operational'
      : appConfig.monitoring.alertWebhookConfigured
        ? 'misconfigured'
        : emailConfigured
          ? 'scaffold'
          : 'inactive',
    activationState: webhookConfigured
      ? 'configured-active'
      : appConfig.monitoring.alertWebhookConfigured
        ? 'misconfigured'
        : emailConfigured
          ? 'configured-inactive'
          : 'not-configured',
    webhookConfigured,
    emailConfigured,
    timeoutMs: appConfig.monitoring.alertTimeoutMs,
    warnings
  };
}

export async function sendOperationalAlert(
  input: OperationalAlertInput
): Promise<AlertDeliveryResult> {
  const diagnostics = getAlertProviderDiagnostics();
  const webhookUrl = appConfig.monitoring.alertWebhookUrl;

  if (!webhookUrl) {
    return {
      ok: false,
      provider: 'none',
      code:
        diagnostics.status === 'misconfigured'
          ? 'alert_destination_misconfigured'
          : 'alert_destination_not_configured',
      message: 'No active webhook alert destination is configured.'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.monitoring.alertTimeoutMs);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(appConfig.monitoring.alertWebhookSecretConfigured
          ? {
              'X-Pixlo-Alert-Secret': process.env.PIXLO_MONITORING_WEBHOOK_SECRET ?? ''
            }
          : {})
      },
      body: JSON.stringify({
        service: 'pixlogames-web',
        environment: appConfig.environment,
        deploymentTarget: appConfig.deploymentTarget,
        timestamp: new Date().toISOString(),
        ...input
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        ok: false,
        provider: 'webhook',
        code: 'alert_delivery_failed',
        message: `Alert webhook responded with ${response.status}.`,
        statusCode: response.status
      };
    }

    logInfo('operational_alert_delivered', {
      level: input.level,
      title: input.title,
      statusCode: response.status
    });

    return {
      ok: true,
      provider: 'webhook',
      statusCode: response.status
    };
  } catch (error) {
    logError('operational_alert_delivery_failed', error, {
      level: input.level,
      title: input.title
    });

    return {
      ok: false,
      provider: 'webhook',
      code: 'alert_delivery_failed',
      message: error instanceof Error ? error.message : 'Alert delivery failed.'
    };
  } finally {
    clearTimeout(timeout);
  }
}
