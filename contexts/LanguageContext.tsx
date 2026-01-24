import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Language, Translations, translations } from "@/i18n/translations";
import { getLanguage, setLanguage } from "@/store/languageStore";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("tr");

  useEffect(() => {
    (async () => {
      const lang = await getLanguage();
      setLanguageState(lang);
    })();
  }, []);

  const handleSetLanguage = async (lang: Language) => {
    await setLanguage(lang);
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t: translations[language],
      }}
    >
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
