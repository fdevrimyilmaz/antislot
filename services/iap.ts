import { Platform } from "react-native";
import {
  endConnection,
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type EventSubscription,
  type Purchase,
  type PurchaseError,
  type ProductSubscription,
  type ProductSubscriptionIOS,
} from "react-native-iap";

import { reportError } from "@/services/monitoring";

export type PremiumPlanId = "monthly" | "quarterly" | "semiannual" | "annual";

export const SUBSCRIPTION_SKUS: Record<PremiumPlanId, string> = {
  monthly: "com.antislot.premium.monthly",
  quarterly: "com.antislot.premium.quarterly",
  semiannual: "com.antislot.premium.semiannual",
  annual: "com.antislot.premium.annual",
};

export const PLAN_BY_SKU: Record<string, PremiumPlanId> = Object.fromEntries(
  Object.entries(SUBSCRIPTION_SKUS).map(([planId, sku]) => [sku, planId as PremiumPlanId])
) as Record<string, PremiumPlanId>;

export type SubscriptionInfo = {
  planId: PremiumPlanId;
  sku: string;
  title: string;
  displayPrice: string;
  currency?: string;
  raw: ProductSubscription;
};

const SKUS: string[] = Object.values(SUBSCRIPTION_SKUS);

let initPromise: Promise<boolean> | null = null;

export function isIapSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export async function initIap(): Promise<boolean> {
  if (!isIapSupported()) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const ok = await initConnection();
      return Boolean(ok);
    } catch (error) {
      reportError(error, { scope: "iap.init", level: "warning" });
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

export async function endIap(): Promise<void> {
  if (!initPromise) return;
  try {
    await endConnection();
  } catch (error) {
    reportError(error, { scope: "iap.end", level: "warning" });
  } finally {
    initPromise = null;
  }
}

function toSubscriptionInfo(product: ProductSubscription): SubscriptionInfo | null {
  const planId = PLAN_BY_SKU[product.id];
  if (!planId) return null;

  const iosProduct =
    product.platform === "ios" ? (product as ProductSubscriptionIOS) : null;
  const currency = iosProduct?.currency;

  return {
    planId,
    sku: product.id,
    title: product.title || product.id,
    displayPrice: product.displayPrice,
    currency,
    raw: product,
  };
}

export async function fetchSubscriptions(): Promise<SubscriptionInfo[]> {
  if (!isIapSupported()) return [];

  const ready = await initIap();
  if (!ready) return [];

  try {
    const result = await fetchProducts({ skus: SKUS, type: "subs" });
    const subscriptions = (result as ProductSubscription[]).filter(
      (item): item is ProductSubscription =>
        item != null && (item.type === "subs" || item.type === undefined)
    );
    return subscriptions
      .map(toSubscriptionInfo)
      .filter((info): info is SubscriptionInfo => info !== null);
  } catch (error) {
    reportError(error, { scope: "iap.fetchSubscriptions", level: "warning" });
    return [];
  }
}

export class IapUserCancelledError extends Error {
  constructor() {
    super("user_cancelled");
    this.name = "IapUserCancelledError";
  }
}

export class IapPurchaseFailedError extends Error {
  code: string;
  productId?: string;
  constructor(message: string, code: string, productId?: string) {
    super(message);
    this.name = "IapPurchaseFailedError";
    this.code = code;
    this.productId = productId;
  }
}

type PurchaseListenerEntry = {
  updates: EventSubscription;
  errors: EventSubscription;
};

function attachOneShotListeners(
  sku: string,
  resolve: (purchase: Purchase) => void,
  reject: (error: unknown) => void
): PurchaseListenerEntry {
  const cleanup = (entry: PurchaseListenerEntry) => {
    entry.updates.remove();
    entry.errors.remove();
  };

  const entry: PurchaseListenerEntry = {
    updates: purchaseUpdatedListener((purchase) => {
      const matchesSku =
        purchase.productId === sku ||
        (purchase.ids?.includes(sku) ?? false);
      if (!matchesSku) return;
      cleanup(entry);
      resolve(purchase);
    }),
    errors: purchaseErrorListener((error: PurchaseError) => {
      if (error.productId && error.productId !== sku) return;
      cleanup(entry);
      if (error.code === ErrorCode.UserCancelled) {
        reject(new IapUserCancelledError());
        return;
      }
      reject(
        new IapPurchaseFailedError(
          error.message || "Purchase failed",
          String(error.code ?? "unknown"),
          error.productId ?? undefined
        )
      );
    }),
  };

  return entry;
}

export async function purchaseSubscription(sku: string): Promise<Purchase> {
  if (!isIapSupported()) {
    throw new IapPurchaseFailedError("IAP not supported on this platform", "unsupported");
  }

  const ready = await initIap();
  if (!ready) {
    throw new IapPurchaseFailedError("Store connection not available", "store-unavailable");
  }

  return new Promise<Purchase>((resolve, reject) => {
    let settled = false;
    const wrappedResolve = (purchase: Purchase) => {
      if (settled) return;
      settled = true;
      resolve(purchase);
    };
    const wrappedReject = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    attachOneShotListeners(sku, wrappedResolve, wrappedReject);

    requestPurchase({
      request: {
        apple: { sku },
        google: { skus: [sku] },
      },
      type: "subs",
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      const code = (error as { code?: string })?.code ?? "request-failed";
      if (code === ErrorCode.UserCancelled) {
        wrappedReject(new IapUserCancelledError());
        return;
      }
      wrappedReject(new IapPurchaseFailedError(message, String(code)));
    });
  });
}

export async function finishPurchase(purchase: Purchase): Promise<void> {
  try {
    await finishTransaction({ purchase, isConsumable: false });
  } catch (error) {
    reportError(error, { scope: "iap.finishTransaction", level: "warning" });
  }
}

export async function getActivePurchases(): Promise<Purchase[]> {
  if (!isIapSupported()) return [];
  const ready = await initIap();
  if (!ready) return [];

  try {
    const result = await getAvailablePurchases({
      onlyIncludeActiveItemsIOS: true,
      alsoPublishToEventListenerIOS: false,
    });
    return (result ?? []).filter((purchase) =>
      SKUS.includes(purchase.productId)
    );
  } catch (error) {
    reportError(error, { scope: "iap.getAvailablePurchases", level: "warning" });
    return [];
  }
}
