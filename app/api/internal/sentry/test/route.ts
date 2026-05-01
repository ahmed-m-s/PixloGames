import { apiError, apiOk } from '@/lib/api-response';
import { requireApiPermission } from '@/lib/auth/session';
import { getSentryDiagnostics, sendSentryVerificationEvent } from '@/lib/observability/sentry';

export async function POST(request: Request) {
  const access = await requireApiPermission(request, 'view_internal');

  if (!access.ok) {
    return access.response;
  }

  const diagnostics = getSentryDiagnostics();
  const result = await sendSentryVerificationEvent(access.session.user.role);

  if (!result.ok) {
    return apiError(
      result.code,
      result.message,
      result.code === 'sentry_not_configured' ? 409 : 502,
      diagnostics.warnings,
      {
        actorRole: access.session.user.role
      }
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
