import { config } from "./config";
import { validateReceiptWithStores } from "./iap-store-validator";

export type ReceiptValidationSource =
  | "subscription_monthly"
  | "subscription_yearly"
  | "lifetime";

export type ReceiptValidationResult = {
  ok: boolean;
  active: boolean;
  source?: ReceiptValidationSource;
  expiresAt?: number | null;
  productId?: string;
  transactionId?: string;
  eventId?: string;
};

type ProviderPayload = {
  ok?: unknown;
  active?: unknown;
  source?: unknown;
  expiresAt?: unknown;
  productId?: unknown;
  transactionId?: unknown;
  eventId?: unknown;
};

function sourceFromProductId(productId: string): ReceiptValidationSource | null {
  if (productId === config.iapProductMonthly) return "subscription_monthly";
  if (productId === config.iapProductYearly) return "subscription_yearly";
  if (productId === config.iapProductLifetime) return "lifetime";
  return null;
}

function sourceFromPayload(value: unknown): ReceiptValidationSource | null {
  if (value === "subscription_monthly") return "subscription_monthly";
  if (value === "subscription_yearly") return "subscription_yearly";
  if (value === "lifetime") return "lifetime";
  return null;
}

function normalizeProviderPayload(data: ProviderPayload): ReceiptValidationResult {
  const ok = data.ok === true;
  const active = data.active === true;

  const productId = typeof data.productId === "string" ? data.productId.trim() : "";
  const sourceFromProduct = productId ? sourceFromProductId(productId) : null;
  const sourceFromRaw = sourceFromPayload(data.source);
  const source = sourceFromRaw ?? sourceFromProduct ?? undefined;

  const expiresAt =
    typeof data.expiresAt === "number" && Number.isFinite(data.expiresAt)
      ? data.expiresAt
      : null;

  return {
    ok,
    active,
    source,
    expiresAt,
    productId: productId || undefined,
    transactionId: typeof data.transactionId === "string" ? data.transactionId : undefined,
    eventId: typeof data.eventId === "string" ? data.eventId : undefined,
  };
}

async function validateWithProvider(
  receipt: string,
  userId: string,
  platform?: "ios" | "android"
): Promise<ReceiptValidationResult> {
  if (!config.receiptValidatorUrl) {
    return { ok: false, active: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(config.receiptValidatorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.receiptValidatorApiKey ? { Authorization: `Bearer ${config.receiptValidatorApiKey}` } : {}),
      },
      body: JSON.stringify({ receipt, platform, userId }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, active: false };
    }

    const data = (await response.json()) as ProviderPayload;
    const normalized = normalizeProviderPayload(data);
    if (!normalized.source) {
      return { ok: false, active: false };
    }
    return normalized;
  } catch {
    return { ok: false, active: false };
  } finally {
    clearTimeout(timeout);
  }
}

function validateWithDevBypass(
  receipt: string,
  userId: string,
  platform?: "ios" | "android"
): ReceiptValidationResult {
  if (config.isProduction || !config.allowDevReceiptBypass) {
    return { ok: false, active: false };
  }
  if (receipt.length < 16) {
    return { ok: false, active: false };
  }

  const now = Date.now();
  const productId = platform === "android" ? config.iapProductMonthly : config.iapProductYearly;

  return {
    ok: true,
    active: true,
    source: sourceFromProductId(productId) ?? "subscription_monthly",
    expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    productId,
    transactionId: `dev-${userId}-${now}`,
    eventId: `dev-${now}`,
  };
}

export async function validateReceipt(
  receipt: string,
  userId: string,
  platform?: "ios" | "android"
): Promise<ReceiptValidationResult> {
  const storeResult = await validateReceiptWithStores(receipt, platform);
  if (storeResult?.ok) {
    return storeResult;
  }

  const providerResult = await validateWithProvider(receipt, userId, platform);
  if (providerResult.ok) {
    return providerResult;
  }
  return validateWithDevBypass(receipt, userId, platform);
}
