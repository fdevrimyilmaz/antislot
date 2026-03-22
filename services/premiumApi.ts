/**
 * Premium API client — server-authoritative.
 * Client only requests; backend decides and returns state.
 */

import type {
  PremiumActivateRequest,
  PremiumActivateResponse,
  PremiumRestoreRequest,
  PremiumRestoreResponse,
  PremiumState,
  PremiumStatusResponse,
  PremiumSyncRequest,
  PremiumSyncResponse,
} from "@/types/premium";
import { getApiBaseUrl } from "@/services/apiBase";
import { getClientIdentity } from "@/services/clientIdentity";
import { getFirebaseAuthBearerToken } from "@/services/firebaseAuthToken";
import { Platform } from "react-native";

function url(path: string): string {
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const userId = await getClientIdentity();
  const idToken = await getFirebaseAuthBearerToken();

  return {
    "Content-Type": "application/json",
    "X-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    "X-User-Id": userId,
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
  };
}

/** GET /v1/premium/status — fetch current premium state from server */
export async function getPremiumStatus(): Promise<PremiumState> {
  const res = await fetch(url("/v1/premium/status"), {
    method: "GET",
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Premium status failed (${res.status}) ${text}`);
  }
  const data = (await res.json()) as PremiumStatusResponse;
  if (!data.ok || !data.state) throw new Error("Invalid premium status response");
  return data.state;
}

/** POST /v1/premium/sync — send local state, receive authoritative state */
export async function syncPremiumState(localState: PremiumState): Promise<PremiumState> {
  const body: PremiumSyncRequest = { localState };
  const res = await fetch(url("/v1/premium/sync"), {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Premium sync failed (${res.status}) ${text}`);
  }
  const data = (await res.json()) as PremiumSyncResponse;
  if (!data.ok || !data.state) throw new Error("Invalid premium sync response");
  return data.state;
}

/** POST /v1/premium/activate — activate via code or receipt */
export async function activatePremium(
  params: PremiumActivateRequest
): Promise<PremiumState> {
  const res = await fetch(url("/v1/premium/activate"), {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as PremiumActivateResponse;
  if (!res.ok) {
    throw new Error(data.error ?? `Activate failed (${res.status})`);
  }
  if (!data.ok || !data.state) throw new Error("Invalid premium activate response");
  return data.state;
}

/** POST /v1/premium/restore — restore purchases */
export async function restorePremium(
  params: PremiumRestoreRequest = {}
): Promise<PremiumState> {
  const res = await fetch(url("/v1/premium/restore"), {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ ...params, platform: params.platform ?? Platform.OS }),
  });
  const data = (await res.json()) as PremiumRestoreResponse;
  if (!res.ok) {
    throw new Error(data.error ?? `Restore failed (${res.status})`);
  }
  if (!data.ok || !data.state) throw new Error("Invalid premium restore response");
  return data.state;
}
