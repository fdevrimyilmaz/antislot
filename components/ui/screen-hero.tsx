import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { Fonts, Radius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

type ScreenHeroProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  gradient?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function ScreenHero({
  icon,
  title,
  subtitle,
  description,
  badge,
  gradient,
  style,
  compact = false,
}: ScreenHeroProps) {
  const { colors } = useTheme();
  const heroGradient: [string, string, ...string[]] = gradient
    ? [gradient[0], gradient[1], ...gradient.slice(2)]
    : [colors.primary, colors.secondary ?? colors.primary];

  return (
    <LinearGradient
      colors={heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, compact ? styles.cardCompact : null, style]}
    >
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <Ionicons
        name={icon}
        size={compact ? 64 : 80}
        color="rgba(255, 255, 255, 0.18)"
        style={styles.watermark}
      />

      <View style={styles.topRow}>
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={compact ? 16 : 18} color="#F8FAFC" />
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, compact ? styles.titleCompact : null]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, compact ? styles.subtitleCompact : null]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {description ? (
          <Text style={styles.description} numberOfLines={compact ? 1 : 3}>
            {description}
          </Text>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 146,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 0.24)",
  },
  cardCompact: {
    minHeight: 112,
    paddingVertical: 12,
  },
  glowTop: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    right: -34,
    top: -38,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  glowBottom: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 999,
    left: -30,
    bottom: -28,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  watermark: {
    position: "absolute",
    right: -6,
    bottom: -10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 0.5)",
    backgroundColor: "rgba(15, 23, 42, 0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(15, 23, 42, 0.26)",
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 0.42)",
  },
  badgeText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  textWrap: {
    marginTop: 12,
    gap: 4,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.2,
  },
  titleCompact: {
    fontSize: 16,
  },
  subtitle: {
    color: "rgba(248, 250, 252, 0.95)",
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    lineHeight: 18,
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  description: {
    color: "rgba(226, 232, 240, 0.95)",
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 17,
  },
});
