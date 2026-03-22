import Constants from "expo-constants";
import { Platform } from "react-native";

const DEV_HOST_FALLBACK = Platform.OS === "android" ? "10.0.2.2" : "localhost";

function getDevHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const sanitized = hostUri.replace(/^[a-z]+:\/\//i, "").split("/")[0];
    const host = sanitized.split(":")[0];
    if (host) return host;
  }
  return DEV_HOST_FALLBACK;
}

export function getApiBaseUrl(): string {
  const envBase = process.env.EXPO_PUBLIC_API_URL || "";
  if (envBase) {
    const normalized = envBase.replace(/\/+$/, "");
    if (__DEV__ && Platform.OS !== "web") {
      try {
        const parsed = new URL(normalized);
        if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
          parsed.hostname = getDevHost();
          return parsed.toString().replace(/\/+$/, "");
        }
      } catch {
        // Ignore malformed env base URL and continue with raw value.
      }
    }
    return normalized;
  }
  if (__DEV__) return `http://${getDevHost()}:3001`;
  return "https://api.antislot.app";
}
