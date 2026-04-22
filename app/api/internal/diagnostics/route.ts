import { apiOk } from '@/lib/api-response';
import { requireApiPermission } from '@/lib/auth/session';
import { getInternalDiagnostics } from '@/lib/diagnostics';

export async function GET(request: Request) {
  const access = await requireApiPermission(request, 'view_internal');

  if (!access.ok) {
    return access.response;
  }

  const diagnostics = await getInternalDiagnostics();

  return apiOk(
    {
      diagnostics,
      actor: access.session.user.email
    },
    {
      source: 'postgresql',
      durable: true,
      count: diagnostics.warnings.length
    }
  );
}
