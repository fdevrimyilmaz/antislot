import * as SecureStore from 'expo-secure-store';
import { FilterSettings } from '@/services/sms-filter/types';
import { SharedConfig } from '@/react-native-bridge/SharedConfigModule';
import { getCommunityKeywords } from '@/store/smsCommunityListStore';

const KEYS = {
  ENABLED: 'sms_filter_enabled',
  KEYWORDS: 'sms_filter_keywords',
  AUTO_DELETE_DAYS: 'sms_filter_auto_delete_days',
  STRICT_MODE: 'sms_filter_strict_mode',
  COMMUNITY_LIST_ENABLED: 'sms_filter_community_enabled',
};

const DEFAULT_SETTINGS: FilterSettings = {
  enabled: true,
  customKeywords: [],
  autoDeleteDays: null,
  strictMode: false,
  communityListEnabled: false,
};

/**
 * Push the merged settings into the App Group so the iOS
 * MessageFilterExtension picks them up on the next SMS query.
 *
 * Customs go in `customKeywords`, the community list (if enabled) goes in
 * `communityKeywords`. Keeping them separate lets the extension assign
 * different score weights and lets the user toggle community without
 * losing their own additions.
 */
async function syncSharedSettings(): Promise<void> {
  const settings = await getFilterSettings();
  const community = settings.communityListEnabled ? await getCommunityKeywords() : [];
  await SharedConfig.saveSmsSettings(
    settings.enabled,
    settings.strictMode,
    settings.customKeywords,
    settings.autoDeleteDays,
    community
  );
}

export async function getFilterSettings(): Promise<FilterSettings> {
  try {
    const [enabled, keywords, autoDeleteDays, strictMode, communityEnabled] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ENABLED),
      SecureStore.getItemAsync(KEYS.KEYWORDS),
      SecureStore.getItemAsync(KEYS.AUTO_DELETE_DAYS),
      SecureStore.getItemAsync(KEYS.STRICT_MODE),
      SecureStore.getItemAsync(KEYS.COMMUNITY_LIST_ENABLED),
    ]);

    return {
      enabled: enabled !== 'false',
      customKeywords: keywords ? safeParseArray(keywords) : [],
      autoDeleteDays: autoDeleteDays ? parseInt(autoDeleteDays, 10) : null,
      strictMode: strictMode === 'true',
      communityListEnabled: communityEnabled === 'true',
    };
  } catch (error) {
    console.error('Filtre ayarları yüklenirken hata:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateFilterSettings(patch: Partial<FilterSettings>): Promise<void> {
  if (patch.enabled !== undefined) {
    await SecureStore.setItemAsync(KEYS.ENABLED, String(patch.enabled));
  }
  if (patch.customKeywords !== undefined) {
    await SecureStore.setItemAsync(KEYS.KEYWORDS, JSON.stringify(patch.customKeywords));
  }
  if (patch.autoDeleteDays !== undefined) {
    await SecureStore.setItemAsync(
      KEYS.AUTO_DELETE_DAYS,
      patch.autoDeleteDays === null ? '' : String(patch.autoDeleteDays)
    );
  }
  if (patch.strictMode !== undefined) {
    await SecureStore.setItemAsync(KEYS.STRICT_MODE, String(patch.strictMode));
  }
  if (patch.communityListEnabled !== undefined) {
    await SecureStore.setItemAsync(KEYS.COMMUNITY_LIST_ENABLED, String(patch.communityListEnabled));
  }
  await syncSharedSettings();
}

export async function addCustomKeyword(keyword: string): Promise<void> {
  const settings = await getFilterSettings();
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed || settings.customKeywords.includes(trimmed)) return;
  await updateFilterSettings({
    customKeywords: [...settings.customKeywords, trimmed],
  });
}

export async function removeCustomKeyword(keyword: string): Promise<void> {
  const settings = await getFilterSettings();
  await updateFilterSettings({
    customKeywords: settings.customKeywords.filter((k) => k !== keyword),
  });
}

export async function toggleFilter(enabled: boolean): Promise<void> {
  await updateFilterSettings({ enabled });
}

export async function resetFilterSettings(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ENABLED),
    SecureStore.deleteItemAsync(KEYS.KEYWORDS),
    SecureStore.deleteItemAsync(KEYS.AUTO_DELETE_DAYS),
    SecureStore.deleteItemAsync(KEYS.STRICT_MODE),
    SecureStore.deleteItemAsync(KEYS.COMMUNITY_LIST_ENABLED),
  ]);
  await syncSharedSettings();
}

/** Re-push settings to the App Group — call after a community list sync. */
export async function refreshSharedSettings(): Promise<void> {
  await syncSharedSettings();
}

function safeParseArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : [];
  } catch {
    return [];
  }
}
