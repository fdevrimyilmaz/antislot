import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  getLocaleForLanguage,
  type Language,
  type SupportedLanguage,
  type Translations,
  getTranslationsForLanguage,
  resolveUiLanguage,
} from "@/i18n/translations";
import { getLanguage, setLanguage } from "@/store/languageStore";

interface LanguageContextType {
  language: Language;
  selectedLanguage: SupportedLanguage;
  locale: string;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("tr");

  useEffect(() => {
    (async () => {
      const lang = await getLanguage();
      setSelectedLanguage(lang);
    })();
  }, []);

  const handleSetLanguage = useCallback(async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    setSelectedLanguage(lang);
  }, []);

  const language = useMemo(() => resolveUiLanguage(selectedLanguage), [selectedLanguage]);
  const locale = useMemo(() => getLocaleForLanguage(selectedLanguage), [selectedLanguage]);
  const t = useMemo(() => getTranslationsForLanguage(selectedLanguage), [selectedLanguage]);

  const value = useMemo(
    () => ({
      language,
      selectedLanguage,
      locale,
      setLanguage: handleSetLanguage,
      t,
    }),
    [language, selectedLanguage, locale, handleSetLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage, LanguageProvider içinde kullanılmalıdır.");
  }
  return context;
}
