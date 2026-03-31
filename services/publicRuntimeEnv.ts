 

const LOCAL_OR_PLACEHOLDER_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "10.0.2.2",
  "10.0.3.2",
  "example.com",
  "example.org",
]);

let hasValidated = false;

function isProductionMobileRuntime(): boolean {
  const isDevRuntime = typeof __DEV__ !== "undefined" ? __DEV__ : false;
  return !isDevRuntime && process.env.NODE_ENV === "production";
}

function requireNonEmptyEnv(key: string): string {
  const value = (process.env[key] ?? "").trim();
  if (!value) {
    throw new Error(`${key} is required in production mobile builds.`);
  }
  return value;
}

function requireHttpsUrl(
  key: string,
  value: string,
  { rejectLocalHosts }: { rejectLocalHosts: boolean }
): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid absolute URL.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${key} must use https in production.`);
  }

  if (rejectLocalHosts && LOCAL_OR_PLACEHOLDER_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error(`${key} cannot use localhost or placeholder hostnames in production.`);
  }

  return parsed.toString().replace(/\/+$/, "");
}

export function validatePublicRuntimeEnvAtStartup(): void {
  if (hasValidated) return;
  if (!isProductionMobileRuntime()) return;

  const apiUrl = requireNonEmptyEnv("EXPO_PUBLIC_API_URL");
  requireHttpsUrl("EXPO_PUBLIC_API_URL", apiUrl, { rejectLocalHosts: true });

  const sentryDsn = requireNonEmptyEnv("EXPO_PUBLIC_SENTRY_DSN");
  requireHttpsUrl("EXPO_PUBLIC_SENTRY_DSN", sentryDsn, { rejectLocalHosts: false });

  hasValidated = true;
}
