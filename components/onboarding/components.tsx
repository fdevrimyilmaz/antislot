import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React, { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OnboardingShellProps = {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  backLabel: string;
  nextLabel: string;
  canGoNext: boolean;
  isBusy?: boolean;
  onBack: () => void;
  onNext: () => void;
  children: ReactNode;
};

type SelectionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  mode: "checkbox" | "radio";
};

export function OnboardingShell({
  step,
  totalSteps = 10,
  title,
  subtitle,
  backLabel,
  nextLabel,
  canGoNext,
  isBusy = false,
  onBack,
  onNext,
  children,
}: OnboardingShellProps) {
  const { colors } = useTheme();
  const disabled = !canGoNext || isBusy;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.85}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${backLabel}`}</Text>
        </TouchableOpacity>
        <Text style={[styles.stepText, { color: colors.textSecondary }]}>{`${step} / ${totalSteps}`}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
        {children}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.primary },
            disabled && styles.nextButtonDisabled,
          ]}
          onPress={onNext}
          disabled={disabled}
          activeOpacity={0.9}
        >
          <Text style={styles.nextButtonText}>{nextLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function SelectionCard({ label, selected, onPress, mode }: SelectionCardProps) {
  const { colors } = useTheme();
  const isCheckbox = mode === "checkbox";

  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: colors.card,
          borderColor: selected ? colors.primary : colors.border,
          shadowColor: colors.text,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View
        style={[
          isCheckbox ? styles.checkbox : styles.radioOuter,
          {
            borderColor: colors.primary,
            backgroundColor: selected ? colors.primary : "transparent",
          },
        ]}
      >
        {selected ? (
          isCheckbox ? (
            <Text style={styles.checkboxTick}>OK</Text>
          ) : (
            <View style={styles.radioInner} />
          )
        ) : null}
      </View>
      <Text style={[styles.optionText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
  stepText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.display,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.body,
    marginBottom: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    borderTopWidth: 1,
  },
  nextButton: {
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: Spacing.sm,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxTick: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: Fonts.bodySemiBold,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: Fonts.body,
  },
});

