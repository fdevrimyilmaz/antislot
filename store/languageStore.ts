import * as SecureStore from "expo-secure-store";
import { Language } from "@/i18n/translations";

const KEY = "antislot_language";
const SUPPORTED: readonly Language[] = ["tr", "en"];

export async function getLanguage(): Promise<Language> {
  try {
    const lang = await SecureStore.getItemAsync(KEY);
    if (lang && (SUPPORTED as readonly string[]).includes(lang)) {
      return lang as Language;
    }
  } catch {
    // ignore — fall through to default
  }
  return "tr";
}

export async function setLanguage(language: Language): Promise<void> {
  await SecureStore.setItemAsync(KEY, language);
}
