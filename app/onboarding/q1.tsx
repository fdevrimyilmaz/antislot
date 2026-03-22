import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { setAnswer } from "@/store/onboardingStore";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, TextInput } from "react-native";
import { OnboardingShell, SelectionCard } from "@/components/onboarding/components";
import { ONBOARDING_CONTENT, localize } from "@/data/onboardingContent";

const OTHER_OPTION_ID = "other";

export default function OnboardingQ1() {
  const router = useRouter();
  const { language } = useLanguage();
  const { colors } = useTheme();
  const common = ONBOARDING_CONTENT.common;
  const q1 = ONBOARDING_CONTENT.q1;

  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const otherSelected = selected.includes(OTHER_OPTION_ID);
  const canGoNext = useMemo(() => {
    if (selected.length === 0) return false;
    if (otherSelected && otherText.trim().length === 0) return false;
    return true;
  }, [otherSelected, otherText, selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((optionId) => optionId !== id);
        if (id === OTHER_OPTION_ID) {
          setOtherText("");
        }
        return next;
      }
      return [...prev, id];
    });
  }

  async function onNext() {
    if (!canGoNext || isBusy) return;

    setIsBusy(true);
    try {
      const payload = selected
        .filter((id) => id !== OTHER_OPTION_ID)
        .concat(otherSelected ? [`other:${otherText.trim()}`] : []);

      await setAnswer("q1", payload);
      router.push("/onboarding/q2");
    } catch (error) {
      console.error("Onboarding q1 save error:", error);
      Alert.alert(localize(language, common.saveErrorTitle), localize(language, common.saveErrorBody));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <OnboardingShell
      step={1}
      title={localize(language, q1.title)}
      subtitle={localize(language, common.selectAll)}
      backLabel={localize(language, common.back)}
      nextLabel={localize(language, common.next)}
      canGoNext={canGoNext}
      isBusy={isBusy}
      onBack={() => router.back()}
      onNext={onNext}
    >
      {q1.options.map((option) => {
        const checked = selected.includes(option.id);

        return (
          <React.Fragment key={option.id}>
            <SelectionCard
              label={localize(language, option.label)}
              selected={checked}
              onPress={() => toggle(option.id)}
              mode="checkbox"
            />
            {option.id === OTHER_OPTION_ID && checked ? (
              <TextInput
                value={otherText}
                onChangeText={setOtherText}
                placeholder={localize(language, common.otherPlaceholder)}
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.otherInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  otherInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Fonts.body,
    marginBottom: Spacing.sm,
  },
});