import { canSendTelemetry, markTelemetryEventSent } from "@/services/privacy";
import { usePrivacyStore } from "@/store/privacyStore";

type EventName =
  | "crisis_screen_viewed"
  | "crisis_call_tapped"
  | "crisis_sms_tapped"
  | "crisis_continue_tapped"
  | "crisis_breathing_tapped"
  | "breathing_started"
  | "breathing_completed"
  | "blocklist_sync_started"
  | "blocklist_sync_succeeded"
  | "blocklist_sync_failed"
  | "blocklist_rollback_applied";

type EventPayloadMap = {
  crisis_screen_viewed: { protocolVersion: string };
  crisis_call_tapped: { contactId: string };
  crisis_sms_tapped: { contactId: string };
  crisis_continue_tapped: { from: "crisis" | "choice" };
  crisis_breathing_tapped: { from: "crisis" };
  breathing_started: { pattern: "4-4-6"; totalSeconds: number };
  breathing_completed: { pattern: "4-4-6"; totalSeconds: number };
  blocklist_sync_started: { source: "manual" | "auto"; apiHost: string };
  blocklist_sync_succeeded: {
    source: "manual" | "auto";
    blocklistUpdated: boolean;
    patternsUpdated: boolean;
    blocklistVersion: number | null;
    patternsVersion: number | null;
  };
  blocklist_sync_failed: {
    source: "manual" | "auto";
    stage: "fetch" | "verify" | "compatibility" | "write" | "unknown";
    reasonCode: string;
  };
  blocklist_rollback_applied: {
    source: "manual" | "auto";
    blocklistVersion: number | null;
    patternsVersion: number | null;
  };
};

type AnalyticsEvent<T extends EventName = EventName> = {
  name: T;
  payload: EventPayloadMap[T];
  ts: string;
  eventVersion: 1;
  sessionId: string;
};

let Sentry: any = null;
void import("@sentry/react-native")
  .then((mod) => {
    Sentry = mod;
  })
  .catch(() => {
    Sentry = null;
  });

const MAX_BUFFERED_EVENTS = 100;
const bufferedEvents: AnalyticsEvent[] = [];
const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const getRetentionMs = (): number => {
  try {
    const { preferences } = usePrivacyStore.getState();
    return preferences.retentionDays * 24 * 60 * 60 * 1000;
  } catch {
    return 30 * 24 * 60 * 60 * 1000;
  }
};

const pruneByRetention = (): void => {
  const retentionMs = getRetentionMs();
  const now = Date.now();
  const kept = bufferedEvents.filter((item) => {
    const ts = Date.parse(item.ts);
    return Number.isFinite(ts) && now - ts <= retentionMs;
  });
  bufferedEvents.splice(0, bufferedEvents.length, ...kept);
};

const sanitizeReasonCode = (reasonCode: string): string =>
  reasonCode
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 64);

/** Data minimization: redact potentially identifiable values before telemetry. */
function sanitizePayloadForTelemetry<T extends EventName>(name: T, payload: EventPayloadMap[T]): EventPayloadMap[T] {
  let safe = { ...payload } as Record<string, unknown>;
  if ("contactId" in safe && typeof safe.contactId === "string") {
    safe.contactId = "redacted";
  }
  if ("apiHost" in safe && typeof safe.apiHost === "string") {
    safe.apiHost = "configured";
  }
  return safe as EventPayloadMap[T];
}

export function trackEvent<T extends EventName>(name: T, payload: EventPayloadMap[T]): void {
  if (!canSendTelemetry()) return;
  pruneByRetention();

  let safePayload: EventPayloadMap[T] = payload;
  if (name === "blocklist_sync_failed") {
    const failedPayload = payload as EventPayloadMap["blocklist_sync_failed"];
    safePayload = {
      ...failedPayload,
      reasonCode: sanitizeReasonCode(failedPayload.reasonCode),
    } as EventPayloadMap[T];
  }
  safePayload = sanitizePayloadForTelemetry(name, safePayload);

  const event: AnalyticsEvent<T> = {
    name,
    payload: safePayload as EventPayloadMap[T],
    ts: new Date().toISOString(),
    eventVersion: 1,
    sessionId,
  };

  bufferedEvents.push(event);
  if (bufferedEvents.length > MAX_BUFFERED_EVENTS) {
    bufferedEvents.shift();
  }

  if (Sentry) {
    try {
      Sentry.addBreadcrumb({
        category: "analytics",
        level: "info",
        type: "default",
        message: event.name,
        data: event.payload,
      });
      markTelemetryEventSent().catch(() => {});
    } catch {}
  }
}

export function getBufferedAnalyticsEvents(): AnalyticsEvent[] {
  pruneByRetention();
  return [...bufferedEvents];
}

export function clearBufferedAnalyticsEvents(): void {
  bufferedEvents.splice(0, bufferedEvents.length);
}
