import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "@/contexts/ThemeContext";
import { Type, Space } from "./tokens";

interface CalmHeaderProps {
  /** Optional greeting / eyebrow — small uppercase caption above the title. */
  eyebrow?: string;
  /** Big-but-quiet title. Keep it short — one phrase. */
  title: string;
  /** Optional one-line subtitle. Avoid paragraphs here. */
  subtitle?: string;
  /** Show a back chevron. */
  showBack?: boolean;
}

/**
 * Screen header for calm screens. No icons next to the title (would
 * compete with the typography), no right-side icon row, no underline.
 * If you need a settings button, put it as a separate small floating
 * touchable elsewhere — not here.
 */
export function CalmHeader({
  eyebrow,
  title,
  subtitle,
  showBack,
}: CalmHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
      ) : null}
      {eyebrow ? (
        <Text style={[Type.caption, styles.eyebrow, { color: colors.textMuted }]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={[Type.title, { color: colors.text }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[Type.subtitle, styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Space.xl,
  },
  back: {
    marginBottom: Space.md,
    width: 32,
    height: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  eyebrow: {
    marginBottom: Space.sm,
  },
  subtitle: {
    marginTop: Space.sm,
  },
});
