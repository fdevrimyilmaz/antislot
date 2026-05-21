import { Platform } from "react-native";
import {
  endConnection,
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  promotedProductListenerIOS,
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
let promotedListener: EventSubscription | null = null;

export type PromotedProductEvent = {
  sku: string;
  type: "in-app" | "subs";
};

const promotedEventHandlers = new Set<
  (event: PromotedProductEvent) => void
>();
const pendingPromotedEvents: PromotedProductEvent[] = [];
const MAX_PENDING_PROMOTED_EVENTS = 8;

export function isIapSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

function dispatchPromotedEvent(event: PromotedProductEvent): void {
  if (promotedEventHandlers.size === 0) {
    const exists = pendingPromotedEvents.some(
      (item) => item.sku === event.sku && item.type === event.type
    );
    if (!exists) {
      pendingPromotedEvents.push(event);
      if (pendingPromotedEvents.length > MAX_PENDING_PROMOTED_EVENTS) {
        pendingPromotedEvents.shift();
      }
    }
    return;
  }

  for (const handler of promotedEventHandlers) {
    try {
      handler(event);
    } catch (error) {
      reportError(error, {
        scope: "iap.promotedProduct.handler",
        level: "warning",
      });
    }
  }
}

function ensurePromotedProductListener(): void {
  if (Platform.OS !== "ios" || promotedListener) return;

  promotedListener = promotedProductListenerIOS((product) => {
    if (!product?.id) return;
    const eventType: "in-app" | "subs" =
      PLAN_BY_SKU[product.id] ? "subs" : "in-app";
    dispatchPromotedEvent({
      sku: product.id,
      type: eventType,
    });
  });
}

export function addPromotedProductListener(
  handler: (event: PromotedProductEvent) => void
): EventSubscription {
  promotedEventHandlers.add(handler);

  if (pendingPromotedEvents.length > 0) {
    const snapshot = pendingPromotedEvents.splice(0, pendingPromotedEvents.length);
    for (const event of snapshot) {
      try {
        handler(event);
      } catch (error) {
        reportError(error, {
          scope: "iap.promotedProduct.flush",
          level: "warning",
        });
      }
    }
  }

  return {
    remove: () => {
      promotedEventHandlers.delete(handler);
    },
  };
}

export async function initIap(): Promise<boolean> {
  if (!isIapSupported()) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const ok = await initConnection();
      if (ok) ensurePromotedProductListener();
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
    promotedListener?.remove();
    promotedListener = null;
    promotedEventHandlers.clear();
    pendingPromotedEvents.length = 0;
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

function normalizeSubscriptionProducts(
  result: unknown
): ProductSubscription[] {
  return (result as ProductSubscription[]).filter(
    (item): item is ProductSubscription =>
      item != null && (item.type === "subs" || item.type === undefined)
  );
}

export async function fetchSubscriptions(): Promise<SubscriptionInfo[]> {
  if (!isIapSupported()) return [];

  const ready = await initIap();
  if (!ready) return [];

  try {
    const result = await fetchProducts({ skus: SKUS, type: "subs" });
    let subscriptions = normalizeSubscriptionProducts(result);

    if (subscriptions.length === 0) {
      const fallbackResult = await fetchProducts({ skus: SKUS, type: "all" });
      subscriptions = normalizeSubscriptionProducts(fallbackResult);
    }

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
  remove: () => void;
};

function attachOneShotListeners(
  sku: string,
  resolve: (purchase: Purchase) => void,
  reject: (error: unknown) => void
): PurchaseListenerEntry {
  let removed = false;
  const cleanup = (entry: Omit<PurchaseListenerEntry, "remove">) => {
    if (removed) return;
    removed = true;
    entry.updates.remove();
    entry.errors.remove();
  };

  const entry: Omit<PurchaseListenerEntry, "remove"> = {
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

  return {
    ...entry,
    remove: () => cleanup(entry),
  };
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

    const entry = attachOneShotListeners(sku, wrappedResolve, wrappedReject);

    requestPurchase({
      request: {
        apple: { sku },
        google: { skus: [sku] },
      },
      type: "subs",
    }).catch((error: unknown) => {
      entry.remove();
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
