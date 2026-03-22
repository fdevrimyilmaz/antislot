import { Fonts, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, type TextStyle } from "react-native";

interface SOSQuickAccessProps {
  variant?: "button" | "floating" | "inline";
  size?: "small" | "medium" | "large";
}

export function SOSQuickAccess({
  variant = "button",
  size = "medium",
}: SOSQuickAccessProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const handlePress = () => {
    router.push("/sos");
  };

  const a11y = { accessibilityLabel: t.sosQuickAccess };

  if (variant === "floating") {
    return (
      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: colors.warning ?? "#D06B5C",
            shadowColor: "#000",
          },
          Shadows.button,
        ]}
        onPress={handlePress}
        activeOpacity={0.82}
        testID="sos-quick-access"
        {...a11y}
      >
        <Text style={styles.floatingText}>SOS</Text>
      </TouchableOpacity>
    );
  }

  if (variant === "inline") {
    return (
      <TouchableOpacity
        style={[
          styles.inlineButton,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.78}
        {...a11y}
      >
        <Text style={styles.inlinePill}>SOS</Text>
        <Text style={[styles.inlineText, { color: colors.text }]}>
          {t.sosQuickAccess}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        size === "small" && styles.buttonSmall,
        size === "large" && styles.buttonLarge,
        {
          backgroundColor: colors.warning ?? "#D06B5C",
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.82}
      {...a11y}
    >
      <Text style={styles.buttonPill}>SOS</Text>
      <Text style={styles.buttonText}>{t.sosQuickAccess}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    ...Shadows.button,
  },
  buttonSmall: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  buttonLarge: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  buttonPill: {
    ...(Typography.overline as TextStyle),
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: "#B42318",
    color: "#FFFFFF",
    fontFamily: Fonts.bodySemiBold,
  },
  buttonText: {
    ...(Typography.body as TextStyle),
    color: "#FFFFFF",
    fontFamily: Fonts.bodySemiBold,
  },
  floatingButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  floatingText: {
    ...(Typography.caption as TextStyle),
    color: "#FFFFFF",
    letterSpacing: 0.5,
    fontFamily: Fonts.bodySemiBold,
  },
  inlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  inlinePill: {
    ...(Typography.overline as TextStyle),
    color: "#FFFFFF",
    fontFamily: Fonts.bodySemiBold,
    backgroundColor: "#B42318",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  inlineText: {
    ...(Typography.bodySmall as TextStyle),
    fontFamily: Fonts.bodyMedium,
  },
});
