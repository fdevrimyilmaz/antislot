import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OptionCard } from "@/components/onboarding/option-card";
import { haptics } from "@/services/haptics";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = [
  "Kumar oynamayı azaltmak veya bırakmak",
  "Ruh sağlığımı iyileştirmek",
  "Daha sağlıklı alışkanlıklar geliştirmek",
  "İlerlememi takip etmek",
  "Baş etme stratejileri öğrenmek",
  "Dürtü hissettiğimde destek almak",
  "Daha fazla kontrol sahibi hissetmek",
  "Diğer",
];

export default function OnboardingQ3() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const canGoNext = useMemo(() => selected.length > 0, [selected]);

  function toggle(option: string) {
    haptics.selection();
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
    );
  }

  async function onNext() {
    if (selected.length === 0) return;
    haptics.tapLight();
    await setAnswer("q3", selected);
    router.push("/onboarding/q4");
  }

  return (
    <OnboardingShell
      step={3}
      title="Hedefleriniz nelerdir?"
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
