import Constants from "expo-constants";
import { Platform } from "react-native";

export type PremiumServerResponse = {
  ok: boolean;
  isActive: boolean;
  source: "iap" | "trial" | "code" | "none";
  expiresAt?: number | null;
};

type ActivatePayload = {
  receipt: string;
  productId: string;
  platform: "ios" | "android";
};

type RestorePayload = {
  accountId: string;
  platform: "ios" | "android";
};

type SyncPayload = {
  accountId: string;
  platform: "ios" | "android";
};

const DEV_HOST_FALLBACK = Platform.OS === "android" ? "10.0.2.2" : "localhost";

const getDevHost = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return DEV_HOST_FALLBACK;
  const sanitized = hostUri.replace(/^[a-z]+:\/\//i, "").split("/")[0];
  const host = sanitized.split(":")[0];
  return host || DEV_HOST_FALLBACK;
};

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL
  : __DEV__
    ? `http://${getDevHost()}:3001`
    : "https://api.antislot.app";

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, "");

async function postJson<TPayload>(
  endpoint: string,
  payload: TPayload
): Promise<PremiumServerResponse> {
  const base = normalizeBaseUrl(DEFAULT_API_BASE);
  const response = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Premium API request failed (${response.status}) ${details}`);
  }

  return (await response.json()) as PremiumServerResponse;
}

export async function activatePremium(payload: ActivatePayload): Promise<PremiumServerResponse> {
  return postJson("/v1/premium/activate", payload);
}

export async function restorePremium(payload: RestorePayload): Promise<PremiumServerResponse> {
  return postJson("/v1/premium/restore", payload);
}

export async function syncPremium(payload: SyncPayload): Promise<PremiumServerResponse> {
  return postJson("/v1/premium/sync", payload);
}

export type RedeemErrorCode =
  | "INVALID_CODE"
  | "REDEEM_NOT_CONFIGURED"
  | "NETWORK_ERROR";

export type RedeemResult =
  | { ok: true; source: "code" }
  | { ok: false; error: RedeemErrorCode };

type RedeemServerResponse = {
  ok: boolean;
  source?: "code";
  error?: string;
};

export async function redeemAccessCode(code: string): Promise<RedeemResult> {
  const base = normalizeBaseUrl(DEFAULT_API_BASE);
  let response: Response;

  try {
    response = await fetch(`${base}/v1/premium/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { ok: false, error: "NETWORK_ERROR" };
  }

  let data: RedeemServerResponse | null = null;
  try {
    data = (await response.json()) as RedeemServerResponse;
  } catch {
    data = null;
  }

  if (response.ok && data?.ok && data.source === "code") {
    return { ok: true, source: "code" };
  }

  const serverError = data?.error;
  if (serverError === "REDEEM_NOT_CONFIGURED") {
    return { ok: false, error: "REDEEM_NOT_CONFIGURED" };
  }
  return { ok: false, error: "INVALID_CODE" };
}
