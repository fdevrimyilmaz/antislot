import { useLanguage } from "@/contexts/LanguageContext";
import { setAnswer } from "@/store/onboardingStore";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import { OnboardingShell, SelectionCard } from "@/components/onboarding/components";
import { ONBOARDING_CONTENT, localize } from "@/data/onboardingContent";

export default function OnboardingQ8() {
  const router = useRouter();
  const { language } = useLanguage();
  const common = ONBOARDING_CONTENT.common;
  const q8 = ONBOARDING_CONTENT.q8;

  const [value, setValue] = useState<"yes" | "no" | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canGoNext = useMemo(() => value !== null, [value]);

  async function onNext() {
    if (!value || isBusy) return;

    setIsBusy(true);
    try {
      await setAnswer("q8", value);
      router.push("/onboarding/q9");
    } catch (error) {
      console.error("Onboarding q8 save error:", error);
      Alert.alert(localize(language, common.saveErrorTitle), localize(language, common.saveErrorBody));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <OnboardingShell
      step={8}
      title={localize(language, q8.title)}
      subtitle={localize(language, common.selectOne)}
      backLabel={localize(language, common.back)}
      nextLabel={localize(language, common.next)}
      canGoNext={canGoNext}
      isBusy={isBusy}
      onBack={() => router.back()}
      onNext={onNext}
    >
      {q8.options.map((option) => (
        <SelectionCard
          key={option.id}
          label={localize(language, option.label)}
          selected={value === option.id}
          onPress={() => setValue(option.id as "yes" | "no")}
          mode="radio"
        />
      ))}
    </OnboardingShell>
  );
}