import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

/**
 * Permission state for sharing AI chat input with our backend and the
 * upstream LLM provider (Google Gemini). The user must explicitly grant
 * this before any /chat call is made.
 */

const STORE_KEY = "antislot_ai_consent_v1";

export type AiConsentStatus = "unknown" | "granted" | "denied";

type Persisted = {
  status: AiConsentStatus;
  decidedAt: number | null;
};

const DEFAULTS: Persisted = {
  status: "unknown",
  decidedAt: null,
};

type StoreShape = {
  hydrated: boolean;
  status: AiConsentStatus;
  decidedAt: number | null;
  hydrate: () => Promise<void>;
  grant: () => Promise<void>;
  deny: () => Promise<void>;
  revoke: () => Promise<void>;
};

function sanitize(input: unknown): Persisted {
  if (!input || typeof input !== "object") return DEFAULTS;
  const i = input as Partial<Persisted>;
  const status: AiConsentStatus =
    i.status === "granted" || i.status === "denied" ? i.status : "unknown";
  const decidedAt =
    typeof i.decidedAt === "number" && Number.isFinite(i.decidedAt) ? i.decidedAt : null;
  return { status, decidedAt };
}

async function persist(value: Persisted) {
  try {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(value));
  } catch {}
}

export const useAiConsentStore = create<StoreShape>((set) => ({
  hydrated: false,
  status: DEFAULTS.status,
  decidedAt: DEFAULTS.decidedAt,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (!raw) {
        set({ hydrated: true, status: DEFAULTS.status, decidedAt: DEFAULTS.decidedAt });
        return;
      }
      const parsed = sanitize(JSON.parse(raw));
      set({ hydrated: true, status: parsed.status, decidedAt: parsed.decidedAt });
    } catch {
      set({ hydrated: true, status: DEFAULTS.status, decidedAt: DEFAULTS.decidedAt });
    }
  },
  grant: async () => {
    const next: Persisted = { status: "granted", decidedAt: Date.now() };
    await persist(next);
    set({ status: next.status, decidedAt: next.decidedAt });
  },
  deny: async () => {
    const next: Persisted = { status: "denied", decidedAt: Date.now() };
    await persist(next);
    set({ status: next.status, decidedAt: next.decidedAt });
  },
  revoke: async () => {
    const next: Persisted = { status: "denied", decidedAt: Date.now() };
    await persist(next);
    set({ status: next.status, decidedAt: next.decidedAt });
  },
}));

export function isAiConsentGranted(status: AiConsentStatus): boolean {
  return status === "granted";
}
