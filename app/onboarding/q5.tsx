import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OptionCard } from "@/components/onboarding/option-card";
import { haptics } from "@/services/haptics";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = ["Sabah", "Öğleden sonra", "Akşam", "Gece geç saatler", "Değişken"];

export default function OnboardingQ5() {
  const router = useRouter();
  const [value, setValue] = useState<string | null>(null);
  const canGoNext = useMemo(() => value !== null, [value]);

  const handleSelect = (option: string) => {
    haptics.selection();
    setValue(option);
  };

  async function onNext() {
    if (!value) return;
    haptics.tapLight();
    await setAnswer("q5", value);
    router.push("/onboarding/q6");
  }

  return (
    <OnboardingShell
      step={5}
      title="Genellikle ne zaman kumar oynarsınız?"
      hint="(birini seçin)"
      onNext={onNext}
      nextDisabled={!canGoNext}
    >
      <View style={styles.list}>
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt}
            label={opt}
            selected={value === opt}
            onPress={() => handleSelect(opt)}
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
