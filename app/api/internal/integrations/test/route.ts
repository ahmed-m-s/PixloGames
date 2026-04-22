import { apiError, apiOk } from '@/lib/api-response';
import { requireApiPermission } from '@/lib/auth/session';
import { runProviderActivationTests } from '@/lib/integrations/provider-checks';

export async function POST(request: Request) {
  const access = await requireApiPermission(request, 'view_internal');

  if (!access.ok) {
    return access.response;
  }

  const results = await runProviderActivationTests(access.session.user.email);

  if (results.summary.fail > 0) {
    return apiError(
      'provider_activation_check_failed',
      'One or more provider activation checks failed.',
      424,
      results.checks
        .filter((check) => check.status === 'fail')
        .map((check) => `${check.provider}: ${check.message}`),
      {
        actor: access.session.user.email
      }
    );
  }

  return apiOk(
    {
      results,
      actor: access.session.user.email
    },
    {
      source: 'external_provider',
      durable: results.checks.some(
        (check) => check.provider === 'analytics' && check.status === 'pass'
      ),
      count: results.checks.length
    }
  );
}
