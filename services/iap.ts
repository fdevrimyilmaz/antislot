import { AppState, Platform } from "react-native";
import { ENABLE_IAP } from "@/constants/featureFlags";
import Constants from "expo-constants";

type IapModule = typeof import("react-native-iap") | null;
let iapModulePromise: Promise<IapModule> | null = null;

export const getIap = async (): Promise<IapModule> => {
  const isExpoGo = Constants.appOwnership === "expo";
  if (isExpoGo || Platform.OS === "web") return null;

  if (!iapModulePromise) {
    iapModulePromise = import("react-native-iap")
      .then((mod) => mod)
      .catch(() => null);
  }

  return iapModulePromise;
};

export type IapCode = "disabled" | "not_ready" | "store_unavailable" | "error";

export type IapResult = {
  ok: boolean;
  code?: IapCode;
  message?: string;
  data?: unknown;
};

export type IapDiagnostics = {
  enabled: boolean;
  connectionStatus: "disabled" | "ready" | "not_ready" | "error";
  productsCount: number;
  message?: string;
};

export type IapPlanId = "monthly" | "yearly" | "lifetime";

export const PRODUCT_IDS = {
  monthly: "antislot_premium_monthly",
  yearly: "antislot_premium_yearly",
  lifetime: "antislot_premium_lifetime",
} as const;

export type IapOffer = {
  id: IapPlanId;
  sku: string;
  title: string;
  description?: string;
  priceLabel?: string;
  currency?: string;
  priceAmountMicros?: number;
  type: "subscription" | "product";
};

export type IapOffersResult = {
  ok: boolean;
  offers: Record<IapPlanId, IapOffer | null>;
  code?: IapCode;
  message?: string;
};

const SUBSCRIPTION_IDS = [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly];
const PRODUCT_IDS_LIST = [PRODUCT_IDS.lifetime];
const PLAN_BY_SKU: Record<string, IapPlanId> = {
  [PRODUCT_IDS.monthly]: "monthly",
  [PRODUCT_IDS.yearly]: "yearly",
  [PRODUCT_IDS.lifetime]: "lifetime",
};
const EMPTY_OFFERS: Record<IapPlanId, IapOffer | null> = {
  monthly: null,
  yearly: null,
  lifetime: null,
};

let connectionReady = false;
let initInFlight: Promise<IapResult> | null = null;
let productsCache: { subscriptions: unknown[]; products: unknown[] } | null = null;
let lastErrorMessage: string | null = null;
let appStateSubscription: { remove: () => void } | null = null;

const log = (...args: unknown[]) => {
  if (__DEV__) {
    console.log("[IAP]", ...args);
  }
};

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const readString = (value: unknown, keys: string[]): string | undefined => {
  const item = asObject(value);
  if (!item) return undefined;
  for (const key of keys) {
    const raw = item[key];
    if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  }
  return undefined;
};

const readNumber = (value: unknown, keys: string[]): number | undefined => {
  const item = asObject(value);
  if (!item) return undefined;
  for (const key of keys) {
    const raw = item[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim().length > 0) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
};

const toMicros = (amount: number | undefined): number | undefined => {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return undefined;
  return Math.round(amount * 1_000_000);
};

const firstOfferToken = (offerList: unknown): string | undefined => {
  if (!Array.isArray(offerList) || offerList.length === 0) return undefined;
  for (const offer of offerList) {
    const token = readString(offer, ["offerToken", "offerTokenAndroid"]);
    if (token) return token;
  }
  return undefined;
};

const normalizeOffer = (value: unknown, type: "subscription" | "product"): IapOffer | null => {
  const sku = readString(value, ["productId", "sku", "id"]);
  if (!sku) return null;
  const id = PLAN_BY_SKU[sku];
  if (!id) return null;
  const title = readString(value, ["title", "name"]) ?? sku;
  const description = readString(value, ["description"]);
  const priceLabel =
    readString(value, ["displayPrice", "localizedPrice", "priceString", "price", "formattedPrice"]) ?? undefined;
  const currency = readString(value, ["currency", "currencyCode"]);
  const priceAmountMicros =
    readNumber(value, ["priceAmountMicros"]) ?? toMicros(readNumber(value, ["price"]));

  return {
    id,
    sku,
    title,
    description,
    priceLabel,
    currency,
    priceAmountMicros,
    type,
  };
};

const toMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error ?? "Unknown error");
};

const disabledResult = (): IapResult => ({
  ok: false,
  code: "disabled",
  message: "Satın alma devre dışı.",
});

async function ensureConnection(): Promise<IapResult> {
  if (!ENABLE_IAP) return disabledResult();
  if (Platform.OS === "web") {
    return { ok: false, code: "store_unavailable", message: "IAP webde desteklenmiyor." };
  }
  if (connectionReady) return { ok: true };
  if (initInFlight) return initInFlight;
  const IAP = await getIap();
  if (!IAP || typeof IAP.initConnection !== "function") {
    return { ok: false, code: "store_unavailable", message: "IAP modulu bulunamadi." };
  }

  initInFlight = (async () => {
    try {
      const ok = await IAP.initConnection();
      if (!ok) {
        throw new Error("initConnection failed");
      }
      connectionReady = true;
      lastErrorMessage = null;
      const iapAny = IAP as unknown as {
        flushFailedPurchasesCachedAsPendingAndroid?: () => Promise<void>;
      };
      if (Platform.OS === "android" && typeof iapAny.flushFailedPurchasesCachedAsPendingAndroid === "function") {
        try {
          await iapAny.flushFailedPurchasesCachedAsPendingAndroid();
        } catch (error) {
          log("flushFailedPurchasesCachedAsPendingAndroid error:", error);
        }
      }
      return { ok: true };
    } catch (error) {
      connectionReady = false;
      lastErrorMessage = toMessage(error);
      return { ok: false, code: "store_unavailable", message: lastErrorMessage };
    } finally {
      initInFlight = null;
    }
  })();

  return initInFlight;
}

export async function endConnection(): Promise<void> {
  if (!connectionReady) return;
  const IAP = await getIap();
  if (!IAP || typeof IAP.endConnection !== "function") {
    connectionReady = false;
    return;
  }
  try {
    await IAP.endConnection();
  } catch (error) {
    log("endConnection error:", error);
  } finally {
    connectionReady = false;
  }
}

export function attachIapLifecycle(): void {
  if (appStateSubscription) return;
  appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state !== "active") {
      endConnection().catch(() => {});
    }
  });
}

export function detachIapLifecycle(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
}

async function fetchProducts(): Promise<IapResult> {
  const init = await ensureConnection();
  if (!init.ok) return init;
  const IAP = await getIap();
  if (!IAP) {
    return { ok: false, code: "store_unavailable", message: "IAP modulu bulunamadi." };
  }

  try {
    let subscriptions: unknown[] = [];
    let products: unknown[] = [];
    const iapAny = IAP as unknown as {
      fetchProducts?: (arg: { skus: string[]; type?: "in-app" | "subs" | "all" | null }) => Promise<unknown[] | null>;
      getSubscriptions?: ((arg: { skus: string[] }) => Promise<unknown[]>) | ((arg: string[]) => Promise<unknown[]>);
      getProducts?: ((arg: { skus: string[] }) => Promise<unknown[]>) | ((arg: string[]) => Promise<unknown[]>);
    };

    if (typeof iapAny.fetchProducts === "function") {
      const [subsResult, productsResult] = await Promise.all([
        iapAny.fetchProducts({ skus: SUBSCRIPTION_IDS, type: "subs" }),
        iapAny.fetchProducts({ skus: PRODUCT_IDS_LIST, type: "in-app" }),
      ]);
      subscriptions = Array.isArray(subsResult) ? subsResult : [];
      products = Array.isArray(productsResult) ? productsResult : [];
    } else {
      if (typeof iapAny.getSubscriptions === "function") {
        try {
          subscriptions = await (iapAny as { getSubscriptions: (arg: { skus: string[] }) => Promise<unknown[]> })
            .getSubscriptions({ skus: SUBSCRIPTION_IDS });
        } catch {
          subscriptions = await (iapAny as { getSubscriptions: (arg: string[]) => Promise<unknown[]> })
            .getSubscriptions(SUBSCRIPTION_IDS);
        }
      }

      if (typeof iapAny.getProducts === "function") {
        try {
          products = await (iapAny as { getProducts: (arg: { skus: string[] }) => Promise<unknown[]> })
            .getProducts({ skus: PRODUCT_IDS_LIST });
        } catch {
          products = await (iapAny as { getProducts: (arg: string[]) => Promise<unknown[]> })
            .getProducts(PRODUCT_IDS_LIST);
        }
      }
    }

    const total = subscriptions.length + products.length;
    if (total === 0) {
      return {
        ok: false,
        code: "not_ready",
        message: "Mağaza ürünleri henüz hazır değil.",
      };
    }

    productsCache = { subscriptions, products };
    return { ok: true, data: productsCache };
  } catch (error) {
    lastErrorMessage = toMessage(error);
    return { ok: false, code: "store_unavailable", message: lastErrorMessage };
  }
}

export async function getIapDiagnostics(refresh = false): Promise<IapDiagnostics> {
  if (!ENABLE_IAP) {
    return { enabled: false, connectionStatus: "disabled", productsCount: 0 };
  }

  if (refresh || !productsCache) {
    const result = await fetchProducts();
    if (!result.ok) {
      return {
        enabled: true,
        connectionStatus: result.code === "store_unavailable" ? "error" : "not_ready",
        productsCount: 0,
        message: result.message,
      };
    }
  }

  const productsCount = (productsCache?.subscriptions.length ?? 0) + (productsCache?.products.length ?? 0);
  return {
    enabled: true,
    connectionStatus: connectionReady ? "ready" : "not_ready",
    productsCount,
    message: lastErrorMessage ?? undefined,
  };
}

const buildOffersMap = (): Record<IapPlanId, IapOffer | null> => {
  const map: Record<IapPlanId, IapOffer | null> = { ...EMPTY_OFFERS };
  if (!productsCache) return map;

  for (const entry of productsCache.subscriptions) {
    const normalized = normalizeOffer(entry, "subscription");
    if (normalized) {
      map[normalized.id] = normalized;
    }
  }

  for (const entry of productsCache.products) {
    const normalized = normalizeOffer(entry, "product");
    if (normalized) {
      map[normalized.id] = normalized;
    }
  }

  return map;
};

export async function getIapOffers(refresh = false): Promise<IapOffersResult> {
  if (!ENABLE_IAP) {
    return {
      ok: false,
      code: "disabled",
      message: "Purchases are disabled.",
      offers: { ...EMPTY_OFFERS },
    };
  }

  if (refresh || !productsCache) {
    const result = await fetchProducts();
    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
        offers: { ...EMPTY_OFFERS },
      };
    }
  }

  return {
    ok: true,
    offers: buildOffersMap(),
  };
}

function getAndroidSubscriptionOfferToken(sku: string): string | undefined {
  if (!productsCache) return undefined;
  for (const item of productsCache.subscriptions) {
    const itemSku = readString(item, ["productId", "sku", "id"]);
    if (itemSku !== sku) continue;

    const directToken = readString(item, ["offerToken", "offerTokenAndroid"]);
    if (directToken) return directToken;

    const obj = asObject(item);
    if (!obj) return undefined;

    const subscriptionOffersToken = firstOfferToken(obj.subscriptionOffers);
    if (subscriptionOffersToken) return subscriptionOffersToken;

    const legacyOffersToken = firstOfferToken(obj.subscriptionOfferDetailsAndroid);
    if (legacyOffersToken) return legacyOffersToken;

    return undefined;
  }
  return undefined;
}

async function requestSubscription(sku: string): Promise<unknown> {
  const IAP = await getIap();
  if (!IAP) throw new Error("IAP modulu bulunamadi.");
  const iapAny = IAP as unknown as {
    requestPurchase?: (arg: unknown) => Promise<unknown>;
    requestSubscription?: ((arg: { sku: string }) => Promise<unknown>) | ((arg: string) => Promise<unknown>);
  };

  if (typeof iapAny.requestPurchase === "function") {
    if (Platform.OS === "android") {
      const offerToken = getAndroidSubscriptionOfferToken(sku);
      return iapAny.requestPurchase({
        type: "subs",
        request: {
          google: {
            skus: [sku],
            subscriptionOffers: offerToken ? [{ sku, offerToken }] : undefined,
          },
        },
      });
    }

    return iapAny.requestPurchase({
      type: "subs",
      request: {
        apple: { sku },
      },
    });
  }

  if (typeof iapAny.requestSubscription === "function") {
    try {
      return await (iapAny.requestSubscription as (arg: { sku: string }) => Promise<unknown>)({ sku });
    } catch {
      return await (iapAny.requestSubscription as (arg: string) => Promise<unknown>)(sku);
    }
  }

  throw new Error("IAP satın alma API bulunamadi.");
}

async function requestPurchase(sku: string): Promise<unknown> {
  const IAP = await getIap();
  if (!IAP) throw new Error("IAP modulu bulunamadi.");
  const iapAny = IAP as unknown as {
    requestPurchase?: (arg: unknown) => Promise<unknown>;
  };

  if (typeof iapAny.requestPurchase !== "function") {
    throw new Error("IAP satın alma API bulunamadi.");
  }

  if (Platform.OS === "android") {
    return iapAny.requestPurchase({
      type: "in-app",
      request: {
        google: { skus: [sku] },
      },
    });
  }

  return iapAny.requestPurchase({
    type: "in-app",
    request: {
      apple: { sku },
    },
  });
}

const toPurchases = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};

async function finishTransactionSafely(purchase: unknown): Promise<void> {
  const IAP = await getIap();
  if (!IAP || typeof IAP.finishTransaction !== "function") return;
  try {
    await (IAP as unknown as { finishTransaction: (arg: { purchase: unknown; isConsumable: boolean }) => Promise<void> })
      .finishTransaction({ purchase, isConsumable: false });
  } catch (error) {
    log("finishTransaction error:", error);
  }
}

async function purchaseSku(sku: string, kind: "subscription" | "product"): Promise<IapResult> {
  if (!ENABLE_IAP) return disabledResult();

  const init = await ensureConnection();
  if (!init.ok) return init;

  const productsResult = await fetchProducts();
  if (!productsResult.ok) return productsResult;

  try {
    const purchase =
      kind === "subscription"
        ? await requestSubscription(sku)
        : await requestPurchase(sku);

    const purchases = toPurchases(purchase);
    await Promise.all(purchases.map((item) => finishTransactionSafely(item)));

    if (purchases.length === 0) {
      return {
        ok: false,
        code: "error",
        message: "Satin alma sonucu alinmadi.",
      };
    }

    return { ok: true, data: purchase };
  } catch (error) {
    return {
      ok: false,
      code: "error",
      message: toMessage(error),
    };
  }
}

export async function purchaseMonthly(): Promise<IapResult> {
  return purchaseSku(PRODUCT_IDS.monthly, "subscription");
}

export async function purchaseYearly(): Promise<IapResult> {
  return purchaseSku(PRODUCT_IDS.yearly, "subscription");
}

export async function purchaseLifetime(): Promise<IapResult> {
  return purchaseSku(PRODUCT_IDS.lifetime, "product");
}

export async function restorePurchases(): Promise<IapResult> {
  if (!ENABLE_IAP) return disabledResult();

  const init = await ensureConnection();
  if (!init.ok) return init;

  const IAP = await getIap();
  if (!IAP || typeof IAP.getAvailablePurchases !== "function") {
    return { ok: false, code: "store_unavailable", message: "Restore API kullanilamiyor." };
  }

  try {
    const getAvailable = IAP.getAvailablePurchases as
      | ((arg?: {
          onlyIncludeActiveItemsIOS?: boolean;
          includeSuspendedAndroid?: boolean;
          alsoPublishToEventListenerIOS?: boolean;
        }) => Promise<unknown[]>)
      | undefined;

    if (typeof getAvailable !== "function") {
      return { ok: false, code: "store_unavailable", message: "Restore API kullanilamiyor." };
    }

    let purchases: unknown[] = [];
    try {
      purchases = await getAvailable({
        onlyIncludeActiveItemsIOS: true,
        includeSuspendedAndroid: false,
        alsoPublishToEventListenerIOS: false,
      });
    } catch {
      purchases = await getAvailable();
    }

    if (Array.isArray(purchases) && purchases.length > 0) {
      // Ensure restored transactions are finalized to avoid replay loops on some stores.
      await Promise.all(purchases.map((purchase) => finishTransactionSafely(purchase)));
    }
    return { ok: true, data: purchases };
  } catch (error) {
    return { ok: false, code: "error", message: toMessage(error) };
  }
}

export async function getIosReceipt(): Promise<IapResult> {
  if (!ENABLE_IAP) return disabledResult();
  if (Platform.OS !== "ios") {
    return { ok: false, code: "store_unavailable", message: "iOS makbuzu yalnizca iOS'ta desteklenir." };
  }

  const init = await ensureConnection();
  if (!init.ok) return init;

  const IAP = await getIap();
  if (!IAP) {
    return { ok: false, code: "store_unavailable", message: "IAP modulu bulunamadi." };
  }

  const iapAny = IAP as unknown as {
    getReceiptIOS?: () => Promise<string>;
    getReceiptDataIOS?: () => Promise<string>;
    requestReceiptRefreshIOS?: () => Promise<string>;
  };

  try {
    let receipt = "";

    if (typeof iapAny.getReceiptIOS === "function") {
      receipt = await iapAny.getReceiptIOS();
    } else if (typeof iapAny.getReceiptDataIOS === "function") {
      receipt = await iapAny.getReceiptDataIOS();
    }

    if (!receipt?.trim() && typeof iapAny.requestReceiptRefreshIOS === "function") {
      receipt = await iapAny.requestReceiptRefreshIOS();
    }

    if (!receipt?.trim()) {
      return { ok: false, code: "not_ready", message: "iOS makbuzu alinamadi." };
    }

    return { ok: true, data: receipt.trim() };
  } catch (error) {
    return { ok: false, code: "error", message: toMessage(error) };
  }
}

export default getIap;
