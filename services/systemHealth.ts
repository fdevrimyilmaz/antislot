import { getApiBaseUrl } from "@/services/apiBase";

export type BackendHealthSnapshot = {
  ok: boolean;
  status: string;
  ready: boolean | null;
  degraded: boolean | null;
  latencyMs: number | null;
  checkedAt: number;
  requestId: string | null;
  uptimeSec: number | null;
  coreBackendStatus: string | null;
  blockers: string[];
  warnings: string[];
  errorCode: string | null;
};

const DEFAULT_TIMEOUT_MS = 5000;

function sanitizeList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === "string").slice(0, 5);
}

export async function fetchBackendHealth(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<BackendHealthSnapshot> {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${baseUrl}/v1/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;
    const requestId = response.headers.get("x-request-id");

    if (!response.ok) {
      return {
        ok: false,
        status: "down",
        ready: null,
        degraded: null,
        latencyMs,
        checkedAt: Date.now(),
        requestId,
        uptimeSec: null,
        coreBackendStatus: null,
        blockers: [],
        warnings: [],
        errorCode: `HTTP_${response.status}`,
      };
    }

    const payload = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          status?: string;
          ready?: boolean;
          degraded?: boolean;
          uptimeSec?: number;
          blockers?: unknown;
          warnings?: unknown;
          dependencies?: {
            coreBackend?: {
              status?: string;
            };
          };
        }
      | null;

    return {
      ok: payload?.ok === true,
      status: typeof payload?.status === "string" ? payload.status : "unknown",
      ready: typeof payload?.ready === "boolean" ? payload.ready : null,
      degraded: typeof payload?.degraded === "boolean" ? payload.degraded : null,
      latencyMs,
      checkedAt: Date.now(),
      requestId,
      uptimeSec: typeof payload?.uptimeSec === "number" ? payload.uptimeSec : null,
      coreBackendStatus:
        typeof payload?.dependencies?.coreBackend?.status === "string"
          ? payload.dependencies.coreBackend.status
          : null,
      blockers: sanitizeList(payload?.blockers),
      warnings: sanitizeList(payload?.warnings),
      errorCode: null,
    };
  } catch (error) {
    const code = error instanceof Error && error.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
    return {
      ok: false,
      status: "down",
      ready: null,
      degraded: null,
      latencyMs: Date.now() - startedAt,
      checkedAt: Date.now(),
      requestId: null,
      uptimeSec: null,
      coreBackendStatus: null,
      blockers: [],
      warnings: [],
      errorCode: code,
    };
  } finally {
    clearTimeout(timeout);
  }
}
