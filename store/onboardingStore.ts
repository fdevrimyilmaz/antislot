import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "antislot_onboarding_answers";

export type OnboardingAnswers = {
  q1?: string[];
  q2?: "yes" | "no";
  q3?: string[];
  q4?: string;
  q5?: string;
  q6?: string[];
  q7?: string;
  q8?: "yes" | "no";
  q9?: string[];
  q10?: string;
};

async function loadAnswers(): Promise<OnboardingAnswers> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Onboarding yanıtları yüklenirken hata:", error);
  }
  return {};
}

let answersCache: OnboardingAnswers | null = null;

export async function getAnswers(): Promise<OnboardingAnswers> {
  if (!answersCache) {
    answersCache = await loadAnswers();
  }
  return answersCache;
}

export async function setAnswer<K extends keyof OnboardingAnswers>(
  key: K,
  value: OnboardingAnswers[K]
): Promise<void> {
  const current = await getAnswers();
  const updated = { ...current, [key]: value };
  answersCache = updated;
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Onboarding yanıtı kaydedilirken hata:", error);
    throw error;
  }
}

export async function resetAnswers(): Promise<void> {
  answersCache = {};
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (error) {
    console.error("Onboarding yanıtları sıfırlanırken hata:", error);
  }
}
