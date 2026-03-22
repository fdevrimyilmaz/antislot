import * as SecureStore from "@/lib/secureStoreCompat";

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
export const USERNAME_MAX_LENGTH = 32;

export function normalizeUsername(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, USERNAME_MAX_LENGTH);
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const stored = await SecureStore.getItemAsync(PROFILE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserProfile;
  } catch (error) {
    console.error("Profil yuklenirken hata:", error);
    return null;
  }
}

export async function getStoredUsername(): Promise<string | null> {
  const profile = await getProfile();
  const normalized = normalizeUsername(profile?.username ?? "");
  return normalized.length > 0 ? normalized : null;
}

export async function saveProfile(
  profile: Omit<UserProfile, "createdAt" | "updatedAt">
): Promise<UserProfile> {
  const normalizedUsername = normalizeUsername(profile.username);
  if (!normalizedUsername) {
    throw new Error("username-required");
  }

  const now = Date.now();
  const existing = await getProfile();
  const payload: UserProfile = {
    ...profile,
    username: normalizedUsername,
    age: profile.age.trim(),
    gender: profile.gender.trim(),
    ethnicity: profile.ethnicity.trim(),
    countryState: profile.countryState.trim(),
    referral: profile.referral.trim(),
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
