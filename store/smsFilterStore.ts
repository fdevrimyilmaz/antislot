import * as SecureStore from 'expo-secure-store';
import { FilterSettings } from '@/services/sms-filter/types';
import { getAllKeywords } from '@/services/sms-filter/keywords';
import { SharedConfig } from '@/react-native-bridge/SharedConfigModule';

const KEYS = {
  ENABLED: 'sms_filter_enabled',
  KEYWORDS: 'sms_filter_keywords',
  AUTO_DELETE_DAYS: 'sms_filter_auto_delete_days',
  STRICT_MODE: 'sms_filter_strict_mode',
};

const DEFAULT_SETTINGS: FilterSettings = {
  enabled: true,
  customKeywords: [],
  autoDeleteDays: null,
  strictMode: false,
};

async function syncSharedSettings() {
  const settings = await getFilterSettings();
  const defaultKeywords = getAllKeywords();
  const combinedKeywords = Array.from(new Set([...defaultKeywords, ...settings.customKeywords]));
  await SharedConfig.saveSmsSettings(
    settings.enabled,
    settings.strictMode,
    combinedKeywords,
    settings.autoDeleteDays
  );
}

export async function getFilterSettings(): Promise<FilterSettings> {
  try {
    const enabled = await SecureStore.getItemAsync(KEYS.ENABLED);
    const keywords = await SecureStore.getItemAsync(KEYS.KEYWORDS);
    const autoDeleteDays = await SecureStore.getItemAsync(KEYS.AUTO_DELETE_DAYS);
    const strictMode = await SecureStore.getItemAsync(KEYS.STRICT_MODE);

    return {
      enabled: enabled === 'true',
      customKeywords: keywords ? JSON.parse(keywords) : [],
      autoDeleteDays: autoDeleteDays ? parseInt(autoDeleteDays, 10) : null,
      strictMode: strictMode === 'true',
    };
  } catch (error) {
    console.error('Filtre ayarları yüklenirken hata:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateFilterSettings(settings: Partial<FilterSettings>): Promise<void> {
  try {
    if (settings.enabled !== undefined) {
      await SecureStore.setItemAsync(KEYS.ENABLED, settings.enabled.toString());
    }
    if (settings.customKeywords !== undefined) {
      await SecureStore.setItemAsync(KEYS.KEYWORDS, JSON.stringify(settings.customKeywords));
    }
    if (settings.autoDeleteDays !== undefined) {
      await SecureStore.setItemAsync(
        KEYS.AUTO_DELETE_DAYS,
        settings.autoDeleteDays?.toString() || ''
      );
    }
    if (settings.strictMode !== undefined) {
      await SecureStore.setItemAsync(KEYS.STRICT_MODE, settings.strictMode.toString());
    }
    await syncSharedSettings();
  } catch (error) {
    console.error('Filtre ayarları kaydedilirken hata:', error);
    throw error;
  }
}

export async function addCustomKeyword(keyword: string): Promise<void> {
  const settings = await getFilterSettings();
  const trimmedKeyword = keyword.trim().toLowerCase();
  
  if (trimmedKeyword && !settings.customKeywords.includes(trimmedKeyword)) {
    await updateFilterSettings({
      customKeywords: [...settings.customKeywords, trimmedKeyword],
    });
  }
}

export async function removeCustomKeyword(keyword: string): Promise<void> {
  const settings = await getFilterSettings();
  await updateFilterSettings({
    customKeywords: settings.customKeywords.filter(k => k !== keyword),
  });
}

export async function toggleFilter(enabled: boolean): Promise<void> {
  await updateFilterSettings({ enabled });
}

export async function resetFilterSettings(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEYS.ENABLED);
    await SecureStore.deleteItemAsync(KEYS.KEYWORDS);
    await SecureStore.deleteItemAsync(KEYS.AUTO_DELETE_DAYS);
    await SecureStore.deleteItemAsync(KEYS.STRICT_MODE);
    await syncSharedSettings();
  } catch (error) {
    console.error('Filtre ayarları sıfırlanırken hata:', error);
  }
}
