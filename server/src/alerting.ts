import { config } from "./config";

type AlertLevel = "warning" | "critical";

export type OperationalAlertInput = {
  level: AlertLevel;
  title: string;
  message: string;
  fingerprint?: string;
  context?: Record<string, unknown>;
};

const ALERT_CACHE_MAX = 500;
const lastSentAt = new Map<string, number>();

function toReason(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}

function trimText(value: unknown, max = 180): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function normalizeContext(
  input?: Record<string, unknown>
): Record<string, string | number | boolean> {
  if (!input) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    if (value instanceof Error) {
      out[key] = trimText(value.message, 280);
      continue;
    }
    if (value == null) {
      continue;
    }
    out[key] = trimText(JSON.stringify(value), 280);
  }
  return out;
}

function pruneAlertCache(now: number): void {
  const threshold = Math.max(1, config.alertMinIntervalMs * 2);
  for (const [key, ts] of lastSentAt.entries()) {
    if (now - ts > threshold) {
      lastSentAt.delete(key);
    }
  }

  if (lastSentAt.size <= ALERT_CACHE_MAX) return;
  const sorted = Array.from(lastSentAt.entries()).sort((a, b) => a[1] - b[1]);
  const removeCount = lastSentAt.size - ALERT_CACHE_MAX;
  for (let i = 0; i < removeCount; i += 1) {
    lastSentAt.delete(sorted[i][0]);
  }
}

function shouldSendAlert(fingerprint: string, now: number): boolean {
  const previous = lastSentAt.get(fingerprint);
  if (typeof previous === "number" && now - previous < config.alertMinIntervalMs) {
    return false;
  }
  lastSentAt.set(fingerprint, now);
  pruneAlertCache(now);
  return true;
}

export async function sendOperationalAlert(input: OperationalAlertInput): Promise<void> {
  if (!config.alertWebhookUrl) return;

  const fingerprint = (input.fingerprint || `${input.level}:${input.title}`).trim();
  const now = Date.now();
  if (!shouldSendAlert(fingerprint, now)) {
    return;
  }

  const payload = {
    service: "antislot-server",
    environment: config.sentryEnvironment || config.nodeEnv,
    level: input.level,
    title: trimText(input.title, 120),
    message: trimText(input.message, 400),
    fingerprint,
    timestamp: new Date(now).toISOString(),
    context: normalizeContext(input.context),
  };

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (config.alertWebhookBearerToken) {
    headers.authorization = `Bearer ${config.alertWebhookBearerToken}`;
  }

  const controller = new AbortController();
  const timeoutHandle: ReturnType<typeof setTimeout> = setTimeout(
    () => controller.abort(),
    config.alertTimeoutMs
  );
  if (
    typeof timeoutHandle === "object" &&
    timeoutHandle !== null &&
    "unref" in timeoutHandle &&
    typeof (timeoutHandle as { unref?: () => void }).unref === "function"
  ) {
    (timeoutHandle as { unref: () => void }).unref();
  }

  try {
    const response = await fetch(config.alertWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`alert webhook status ${response.status}`);
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Alert delivery failed",
        reason: toReason(error),
        fingerprint,
      })
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}
