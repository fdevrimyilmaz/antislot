import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OptionCard } from "@/components/onboarding/option-card";
import { haptics } from "@/services/haptics";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = [
  "Stres veya kaygı",
  "Can sıkıntısı",
  "Yalnızlık",
  "Maddi endişeler",
  "Alkol / maddeler",
  "Reklam veya kumar içerikleri görmek",
  "Tartışma veya çatışma",
  "Kutlama / heyecan",
];

export default function OnboardingQ6() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const canGoNext = useMemo(() => selected.length > 0, [selected]);

  function toggle(opt: string) {
    haptics.selection();
    setSelected((p) => (p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]));
  }

  async function onNext() {
    if (!canGoNext) return;
    haptics.tapLight();
    await setAnswer("q6", selected);
    router.push("/onboarding/q7");
  }

  return (
    <OnboardingShell
      step={6}
      title="Kumar oynamayı ne tetikler?"
      hint="(geçerli olanların hepsini seçin)"
      onNext={onNext}
      nextDisabled={!canGoNext}
    >
      <View style={styles.list}>
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt}
            label={opt}
            selected={selected.includes(opt)}
            onPress={() => toggle(opt)}
            type="check"
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
});
