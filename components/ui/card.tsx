import React, { type ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/contexts/ThemeContext";

type CardVariant = "surface" | "hero";

type CardProps = ViewProps & {
  children: ReactNode;
  variant?: CardVariant;
  padding?: number;
};

export function Card({
  children,
  variant = "surface",
  padding = 16,
  style,
  ...rest
}: CardProps) {
  const { colors } = useTheme();

  if (variant === "hero") {
    return (
      <LinearGradient
        colors={colors.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, styles.hero, { padding }, style]}
        {...rest}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      {...rest}
      style={[
        styles.base,
        styles.surface,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    borderRadius: 18,
  },
  surface: {
    borderWidth: 1,
  },
  hero: {
    borderRadius: 20,
  },
});
