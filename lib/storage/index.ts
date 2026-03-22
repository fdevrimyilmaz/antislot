/**
 * Storage Abstraction Layer
 * 
 * Provides a unified interface for secure and non-secure storage.
 * Abstracts away the differences between SecureStore and AsyncStorage.
 * 
 * Design principles:
 * - Offline-first: All data stored locally
 * - Privacy-first: Sensitive data uses SecureStore
 * - Sync-ready: Structure supports future cloud sync
 * - Migration-ready: Version-aware storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export type StorageType = 'secure' | 'standard';

// In-memory fallback for when SecureStore is unavailable
const memoryStore = new Map<string, string>();

// Track storage status for diagnostics
interface StorageStatus {
  lastErrorAt: number | null;
  lastBackendUsed: 'secure' | 'async' | 'memory';
  lastErrorCode: string | null;
  usingFallback: boolean;
}

let storageStatus: StorageStatus = {
  lastErrorAt: null,
  lastBackendUsed: 'secure',
  lastErrorCode: null,
  usingFallback: false,
};

export function getStorageStatus(): StorageStatus {
  return { ...storageStatus };
}

export function isUsingStorageFallback(): boolean {
  return storageStatus.usingFallback;
}

// Telemetry hook for storage errors (no PII)
type StorageErrorCallback = (error: { type: 'read' | 'write' | 'remove'; key: string; errorType: string }) => void;
let storageErrorCallback: StorageErrorCallback | null = null;

export function setStorageErrorCallback(callback: StorageErrorCallback | null) {
  storageErrorCallback = callback;
}

function reportStorageError(type: 'read' | 'write' | 'remove', key: string, error: unknown) {
  const errorType = error instanceof Error ? error.constructor.name : typeof error;
  storageStatus.usingFallback = true;
  
  // Try to import monitoring service (may not be available)
  try {
    const { reportStorageError: reportToMonitoring } = require('@/services/monitoring');
    reportToMonitoring({ type, key, errorType });
  } catch {
    // Monitoring not available, use callback if set
    if (storageErrorCallback) {
      storageErrorCallback({ type, key, errorType });
    }
  }
}

export interface StorageOptions {
  type?: StorageType;
  encrypt?: boolean; // Future: encryption layer
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  clear(): Promise<void>;
}

class SecureStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      storageStatus.lastBackendUsed = 'secure';
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      reportStorageError('read', key, error);
      console.warn(`[Storage] SecureStore unavailable for ${key}, using in-memory fallback`);
      // Fallback to in-memory storage
      return memoryStore.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      storageStatus.lastBackendUsed = 'secure';
      await SecureStore.setItemAsync(key, value);
      // Also store in memory as backup
      memoryStore.set(key, value);
    } catch (error) {
      reportStorageError('write', key, error);
      console.warn(`[Storage] SecureStore unavailable for ${key}, using in-memory fallback`);
      // Fallback to in-memory storage - don't throw, allow app to continue
      memoryStore.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      memoryStore.delete(key);
    } catch (error) {
      reportStorageError('remove', key, error);
      console.warn(`[Storage] SecureStore unavailable for ${key}, using in-memory fallback`);
      // Fallback to in-memory storage
      memoryStore.delete(key);
    }
  }

  async getAllKeys(): Promise<string[]> {
    // SecureStore doesn't support getAllKeys
    // Return empty array - this is a limitation we accept
    return [];
  }

  async clear(): Promise<void> {
    // SecureStore doesn't support clear
    // This is intentional - we don't want to accidentally clear all secure data
    throw new Error('SecureStore.clear() is not supported for safety reasons');
  }
}

class StandardStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      storageStatus.lastBackendUsed = 'async';
      return await AsyncStorage.getItem(key);
    } catch (error) {
      reportStorageError('read', key, error);
      console.warn(`[Storage] AsyncStorage unavailable for ${key}, using in-memory fallback`);
      // Fallback to in-memory storage
      return memoryStore.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      storageStatus.lastBackendUsed = 'async';
      await AsyncStorage.setItem(key, value);
      // Also store in memory as backup
      memoryStore.set(key, value);
    } catch (error) {
      reportStorageError('write', key, error);
      console.warn(`[Storage] AsyncStorage unavailable for ${key}, using in-memory fallback`);
      // Fallback to in-memory storage - don't throw, allow app to continue
      memoryStore.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      memoryStore.delete(key);
    } catch (error) {
      reportStorageError('remove', key, error);
      console.warn(`[Storage] AsyncStorage unavailable for ${key}, using in-memory fallback`);
      // Fallback to in-memory storage
      memoryStore.delete(key);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error(`[Storage] Error getting all keys:`, error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error(`[Storage] Error clearing storage:`, error);
      throw error;
    }
  }
}

// Storage factory
function getAdapter(type: StorageType): StorageAdapter {
  return type === 'secure' ? new SecureStorageAdapter() : new StandardStorageAdapter();
}

/**
 * Unified Storage API
 */
export const storage = {
  /**
   * Get item from storage
   */
  async get<T = string>(key: string, options: StorageOptions = {}): Promise<T | null> {
    const adapter = getAdapter(options.type || 'standard');
    const value = await adapter.getItem(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      // If parsing fails, return as string (backward compatibility)
      return value as unknown as T;
    }
  },

  /**
   * Set item in storage
   */
  async set<T = string>(key: string, value: T, options: StorageOptions = {}): Promise<void> {
    const adapter = getAdapter(options.type || 'standard');
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await adapter.setItem(key, serialized);
  },

  /**
   * Remove item from storage
   */
  async remove(key: string, options: StorageOptions = {}): Promise<void> {
    const adapter = getAdapter(options.type || 'standard');
    await adapter.removeItem(key);
  },

  /**
   * Get all keys (only works for standard storage)
   */
  async getAllKeys(): Promise<string[]> {
    const adapter = new StandardStorageAdapter();
    return adapter.getAllKeys();
  },

  /**
   * Clear all standard storage (secure storage cannot be cleared)
   */
  async clear(): Promise<void> {
    const adapter = new StandardStorageAdapter();
    await adapter.clear();
  },
};

export { STORAGE_KEYS } from './keys';

/**
 * Privacy-first JSON helpers. Use SecureStore by default.
 * Use AsyncStorage only when secure is unavailable (e.g. web).
 */
export const getJSON = async <T = unknown>(key: string): Promise<T | null> =>
  storage.get<T>(key, { type: 'secure' });

export const setJSON = async <T = unknown>(key: string, value: T): Promise<void> =>
  storage.set(key, value, { type: 'secure' });

export const remove = async (key: string): Promise<void> =>
  storage.remove(key, { type: 'secure' });
