import { getApiBaseUrl } from "@/services/apiBase";
import { getClientIdentity } from "@/services/clientIdentity";
import { getFirebaseAuthBearerToken } from "@/services/firebaseAuthToken";
import { resolveUiLanguage, type SupportedLanguage } from "@/i18n/translations";

export interface TherapyCallbackRequestPayload {
  phone: string;
  name?: string;
  preferredTime?: string;
  note?: string;
  locale?: SupportedLanguage;
}

export interface TherapyCallbackRequestResponse {
  ok: boolean;
  requestId: string;
  status: "queued" | "contacted" | "closed";
  queueDepth: number;
  queuedAt: number;
  supportEmail?: string;
}

function url(path: string): string {
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function getAuthHeaders(): Promise<HeadersInit | null> {
  const userId = await getClientIdentity();
  const idToken = await getFirebaseAuthBearerToken();
  if (!idToken) return null;

  return {
    "Content-Type": "application/json",
    "X-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    "X-User-Id": userId,
    Authorization: `Bearer ${idToken}`,
  };
}

export async function enqueueTherapyCallbackRequest(
  payload: TherapyCallbackRequestPayload
): Promise<TherapyCallbackRequestResponse | null> {
  const headers = await getAuthHeaders();
  if (!headers) return null;

  const normalizedPayload = {
    ...payload,
    locale: payload.locale ? resolveUiLanguage(payload.locale) : undefined,
  };

  const response = await fetch(url("/v1/therapy/callback"), {
    method: "POST",
    headers,
    body: JSON.stringify(normalizedPayload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Therapy callback request failed (${response.status}) ${errorText}`);
  }

  const data = (await response.json()) as TherapyCallbackRequestResponse;
  if (!data.ok || typeof data.requestId !== "string" || !data.requestId.trim()) {
    throw new Error("Invalid therapy callback response");
  }

  return data;
}
