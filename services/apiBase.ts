import Constants from "expo-constants";
import { Platform } from "react-native";

const REMOTE_API_FALLBACK = "https://api.antislot.app";
const DEV_HOST_FALLBACK = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const PLACEHOLDER_HOSTS = new Set(["example.com", "example.org", "localhost", "127.0.0.1", "10.0.2.2", "10.0.3.2"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "10.0.2.2", "10.0.3.2"]);
let cachedApiBaseUrl: string | null = null;

function parseHost(rawUri: string | null | undefined): string | null {
  if (!rawUri) return null;
  const sanitized = rawUri.replace(/^[a-z]+:\/\//i, "").split("/")[0];
  const host = sanitized.split(":")[0]?.trim();
  if (!host) return null;
  return host;
}

function resolveRuntimeHost(): string | null {
  const expoHost = parseHost(Constants.expoConfig?.hostUri);
  if (expoHost) return expoHost;

  const linkingHost = parseHost(Constants.linkingUri);
  if (linkingHost) return linkingHost;

  return null;
}

function mapLocalhostToRuntimeHost(normalizedUrl: string): string | null {
  try {
    const parsed = new URL(normalizedUrl);
    if (!LOCAL_HOSTS.has(parsed.hostname.toLowerCase())) {
      return null;
    }
    const runtimeHost = resolveRuntimeHost();
    if (!runtimeHost || LOCAL_HOSTS.has(runtimeHost.toLowerCase())) {
      return null;
    }
    parsed.hostname = runtimeHost;
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function ensureProductionApiUrl(url: string): string {
  if (!url) {
    throw new Error("EXPO_PUBLIC_API_URL is required in production builds.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("EXPO_PUBLIC_API_URL must be a valid absolute URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Production EXPO_PUBLIC_API_URL must use https.");
  }
  if (PLACEHOLDER_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("Production EXPO_PUBLIC_API_URL cannot use placeholder/local hostnames.");
  }

  return parsed.toString().replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const envBase = process.env.EXPO_PUBLIC_API_URL || "";
  const isProductionRuntime = !__DEV__;

  if (isProductionRuntime) {
    cachedApiBaseUrl = ensureProductionApiUrl(envBase.trim());
    return cachedApiBaseUrl;
  }

  if (envBase) {
    const normalized = envBase.replace(/\/+$/, "");
    if (Platform.OS !== "web") {
      const remapped = mapLocalhostToRuntimeHost(normalized);
      if (remapped) {
        cachedApiBaseUrl = remapped;
        return cachedApiBaseUrl;
      }
      try {
        const parsed = new URL(normalized);
        if (LOCAL_HOSTS.has(parsed.hostname.toLowerCase())) {
          // Physical devices cannot resolve localhost-based URLs packaged into the app.
          cachedApiBaseUrl = REMOTE_API_FALLBACK;
          return cachedApiBaseUrl;
        }
      } catch {
        // Keep malformed values as-is; request layer will surface a clear error.
      }
    }
    cachedApiBaseUrl = normalized;
    return cachedApiBaseUrl;
  }

  const runtimeHost = resolveRuntimeHost();
  if (__DEV__ && runtimeHost && !LOCAL_HOSTS.has(runtimeHost.toLowerCase())) {
    cachedApiBaseUrl = `http://${runtimeHost}:3001`;
    return cachedApiBaseUrl;
  }

  cachedApiBaseUrl = __DEV__ ? `http://${DEV_HOST_FALLBACK}:3001` : REMOTE_API_FALLBACK;
  return cachedApiBaseUrl;
}
