import { NextResponse } from 'next/server';
import { logError, logWarn, type LogContext } from '@/lib/observability/logger';
import type { ApiFailure, ApiMeta, ApiSuccess } from '@/types/api';

export function apiOk<T>(data: T, meta: ApiMeta) {
  const response: ApiSuccess<T> = {
    ok: true,
    data,
    meta
  };

  return NextResponse.json(response);
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  issues?: string[],
  context: LogContext = {}
) {
  const response: ApiFailure = {
    ok: false,
    error: {
      code,
      message,
      issues
    }
  };

  if (status >= 500) {
    logError('api_error', new Error(message), {
      code,
      status,
      ...context
    });
  } else if (process.env.PIXLO_LOG_VALIDATION_ERRORS === '1') {
    logWarn('api_validation_error', {
      code,
      status,
      ...context
    });
  }

  return NextResponse.json(response, { status });
}
