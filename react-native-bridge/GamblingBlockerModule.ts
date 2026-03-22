/**
 * Kumar Engelleyici için React Native modülü
 * Android VPN ve iOS Network Extension için köprü
 */

import { NativeModules, Platform } from "react-native";

export type ProtectionStatus = "running" | "stopped" | "error";
export type VpnResult = { status: ProtectionStatus; reason?: string; message?: string };

interface GamblingBlockerInterface {
  startProtection(): Promise<VpnResult>;
  stopProtection(): Promise<VpnResult>;
  isProtectionEnabled(): Promise<boolean>;
  syncBlocklist(apiUrl?: string): Promise<boolean>;
  status(): Promise<ProtectionStatus>;
}

type NativeBlockerModule = {
  startVpn?: () => Promise<string | boolean | { status?: string; reason?: string; message?: string }>;
  stopVpn?: () => Promise<string | boolean | { status?: string; reason?: string; message?: string }>;
  isVpnRunning?: () => Promise<boolean>;
  syncBlocklist?: (apiUrl: string) => Promise<boolean>;
  status?: () => Promise<string>;
  startFilter?: () => Promise<boolean | { ok?: boolean; code?: string; message?: string }>;
  stopFilter?: () => Promise<boolean | { ok?: boolean; code?: string; message?: string }>;
  isFilterEnabled?: () => Promise<boolean>;
};

const { GamblingBlockerModule, VpnModule, NetworkExtensionModule } = NativeModules;

const MODULE_UNAVAILABLE_MESSAGE = "Koruma modülü bu cihazda kullanılamıyor.";

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

function warnUnavailable(action: string) {
  console.warn(`${MODULE_UNAVAILABLE_MESSAGE} (action: ${action})`);
}

function normalizeStatus(value: unknown): ProtectionStatus {
  if (typeof value === "boolean") {
    return value ? "running" : "stopped";
  }
  const text = String(value ?? "").toLowerCase();
  if (text === "running") return "running";
  if (text === "stopped") return "stopped";
  return "error";
}

function normalizeResult(value: unknown, fallback: ProtectionStatus = "error"): VpnResult {
  if (value && typeof value === "object") {
    if ("ok" in (value as { ok?: unknown })) {
      const ok = Boolean((value as { ok?: unknown }).ok);
      const reason = typeof (value as { code?: unknown }).code === "string"
        ? (value as { code?: string }).code
        : undefined;
      const message = typeof (value as { message?: unknown }).message === "string"
        ? (value as { message?: string }).message
        : undefined;
      return { status: ok ? "running" : "error", reason, message };
    }
    const status = normalizeStatus((value as { status?: unknown }).status ?? fallback);
    const reason = typeof (value as { reason?: unknown }).reason === "string"
      ? (value as { reason?: string }).reason
      : undefined;
    const message = typeof (value as { message?: unknown }).message === "string"
      ? (value as { message?: string }).message
      : undefined;
    return { status, reason, message };
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return { status: normalizeStatus(value) };
  }
  return { status: fallback };
}

function normalizeIosResult(value: unknown, action: "start" | "stop"): VpnResult {
  if (value && typeof value === "object" && "ok" in (value as { ok?: unknown })) {
    const ok = Boolean((value as { ok?: unknown }).ok);
    const reason = typeof (value as { code?: unknown }).code === "string"
      ? (value as { code?: string }).code
      : undefined;
    const message = typeof (value as { message?: unknown }).message === "string"
      ? (value as { message?: string }).message
      : undefined;
    if (ok) {
      return { status: action === "start" ? "running" : "stopped", reason, message };
    }
    return { status: "error", reason, message };
  }

  if (typeof value === "boolean") {
    if (value) {
      return { status: action === "start" ? "running" : "stopped" };
    }
    return { status: "error", reason: action === "start" ? "start_failed" : "stop_failed" };
  }
  return normalizeResult(value, action === "start" ? "error" : "stopped");
}

class GamblingBlocker implements GamblingBlockerInterface {
  async startProtection(): Promise<VpnResult> {
    const module = resolveModule();
    if (Platform.OS === "android") {
      const startVpn = getOptionalMethod(module, "startVpn");
      if (!startVpn) {
        warnUnavailable("startProtection");
        return { status: "error", reason: "module_unavailable" };
      }
      const result = await startVpn();
      return normalizeResult(result, "error");
    }
    if (Platform.OS === "ios") {
      const startFilter = getOptionalMethod(module, "startFilter");
      if (!startFilter) {
        warnUnavailable("startProtection");
        return { status: "error", reason: "module_unavailable" };
      }
      const result = await startFilter();
      return normalizeIosResult(result, "start");
    }
    console.warn(`Platform ${Platform.OS} desteklenmiyor`);
    return { status: "error", reason: "unsupported_platform" };
  }

  async stopProtection(): Promise<VpnResult> {
    const module = resolveModule();
    if (Platform.OS === "android") {
      const stopVpn = getOptionalMethod(module, "stopVpn");
      if (!stopVpn) {
        warnUnavailable("stopProtection");
        return { status: "stopped", reason: "module_unavailable" };
      }
      const result = await stopVpn();
      return normalizeResult(result, "stopped");
    }
    if (Platform.OS === "ios") {
      const stopFilter = getOptionalMethod(module, "stopFilter");
      if (!stopFilter) {
        warnUnavailable("stopProtection");
        return { status: "stopped", reason: "module_unavailable" };
      }
      const result = await stopFilter();
      return normalizeIosResult(result, "stop");
    }
    console.warn(`Platform ${Platform.OS} desteklenmiyor`);
    return { status: "stopped", reason: "unsupported_platform" };
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
      console.warn("Koruma durumu kontrol edilemedi:", error);
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

  async status(): Promise<ProtectionStatus> {
    const module = resolveModule();
    if (Platform.OS === "android") {
      const statusMethod = getOptionalMethod(module, "status");
      if (statusMethod) {
        const result = await statusMethod();
        const status = normalizeStatus(result);
        return status === "running" ? "running" : "stopped";
      }
    }
    const enabled = await this.isProtectionEnabled();
    return enabled ? "running" : "stopped";
  }
}

export default new GamblingBlocker();
