import * as SecureStore from "expo-secure-store";

/**
 * Crisis plan — user fills in personal answers ahead of time so the
 * decisions are pre-made when an urge actually arrives. Gambling Therapy
 * pattern: 3-line plan ready in the pocket.
 */

const KEY = "antislot_crisis_plan";

export type CrisisPlan = {
  warningSigns: string[]; // "kayıp telafi düşüncesi", "gece geç oturma"
  highRiskSituations: string[]; // "maaş günü", "iş stresi yoğun gün"
  copingActions: string[]; // "60 sn nefes", "yürüyüşe çık"
  safePersonName?: string;
  safePersonPhone?: string;
  safeWords?: string;
  updatedAt: number;
};

const EMPTY: CrisisPlan = {
  warningSigns: [],
  highRiskSituations: [],
  copingActions: [],
  updatedAt: 0,
};

export async function getCrisisPlan(): Promise<CrisisPlan> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CrisisPlan;
    return {
      warningSigns: Array.isArray(parsed.warningSigns) ? parsed.warningSigns : [],
      highRiskSituations: Array.isArray(parsed.highRiskSituations)
        ? parsed.highRiskSituations
        : [],
      copingActions: Array.isArray(parsed.copingActions) ? parsed.copingActions : [],
      safePersonName: parsed.safePersonName,
      safePersonPhone: parsed.safePersonPhone,
      safeWords: parsed.safeWords,
      updatedAt: parsed.updatedAt ?? 0,
    };
  } catch {
    return EMPTY;
  }
}

export async function saveCrisisPlan(plan: CrisisPlan): Promise<void> {
  const next: CrisisPlan = { ...plan, updatedAt: Date.now() };
  await SecureStore.setItemAsync(KEY, JSON.stringify(next));
}
