import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

export type StatusTone = "active" | "trial" | "inactive" | "neutral" | "info";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  style?: StyleProp<ViewStyle>;
};

const TONE_STYLES: Record<StatusTone, { background: string; text: string }> = {
  active: { background: "#D1FADF", text: "#027A48" },
  trial: { background: "#FEF0C7", text: "#B54708" },
  inactive: { background: "#FEE4E2", text: "#B42318" },
  neutral: { background: "#F2F4F7", text: "#667085" },
  info: { background: "#E0F2FE", text: "#0369A1" },
};

export function StatusBadge({ label, tone = "neutral", style }: StatusBadgeProps) {
  const palette = TONE_STYLES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }, style]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
