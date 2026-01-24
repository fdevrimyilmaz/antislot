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
  autoDeleteDays: number | null
) {
  if (!isAvailable() || !SharedConfigModule.saveSmsSettings) return false;
  await SharedConfigModule.saveSmsSettings(
    enabled,
    strictMode,
    customKeywords,
    autoDeleteDays ?? -1
  );
  return true;
}

export const SharedConfig = {
  saveBlocklist,
  savePatterns,
  saveWhitelist,
  saveSmsSettings,
};
