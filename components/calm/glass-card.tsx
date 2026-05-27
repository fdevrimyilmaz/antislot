import React from "react";
import { StyleSheet, View, type ViewProps, type ViewStyle } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { Space } from "./tokens";

interface GlassCardProps extends ViewProps {
  variant?: "default" | "hero";
}

/**
 * Soft glassmorphism container. We don't use `BlurView` — RN's blur
 * adds overhead and on Android frequently looks worse than a tuned
 * translucent fill. The look comes from:
 *   - low-opacity white-on-card fill
 *   - hairline 1px border in primary tint
 *   - large radius (28) so corners feel hand-drawn rather than CSS-snapped
 *   - generous internal padding so content has space to breathe
 *
 * `hero` doubles the padding for the streak hero on Home.
 */
export function GlassCard({
  variant = "default",
  style,
  children,
  ...rest
}: GlassCardProps) {
  const { colors } = useTheme();
  const isHero = variant === "hero";

  const composedStyle: ViewStyle = {
    backgroundColor: `${colors.card}AA`,
    borderColor: `${colors.primary}26`,
    padding: isHero ? Space.xl : Space.lg + 4,
    shadowColor: colors.primary,
  };

  return (
    <View style={[styles.base, composedStyle, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 28,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
});
