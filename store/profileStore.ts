import * as SecureStore from "expo-secure-store";

export interface UserProfile {
  username: string;
  age: string;
  gender: string;
  ethnicity: string;
  countryState: string;
  referral: string;
  createdAt: number;
  updatedAt: number;
}

const PROFILE_KEY = "antislot_user_profile";

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const stored = await SecureStore.getItemAsync(PROFILE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserProfile;
  } catch (error) {
    console.error("Profil yüklenirken hata:", error);
    return null;
  }
}

export async function saveProfile(profile: Omit<UserProfile, "createdAt" | "updatedAt">): Promise<UserProfile> {
  const now = Date.now();
  const existing = await getProfile();
  const payload: UserProfile = {
    ...profile,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  try {
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(payload));
    return payload;
  } catch (error) {
    console.error("Profil kaydedilirken hata:", error);
    throw error;
  }
}

export async function clearProfile(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
  } catch (error) {
    console.error("Profil temizlenirken hata:", error);
  }
}
