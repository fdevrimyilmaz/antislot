// Optional Sentry import
import Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { canSendCrashReports, canSendTelemetry, markTelemetryEventSent } from "@/services/privacy";

let routingInstrumentation: any = new Sentry.ReactNavigationInstrumentation();

let initialized = false;

const parseSampleRate = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Build Sentry release name (e.g. com.antislot.app@1.0.0) and dist (build number) for release health. */
function getReleaseTags(): { release: string; dist: string } {
  const version = Constants.expoConfig?.version ?? "0.0.0";
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier ?? Constants.expoConfig?.android?.package ?? "com.antislot.app";
  const release = `${bundleId}@${version}`;
  const dist = Platform.OS === "ios"
    ? String(Constants.expoConfig?.ios?.buildNumber ?? "0")
    : String(Constants.expoConfig?.android?.versionCode ?? "0");
  return { release, dist };
}

export const initMonitoring = (): void => {
  if (initialized) return;
  if (!Sentry) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const { release, dist } = getReleaseTags();

  Sentry.init({
    dsn,
    release,
    dist,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENV ??
      (__DEV__ ? "development" : "production"),
    enableAutoSessionTracking: true,
    tracesSampleRate: parseSampleRate(
      process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      0.2
    ),
    profilesSampleRate: parseSampleRate(
      process.env.EXPO_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE,
      0.0
    ),
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation,
        enableNativeFramesTracking: true,
      }),
    ],
    beforeSend(event: any, hint: any) {
      // Check crash reporting preference before sending
      if (!canSendCrashReports()) {
        // Don't send crash reports if user has disabled crash reporting
        return null;
      }
      markTelemetryEventSent().catch(() => {});
      return event;
    },
  });

  initialized = true;
};

export const registerNavigationContainer = (
  navigationRef: any
): void => {
  if (routingInstrumentation && navigationRef) {
    routingInstrumentation.registerNavigationContainer(navigationRef);
  }
};

/**
 * Report storage errors to telemetry (no PII)
 * Only reports if diagnostics sharing is enabled.
 */
export const reportStorageError = (error: { type: 'read' | 'write' | 'remove'; key: string; errorType: string }): void => {
  if (!Sentry) return;
  if (!canSendTelemetry()) return;
  
  try {
    Sentry.captureMessage('Storage operation failed', {
      level: 'warning',
      tags: {
        storage_type: error.type,
        error_type: error.errorType,
      },
      extra: {
        // Only include key prefix, not full key (privacy)
        key_prefix: error.key.split('_')[0] || 'unknown',
      },
    });
    markTelemetryEventSent().catch(() => {});
  } catch (err) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[Monitoring] Failed to report storage error:', err);
    }
  }
};
