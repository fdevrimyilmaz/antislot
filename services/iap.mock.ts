/**
 * Mock IAP — Expo Go / development.
 * Fake purchase, local state update only; no real store.
 */

export const PRODUCT_IDS = {
  monthly: "antislot_premium_monthly",
  quarterly: "antislot_premium_quarterly",
  semiannual: "antislot_premium_semiannual",
  yearly: "antislot_premium_yearly",
} as const;

type IapCode = "disabled" | "not_ready" | "store_unavailable" | "error";
type IapResult = { ok: boolean; code?: IapCode; message?: string; data?: unknown };

export const iapInit = async (): Promise<IapResult> => {
  return { ok: true };
};

export const purchaseMonthly = async (): Promise<IapResult> => {
  return { ok: true, data: { sku: PRODUCT_IDS.monthly } };
};

export const purchaseQuarterly = async (): Promise<IapResult> => {
  return { ok: true, data: { sku: PRODUCT_IDS.quarterly } };
};

export const purchaseSemiannual = async (): Promise<IapResult> => {
  return { ok: true, data: { sku: PRODUCT_IDS.semiannual } };
};

export const purchaseYearly = async (): Promise<IapResult> => {
  return { ok: true, data: { sku: PRODUCT_IDS.yearly } };
};

export const restorePurchases = async (): Promise<IapResult> => {
  return { ok: true, data: [] };
};

export const iapEnd = async (): Promise<void> => {
  return;
};
