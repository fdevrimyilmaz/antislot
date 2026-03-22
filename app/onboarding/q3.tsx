import { useLanguage } from "@/contexts/LanguageContext";
import { setAnswer } from "@/store/onboardingStore";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import { OnboardingShell, SelectionCard } from "@/components/onboarding/components";
import { ONBOARDING_CONTENT, localize } from "@/data/onboardingContent";

export default function OnboardingQ3() {
  const router = useRouter();
  const { language } = useLanguage();
  const common = ONBOARDING_CONTENT.common;
  const q3 = ONBOARDING_CONTENT.q3;

  const [selected, setSelected] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const canGoNext = useMemo(() => selected.length > 0, [selected]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  async function onNext() {
    if (!canGoNext || isBusy) return;

    setIsBusy(true);
    try {
      await setAnswer("q3", selected);
      router.push("/onboarding/q4");
    } catch (error) {
      console.error("Onboarding q3 save error:", error);
      Alert.alert(localize(language, common.saveErrorTitle), localize(language, common.saveErrorBody));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <OnboardingShell
      step={3}
      title={localize(language, q3.title)}
      subtitle={localize(language, common.selectAll)}
      backLabel={localize(language, common.back)}
      nextLabel={localize(language, common.next)}
      canGoNext={canGoNext}
      isBusy={isBusy}
      onBack={() => router.back()}
      onNext={onNext}
    >
      {q3.options.map((option) => (
        <SelectionCard
          key={option.id}
          label={localize(language, option.label)}
          selected={selected.includes(option.id)}
          onPress={() => toggle(option.id)}
          mode="checkbox"
        />
      ))}
    </OnboardingShell>
  );
}