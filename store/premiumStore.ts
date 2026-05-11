import * as SecureStore from "expo-secure-store";

export type PremiumSource = "none" | "code" | "iap";

export type PremiumState = {
  isActive: boolean;
  trialEndsAt: number | null;
  activatedAt: number | null;
  source: PremiumSource;
};

const STORAGE_KEY = "antislot_premium_state";
const DEFAULT_STATE: PremiumState = {
  isActive: false,
  trialEndsAt: null,
  activatedAt: null,
  source: "none",
};

function normalizeState(state: PremiumState): PremiumState {
  if (state.source === "none" || state.source === "code" || state.source === "iap") {
    return state;
  }
  return { ...DEFAULT_STATE };
}

async function saveState(state: PremiumState) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
}

export async function getPremiumState(): Promise<PremiumState> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATE };
    const parsed = { ...DEFAULT_STATE, ...JSON.parse(stored) } as PremiumState;
    const normalized = normalizeState(parsed);
    if (normalized !== parsed) {
      await saveState(normalized);
    }
    return normalized;
  } catch (error) {
    console.error("Premium durumu yüklenirken hata:", error);
    return { ...DEFAULT_STATE };
  }
}

export async function setPremiumActive(source: PremiumSource = "code"): Promise<PremiumState> {
  const now = Date.now();
  const next: PremiumState = {
    isActive: true,
    trialEndsAt: null,
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
