import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OptionCard } from "@/components/onboarding/option-card";
import { haptics } from "@/services/haptics";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS: { value: "yes" | "no"; label: string }[] = [
  { value: "yes", label: "Evet" },
  { value: "no", label: "Hayır" },
];

export default function OnboardingQ8() {
  const router = useRouter();
  const [value, setValue] = useState<"yes" | "no" | null>(null);
  const canGoNext = useMemo(() => value !== null, [value]);

  const handleSelect = (next: "yes" | "no") => {
    haptics.selection();
    setValue(next);
  };

  async function onNext() {
    if (!value) return;
    haptics.tapLight();
    await setAnswer("q8", value);
    router.push("/onboarding/q9");
  }

  return (
    <OnboardingShell
      step={8}
      title="Günlük hatırlatmalar ister misiniz?"
      onNext={onNext}
      nextDisabled={!canGoNext}
    >
      <View style={styles.list}>
        {OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onPress={() => handleSelect(option.value)}
            type="radio"
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
});
