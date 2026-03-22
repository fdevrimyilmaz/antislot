import { GoogleAuth } from "google-auth-library";
import { config } from "./config";
import type { ReceiptValidationResult, ReceiptValidationSource } from "./iap-validator";

type AppleReceiptItem = {
  product_id?: string;
  expires_date_ms?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  cancellation_date_ms?: string;
};

type AppleVerifyResponse = {
  status?: number;
  environment?: string;
  latest_receipt_info?: AppleReceiptItem[];
  receipt?: {
    in_app?: AppleReceiptItem[];
  };
};

type AndroidSubscriptionV2 = {
  subscriptionState?: string;
  latestOrderId?: string;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string;
  }>;
};

type AndroidInAppProduct = {
  purchaseState?: number;
  orderId?: string;
};

const IOS_VERIFY_PROD_URL = "https://buy.itunes.apple.com/verifyReceipt";
const IOS_VERIFY_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
const ANDROID_SCOPE = "https://www.googleapis.com/auth/androidpublisher";

function sourceFromProductId(productId: string): ReceiptValidationSource | null {
  if (productId === config.iapProductMonthly) return "subscription_monthly";
  if (productId === config.iapProductYearly) return "subscription_yearly";
  if (productId === config.iapProductLifetime) return "lifetime";
  return null;
}

function allowedProductIds(): string[] {
  return [config.iapProductMonthly, config.iapProductYearly, config.iapProductLifetime];
}

async function fetchJsonWithTimeout<T>(
  operation: string,
  url: string,
  init: Omit<RequestInit, "signal">
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.iapStoreTimeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[iap-store-validator] ${operation} failed with status=${response.status}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    const err = error as { name?: string; message?: string };
    if (err?.name === "AbortError") {
      console.warn(
        `[iap-store-validator] ${operation} timed out after ${config.iapStoreTimeoutMs}ms`
      );
      return null;
    }

    console.warn(
      `[iap-store-validator] ${operation} network error: ${err?.message ?? "unknown"}`
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function postAppleVerifyReceipt(url: string, receipt: string): Promise<AppleVerifyResponse | null> {
  return fetchJsonWithTimeout<AppleVerifyResponse>("apple-verify-receipt", url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receipt,
      password: config.iapIosSharedSecret,
      "exclude-old-transactions": true,
    }),
  });
}

function pickBestAppleItem(items: AppleReceiptItem[]): AppleReceiptItem | null {
  const filtered = items.filter((item) => {
    const productId = item.product_id ?? "";
    return allowedProductIds().includes(productId) && !item.cancellation_date_ms;
  });
  if (filtered.length === 0) return null;

  filtered.sort((a, b) => {
    const aExp = Number.parseInt(a.expires_date_ms ?? "0", 10);
    const bExp = Number.parseInt(b.expires_date_ms ?? "0", 10);
    return bExp - aExp;
  });
  return filtered[0] ?? null;
}

async function validateIosReceipt(receipt: string): Promise<ReceiptValidationResult | null> {
  if (!config.iapIosSharedSecret) return null;

  let payload = await postAppleVerifyReceipt(IOS_VERIFY_PROD_URL, receipt);
  if (!payload) return null;

  if (payload.status === 21007) {
    payload = await postAppleVerifyReceipt(IOS_VERIFY_SANDBOX_URL, receipt);
    if (!payload) return null;
  }

  if (payload.status !== 0) return null;

  const items = payload.latest_receipt_info ?? payload.receipt?.in_app ?? [];
  const best = pickBestAppleItem(items);
  if (!best || !best.product_id) return null;

  const source = sourceFromProductId(best.product_id);
  if (!source) return null;

  const now = Date.now();
  const expiresAtRaw = Number.parseInt(best.expires_date_ms ?? "0", 10);
  const expiresAt = Number.isFinite(expiresAtRaw) && expiresAtRaw > 0 ? expiresAtRaw : null;
  const active = source === "lifetime" ? true : expiresAt !== null && expiresAt > now;
  const txId = best.transaction_id || best.original_transaction_id || undefined;

  return {
    ok: true,
    active,
    source,
    expiresAt,
    productId: best.product_id,
    transactionId: txId,
    eventId: txId ? `${payload.environment ?? "ios"}-${txId}` : undefined,
  };
}

function decodeGoogleServiceAccount(): Record<string, unknown> | null {
  if (!config.iapGoogleServiceAccountJsonB64) return null;
  try {
    const json = Buffer.from(config.iapGoogleServiceAccountJsonB64, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function getAndroidAccessToken(): Promise<string | null> {
  const credentials = decodeGoogleServiceAccount();
  if (!credentials) return null;

  const auth = new GoogleAuth({
    credentials,
    scopes: [ANDROID_SCOPE],
  });
  const token = await auth.getAccessToken();
  return token || null;
}

async function fetchAndroidJson<T>(url: string): Promise<T | null> {
  const token = await getAndroidAccessToken();
  if (!token) return null;

  return fetchJsonWithTimeout<T>("android-publisher", url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function validateAndroidReceipt(receipt: string): Promise<ReceiptValidationResult | null> {
  if (!config.iapAndroidPackageName) return null;

  const packageName = encodeURIComponent(config.iapAndroidPackageName);
  const token = encodeURIComponent(receipt);

  const subscriptionUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${token}`;
  const subscription = await fetchAndroidJson<AndroidSubscriptionV2>(subscriptionUrl);
  if (subscription?.lineItems?.length) {
    const item = subscription.lineItems.find((line) =>
      typeof line.productId === "string" && allowedProductIds().includes(line.productId)
    );
    if (item?.productId) {
      const source = sourceFromProductId(item.productId);
      if (!source) return null;

      const expiresAtRaw = item.expiryTime ? Date.parse(item.expiryTime) : NaN;
      const expiresAt = Number.isFinite(expiresAtRaw) ? expiresAtRaw : null;
      const activeStates = new Set([
        "SUBSCRIPTION_STATE_ACTIVE",
        "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
      ]);
      const active =
        source === "lifetime"
          ? true
          : activeStates.has(subscription.subscriptionState ?? "") &&
            expiresAt !== null &&
            expiresAt > Date.now();

      return {
        ok: true,
        active,
        source,
        expiresAt,
        productId: item.productId,
        transactionId: subscription.latestOrderId,
        eventId: subscription.latestOrderId ? `gp-${subscription.latestOrderId}` : undefined,
      };
    }
  }

  const productId = encodeURIComponent(config.iapProductLifetime);
  const productUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${token}`;
  const inApp = await fetchAndroidJson<AndroidInAppProduct>(productUrl);
  if (!inApp) return null;

  const purchased = inApp.purchaseState === 0;
  return {
    ok: true,
    active: purchased,
    source: "lifetime",
    expiresAt: null,
    productId: config.iapProductLifetime,
    transactionId: inApp.orderId,
    eventId: inApp.orderId ? `gp-${inApp.orderId}` : undefined,
  };
}

export async function validateReceiptWithStores(
  receipt: string,
  platform?: "ios" | "android"
): Promise<ReceiptValidationResult | null> {
  if (platform === "ios") return validateIosReceipt(receipt);
  if (platform === "android") return validateAndroidReceipt(receipt);
  // When platform unknown: try iOS first (base64 receipt), then Android (purchase token)
  const iosResult = await validateIosReceipt(receipt);
  if (iosResult) return iosResult;
  return validateAndroidReceipt(receipt);
}
