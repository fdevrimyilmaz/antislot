import * as SecureStore from "@/lib/secureStoreCompat";
import { FilterSettings } from '@/services/sms-filter/types';
import { getAllKeywords } from '@/services/sms-filter/keywords';
import { dedupeSmsKeywords, normalizeSmsKeyword } from '@/services/sms-filter/normalize';
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
  strictMode: true,
};

const AUTO_DELETE_OPTIONS = new Set<number>([1, 3, 7, 14, 30, 60, 90]);

function sanitizeAutoDeleteDays(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return AUTO_DELETE_OPTIONS.has(value) ? value : null;
}

function sanitizeCustomKeywords(keywords: string[]): string[] {
  return dedupeSmsKeywords(keywords).slice(0, 250);
}

async function syncSharedSettings() {
  const settings = await getFilterSettings();
  const defaultKeywords = getAllKeywords();
  const combinedKeywords = sanitizeCustomKeywords([...defaultKeywords, ...settings.customKeywords]);
  await SharedConfig.saveSmsSettings(
    settings.enabled,
    settings.strictMode,
    combinedKeywords,
    sanitizeAutoDeleteDays(settings.autoDeleteDays)
  );
}

export async function getFilterSettings(): Promise<FilterSettings> {
  try {
    const enabled = await SecureStore.getItemAsync(KEYS.ENABLED);
    const keywords = await SecureStore.getItemAsync(KEYS.KEYWORDS);
    const autoDeleteDays = await SecureStore.getItemAsync(KEYS.AUTO_DELETE_DAYS);
    const strictMode = await SecureStore.getItemAsync(KEYS.STRICT_MODE);

    let parsedKeywords: string[] = [];
    if (keywords) {
      try {
        const raw = JSON.parse(keywords);
        parsedKeywords = Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [];
      } catch {
        parsedKeywords = [];
      }
    }

    const parsedAutoDelete = autoDeleteDays ? parseInt(autoDeleteDays, 10) : null;
    const safeKeywords = sanitizeCustomKeywords(parsedKeywords);

    const settings: FilterSettings = {
      enabled: enabled === null ? DEFAULT_SETTINGS.enabled : enabled === 'true',
      customKeywords: safeKeywords,
      autoDeleteDays: Number.isFinite(parsedAutoDelete as number)
        ? sanitizeAutoDeleteDays(parsedAutoDelete as number)
        : null,
      strictMode: strictMode === null ? DEFAULT_SETTINGS.strictMode : strictMode === 'true',
    };

    const shouldPersistDefaults = enabled === null || keywords === null || strictMode === null || autoDeleteDays === null;
    if (shouldPersistDefaults) {
      await SecureStore.setItemAsync(KEYS.ENABLED, settings.enabled.toString());
      await SecureStore.setItemAsync(KEYS.KEYWORDS, JSON.stringify(settings.customKeywords));
      await SecureStore.setItemAsync(KEYS.STRICT_MODE, settings.strictMode.toString());
      await SecureStore.setItemAsync(KEYS.AUTO_DELETE_DAYS, settings.autoDeleteDays?.toString() || '');
    }

    const defaultKeywords = getAllKeywords();
    const combinedKeywords = sanitizeCustomKeywords([...defaultKeywords, ...settings.customKeywords]);
    await SharedConfig.saveSmsSettings(
      settings.enabled,
      settings.strictMode,
      combinedKeywords,
      sanitizeAutoDeleteDays(settings.autoDeleteDays)
    );

    return settings;
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
      await SecureStore.setItemAsync(
        KEYS.KEYWORDS,
        JSON.stringify(sanitizeCustomKeywords(settings.customKeywords))
      );
    }
    if (settings.autoDeleteDays !== undefined) {
      await SecureStore.setItemAsync(
        KEYS.AUTO_DELETE_DAYS,
        sanitizeAutoDeleteDays(settings.autoDeleteDays)?.toString() || ''
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
  const trimmedKeyword = normalizeSmsKeyword(keyword);
  
  if (trimmedKeyword && !settings.customKeywords.includes(trimmedKeyword)) {
    await updateFilterSettings({
      customKeywords: [...settings.customKeywords, trimmedKeyword],
    });
  }
}

export async function removeCustomKeyword(keyword: string): Promise<void> {
  const settings = await getFilterSettings();
  const normalized = normalizeSmsKeyword(keyword);
  await updateFilterSettings({
    customKeywords: settings.customKeywords.filter(k => normalizeSmsKeyword(k) !== normalized),
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
