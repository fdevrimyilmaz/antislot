import { Platform } from "react-native";
import Constants from "expo-constants";
import { useAiConsentStore } from "@/store/aiConsentStore";

export class AiConsentMissingError extends Error {
  constructor() {
    super("ai_consent_missing");
    this.name = "AiConsentMissingError";
  }
}

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatResponse = {
  reply: string;
  /** Server signals when the upstream model hit its output-token cap. */
  truncated?: boolean;
};

export type ChatResult = {
  reply: string;
  truncated: boolean;
};

type PostChatOptions = {
  signal?: AbortSignal;
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

export async function postChat(
  messages: ChatMessage[],
  options: PostChatOptions = {}
): Promise<ChatResult> {
  // Hard gate: refuse to send any data unless the user has granted consent.
  // The AI screen also checks this — this is the last line of defense for
  // any future caller that might forget the UI check.
  const consent = useAiConsentStore.getState();
  if (consent.status !== "granted") {
    throw new AiConsentMissingError();
  }

  const baseUrl = normalizeBaseUrl(DEFAULT_API_URL);
  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Chat request failed (${response.status}) ${errorText}`);
  }

  const data = (await response.json()) as ChatResponse;
  if (!data?.reply) {
    throw new Error("Chat reply missing");
  }
  return { reply: data.reply, truncated: Boolean(data.truncated) };
}
