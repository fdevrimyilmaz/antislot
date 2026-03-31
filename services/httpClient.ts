import * as Sentry from "@sentry/react-native";
import { canSendTelemetry, markTelemetryEventSent } from "@/services/privacy";

const DEFAULT_RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export type RequestRetryOptions = {
  retries?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
  retryableStatuses?: Set<number>;
  signal?: AbortSignal;
  context?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number, retryableStatuses: Set<number>): boolean {
  return retryableStatuses.has(status);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function summarizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "unknown_error");
}

function resolveDelayMs(baseDelayMs: number, attempt: number): number {
  const exp = Math.max(0, attempt);
  const base = Math.max(50, baseDelayMs);
  const jitter = Math.floor(Math.random() * 70);
  return Math.min(1500, base * 2 ** exp + jitter);
}

async function captureApiFailure(error: unknown, context: string): Promise<void> {
  if (!canSendTelemetry()) {
    return;
  }
  try {
    if (Sentry?.captureException) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
        tags: {
          area: "api",
        },
        extra: {
          context,
        },
      });
      await markTelemetryEventSent();
    }
  } catch {
    // Telemetry reporting must never block product flows.
  }
}

export async function requestWithRetry(
  url: string,
  init: RequestInit,
  options: RequestRetryOptions = {}
): Promise<Response> {
  const retries = Math.max(0, options.retries ?? 0);
  const timeoutMs = Math.max(1000, options.timeoutMs ?? 12000);
  const baseDelayMs = Math.max(50, options.baseDelayMs ?? 250);
  const retryableStatuses = options.retryableStatuses ?? DEFAULT_RETRYABLE_STATUSES;
  const method = (init.method || "GET").toUpperCase();
  const context = options.context || `${method} ${url}`;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const timeoutController = new AbortController();
    let timeoutFired = false;
    const timeout = setTimeout(() => {
      timeoutFired = true;
      timeoutController.abort();
    }, timeoutMs);

    const parentSignal = options.signal;
    const onParentAbort = () => {
      timeoutController.abort();
    };
    if (parentSignal) {
      if (parentSignal.aborted) {
        clearTimeout(timeout);
        throw new Error("request_aborted");
      }
      parentSignal.addEventListener("abort", onParentAbort, { once: true });
    }

    try {
      const response = await fetch(url, {
        ...init,
        signal: timeoutController.signal,
      });

      if (isRetryableStatus(response.status, retryableStatuses) && attempt < retries) {
        try {
          response.body?.cancel?.();
        } catch {
          // Best effort only.
        }
        await sleep(resolveDelayMs(baseDelayMs, attempt));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      const abortedByCaller = Boolean(options.signal?.aborted);
      const retryableNetworkError =
        timeoutFired ||
        (error instanceof TypeError && !abortedByCaller) ||
        (isAbortError(error) && !abortedByCaller);

      if (retryableNetworkError && attempt < retries) {
        await sleep(resolveDelayMs(baseDelayMs, attempt));
        continue;
      }

      if (!abortedByCaller) {
        await captureApiFailure(error, context);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      if (parentSignal) {
        parentSignal.removeEventListener("abort", onParentAbort);
      }
    }
  }

  const error = lastError instanceof Error ? lastError : new Error(summarizeError(lastError));
  await captureApiFailure(error, context);
  throw error;
}

type StructuredErrorBody = {
  ok?: false;
  error?: {
    message?: string;
    code?: string;
  };
};

export async function buildHttpErrorMessage(
  response: Response,
  fallbackPrefix: string
): Promise<string> {
  const text = await response.text().catch(() => "");
  const maybeJson = (() => {
    if (!text) return null;
    try {
      return JSON.parse(text) as StructuredErrorBody;
    } catch {
      return null;
    }
  })();

  const remoteMessage = maybeJson?.error?.message?.trim();
  if (remoteMessage) {
    return `${fallbackPrefix} (${response.status}) ${remoteMessage}`;
  }

  if (text.trim().length > 0) {
    return `${fallbackPrefix} (${response.status}) ${text.trim()}`;
  }

  return `${fallbackPrefix} (${response.status})`;
}
