import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { Fonts, Radius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

type SectionTone = "primary" | "warning" | "danger" | "success" | "neutral";

type SectionLeadProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  badge?: string;
  tone?: SectionTone;
  style?: StyleProp<ViewStyle>;
};

function resolveToneColor(tone: SectionTone, fallback: string): string {
  if (tone === "warning") return "#D97706";
  if (tone === "danger") return "#B33A1B";
  if (tone === "success") return "#0D8A6E";
  if (tone === "neutral") return "#64748B";
  return fallback;
}

export function SectionLead({
  icon,
  title,
  subtitle,
  badge,
  tone = "primary",
  style,
}: SectionLeadProps) {
  const { colors } = useTheme();
  const accent = resolveToneColor(tone, colors.primary);

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: `${accent}40`,
          backgroundColor: `${accent}14`,
        },
        style,
      ]}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            {
              borderColor: `${accent}55`,
              backgroundColor: `${accent}24`,
            },
          ]}
        >
          <Ionicons name={icon} size={16} color={accent} />
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>

        {badge ? (
          <View style={[styles.badge, { borderColor: `${accent}55`, backgroundColor: `${accent}20` }]}>
            <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.body,
  },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
});
