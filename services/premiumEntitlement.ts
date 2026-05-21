import { Platform } from "react-native";

import { ENABLE_IAP } from "@/constants/featureFlags";
import { getActivePurchases, isIapSupported, PLAN_BY_SKU } from "@/services/iap";
import { addBreadcrumb, reportError } from "@/services/monitoring";
import { activatePremium } from "@/services/premiumApi";
import {
  getPremiumState,
  setPremiumActive,
  setPremiumState,
  type PremiumState,
} from "@/store/premiumStore";

const MIN_REFRESH_INTERVAL_MS = 45_000;
const MISSING_PURCHASE_GRACE_MS = 3 * 60_000;

type ReconcileReason =
  | "app_launch"
  | "app_foreground"
  | "screen_load"
  | "premium_screen"
  | "manual_restore";

export type ReconcilePremiumOptions = {
  force?: boolean;
  reason?: ReconcileReason;
};

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isExpired(expiresAt: number | null): boolean {
  return typeof expiresAt === "number" && expiresAt > 0 && expiresAt <= Date.now();
}

function pickBestPurchase<T extends { productId: string; transactionDate: number }>(
  purchases: T[]
): T | null {
  if (purchases.length === 0) return null;
  const sorted = [...purchases].sort(
    (a, b) => (b.transactionDate || 0) - (a.transactionDate || 0)
  );
  return sorted[0] ?? null;
}

function buildInactiveState(state: PremiumState, verifiedAt: number): PremiumState {
  return {
    isActive: false,
    activatedAt: null,
    expiresAt: null,
    lastVerifiedAt: verifiedAt,
    source: state.source === "code" ? "code" : "none",
  };
}

function shouldSkipRefresh(state: PremiumState, force: boolean): boolean {
  if (force) return false;
  if (!state.lastVerifiedAt) return false;
  if (isExpired(state.expiresAt)) return false;
  return Date.now() - state.lastVerifiedAt < MIN_REFRESH_INTERVAL_MS;
}

export async function reconcilePremiumEntitlement(
  options?: ReconcilePremiumOptions
): Promise<PremiumState> {
  const force = Boolean(options?.force);
  const reason = options?.reason ?? "screen_load";
  const now = Date.now();

  const local = await getPremiumState();
  if (local.source === "code") return local;

  if (isExpired(local.expiresAt)) {
    return setPremiumState(buildInactiveState(local, now));
  }

  if (!ENABLE_IAP || !isIapSupported()) {
    return local;
  }

  if (shouldSkipRefresh(local, force)) {
    return local;
  }

  addBreadcrumb("premium.reconcile", "start", {
    reason,
    force,
    source: local.source,
    active: local.isActive,
  });

  try {
    const purchases = await getActivePurchases();
    const premiumPurchases = purchases.filter((purchase) =>
      Boolean(PLAN_BY_SKU[purchase.productId])
    );
    const activePurchase = pickBestPurchase(premiumPurchases);

    if (!activePurchase) {
      if (
        local.isActive &&
        local.source === "iap" &&
        !force &&
        local.lastVerifiedAt &&
        now - local.lastVerifiedAt < MISSING_PURCHASE_GRACE_MS
      ) {
        addBreadcrumb("premium.reconcile", "missing_grace", { reason });
        return local;
      }

      const nextInactive = buildInactiveState(local, now);
      return setPremiumState(nextInactive);
    }

    const receipt = activePurchase.purchaseToken ?? "";
    let expiresAt = toNumberOrNull(
      (activePurchase as { expirationDateIOS?: number | null }).expirationDateIOS
    );

    if (receipt) {
      try {
        const serverState = await activatePremium({
          receipt,
          productId: activePurchase.productId,
          platform: Platform.OS === "android" ? "android" : "ios",
        });
        if (toNumberOrNull(serverState.expiresAt)) {
          expiresAt = toNumberOrNull(serverState.expiresAt);
        }
      } catch (error) {
        reportError(error, {
          scope: "premium.reconcile.serverActivate",
          level: "warning",
        });
      }
    }

    if (isExpired(expiresAt)) {
      const nextInactive = buildInactiveState(local, now);
      return setPremiumState(nextInactive);
    }

    const activatedAt =
      local.isActive && local.source === "iap" && local.activatedAt
        ? local.activatedAt
        : now;

    const next = await setPremiumActive("iap", {
      activatedAt,
      expiresAt,
      lastVerifiedAt: now,
    });
    addBreadcrumb("premium.reconcile", "active", { reason });
    return next;
  } catch (error) {
    reportError(error, { scope: "premium.reconcile", level: "warning" });
    if (local.isActive && local.source === "iap" && isExpired(local.expiresAt)) {
      return setPremiumState(buildInactiveState(local, now));
    }
    return local;
  }
}
