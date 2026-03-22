import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { translateCopyObject } from "@/i18n/runtimeCopyTranslate";
import type { SupportedLanguage } from "@/i18n/translations";

type BilingualCopy = {
  tr: unknown;
  en: unknown;
};

type LocalizedCopyValue<TCopy extends BilingualCopy> = TCopy["tr"] | TCopy["en"];

function getInitialCopy<TCopy extends BilingualCopy>(
  copy: TCopy,
  language: SupportedLanguage
): LocalizedCopyValue<TCopy> {
  if (language === "tr") return copy.tr as LocalizedCopyValue<TCopy>;
  return copy.en as LocalizedCopyValue<TCopy>;
}

export function useLocalizedCopy<TCopy extends BilingualCopy>(copy: TCopy): LocalizedCopyValue<TCopy> {
  const { language, selectedLanguage } = useLanguage();
  const activeLanguage = selectedLanguage ?? language;

  const fallbackCopy = useMemo(() => getInitialCopy(copy, language), [copy, language]);
  const [value, setValue] = useState<LocalizedCopyValue<TCopy>>(fallbackCopy);

  useEffect(() => {
    setValue(fallbackCopy);
  }, [fallbackCopy]);

  useEffect(() => {
    let cancelled = false;

    if (activeLanguage === "tr") {
      setValue(copy.tr as LocalizedCopyValue<TCopy>);
      return () => {
        cancelled = true;
      };
    }

    if (activeLanguage === "en") {
      setValue(copy.en as LocalizedCopyValue<TCopy>);
      return () => {
        cancelled = true;
      };
    }

    void translateCopyObject(copy.en, activeLanguage)
      .then((translated) => {
        if (!cancelled) {
          setValue(translated as LocalizedCopyValue<TCopy>);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValue(copy.en as LocalizedCopyValue<TCopy>);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeLanguage, copy]);

  return value;
}

export function useAutoTranslatedValue<T>(value: T): T {
  const { language, selectedLanguage } = useLanguage();
  const activeLanguage = selectedLanguage ?? language;
  const [localizedValue, setLocalizedValue] = useState<T>(value);

  useEffect(() => {
    setLocalizedValue(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;

    if (activeLanguage === "tr" || activeLanguage === "en") {
      setLocalizedValue(value);
      return () => {
        cancelled = true;
      };
    }

    void translateCopyObject(value, activeLanguage)
      .then((translated) => {
        if (!cancelled) {
          setLocalizedValue(translated);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocalizedValue(value);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeLanguage, value]);

  return localizedValue;
}
