import { createHash } from 'node:crypto';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { InternalRole } from '@/types/auth';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    internalSession: {
      findUnique: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

import { POST as signOut } from '@/app/api/internal/auth/sign-out/route';
import { createInternalCsrfToken } from '@/lib/auth/csrf';
import { internalSessionCookieName, requireApiPermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { InternalSession } from '@/types/auth';

type InternalSessionRow = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
    role: InternalRole;
    active: boolean;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

const sessionToken = 'pixlo-test-session-token';
const userId = 'user-admin';
const futureExpiry = new Date(Date.now() + 1000 * 60 * 60);

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function makeSessionRow(role: InternalRole = 'admin', overrides: Partial<InternalSessionRow> = {}) {
  const row: InternalSessionRow = {
    id: 'session-admin',
    userId,
    tokenHash: hashToken(sessionToken),
    expiresAt: futureExpiry,
    revokedAt: null,
    createdAt: new Date('2026-04-22T00:00:00.000Z'),
    updatedAt: new Date('2026-04-22T00:00:00.000Z'),
    user: {
      id: userId,
      email: 'admin@pixlogames.test',
      name: 'Pixlo Admin',
      role,
      active: true,
      passwordHash: 'not-used',
      createdAt: new Date('2026-04-22T00:00:00.000Z'),
      updatedAt: new Date('2026-04-22T00:00:00.000Z')
    },
    ...overrides
  };

  return row;
}

function toSession(row: InternalSessionRow): InternalSession {
  return {
    id: row.id,
    expiresAt: row.expiresAt,
    user: {
      id: row.user.id,
      email: row.user.email,
      name: row.user.name,
      role: row.user.role
    }
  };
}

function makeInternalRequest(
  input: {
    method?: string;
    csrfToken?: string;
    token?: string;
    body?: BodyInit;
    contentType?: string;
  } = {}
) {
  const headers = new Headers();

  if (input.token !== undefined) {
    headers.set('cookie', `${internalSessionCookieName}=${encodeURIComponent(input.token)}`);
  }

  if (input.csrfToken) {
    headers.set('x-pixlo-csrf', input.csrfToken);
  }

  if (input.contentType) {
    headers.set('content-type', input.contentType);
  }

  return new Request('https://pixlogames.test/api/internal/games', {
    body: input.body,
    headers,
    method: input.method ?? 'GET'
  });
}

async function readErrorCode(response: Response) {
  const body = (await response.json()) as {
    error?: {
      code?: string;
    };
  };

  return body.error?.code;
}

describe('internal auth and CSRF protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated internal API access', async () => {
    const access = await requireApiPermission(makeInternalRequest(), 'manage_games');

    expect(access.ok).toBe(false);

    if (!access.ok) {
      expect(access.response.status).toBe(401);
      await expect(readErrorCode(access.response)).resolves.toBe('unauthenticated');
    }

    expect(prisma.internalSession.findUnique).not.toHaveBeenCalled();
  });

  it('rejects authenticated users without the required permission', async () => {
    vi.mocked(prisma.internalSession.findUnique).mockResolvedValueOnce(
      makeSessionRow('reviewer') as never
    );

    const access = await requireApiPermission(
      makeInternalRequest({
        token: sessionToken
      }),
      'manage_games'
    );

    expect(access.ok).toBe(false);

    if (!access.ok) {
      expect(access.response.status).toBe(403);
      await expect(readErrorCode(access.response)).resolves.toBe('forbidden');
    }
  });

  it('rejects protected internal mutations without a CSRF token', async () => {
    vi.mocked(prisma.internalSession.findUnique).mockResolvedValueOnce(
      makeSessionRow('admin') as never
    );

    const access = await requireApiPermission(
      makeInternalRequest({
        method: 'PATCH',
        token: sessionToken
      }),
      'manage_games'
    );

    expect(access.ok).toBe(false);

    if (!access.ok) {
      expect(access.response.status).toBe(403);
      await expect(readErrorCode(access.response)).resolves.toBe('csrf_missing');
    }
  });

  it('rejects protected internal mutations with a CSRF token for a different session', async () => {
    const row = makeSessionRow('admin');
    const wrongSessionToken = createInternalCsrfToken({
      ...toSession(row),
      id: 'different-session'
    });

    vi.mocked(prisma.internalSession.findUnique).mockResolvedValueOnce(row as never);

    const access = await requireApiPermission(
      makeInternalRequest({
        csrfToken: wrongSessionToken,
        method: 'PATCH',
        token: sessionToken
      }),
      'manage_games'
    );

    expect(access.ok).toBe(false);

    if (!access.ok) {
      expect(access.response.status).toBe(403);
      await expect(readErrorCode(access.response)).resolves.toBe('csrf_invalid');
    }
  });

  it('accepts protected internal mutations with a matching authenticated session and CSRF token', async () => {
    const row = makeSessionRow('admin');
    const csrfToken = createInternalCsrfToken(toSession(row));

    vi.mocked(prisma.internalSession.findUnique).mockResolvedValueOnce(row as never);

    const access = await requireApiPermission(
      makeInternalRequest({
        csrfToken,
        method: 'PATCH',
        token: sessionToken
      }),
      'manage_games'
    );

    expect(access.ok).toBe(true);

    if (access.ok) {
      expect(access.session.user.email).toBe('admin@pixlogames.test');
    }
  });

  it('rejects revoked internal sessions before permission checks', async () => {
    vi.mocked(prisma.internalSession.findUnique).mockResolvedValueOnce(
      makeSessionRow('admin', {
        revokedAt: new Date('2026-04-22T01:00:00.000Z')
      }) as never
    );

    const access = await requireApiPermission(
      makeInternalRequest({
        token: sessionToken
      }),
      'manage_games'
    );

    expect(access.ok).toBe(false);

    if (!access.ok) {
      expect(access.response.status).toBe(401);
      await expect(readErrorCode(access.response)).resolves.toBe('unauthenticated');
    }
  });

  it('signs out by requiring CSRF, revoking the active session token, and clearing the cookie', async () => {
    const row = makeSessionRow('admin');
    const csrfToken = createInternalCsrfToken(toSession(row));

    vi.mocked(prisma.internalSession.findUnique).mockResolvedValueOnce(row as never);
    vi.mocked(prisma.internalSession.updateMany).mockResolvedValueOnce({ count: 1 } as never);

    const response = await signOut(
      new Request('https://pixlogames.test/api/internal/auth/sign-out', {
        body: new URLSearchParams({
          _csrf: csrfToken
        }),
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: `${internalSessionCookieName}=${encodeURIComponent(sessionToken)}`
        },
        method: 'POST'
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('/internal/sign-in?signedOut=1');
    expect(response.headers.get('set-cookie')).toContain(`${internalSessionCookieName}=`);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect(prisma.internalSession.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: hashToken(sessionToken),
        revokedAt: null
      },
      data: {
        revokedAt: expect.any(Date)
      }
    });
  });
});
