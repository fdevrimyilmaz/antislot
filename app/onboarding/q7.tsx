import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { haptics } from "@/services/haptics";
import { setAnswer } from "@/store/onboardingStore";

const SCALE = ["1", "2", "3", "4", "5"];

export default function OnboardingQ7() {
  const router = useRouter();
  const { colors } = useTheme();
  const [value, setValue] = useState<string | null>(null);
  const canGoNext = useMemo(() => value !== null, [value]);

  const handleSelect = (option: string) => {
    haptics.selection();
    setValue(option);
  };

  async function onNext() {
    if (!value) return;
    haptics.tapLight();
    await setAnswer("q7", value);
    router.push("/onboarding/q8");
  }

  return (
    <OnboardingShell
      step={7}
      title="Kumar oynama dürtüleriniz ne kadar güçlü?"
      hint="1 = düşük, 5 = çok güçlü"
      onNext={onNext}
      nextDisabled={!canGoNext}
    >
      <View style={styles.scaleRow}>
        {SCALE.map((opt) => {
          const selected = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.pill,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${opt} puanı`}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: selected ? "#FFFFFF" : colors.primary },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.scaleLabels}>
        <Text style={[styles.scaleLabel, { color: colors.textMuted }]}>Düşük</Text>
        <Text style={[styles.scaleLabel, { color: colors.textMuted }]}>Çok güçlü</Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  scaleRow: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    fontSize: 20,
    fontWeight: "800",
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 4,
  },
  scaleLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
