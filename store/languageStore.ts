import * as SecureStore from "expo-secure-store";
import { Language } from "@/i18n/translations";

const KEY = "antislot_language";

export async function getLanguage(): Promise<Language> {
  const lang = await SecureStore.getItemAsync(KEY);
  if (lang === "tr") {
    return "tr";
  }
  if (lang === "en") {
    await SecureStore.setItemAsync(KEY, "tr");
  }
  // Varsayılan dil Türkçe
  return "tr";
}

export async function setLanguage(language: Language) {
  await SecureStore.setItemAsync(KEY, language);
}
