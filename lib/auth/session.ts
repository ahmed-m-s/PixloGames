import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiError } from '@/lib/api-response';
import {
  getCsrfTokenFromRequest,
  isUnsafeMutationMethod,
  validateInternalCsrfToken
} from '@/lib/auth/csrf';
import { prisma } from '@/lib/db/prisma';
import { appConfig } from '@/lib/config';
import { hasInternalPermission, isInternalRole } from '@/lib/auth/permissions';
import type { InternalPermission, InternalSession, InternalSessionUser } from '@/types/auth';

export const internalSessionCookieName =
  process.env.NODE_ENV === 'production'
    ? '__Host-pixlo_internal_session'
    : 'pixlo_internal_session';

const sessionDurationMs = 1000 * 60 * 60 * appConfig.internalAuth.sessionHours;

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader.split(';').map((part) => {
      const [name, ...valueParts] = part.trim().split('=');

      return [name, decodeURIComponent(valueParts.join('='))] as const;
    })
  );
}

function toInternalSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}): InternalSessionUser | undefined {
  if (!isInternalRole(user.role)) {
    return undefined;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

async function getSessionByToken(token: string | undefined): Promise<InternalSession | undefined> {
  if (!token) {
    return undefined;
  }

  const row = await prisma.internalSession.findUnique({
    where: {
      tokenHash: hashSessionToken(token)
    },
    include: {
      user: true
    }
  });

  if (!row || row.revokedAt || row.expiresAt <= new Date() || !row.user.active) {
    return undefined;
  }

  const user = toInternalSessionUser(row.user);

  if (!user) {
    return undefined;
  }

  return {
    id: row.id,
    expiresAt: row.expiresAt,
    user
  };
}

export async function getInternalSession() {
  const cookieStore = await cookies();

  return getSessionByToken(cookieStore.get(internalSessionCookieName)?.value);
}

export async function getInternalSessionFromRequest(request: Request) {
  const cookieMap = parseCookieHeader(request.headers.get('cookie'));

  return getSessionByToken(cookieMap.get(internalSessionCookieName));
}

export function getInternalSessionTokenFromRequest(request: Request) {
  const cookieMap = parseCookieHeader(request.headers.get('cookie'));

  return cookieMap.get(internalSessionCookieName);
}

export async function createInternalSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  const session = await prisma.internalSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt
    }
  });

  return {
    token,
    expiresAt,
    sessionId: session.id
  };
}

export async function revokeInternalSessionToken(token: string | undefined) {
  if (!token) {
    return;
  }

  await prisma.internalSession.updateMany({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export function getInternalCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: appConfig.internalAuth.secureCookies,
    path: '/',
    expires: expiresAt
  };
}

export function getInternalCookieClearOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: appConfig.internalAuth.secureCookies,
    path: '/',
    maxAge: 0
  };
}

export async function requireInternalPermission(permission: InternalPermission) {
  const session = await getInternalSession();

  if (!session) {
    redirect('/internal/sign-in');
  }

  if (!hasInternalPermission(session.user.role, permission)) {
    redirect('/internal/forbidden');
  }

  return session;
}

export async function requireAnyInternalSession() {
  const session = await getInternalSession();

  if (!session) {
    redirect('/internal/sign-in');
  }

  return session;
}

export async function requireApiPermission(request: Request, permission: InternalPermission) {
  const session = await getInternalSessionFromRequest(request);

  if (!session) {
    return {
      ok: false as const,
      response: apiError('unauthenticated', 'Internal authentication is required.', 401)
    };
  }

  if (!hasInternalPermission(session.user.role, permission)) {
    return {
      ok: false as const,
      response: apiError('forbidden', 'Your internal role cannot perform this action.', 403)
    };
  }

  if (appConfig.security.internalMutationProtection && isUnsafeMutationMethod(request.method)) {
    const csrf = validateInternalCsrfToken(session, getCsrfTokenFromRequest(request));

    if (!csrf.ok) {
      return {
        ok: false as const,
        response: apiError(csrf.code, csrf.message, 403)
      };
    }
  }

  return {
    ok: true as const,
    session
  };
}
