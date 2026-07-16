/**
 * Minimal structured JSON logger for Lambda.
 *
 * CloudWatch Logs Insights can query JSON fields directly, so every log line
 * is emitted as a single JSON object rather than free-form text. This keeps
 * log output queryable once telemetry volume grows in later phases
 * (device events, OTA jobs, alert evaluation, etc.).
 *
 * Intentionally dependency-free — pulling in a full logging library (e.g.
 * Powertools) can happen later if/when the extra features (tracing
 * correlation, metrics) are needed. For the foundation phase, a small
 * wrapper keeps cold starts fast and the surface area easy to reason about.
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  [key: string]: unknown;
}

interface LoggerOptions {
  /** Name of the Lambda function / service emitting logs. */
  service: string;
  /** Correlation id for the current invocation (e.g. API Gateway requestId). */
  requestId?: string;
}

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'INFO';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function write(level: LogLevel, service: string, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...context,
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export class Logger {
  private readonly service: string;
  private readonly requestId?: string;

  constructor(options: LoggerOptions) {
    this.service = options.service;
    this.requestId = options.requestId;
  }

  /** Returns a child logger bound to a specific request/correlation id. */
  withRequestId(requestId: string): Logger {
    return new Logger({ service: this.service, requestId });
  }

  private context(extra?: LogContext): LogContext | undefined {
    if (!this.requestId && !extra) return undefined;
    return { ...(this.requestId ? { requestId: this.requestId } : {}), ...extra };
  }

  debug(message: string, extra?: LogContext): void {
    write('DEBUG', this.service, message, this.context(extra));
  }

  info(message: string, extra?: LogContext): void {
    write('INFO', this.service, message, this.context(extra));
  }

  warn(message: string, extra?: LogContext): void {
    write('WARN', this.service, message, this.context(extra));
  }

  error(message: string, error?: unknown, extra?: LogContext): void {
    const errorContext =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
        : error !== undefined
          ? { error }
          : {};

    write('ERROR', this.service, message, this.context({ ...errorContext, ...extra }));
  }
}
