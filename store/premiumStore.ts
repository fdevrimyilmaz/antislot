import * as SecureStore from "@/lib/secureStoreCompat";
import { create } from "zustand";

import { PREMIUM_FREE_FOR_NOW } from "@/constants/featureFlags";
import { activatePremium, restorePremium, syncPremiumState } from "@/services/premiumApi";
import {
  DEFAULT_PREMIUM_STATE,
  PREMIUM_FEATURES,
  type PremiumFeatureId,
  type PremiumState,
} from "@/types/premium";

const STORAGE_KEY = "antislot_premium_state_v2";
const ALL_PREMIUM_FEATURES = Object.values(PREMIUM_FEATURES) as string[];

type PersistedPremiumState = Partial<PremiumState> & {
  activatedAt?: number;
  source?: string | null;
};

export type PremiumSource = PremiumState["source"] | "none";

type PremiumStoreState = {
  state: PremiumState;
  hydrated: boolean;
  loading: boolean;
  syncError: string | null;
  hydrate: () => Promise<void>;
  hasFeature: (featureName: PremiumFeatureId | string) => boolean;
  syncWithServer: () => Promise<PremiumState>;
  activateCode: (code: string) => Promise<PremiumState>;
  restorePurchases: () => Promise<PremiumState>;
  clearPremium: () => Promise<PremiumState>;
};

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
}

function toNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function toSource(value: unknown): PremiumState["source"] {
  if (value === "none") return null;
  if (
    value === "trial" ||
    value === "subscription_monthly" ||
    value === "subscription_yearly" ||
    value === "lifetime" ||
    value === "code" ||
    value === "admin"
  ) {
    return value;
  }
  return null;
}

function normalizePremiumState(input: unknown): PremiumState {
  const raw =
    input && typeof input === "object"
      ? (input as PersistedPremiumState)
      : ({} as PersistedPremiumState);

  const isActive = typeof raw.isActive === "boolean" ? raw.isActive : false;
  const source = toSource(raw.source);
  const startedAt = toNumber(raw.startedAt ?? raw.activatedAt ?? null);
  const expiresAt = toNumber(raw.expiresAt ?? null);
  const trialEndsAt = toNumber(raw.trialEndsAt ?? null);
  const lastSync = toNumber(raw.lastSync) ?? 0;
  const features =
    Array.isArray(raw.features) && raw.features.length > 0
      ? Array.from(new Set(raw.features.filter((item): item is string => typeof item === "string")))
      : isActive
        ? [...ALL_PREMIUM_FEATURES]
        : [];

  if (!isActive) {
    return { ...DEFAULT_PREMIUM_STATE, lastSync };
  }

  if (source === "trial" && trialEndsAt && Date.now() > trialEndsAt) {
    return { ...DEFAULT_PREMIUM_STATE, lastSync };
  }

  return {
    isActive: true,
    source: source ?? "code",
    startedAt,
    expiresAt,
    trialEndsAt,
    features,
    lastSync,
  };
}

async function persistState(state: PremiumState): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
}

async function readPersistedState(): Promise<PremiumState> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREMIUM_STATE };
    return normalizePremiumState(JSON.parse(raw));
  } catch (error) {
    console.error("[PremiumStore] Failed to read persisted state:", error);
    return { ...DEFAULT_PREMIUM_STATE };
  }
}

function buildActiveLocalState(source: PremiumState["source"], trialEndsAt: number | null = null): PremiumState {
  const now = Date.now();
  return {
    isActive: true,
    source: source ?? "code",
    startedAt: now,
    expiresAt: source === "trial" ? trialEndsAt : null,
    trialEndsAt: source === "trial" ? trialEndsAt : null,
    features: [...ALL_PREMIUM_FEATURES],
    lastSync: now,
  };
}

async function applyStoreState(state: PremiumState): Promise<PremiumState> {
  const normalized = normalizePremiumState(state);
  await persistState(normalized);
  usePremiumStore.setState({
    state: normalized,
    hydrated: true,
    syncError: null,
  });
  return normalized;
}

export const usePremiumStore = create<PremiumStoreState>((set, get) => ({
  state: { ...DEFAULT_PREMIUM_STATE },
  hydrated: false,
  loading: false,
  syncError: null,

  hydrate: async () => {
    if (get().hydrated || get().loading) return;
    set({ loading: true, syncError: null });
    const persisted = await readPersistedState();
    set({
      state: persisted,
      hydrated: true,
      loading: false,
    });
  },

  hasFeature: (featureName) => {
    if (PREMIUM_FREE_FOR_NOW) return true;
    const { state } = get();
    if (!state.isActive) return false;
    return state.features.includes(featureName);
  },

  syncWithServer: async () => {
    const current = get().state;
    set({ loading: true, syncError: null });
    try {
      const serverState = await syncPremiumState(current);
      const next = normalizePremiumState({
        ...serverState,
        lastSync: Date.now(),
      });
      await persistState(next);
      set({
        state: next,
        hydrated: true,
        loading: false,
      });
      return next;
    } catch (error) {
      const message = toMessage(error);
      set({
        loading: false,
        hydrated: true,
        syncError: message,
      });
      return get().state;
    }
  },

  activateCode: async (code: string) => {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      throw new Error("Activation code is required.");
    }

    set({ loading: true, syncError: null });
    try {
      const serverState = await activatePremium({ code: normalizedCode });
      const next = normalizePremiumState({
        ...serverState,
        lastSync: Date.now(),
      });
      await persistState(next);
      set({
        state: next,
        hydrated: true,
        loading: false,
      });
      return next;
    } catch (error) {
      const message = toMessage(error);
      set({
        loading: false,
        hydrated: true,
        syncError: message,
      });
      throw new Error(message);
    }
  },

  restorePurchases: async () => {
    set({ loading: true, syncError: null });
    try {
      const serverState = await restorePremium({});
      const next = normalizePremiumState({
        ...serverState,
        lastSync: Date.now(),
      });
      await persistState(next);
      set({
        state: next,
        hydrated: true,
        loading: false,
      });
      return next;
    } catch (error) {
      const message = toMessage(error);
      set({
        loading: false,
        hydrated: true,
        syncError: message,
      });
      throw new Error(message);
    }
  },

  clearPremium: async () => {
    const next: PremiumState = {
      ...DEFAULT_PREMIUM_STATE,
      lastSync: Date.now(),
    };
    await persistState(next);
    set({
      state: next,
      hydrated: true,
      syncError: null,
    });
    return next;
  },
}));

export async function getPremiumState(): Promise<PremiumState> {
  const store = usePremiumStore.getState();
  if (!store.hydrated) {
    await store.hydrate();
  }
  return usePremiumStore.getState().state;
}

export async function startTrial(days = 7): Promise<PremiumState> {
  const now = Date.now();
  const trialEndsAt = now + days * 24 * 60 * 60 * 1000;
  const next = buildActiveLocalState("trial", trialEndsAt);
  return applyStoreState(next);
}

export async function setPremiumActive(source: PremiumSource = "code"): Promise<PremiumState> {
  if (source === "none" || source === null) {
    return clearPremium();
  }
  const safeSource = toSource(source) ?? "code";
  const next = buildActiveLocalState(safeSource, null);
  return applyStoreState(next);
}

export async function clearPremium(): Promise<PremiumState> {
  const next: PremiumState = {
    ...DEFAULT_PREMIUM_STATE,
    lastSync: Date.now(),
  };
  return applyStoreState(next);
}
