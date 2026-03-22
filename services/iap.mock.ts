/**
 * Mock IAP — Expo Go / development.
 * Fake purchase, local state update only; no real store.
 */

export const PRODUCT_IDS = {
  monthly: "antislot_premium_monthly",
  yearly: "antislot_premium_yearly",
  lifetime: "antislot_premium_lifetime",
} as const;

type IapCode = "disabled" | "not_ready" | "store_unavailable" | "error";
type IapResult = { ok: boolean; code?: IapCode; message?: string; data?: unknown };

export const iapInit = async (): Promise<IapResult> => {
  return { ok: true };
};

export const purchaseMonthly = async (): Promise<IapResult> => {
  return { ok: true, data: { sku: PRODUCT_IDS.monthly } };
};

export const purchaseYearly = async (): Promise<IapResult> => {
  return { ok: true, data: { sku: PRODUCT_IDS.yearly } };
};

export const purchaseLifetime = async (): Promise<IapResult> => {
  return { ok: true, data: { sku: PRODUCT_IDS.lifetime } };
};

export const restorePurchases = async (): Promise<IapResult> => {
  return { ok: true, data: [] };
};

export const iapEnd = async (): Promise<void> => {
  return;
};
