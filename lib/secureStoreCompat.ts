import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoSecureStore from "expo-secure-store";

export type SecureStoreOptions = ExpoSecureStore.SecureStoreOptions;

const memoryFallback = new Map<string, string>();
let warnedUnavailable = false;

function warnOnce(operation: "get" | "set" | "delete", key: string, error: unknown) {
  if (warnedUnavailable) {
    return;
  }
  warnedUnavailable = true;
  console.warn(
    `[SecureStoreCompat] SecureStore failed during ${operation} for key "${key}". Falling back to AsyncStorage/memory.`,
    error
  );
}

async function fallbackGetItem(key: string): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      memoryFallback.set(key, value);
    }
    return value;
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

async function fallbackSetItem(key: string, value: string): Promise<void> {
  memoryFallback.set(key, value);
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // AsyncStorage can be unavailable in some environments; memory fallback remains.
  }
}

async function fallbackDeleteItem(key: string): Promise<void> {
  memoryFallback.delete(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore fallback delete errors.
  }
}

export async function isAvailableAsync(): Promise<boolean> {
  try {
    if (typeof ExpoSecureStore.isAvailableAsync !== "function") {
      return false;
    }
    return await ExpoSecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getItemAsync(
  key: string,
  options?: SecureStoreOptions
): Promise<string | null> {
  try {
    if (typeof ExpoSecureStore.getItemAsync === "function") {
      if (options === undefined) {
        return await ExpoSecureStore.getItemAsync(key);
      }
      return await ExpoSecureStore.getItemAsync(key, options);
    }
  } catch (error) {
    warnOnce("get", key, error);
  }
  return fallbackGetItem(key);
}

export async function setItemAsync(
  key: string,
  value: string,
  options?: SecureStoreOptions
): Promise<void> {
  try {
    if (typeof ExpoSecureStore.setItemAsync === "function") {
      if (options === undefined) {
        await ExpoSecureStore.setItemAsync(key, value);
      } else {
        await ExpoSecureStore.setItemAsync(key, value, options);
      }
      memoryFallback.set(key, value);
      return;
    }
  } catch (error) {
    warnOnce("set", key, error);
  }
  await fallbackSetItem(key, value);
}

export async function deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void> {
  try {
    if (typeof ExpoSecureStore.deleteItemAsync === "function") {
      if (options === undefined) {
        await ExpoSecureStore.deleteItemAsync(key);
      } else {
        await ExpoSecureStore.deleteItemAsync(key, options);
      }
      memoryFallback.delete(key);
      return;
    }
  } catch (error) {
    warnOnce("delete", key, error);
  }
  await fallbackDeleteItem(key);
}

export function canUseBiometricAuthentication(): boolean {
  try {
    if (typeof ExpoSecureStore.canUseBiometricAuthentication !== "function") {
      return false;
    }
    return ExpoSecureStore.canUseBiometricAuthentication();
  } catch {
    return false;
  }
}

export const AFTER_FIRST_UNLOCK = ExpoSecureStore.AFTER_FIRST_UNLOCK;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = ExpoSecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
export const ALWAYS = ExpoSecureStore.ALWAYS;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = ExpoSecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY;
export const ALWAYS_THIS_DEVICE_ONLY = ExpoSecureStore.ALWAYS_THIS_DEVICE_ONLY;
export const WHEN_UNLOCKED = ExpoSecureStore.WHEN_UNLOCKED;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = ExpoSecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
