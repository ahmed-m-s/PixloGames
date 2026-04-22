import { apiOk } from '@/lib/api-response';
import { requireApiPermission } from '@/lib/auth/session';
import { getIntegrationActivationSummary } from '@/lib/integrations/provider-checks';

export async function GET(request: Request) {
  const access = await requireApiPermission(request, 'view_internal');

  if (!access.ok) {
    return access.response;
  }

  const integrations = await getIntegrationActivationSummary();

  return apiOk(
    {
      integrations,
      actor: access.session.user.email
    },
    {
      source: 'postgresql',
      durable: true,
      count: integrations.requirements.length
    }
  );
}
