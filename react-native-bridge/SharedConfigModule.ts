import { NativeModules } from "react-native";

const { SharedConfigModule } = NativeModules;

type BlocklistPattern = {
  pattern: string;
  type: "exact" | "subdomain" | "contains" | "regex";
  weight: number;
};

function isAvailable() {
  return Boolean(SharedConfigModule);
}

async function saveBlocklist(domains: string[]) {
  if (!isAvailable() || !SharedConfigModule.saveBlocklist) return false;
  await SharedConfigModule.saveBlocklist(domains);
  return true;
}

async function savePatterns(patterns: BlocklistPattern[]) {
  if (!isAvailable() || !SharedConfigModule.savePatterns) return false;
  await SharedConfigModule.savePatterns(patterns);
  return true;
}

async function saveWhitelist(domains: string[]) {
  if (!isAvailable() || !SharedConfigModule.saveWhitelist) return false;
  await SharedConfigModule.saveWhitelist(domains);
  return true;
}

async function saveSmsSettings(
  enabled: boolean,
  strictMode: boolean,
  customKeywords: string[],
  autoDeleteDays: number | null,
  communityKeywords: string[] = []
) {
  if (!isAvailable() || !SharedConfigModule.saveSmsSettings) return false;
  await SharedConfigModule.saveSmsSettings(
    enabled,
    strictMode,
    customKeywords,
    autoDeleteDays ?? -1,
    communityKeywords
  );
  return true;
}

export interface SafariBlockerReloadResult {
  wrote: boolean;
  reloaded: boolean;
  reason?: "extension_not_enabled";
}

export interface SafariBlockerStatus {
  enabled: boolean;
  available: boolean;
}

/**
 * Push the Safari Content Blocker rules into the App Group container and
 * ask Safari to reload them. Returns whether Safari accepted the reload —
 * if `reloaded` is false the user likely hasn't enabled the extension in
 * Settings → Safari → Extensions yet.
 *
 * No-ops on Android (returns `{ wrote: false, reloaded: false }`).
 */
async function saveSafariContentBlockerRules(
  rulesJson: string
): Promise<SafariBlockerReloadResult> {
  if (!isAvailable() || !SharedConfigModule.saveSafariContentBlockerRules) {
    return { wrote: false, reloaded: false };
  }
  const result = await SharedConfigModule.saveSafariContentBlockerRules(rulesJson);
  return {
    wrote: Boolean(result?.wrote),
    reloaded: Boolean(result?.reloaded),
    reason: result?.reason,
  };
}

async function getSafariContentBlockerStatus(): Promise<SafariBlockerStatus> {
  if (!isAvailable() || !SharedConfigModule.getSafariContentBlockerStatus) {
    return { enabled: false, available: false };
  }
  const result = await SharedConfigModule.getSafariContentBlockerStatus();
  return {
    enabled: Boolean(result?.enabled),
    available: Boolean(result?.available),
  };
}

export const SharedConfig = {
  saveBlocklist,
  savePatterns,
  saveWhitelist,
  saveSmsSettings,
  saveSafariContentBlockerRules,
  getSafariContentBlockerStatus,
};
