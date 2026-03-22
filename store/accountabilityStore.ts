import { create } from "zustand";

import { storage, STORAGE_KEYS } from "@/lib/storage";

export type AccountabilityRiskLevel = "warning" | "high" | "critical";

type PersistedAccountabilityPolicy = {
  partnerName: string;
  partnerPhone: string;
  notifyOnHighRisk: boolean;
  notifyOnCriticalRisk: boolean;
  proactiveInterventionEnabled: boolean;
  alertCooldownMinutes: number;
  lastAlertAt: number | null;
};

type AccountabilityStoreState = PersistedAccountabilityPolicy & {
  hydrated: boolean;
  hasPartner: boolean;
  hydrate: () => Promise<void>;
  setPartner: (name: string, phone: string) => Promise<void>;
  clearPartner: () => Promise<void>;
  updatePolicy: (partial: Partial<PersistedAccountabilityPolicy>) => Promise<void>;
  shouldNotifyForRisk: (riskLevel: AccountabilityRiskLevel) => boolean;
  canSendAlert: (now?: number) => boolean;
  recordAlert: (timestamp?: number) => Promise<void>;
  reset: () => Promise<void>;
};

const DEFAULT_POLICY: PersistedAccountabilityPolicy = {
  partnerName: "",
  partnerPhone: "",
  notifyOnHighRisk: true,
  notifyOnCriticalRisk: true,
  proactiveInterventionEnabled: true,
  alertCooldownMinutes: 20,
  lastAlertAt: null,
};

const MAX_COOLDOWN_MINUTES = 240;

function normalizeName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 60);
}

function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  const sanitized = value
    .trim()
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "");

  return sanitized.slice(0, 22);
}

function normalizeBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizePositiveInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  return Math.min(max, Math.max(min, rounded));
}

function normalizeTimestamp(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function normalizePersistedPolicy(rawValue: unknown): PersistedAccountabilityPolicy {
  const raw =
    rawValue && typeof rawValue === "object"
      ? (rawValue as Partial<PersistedAccountabilityPolicy>)
      : {};

  return {
    partnerName: normalizeName(raw.partnerName),
    partnerPhone: normalizePhone(raw.partnerPhone),
    notifyOnHighRisk: normalizeBool(raw.notifyOnHighRisk, DEFAULT_POLICY.notifyOnHighRisk),
    notifyOnCriticalRisk: normalizeBool(raw.notifyOnCriticalRisk, DEFAULT_POLICY.notifyOnCriticalRisk),
    proactiveInterventionEnabled: normalizeBool(
      raw.proactiveInterventionEnabled,
      DEFAULT_POLICY.proactiveInterventionEnabled
    ),
    alertCooldownMinutes: normalizePositiveInt(
      raw.alertCooldownMinutes,
      DEFAULT_POLICY.alertCooldownMinutes,
      1,
      MAX_COOLDOWN_MINUTES
    ),
    lastAlertAt: normalizeTimestamp(raw.lastAlertAt),
  };
}

function toPersistedState(state: AccountabilityStoreState): PersistedAccountabilityPolicy {
  return {
    partnerName: state.partnerName,
    partnerPhone: state.partnerPhone,
    notifyOnHighRisk: state.notifyOnHighRisk,
    notifyOnCriticalRisk: state.notifyOnCriticalRisk,
    proactiveInterventionEnabled: state.proactiveInterventionEnabled,
    alertCooldownMinutes: state.alertCooldownMinutes,
    lastAlertAt: state.lastAlertAt,
  };
}

function hasPartner(state: Pick<PersistedAccountabilityPolicy, "partnerPhone">): boolean {
  return state.partnerPhone.trim().length >= 6;
}

async function persistPolicy(policy: PersistedAccountabilityPolicy): Promise<void> {
  await storage.set(STORAGE_KEYS.ACCOUNTABILITY_POLICY, policy, { type: "secure" });
}

export const useAccountabilityStore = create<AccountabilityStoreState>((set, get) => ({
  ...DEFAULT_POLICY,
  hydrated: false,
  hasPartner: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const stored = await storage.get<PersistedAccountabilityPolicy>(STORAGE_KEYS.ACCOUNTABILITY_POLICY, {
        type: "secure",
      });
      const normalized = normalizePersistedPolicy(stored);
      set({
        ...normalized,
        hydrated: true,
        hasPartner: hasPartner(normalized),
      });
    } catch (error) {
      console.error("[AccountabilityStore] Hydration error:", error);
      set({
        ...DEFAULT_POLICY,
        hydrated: true,
        hasPartner: false,
      });
    }
  },

  setPartner: async (name, phone) => {
    const state = get();
    const next: PersistedAccountabilityPolicy = {
      ...toPersistedState(state),
      partnerName: normalizeName(name),
      partnerPhone: normalizePhone(phone),
    };
    set({
      ...next,
      hasPartner: hasPartner(next),
    });
    await persistPolicy(next);
  },

  clearPartner: async () => {
    const state = get();
    const next: PersistedAccountabilityPolicy = {
      ...toPersistedState(state),
      partnerName: "",
      partnerPhone: "",
      lastAlertAt: null,
    };
    set({
      ...next,
      hasPartner: false,
    });
    await persistPolicy(next);
  },

  updatePolicy: async (partial) => {
    const state = get();
    const merged = {
      ...toPersistedState(state),
      ...partial,
    };
    const next = normalizePersistedPolicy(merged);
    set({
      ...next,
      hasPartner: hasPartner(next),
    });
    await persistPolicy(next);
  },

  shouldNotifyForRisk: (riskLevel) => {
    const state = get();
    if (!state.hasPartner) return false;
    if (riskLevel === "critical") return state.notifyOnCriticalRisk;
    if (riskLevel === "high") return state.notifyOnHighRisk;
    return false;
  },

  canSendAlert: (now = Date.now()) => {
    const state = get();
    if (!state.hasPartner) return false;
    if (!state.lastAlertAt) return true;
    return now - state.lastAlertAt >= state.alertCooldownMinutes * 60 * 1000;
  },

  recordAlert: async (timestamp = Date.now()) => {
    const state = get();
    const next: PersistedAccountabilityPolicy = {
      ...toPersistedState(state),
      lastAlertAt: Math.max(1, Math.trunc(timestamp)),
    };
    set({
      ...next,
      hasPartner: hasPartner(next),
    });
    await persistPolicy(next);
  },

  reset: async () => {
    set({
      ...DEFAULT_POLICY,
      hydrated: true,
      hasPartner: false,
    });
    await storage.remove(STORAGE_KEYS.ACCOUNTABILITY_POLICY, { type: "secure" });
  },
}));
