import { useLanguage } from "@/contexts/LanguageContext";
import { setAnswer } from "@/store/onboardingStore";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import { OnboardingShell, SelectionCard } from "@/components/onboarding/components";
import { ONBOARDING_CONTENT, localize } from "@/data/onboardingContent";

export default function OnboardingQ5() {
  const router = useRouter();
  const { language } = useLanguage();
  const common = ONBOARDING_CONTENT.common;
  const q5 = ONBOARDING_CONTENT.q5;

  const [value, setValue] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canGoNext = useMemo(() => value !== null, [value]);

  async function onNext() {
    if (!value || isBusy) return;

    setIsBusy(true);
    try {
      await setAnswer("q5", value);
      router.push("/onboarding/q6");
    } catch (error) {
      console.error("Onboarding q5 save error:", error);
      Alert.alert(localize(language, common.saveErrorTitle), localize(language, common.saveErrorBody));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <OnboardingShell
      step={5}
      title={localize(language, q5.title)}
      subtitle={localize(language, common.selectOne)}
      backLabel={localize(language, common.back)}
      nextLabel={localize(language, common.next)}
      canGoNext={canGoNext}
      isBusy={isBusy}
      onBack={() => router.back()}
      onNext={onNext}
    >
      {q5.options.map((option) => (
        <SelectionCard
          key={option.id}
          label={localize(language, option.label)}
          selected={value === option.id}
          onPress={() => setValue(option.id)}
          mode="radio"
        />
      ))}
    </OnboardingShell>
  );
}