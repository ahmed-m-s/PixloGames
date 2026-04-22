type LogLevel = 'info' | 'warn' | 'error';

export type LogContext = Record<string, string | number | boolean | null | undefined>;

function sanitizeContext(context: LogContext = {}) {
  return Object.fromEntries(Object.entries(context).filter((entry) => entry[1] !== undefined));
}

function writeLog(level: LogLevel, event: string, context: LogContext = {}) {
  const payload = {
    level,
    event,
    service: 'pixlogames-web',
    timestamp: new Date().toISOString(),
    ...sanitizeContext(context)
  };

  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.info(line);
  }
}

export function logInfo(event: string, context?: LogContext) {
  writeLog('info', event, context);
}

export function logWarn(event: string, context?: LogContext) {
  writeLog('warn', event, context);
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  const errorContext =
    error instanceof Error
      ? {
          errorName: error.name,
          errorMessage: error.message
        }
      : {
          errorMessage: String(error)
        };

  writeLog('error', event, {
    ...context,
    ...errorContext
  });
}
