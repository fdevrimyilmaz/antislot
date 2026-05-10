import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

type StorageBackendType = "secure" | "standard";

type StorageOptions = {
  type?: StorageBackendType;
};

type StorageErrorPayload = {
  type: "read" | "write" | "remove";
  key: string;
  errorType: string;
};

type StorageStatus = {
  lastErrorAt: number | null;
  lastBackendUsed: "secure" | "async" | "memory";
  lastErrorCode: string | null;
  usingFallback: boolean;
};

export const STORAGE_KEYS = {
  USER_PROFILE: "antislot_user_profile",
  USER_ADDICTIONS: "antislot_user_addictions",
  EMERGENCY_CONTACTS: "antislot_emergency_contacts",
  PROGRESS: "antislot_progress",
  PROGRESS_EXTRAS: "antislot_progress_extras",
  SESSIONS_COMPLETED: "antislot_sessions_completed",
  URGE_LOGS: "antislot_urge_logs",
  URGE_PATTERNS: "antislot_urge_patterns",
  URGE_SETTINGS: "antislot_urge_settings",
  URGE_FEEDBACK: "antislot_urge_feedback",
  URGE_ACTIVE: "antislot_urge_active",
  URGE_LAST_SYNC_AT: "antislot_urge_last_sync_at",
  INTERVENTION_HISTORY: "antislot_intervention_history",
  ONBOARDING_DONE: "antislot_onboarding_done",
  WELCOME_SHOWN: "antislot_welcome_shown",
  THEME: "antislot_theme",
  LANGUAGE: "antislot_language",
  BLOCKLIST_DOMAINS: "antislot_blocklist_domains",
  BLOCKLIST_PATTERNS: "antislot_blocklist_patterns",
  BLOCKER_HARDENING_POLICY: "antislot_blocker_hardening_policy",
  SESSION_THERAPY: "antislot_sessions_therapy",
  SESSION_MINDFULNESS: "antislot_sessions_mindfulness",
  PREMIUM_STATE: "antislot_premium_state",
  SMS_FILTER_STATS: "antislot_sms_filter_stats",
  SMS_FILTER_SETTINGS: "antislot_sms_filter_settings",
  PRIVACY_PREFERENCES: "antislot_privacy_preferences",
  PRIVACY_LAST_TELEMETRY_AT: "antislot_privacy_last_telemetry_at",
  MONEY_PROTECTION_STATE: "antislot_money_protection_state",
  MONEY_PROTECTION_LAST_SYNC_AT: "antislot_money_protection_last_sync_at",
  ACCESSIBILITY_PREFERENCES: "antislot_accessibility_preferences",
  ACCOUNTABILITY_POLICY: "antislot_accountability_policy",
  NOTIFICATION_PREFS: "antislot_notification_prefs",
  NOTIFICATION_SCHEDULED_IDS: "antislot_notification_scheduled_ids",
  LAST_APP_OPENED_AT: "antislot_last_app_opened_at",
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS] | string;

const memoryFallback = new Map<string, string>();

let status: StorageStatus = {
  lastErrorAt: null,
  lastBackendUsed: "secure",
  lastErrorCode: null,
  usingFallback: false,
};

let onStorageError: ((payload: StorageErrorPayload) => void) | null = null;

function markStorageError(type: StorageErrorPayload["type"], key: string, error: unknown): void {
  const errorType =
    error instanceof Error ? error.constructor.name : typeof error;

  status = {
    ...status,
    lastErrorAt: Date.now(),
    lastErrorCode: errorType,
    usingFallback: true,
  };

  void import("@/services/monitoring")
    .then((mod) => {
      if (typeof mod.reportStorageError === "function") {
        mod.reportStorageError({ type, key, errorType });
      }
    })
    .catch(() => {});

  if (onStorageError) {
    onStorageError({ type, key, errorType });
  }
}

class SecureStoreBackend {
  async getItem(key: string): Promise<string | null> {
    try {
      status = { ...status, lastBackendUsed: "secure" };
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      markStorageError("read", key, error);
      status = { ...status, lastBackendUsed: "memory" };
      return memoryFallback.get(key) ?? null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      status = { ...status, lastBackendUsed: "secure" };
      await SecureStore.setItemAsync(key, value);
      memoryFallback.set(key, value);
    } catch (error) {
      markStorageError("write", key, error);
      status = { ...status, lastBackendUsed: "memory" };
      memoryFallback.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      status = { ...status, lastBackendUsed: "secure" };
      await SecureStore.deleteItemAsync(key);
      memoryFallback.delete(key);
    } catch (error) {
      markStorageError("remove", key, error);
      status = { ...status, lastBackendUsed: "memory" };
      memoryFallback.delete(key);
    }
  }

  async getAllKeys(): Promise<string[]> {
    return [];
  }

  async clear(): Promise<void> {
    throw new Error("SecureStore.clear() is not supported for safety reasons");
  }
}

class AsyncStorageBackend {
  async getItem(key: string): Promise<string | null> {
    try {
      status = { ...status, lastBackendUsed: "async" };
      return await AsyncStorage.getItem(key);
    } catch (error) {
      markStorageError("read", key, error);
      status = { ...status, lastBackendUsed: "memory" };
      return memoryFallback.get(key) ?? null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      status = { ...status, lastBackendUsed: "async" };
      await AsyncStorage.setItem(key, value);
      memoryFallback.set(key, value);
    } catch (error) {
      markStorageError("write", key, error);
      status = { ...status, lastBackendUsed: "memory" };
      memoryFallback.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      status = { ...status, lastBackendUsed: "async" };
      await AsyncStorage.removeItem(key);
      memoryFallback.delete(key);
    } catch (error) {
      markStorageError("remove", key, error);
      status = { ...status, lastBackendUsed: "memory" };
      memoryFallback.delete(key);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch {
      return [];
    }
  }

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
}

const resolveBackend = (type: StorageBackendType) =>
  type === "secure" ? new SecureStoreBackend() : new AsyncStorageBackend();

export const storage = {
  async get<T = unknown>(
    key: StorageKey,
    options: StorageOptions = {}
  ): Promise<T | null> {
    const backend = resolveBackend(options.type ?? "standard");
    const raw = await backend.getItem(String(key));

    if (raw == null) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  },

  async set(
    key: StorageKey,
    value: unknown,
    options: StorageOptions = {}
  ): Promise<void> {
    const backend = resolveBackend(options.type ?? "standard");
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    await backend.setItem(String(key), raw);
  },

  async remove(
    key: StorageKey,
    options: StorageOptions = {}
  ): Promise<void> {
    const backend = resolveBackend(options.type ?? "standard");
    await backend.removeItem(String(key));
  },

  async getAllKeys(): Promise<string[]> {
    const backend = new AsyncStorageBackend();
    return backend.getAllKeys();
  },

  async clear(): Promise<void> {
    const backend = new AsyncStorageBackend();
    await backend.clear();
  },
};

export const getJSON = async <T = unknown>(key: StorageKey): Promise<T | null> =>
  storage.get<T>(key, { type: "secure" });

export const setJSON = async (key: StorageKey, value: unknown): Promise<void> =>
  storage.set(key, value, { type: "secure" });

export const remove = async (key: StorageKey): Promise<void> =>
  storage.remove(key, { type: "secure" });

export const getStorageStatus = (): StorageStatus => ({ ...status });

export const isUsingStorageFallback = (): boolean => status.usingFallback;

export const setStorageErrorCallback = (
  callback: ((payload: StorageErrorPayload) => void) | null
): void => {
  onStorageError = callback;
};
