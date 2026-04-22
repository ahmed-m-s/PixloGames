import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { validateInternalCsrfToken } from '@/lib/auth/csrf';
import {
  getInternalCookieClearOptions,
  getInternalSessionFromRequest,
  getInternalSessionTokenFromRequest,
  internalSessionCookieName,
  revokeInternalSessionToken
} from '@/lib/auth/session';

export async function POST(request: Request) {
  const [session, formData] = await Promise.all([
    getInternalSessionFromRequest(request),
    request.formData().catch(() => undefined)
  ]);

  if (!session) {
    return apiError('unauthenticated', 'Internal authentication is required.', 401);
  }

  const csrfValue = formData?.get('_csrf');
  const csrf = validateInternalCsrfToken(
    session,
    typeof csrfValue === 'string' ? csrfValue : undefined
  );

  if (!csrf.ok) {
    return apiError(csrf.code, csrf.message, 403);
  }

  await revokeInternalSessionToken(getInternalSessionTokenFromRequest(request));

  const response = NextResponse.redirect(
    new URL('/internal/sign-in?signedOut=1', request.url),
    303
  );

  response.cookies.set(internalSessionCookieName, '', getInternalCookieClearOptions());

  return response;
}
