import * as Sentry from "@sentry/node";

type ObservabilityConfig = {
  dsn: string;
  environment: string;
  release: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
};

let initialized = false;
let enabled = false;

export function initObservability(config: ObservabilityConfig): void {
  if (initialized) {
    return;
  }
  initialized = true;

  if (!config.dsn) {
    enabled = false;
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment || "development",
    release: config.release || undefined,
    tracesSampleRate: config.tracesSampleRate,
    profilesSampleRate: config.profilesSampleRate,
    sendDefaultPii: false,
  });

  enabled = true;
}

export function isObservabilityEnabled(): boolean {
  return enabled;
}

export function captureException(
  error: unknown,
  context?: Record<string, string | number | boolean>
): void {
  if (!enabled) {
    return;
  }

  const normalizedError = error instanceof Error ? error : new Error(String(error));

  if (context && Object.keys(context).length > 0) {
    Sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
      Sentry.captureException(normalizedError);
    });
    return;
  }

  Sentry.captureException(normalizedError);
}

export async function flushObservability(timeoutMs = 2000): Promise<void> {
  if (!enabled) {
    return;
  }
  await Sentry.flush(timeoutMs);
}
