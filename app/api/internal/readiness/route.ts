import { apiOk } from '@/lib/api-response';
import { requireApiPermission } from '@/lib/auth/session';
import { getLaunchReadiness } from '@/lib/operations/readiness';

export async function GET(request: Request) {
  const access = await requireApiPermission(request, 'view_internal');

  if (!access.ok) {
    return access.response;
  }

  const readiness = await getLaunchReadiness();

  return apiOk(
    {
      readiness,
      actor: access.session.user.email
    },
    {
      source: 'postgresql',
      durable: true,
      count: readiness.summary.issues
    }
  );
}
