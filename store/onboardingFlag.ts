import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

let secureStoreAvailable: boolean | null = null;

async function isSecureStoreAvailable() {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }

  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }

  return secureStoreAvailable;
}

async function runWithFallback<T>(secureFn: () => Promise<T>, fallbackFn: () => Promise<T>) {
  if (await isSecureStoreAvailable()) {
    try {
      return await secureFn();
    } catch {
      secureStoreAvailable = false;
      return await fallbackFn();
    }
  }

  return await fallbackFn();
}

const KEY = "antislot_onboarding_done";
const WELCOME_SHOWN_KEY = "antislot_welcome_shown";

export async function setOnboardingDone() {
  await runWithFallback(
    () => SecureStore.setItemAsync(KEY, "true"),
    () => AsyncStorage.setItem(KEY, "true")
  );
}

export async function isOnboardingDone() {
  const v = await runWithFallback(
    () => SecureStore.getItemAsync(KEY),
    () => AsyncStorage.getItem(KEY)
  );
  return v === "true";
}

export async function resetOnboardingDone() {
  await runWithFallback(
    () => SecureStore.deleteItemAsync(KEY),
    () => AsyncStorage.removeItem(KEY)
  );
}

export async function hasWelcomeBeenShown() {
  const v = await runWithFallback(
    () => SecureStore.getItemAsync(WELCOME_SHOWN_KEY),
    () => AsyncStorage.getItem(WELCOME_SHOWN_KEY)
  );
  return v === "true";
}

export async function setWelcomeShown() {
  await runWithFallback(
    () => SecureStore.setItemAsync(WELCOME_SHOWN_KEY, "true"),
    () => AsyncStorage.setItem(WELCOME_SHOWN_KEY, "true")
  );
}

export async function resetWelcomeShown() {
  await runWithFallback(
    () => SecureStore.deleteItemAsync(WELCOME_SHOWN_KEY),
    () => AsyncStorage.removeItem(WELCOME_SHOWN_KEY)
  );
}
