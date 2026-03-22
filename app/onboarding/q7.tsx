import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { setAnswer } from "@/store/onboardingStore";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { OnboardingShell } from "@/components/onboarding/components";
import { ONBOARDING_CONTENT, localize } from "@/data/onboardingContent";

export default function OnboardingQ7() {
  const router = useRouter();
  const { language } = useLanguage();
  const { colors } = useTheme();
  const common = ONBOARDING_CONTENT.common;
  const q7 = ONBOARDING_CONTENT.q7;

  const [value, setValue] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canGoNext = useMemo(() => value !== null, [value]);

  async function onNext() {
    if (!value || isBusy) return;

    setIsBusy(true);
    try {
      await setAnswer("q7", value);
      router.push("/onboarding/q8");
    } catch (error) {
      console.error("Onboarding q7 save error:", error);
      Alert.alert(localize(language, common.saveErrorTitle), localize(language, common.saveErrorBody));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <OnboardingShell
      step={7}
      title={localize(language, q7.title)}
      subtitle={localize(language, q7.subtitle)}
      backLabel={localize(language, common.back)}
      nextLabel={localize(language, common.next)}
      canGoNext={canGoNext}
      isBusy={isBusy}
      onBack={() => router.back()}
      onNext={onNext}
    >
      <View style={styles.scaleRow}>
        {q7.options.map((option) => {
          const selected = value === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.scalePill,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setValue(option)}
              activeOpacity={0.86}
            >
              <Text
                style={[
                  styles.scalePillText,
                  { color: selected ? "#FFFFFF" : colors.text },
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  scaleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  scalePill: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  scalePillText: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
  },
});