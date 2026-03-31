import { getApiBaseUrl } from "@/services/apiBase";
import { getClientIdentity } from "@/services/clientIdentity";
import { getFirebaseAuthBearerToken } from "@/services/firebaseAuthToken";
import { buildHttpErrorMessage, requestWithRetry } from "@/services/httpClient";

export type RealityFeedApiItem = {
  id: string;
  type: "news" | "court";
  impact: "high" | "moderate";
  date: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
};

type RealityFeedApiResponse = {
  ok?: boolean;
  source: "live" | "fallback";
  generatedAt: number;
  items: RealityFeedApiItem[];
};

type FetchRealityFeedOptions = {
  signal?: AbortSignal;
};

async function buildHeaders(): Promise<HeadersInit> {
  const userId = await getClientIdentity();
  const idToken = await getFirebaseAuthBearerToken();
  const headers: HeadersInit = {
    Accept: "application/json",
    "X-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    "X-User-Id": userId,
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  return headers;
}

export async function fetchRealityFeed(
  options?: FetchRealityFeedOptions
): Promise<RealityFeedApiResponse> {
  const baseUrl = getApiBaseUrl();
  const response = await requestWithRetry(
    `${baseUrl}/v1/explore/reality-feed`,
    {
      method: "GET",
      headers: await buildHeaders(),
      signal: options?.signal,
    },
    {
      retries: 1,
      timeoutMs: 10000,
      signal: options?.signal,
      context: "GET /v1/explore/reality-feed",
    }
  );

  if (!response.ok) {
    throw new Error(await buildHttpErrorMessage(response, "Reality feed request failed"));
  }

  const data = (await response.json()) as RealityFeedApiResponse;
  if (!Array.isArray(data?.items)) {
    throw new Error("Reality feed payload is invalid");
  }

  return data;
}
