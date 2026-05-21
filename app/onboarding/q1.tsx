import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OptionCard } from "@/components/onboarding/option-card";
import { haptics } from "@/services/haptics";
import { setAnswer } from "@/store/onboardingStore";

const OPTIONS = [
  "Kumar oynamayı azaltmak veya bırakmak için yardım",
  "Kumar davranışlarımı ve ilerlememi öğrenmek ve takip etmek",
  "Kumar davranışım için acil yardım",
  "Kumar destek hizmetleri bulmak",
  "Çevrimiçi bir topluluğa katılmak",
  "Birisiyle konuşmak",
  "Kumarsız kalmak için destek",
  "Diğer (lütfen belirtin)",
];

const OTHER_LABEL = "Diğer (lütfen belirtin)";

export default function OnboardingQ1() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");

  const otherSelected = selected.includes(OTHER_LABEL);

  const canGoNext = useMemo(() => {
    if (selected.length === 0) return false;
    if (otherSelected && otherText.trim().length === 0) return false;
    return true;
  }, [selected, otherSelected, otherText]);

  function toggle(option: string) {
    haptics.selection();
    setSelected((prev) => {
      const exists = prev.includes(option);
      if (exists) {
        if (option === OTHER_LABEL) setOtherText("");
        return prev.filter((x) => x !== option);
      }
      return [...prev, option];
    });
  }

  async function onNext() {
    const cleaned = selected
      .filter((x) => x !== OTHER_LABEL)
      .concat(otherSelected ? [`Diğer: ${otherText.trim()}`] : []);
    haptics.tapLight();
    await setAnswer("q1", cleaned);
    router.push("/onboarding/q2");
  }

  return (
    <OnboardingShell
      step={1}
      title="Antislot’u indirmeye sizi ne yöneltti?"
      hint="(geçerli olanların hepsini seçin)"
      onNext={onNext}
      nextDisabled={!canGoNext}
    >
      <View style={styles.list}>
        {OPTIONS.map((opt) => (
          <View key={opt}>
            <OptionCard
              label={opt}
              selected={selected.includes(opt)}
              onPress={() => toggle(opt)}
              type="check"
            />
            {opt === OTHER_LABEL && otherSelected ? (
              <TextInput
                value={otherText}
                onChangeText={setOtherText}
                placeholder="Lütfen belirtin..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.otherInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                accessibilityLabel="Diğer açıklaması"
              />
            ) : null}
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  otherInput: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});
