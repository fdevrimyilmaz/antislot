/**
 * Kumar Engelleyici için React Native modülü
 * Android VPN ve iOS Network Extension için köprü
 */

import { NativeModules, Platform } from "react-native";

interface GamblingBlockerInterface {
  startProtection(): Promise<boolean>;
  stopProtection(): Promise<boolean>;
  isProtectionEnabled(): Promise<boolean>;
  syncBlocklist(apiUrl?: string): Promise<boolean>;
}

type NativeBlockerModule = {
  startVpn?: () => Promise<boolean>;
  stopVpn?: () => Promise<boolean>;
  isVpnRunning?: () => Promise<boolean>;
  syncBlocklist?: (apiUrl: string) => Promise<boolean>;
  startFilter?: () => Promise<boolean>;
  stopFilter?: () => Promise<boolean>;
  isFilterEnabled?: () => Promise<boolean>;
};

const { GamblingBlockerModule, VpnModule, NetworkExtensionModule } = NativeModules;

const MODULE_UNAVAILABLE_CODE = "BLOCKER_MODULE_UNAVAILABLE";

function resolveModule(): NativeBlockerModule | null {
  if (Platform.OS === "android") {
    return (VpnModule as NativeBlockerModule) ?? (GamblingBlockerModule as NativeBlockerModule) ?? null;
  }
  if (Platform.OS === "ios") {
    return (NetworkExtensionModule as NativeBlockerModule) ?? (GamblingBlockerModule as NativeBlockerModule) ?? null;
  }
  return null;
}

function getOptionalMethod<T extends keyof NativeBlockerModule>(
  module: NativeBlockerModule | null,
  methodName: T
): NonNullable<NativeBlockerModule[T]> | null {
  const method = module?.[methodName];
  return typeof method === "function" ? (method as NonNullable<NativeBlockerModule[T]>) : null;
}

function getRequiredMethod<T extends keyof NativeBlockerModule>(
  module: NativeBlockerModule | null,
  methodName: T
): NonNullable<NativeBlockerModule[T]> {
  const method = getOptionalMethod(module, methodName);
  if (!method) {
    const error = new Error("Koruma modülü bu cihazda kullanılamıyor.");
    (error as { code?: string }).code = MODULE_UNAVAILABLE_CODE;
    throw error;
  }
  return method;
}

class GamblingBlocker implements GamblingBlockerInterface {
  async startProtection(): Promise<boolean> {
    const module = resolveModule();
    if (Platform.OS === "android") {
      const startVpn = getRequiredMethod(module, "startVpn");
      return startVpn();
    }
    if (Platform.OS === "ios") {
      const startFilter = getRequiredMethod(module, "startFilter");
      return startFilter();
    }
    throw new Error(`Platform ${Platform.OS} desteklenmiyor`);
  }

  async stopProtection(): Promise<boolean> {
    const module = resolveModule();
    if (Platform.OS === "android") {
      const stopVpn = getRequiredMethod(module, "stopVpn");
      return stopVpn();
    }
    if (Platform.OS === "ios") {
      const stopFilter = getRequiredMethod(module, "stopFilter");
      return stopFilter();
    }
    throw new Error(`Platform ${Platform.OS} desteklenmiyor`);
  }

  async isProtectionEnabled(): Promise<boolean> {
    try {
      const module = resolveModule();
      if (Platform.OS === "android") {
        const isVpnRunning = getOptionalMethod(module, "isVpnRunning");
        return isVpnRunning ? await isVpnRunning() : false;
      }
      if (Platform.OS === "ios") {
        const isFilterEnabled = getOptionalMethod(module, "isFilterEnabled");
        return isFilterEnabled ? await isFilterEnabled() : false;
      }
      return false;
    } catch (error) {
      if ((error as { code?: string }).code !== MODULE_UNAVAILABLE_CODE) {
        console.warn("Koruma durumu kontrol edilemedi:", error);
      }
      return false;
    }
  }

  async syncBlocklist(apiUrl: string = "https://api.antislot.app"): Promise<boolean> {
    const module = resolveModule();
    if (Platform.OS === "android") {
      const sync = getOptionalMethod(module, "syncBlocklist");
      if (!sync) return false;
      try {
        return await sync(apiUrl);
      } catch (error) {
        console.warn("Engel listesi senkronize edilemedi:", error);
        return false;
      }
    }
    // iOS, Network Extension üzerinden otomatik senkronize olur
    return true;
  }
}

export default new GamblingBlocker();