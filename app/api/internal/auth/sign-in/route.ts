import { NextResponse } from 'next/server';
import { verifyInternalCredentials } from '@/lib/auth/credentials';
import {
  createInternalSession,
  getInternalCookieOptions,
  internalSessionCookieName
} from '@/lib/auth/session';

function getSafeNextPath(value: FormDataEntryValue | null) {
  const next = typeof value === 'string' ? value : '';

  if (next.startsWith('/internal') && next !== '/internal/sign-in') {
    return next;
  }

  return '/internal/games';
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const nextPath = getSafeNextPath(formData.get('next'));
  const user = await verifyInternalCredentials(email, password);

  if (!user) {
    const redirectUrl = new URL('/internal/sign-in', request.url);
    redirectUrl.searchParams.set('error', 'invalid');
    redirectUrl.searchParams.set('next', nextPath);

    return NextResponse.redirect(redirectUrl, 303);
  }

  const session = await createInternalSession(user.id);
  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);

  response.cookies.set(
    internalSessionCookieName,
    session.token,
    getInternalCookieOptions(session.expiresAt)
  );

  return response;
}
