import * as SecureStore from "expo-secure-store";

import { reportError } from "@/services/monitoring";

export type PremiumSource = "none" | "code" | "iap";

export type PremiumState = {
  isActive: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
  lastVerifiedAt: number | null;
  source: PremiumSource;
};

const STORAGE_KEY = "antislot_premium_state";
const DEFAULT_STATE: PremiumState = {
  isActive: false,
  activatedAt: null,
  expiresAt: null,
  lastVerifiedAt: null,
  source: "none",
};

async function saveState(state: PremiumState) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePremiumSource(value: unknown): PremiumSource {
  if (value === "iap" || value === "code" || value === "none") return value;
  return "none";
}

function normalizeState(input: Partial<PremiumState>): PremiumState {
  return {
    isActive: Boolean(input.isActive),
    activatedAt: toNumberOrNull(input.activatedAt),
    expiresAt: toNumberOrNull(input.expiresAt),
    lastVerifiedAt: toNumberOrNull(input.lastVerifiedAt),
    source: normalizePremiumSource(input.source),
  };
}

export async function getPremiumState(): Promise<PremiumState> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATE };
    const raw = JSON.parse(stored) as Partial<PremiumState>;
    return normalizeState({ ...DEFAULT_STATE, ...raw });
  } catch (error) {
    reportError(error, { scope: "premiumStore.load", level: "warning" });
    return { ...DEFAULT_STATE };
  }
}

export async function setPremiumState(state: PremiumState): Promise<PremiumState> {
  const normalized = normalizeState(state);
  await saveState(normalized);
  return normalized;
}

export async function setPremiumActive(
  source: PremiumSource = "code",
  options?: {
    activatedAt?: number | null;
    expiresAt?: number | null;
    lastVerifiedAt?: number | null;
  }
): Promise<PremiumState> {
  const now = toNumberOrNull(options?.activatedAt) ?? Date.now();
  const verifiedAt = toNumberOrNull(options?.lastVerifiedAt) ?? Date.now();
  const next: PremiumState = {
    isActive: true,
    activatedAt: now,
    expiresAt: toNumberOrNull(options?.expiresAt),
    lastVerifiedAt: verifiedAt,
    source,
  };
  return setPremiumState(next);
}

export async function clearPremium(): Promise<PremiumState> {
  return setPremiumState({ ...DEFAULT_STATE });
}
