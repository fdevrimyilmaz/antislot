import { storage, STORAGE_KEYS } from "@/lib/storage";
import { usePrivacyStore } from "@/store/privacyStore";

export function canSendTelemetry(): boolean {
  try {
    const { hydrated, preferences } = usePrivacyStore.getState();
    return (
      hydrated &&
      preferences.telemetryEnabled &&
      preferences.shareDiagnostics &&
      preferences.dataMinimization
    );
  } catch {
    return false;
  }
}

export function canSendCrashReports(): boolean {
  try {
    const { hydrated, preferences } = usePrivacyStore.getState();
    return hydrated && preferences.telemetryEnabled && preferences.crashReporting;
  } catch {
    return false;
  }
}

export async function markTelemetryEventSent(): Promise<void> {
  await storage.set(STORAGE_KEYS.PRIVACY_LAST_TELEMETRY_AT, Date.now(), {
    type: "standard",
  });
}

