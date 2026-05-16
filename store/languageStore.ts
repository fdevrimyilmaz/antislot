import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Language } from "@/i18n/translations";

const KEY = "antislot_language";
const SUPPORTED: readonly Language[] = [
  "tr",
  "en",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "ar",
  "ru",
  "fil",
  "sv",
  "fi",
  "nl",
  "ja",
  "id",
  "th",
  "hi",
  "km",
  "el",
];

const isSupported = (value: string | null): value is Language =>
  Boolean(value && (SUPPORTED as readonly string[]).includes(value));

export async function getLanguage(): Promise<Language> {
  try {
    const lang = await SecureStore.getItemAsync(KEY);
    if (isSupported(lang)) return lang;
  } catch {
    // ignore and continue with fallback
  }

  try {
    const lang = await AsyncStorage.getItem(KEY);
    if (isSupported(lang)) return lang;
  } catch {
    // ignore and fall through to default
  }

  return "tr";
}

export async function setLanguage(language: Language): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, language);
    return;
  } catch {
    // ignore and continue with fallback
  }
  await AsyncStorage.setItem(KEY, language);
}
