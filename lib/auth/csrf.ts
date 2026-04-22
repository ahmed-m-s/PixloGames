import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { appConfig } from '@/lib/config';
import type { InternalSession } from '@/types/auth';

type CsrfPayload = {
  sid: string;
  uid: string;
  exp: number;
  iat: number;
  nonce: string;
};

export type CsrfValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: 'csrf_missing' | 'csrf_malformed' | 'csrf_invalid' | 'csrf_expired';
      message: string;
    };

const tokenVersion = 'v1';

function getCsrfSecret() {
  return (
    process.env.PIXLO_CSRF_SECRET ||
    process.env.DATABASE_URL ||
    process.env.PIXLO_INTERNAL_ADMIN_PASSWORD ||
    'pixlogames-local-dev-csrf-secret'
  );
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload: string) {
  return createHmac('sha256', getCsrfSecret()).update(payload).digest('base64url');
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createInternalCsrfToken(session: InternalSession) {
  const payload: CsrfPayload = {
    sid: session.id,
    uid: session.user.id,
    exp: session.expiresAt.getTime(),
    iat: Date.now(),
    nonce: randomBytes(16).toString('base64url')
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${tokenVersion}.${encodedPayload}.${signature}`;
}

export function getCsrfTokenFromRequest(request: Request) {
  return (
    request.headers.get(appConfig.security.csrfHeaderName) ||
    request.headers.get('x-csrf-token') ||
    request.headers.get('x-request-verification-token') ||
    undefined
  );
}

export function validateInternalCsrfToken(
  session: InternalSession,
  token: string | undefined | null
): CsrfValidationResult {
  if (!token) {
    return {
      ok: false,
      code: 'csrf_missing',
      message: 'A CSRF token is required for internal mutation actions.'
    };
  }

  const [version, encodedPayload, signature, ...extra] = token.split('.');

  if (version !== tokenVersion || !encodedPayload || !signature || extra.length > 0) {
    return {
      ok: false,
      code: 'csrf_malformed',
      message: 'The CSRF token is malformed.'
    };
  }

  if (!safeCompare(signPayload(encodedPayload), signature)) {
    return {
      ok: false,
      code: 'csrf_invalid',
      message: 'The CSRF token is invalid for this internal session.'
    };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as CsrfPayload;

    if (payload.sid !== session.id || payload.uid !== session.user.id) {
      return {
        ok: false,
        code: 'csrf_invalid',
        message: 'The CSRF token does not match the active internal session.'
      };
    }

    if (payload.exp <= Date.now() || session.expiresAt.getTime() <= Date.now()) {
      return {
        ok: false,
        code: 'csrf_expired',
        message: 'The CSRF token has expired. Refresh the page and try again.'
      };
    }

    return {
      ok: true
    };
  } catch {
    return {
      ok: false,
      code: 'csrf_malformed',
      message: 'The CSRF token payload is malformed.'
    };
  }
}

export function isUnsafeMutationMethod(method: string) {
  return method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';
}
