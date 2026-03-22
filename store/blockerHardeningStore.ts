import { create } from "zustand";

import { storage, STORAGE_KEYS } from "@/lib/storage";

export type BlockerHardeningPolicy = {
  strictMode: boolean;
  blockDoh: boolean;
  blockDot: boolean;
  blockQuic: boolean;
  lockdownVpn: boolean;
  tamperAlerts: boolean;
};

type BlockerHardeningStoreState = BlockerHardeningPolicy & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updatePolicy: (partial: Partial<BlockerHardeningPolicy>) => Promise<void>;
  reset: () => Promise<void>;
};

const DEFAULT_POLICY: BlockerHardeningPolicy = {
  strictMode: true,
  blockDoh: true,
  blockDot: true,
  blockQuic: true,
  lockdownVpn: false,
  tamperAlerts: true,
};

function normalizeBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizePolicy(rawValue: unknown): BlockerHardeningPolicy {
  const raw = rawValue && typeof rawValue === "object" ? (rawValue as Partial<BlockerHardeningPolicy>) : {};
  return {
    strictMode: normalizeBool(raw.strictMode, DEFAULT_POLICY.strictMode),
    blockDoh: normalizeBool(raw.blockDoh, DEFAULT_POLICY.blockDoh),
    blockDot: normalizeBool(raw.blockDot, DEFAULT_POLICY.blockDot),
    blockQuic: normalizeBool(raw.blockQuic, DEFAULT_POLICY.blockQuic),
    lockdownVpn: normalizeBool(raw.lockdownVpn, DEFAULT_POLICY.lockdownVpn),
    tamperAlerts: normalizeBool(raw.tamperAlerts, DEFAULT_POLICY.tamperAlerts),
  };
}

async function persistPolicy(policy: BlockerHardeningPolicy): Promise<void> {
  await storage.set(STORAGE_KEYS.BLOCKER_HARDENING_POLICY, policy, { type: "standard" });
}

export function computeBlockerHardeningScore(params: {
  policy: BlockerHardeningPolicy;
  protectionEnabled: boolean;
  lastSyncStale: boolean;
}): number {
  const { policy, protectionEnabled, lastSyncStale } = params;
  let score = 0;

  if (protectionEnabled) score += 30;
  if (policy.strictMode) score += 20;
  if (policy.blockDoh) score += 12;
  if (policy.blockDot) score += 8;
  if (policy.blockQuic) score += 10;
  if (policy.lockdownVpn) score += 12;
  if (policy.tamperAlerts) score += 8;
  if (lastSyncStale) score -= 10;

  return Math.max(0, Math.min(100, score));
}

export const useBlockerHardeningStore = create<BlockerHardeningStoreState>((set, get) => ({
  ...DEFAULT_POLICY,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const stored = await storage.get<BlockerHardeningPolicy>(STORAGE_KEYS.BLOCKER_HARDENING_POLICY, {
        type: "standard",
      });
      const normalized = normalizePolicy(stored);
      set({
        ...normalized,
        hydrated: true,
      });
    } catch (error) {
      console.error("[BlockerHardeningStore] Hydration error:", error);
      set({
        ...DEFAULT_POLICY,
        hydrated: true,
      });
    }
  },

  updatePolicy: async (partial) => {
    const current = get();
    const next = normalizePolicy({
      strictMode: current.strictMode,
      blockDoh: current.blockDoh,
      blockDot: current.blockDot,
      blockQuic: current.blockQuic,
      lockdownVpn: current.lockdownVpn,
      tamperAlerts: current.tamperAlerts,
      ...partial,
    });
    set(next);
    await persistPolicy(next);
  },

  reset: async () => {
    set({
      ...DEFAULT_POLICY,
      hydrated: true,
    });
    await storage.remove(STORAGE_KEYS.BLOCKER_HARDENING_POLICY, { type: "standard" });
  },
}));
