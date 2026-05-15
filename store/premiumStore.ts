import * as SecureStore from "expo-secure-store";

import { reportError } from "@/services/monitoring";

export type PremiumSource = "none" | "code" | "iap";

export type PremiumState = {
  isActive: boolean;
  activatedAt: number | null;
  source: PremiumSource;
};

const STORAGE_KEY = "antislot_premium_state";
const DEFAULT_STATE: PremiumState = {
  isActive: false,
  activatedAt: null,
  source: "none",
};

async function saveState(state: PremiumState) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
}

export async function getPremiumState(): Promise<PremiumState> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATE };
    const parsed = { ...DEFAULT_STATE, ...JSON.parse(stored) } as PremiumState;
    return parsed;
  } catch (error) {
    reportError(error, { scope: "premiumStore.load", level: "warning" });
    return { ...DEFAULT_STATE };
  }
}

export async function setPremiumActive(source: PremiumSource = "code"): Promise<PremiumState> {
  const now = Date.now();
  const next: PremiumState = {
    isActive: true,
    activatedAt: now,
    source,
  };
  await saveState(next);
  return next;
}

export async function clearPremium(): Promise<PremiumState> {
  await saveState({ ...DEFAULT_STATE });
  return { ...DEFAULT_STATE };
}
