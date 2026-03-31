 

import Constants from "expo-constants";
import { Platform } from "react-native";

const DEV_HOST_FALLBACK = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const PLACEHOLDER_HOSTS = new Set(["example.com", "example.org", "localhost", "127.0.0.1", "10.0.2.2", "10.0.3.2"]);
let cachedApiBaseUrl: string | null = null;

function getDevHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const sanitized = hostUri.replace(/^[a-z]+:\/\//i, "").split("/")[0];
    const host = sanitized.split(":")[0];
    if (host) return host;
  }
  return DEV_HOST_FALLBACK;
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
  const isProductionRuntime = !__DEV__ && process.env.NODE_ENV === "production";

  if (isProductionRuntime) {
    cachedApiBaseUrl = ensureProductionApiUrl(envBase.trim());
    return cachedApiBaseUrl;
  }

  if (envBase) {
    const normalized = envBase.replace(/\/+$/, "");
    if (Platform.OS !== "web") {
      try {
        const parsed = new URL(normalized);
        if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
          parsed.hostname = getDevHost();
          cachedApiBaseUrl = parsed.toString().replace(/\/+$/, "");
          return cachedApiBaseUrl;
        }
      } catch {
        cachedApiBaseUrl = normalized;
        return cachedApiBaseUrl;
      }
    }
    cachedApiBaseUrl = normalized;
    return cachedApiBaseUrl;
  }

  cachedApiBaseUrl = __DEV__ ? `http://${getDevHost()}:3001` : "https://api.antislot.app";
  return cachedApiBaseUrl;
}
