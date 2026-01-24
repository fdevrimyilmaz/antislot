import { Platform } from "react-native";
import Constants from "expo-constants";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatResponse = {
  reply: string;
};

const DEV_HOST_FALLBACK = Platform.OS === "android" ? "10.0.2.2" : "localhost";

const getDevHost = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const sanitized = hostUri.replace(/^[a-z]+:\/\//i, "").split("/")[0];
    const host = sanitized.split(":")[0];
    if (host) return host;
  }
  return DEV_HOST_FALLBACK;
};

const DEV_BASE_URL = `http://${getDevHost()}:3001`;

const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL
  : __DEV__
    ? DEV_BASE_URL
    : "https://api.antislot.app";

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

export async function postChat(messages: ChatMessage[]): Promise<string> {
  const baseUrl = normalizeBaseUrl(DEFAULT_API_URL);
  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Chat request failed (${response.status}) ${errorText}`);
  }

  const data = (await response.json()) as ChatResponse;
  if (!data?.reply) {
    throw new Error("Chat reply missing");
  }
  return data.reply;
}
