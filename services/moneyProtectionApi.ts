import { getApiBaseUrl } from "@/services/apiBase";
import { getClientIdentity } from "@/services/clientIdentity";
import { getFirebaseAuthBearerToken } from "@/services/firebaseAuthToken";
import type {
  MoneyProtectionSyncRequest,
  MoneyProtectionSyncResponse,
} from "@/types/moneyProtectionSync";

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

export async function syncMoneyProtectionCloud(
  payload: MoneyProtectionSyncRequest
): Promise<MoneyProtectionSyncResponse | null> {
  const headers = await getAuthHeaders();
  if (!headers) return null;

  const response = await fetch(url("/v1/money-protection/sync"), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Money protection sync failed (${response.status}) ${errorText}`);
  }

  const data = (await response.json()) as MoneyProtectionSyncResponse;
  if (!data.ok || !data.state || typeof data.state !== "object") {
    throw new Error("Invalid money protection sync response");
  }

  return data;
}
