import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OptionCard } from "@/components/onboarding/option-card";
import { haptics } from "@/services/haptics";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = [
  "Kendi kendine yardım araçları",
  "Topluluk desteği",
  "Profesyonel yardım",
  "Kriz / acil destek",
  "Takip ve içgörüler",
];

export default function OnboardingQ9() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const canGoNext = useMemo(() => selected.length > 0, [selected]);

  function toggle(opt: string) {
    haptics.selection();
    setSelected((p) => (p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]));
  }

  async function onNext() {
    if (selected.length === 0) return;
    haptics.tapLight();
    await setAnswer("q9", selected);
    router.push("/onboarding/q10");
  }

  return (
    <OnboardingShell
      step={9}
      title="Hangi desteği tercih edersiniz?"
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
