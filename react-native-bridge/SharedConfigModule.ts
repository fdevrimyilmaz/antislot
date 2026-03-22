import { logOnce } from "@/lib/logOnce";
import { NativeModules, Platform } from "react-native";

const { SharedConfigModule } = NativeModules;

type BlocklistPattern = {
  pattern: string;
  type: "exact" | "subdomain" | "contains" | "regex";
  weight: number;
};

type BlockerHardeningPolicy = {
  strictMode: boolean;
  blockDoh: boolean;
  blockDot: boolean;
  blockQuic: boolean;
  lockdownVpn: boolean;
  tamperAlerts: boolean;
};

const MODULE_UNAVAILABLE_MESSAGE = "SharedConfig modülü bu cihazda kullanılamıyor.";

function isAvailable() {
  return Boolean(SharedConfigModule);
}

const MODULE_UNAVAILABLE_LOG_KEY = "SharedConfigModule:unavailable";

function warnUnavailable(method: string) {
  logOnce(
    MODULE_UNAVAILABLE_LOG_KEY,
    `${MODULE_UNAVAILABLE_MESSAGE} (platform: ${Platform.OS}, firstMethod: ${method})`
  );
}

async function saveBlocklist(domains: string[]) {
  if (!isAvailable() || !SharedConfigModule.saveBlocklist) {
    warnUnavailable("saveBlocklist");
    return false;
  }
  await SharedConfigModule.saveBlocklist(domains);
  return true;
}

async function savePatterns(patterns: BlocklistPattern[]) {
  if (!isAvailable() || !SharedConfigModule.savePatterns) {
    warnUnavailable("savePatterns");
    return false;
  }
  await SharedConfigModule.savePatterns(patterns);
  return true;
}

async function saveWhitelist(domains: string[]) {
  if (!isAvailable() || !SharedConfigModule.saveWhitelist) {
    warnUnavailable("saveWhitelist");
    return false;
  }
  await SharedConfigModule.saveWhitelist(domains);
  return true;
}

async function saveBlockerHardening(policy: BlockerHardeningPolicy) {
  if (!isAvailable() || !SharedConfigModule.saveBlockerHardening) {
    warnUnavailable("saveBlockerHardening");
    return false;
  }
  await SharedConfigModule.saveBlockerHardening(
    policy.strictMode,
    policy.blockDoh,
    policy.blockDot,
    policy.blockQuic,
    policy.lockdownVpn,
    policy.tamperAlerts
  );
  return true;
}

async function saveSmsSettings(
  enabled: boolean,
  strictMode: boolean,
  customKeywords: string[],
  autoDeleteDays: number | null
) {
  if (!isAvailable() || !SharedConfigModule.saveSmsSettings) {
    warnUnavailable("saveSmsSettings");
    return false;
  }
  await SharedConfigModule.saveSmsSettings(
    enabled,
    strictMode,
    customKeywords,
    autoDeleteDays ?? -1
  );
  return true;
}

async function getSmsBlockedCount(): Promise<number> {
  if (!isAvailable() || !SharedConfigModule.getSmsBlockedCount) {
    warnUnavailable("getSmsBlockedCount");
    return 0;
  }
  const value = await SharedConfigModule.getSmsBlockedCount();
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function resetSmsBlockedCount(): Promise<boolean> {
  if (!isAvailable() || !SharedConfigModule.resetSmsBlockedCount) {
    warnUnavailable("resetSmsBlockedCount");
    return false;
  }
  await SharedConfigModule.resetSmsBlockedCount();
  return true;
}

async function cleanupSpamInboxNow(): Promise<number> {
  if (!isAvailable() || !SharedConfigModule.cleanupSpamInboxNow) {
    warnUnavailable("cleanupSpamInboxNow");
    return 0;
  }
  const value = await SharedConfigModule.cleanupSpamInboxNow();
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export const SharedConfig = {
  saveBlocklist,
  savePatterns,
  saveWhitelist,
  saveBlockerHardening,
  saveSmsSettings,
  getSmsBlockedCount,
  resetSmsBlockedCount,
  cleanupSpamInboxNow,
};
