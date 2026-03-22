import { useLanguage } from "@/contexts/LanguageContext";
import { setAnswer } from "@/store/onboardingStore";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import { OnboardingShell, SelectionCard } from "@/components/onboarding/components";
import { ONBOARDING_CONTENT, localize } from "@/data/onboardingContent";

export default function OnboardingQ2() {
  const router = useRouter();
  const { language } = useLanguage();
  const common = ONBOARDING_CONTENT.common;
  const q2 = ONBOARDING_CONTENT.q2;

  const [value, setValue] = useState<"yes" | "no" | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canGoNext = useMemo(() => value !== null, [value]);

  async function onNext() {
    if (!value || isBusy) return;

    setIsBusy(true);
    try {
      await setAnswer("q2", value);
      router.push("/onboarding/q3");
    } catch (error) {
      console.error("Onboarding q2 save error:", error);
      Alert.alert(localize(language, common.saveErrorTitle), localize(language, common.saveErrorBody));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <OnboardingShell
      step={2}
      title={localize(language, q2.title)}
      subtitle={localize(language, common.selectOne)}
      backLabel={localize(language, common.back)}
      nextLabel={localize(language, common.next)}
      canGoNext={canGoNext}
      isBusy={isBusy}
      onBack={() => router.back()}
      onNext={onNext}
    >
      {q2.options.map((option) => (
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