import { getApiBaseUrl } from "@/services/apiBase";
import { getClientIdentity } from "@/services/clientIdentity";
import { getFirebaseAuthBearerToken } from "@/services/firebaseAuthToken";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatRiskLevel = "low" | "medium" | "high" | "critical";

export type ChatCoachingContext = {
  locale?: "tr" | "en";
  riskLevel?: ChatRiskLevel;
  suggestedIntensity?: number;
  trigger?: string;
  focus?: string;
  actionPlan?: string[];
};

type ChatResponse = {
  ok?: boolean;
  reply: string;
};

type PostChatOptions = {
  signal?: AbortSignal;
};

async function buildHeaders(): Promise<HeadersInit> {
  const userId = await getClientIdentity();
  const idToken = await getFirebaseAuthBearerToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    "X-User-Id": userId,
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  return headers;
}

export async function postChat(messages: ChatMessage[], options?: PostChatOptions): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const bodyPayload = {
    messages,
  };

  const response = await fetch(`${baseUrl}/v1/chat`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify(bodyPayload),
    signal: options?.signal,
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

export async function postChatWithContext(
  messages: ChatMessage[],
  coachingContext: ChatCoachingContext,
  options?: PostChatOptions
): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const bodyPayload = {
    messages,
    locale: coachingContext.locale,
    coachingContext,
  };

  const response = await fetch(`${baseUrl}/v1/chat`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify(bodyPayload),
    signal: options?.signal,
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
