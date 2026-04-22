import { apiError, apiOk } from '@/lib/api-response';
import { requireApiPermission } from '@/lib/auth/session';
import { getAlertProviderDiagnostics, sendOperationalAlert } from '@/lib/monitoring/alerts';

export async function POST(request: Request) {
  const access = await requireApiPermission(request, 'view_internal');

  if (!access.ok) {
    return access.response;
  }

  const diagnostics = getAlertProviderDiagnostics();
  const result = await sendOperationalAlert({
    level: 'info',
    title: 'PixloGames alert test',
    message: 'Internal operator requested a test alert from PixloGames.',
    context: {
      actor: access.session.user.email,
      providerMode: diagnostics.mode
    }
  });

  if (!result.ok) {
    return apiError(
      result.code,
      result.message,
      result.code === 'alert_destination_not_configured' ? 409 : 502,
      diagnostics.warnings
    );
  }

  return apiOk(
    {
      result,
      diagnostics
    },
    {
      source: 'external_provider',
      durable: false,
      count: 1
    }
  );
}
