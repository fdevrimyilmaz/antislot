import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, type DimensionValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { haptics } from "@/services/haptics";

export type HomeCardTone =
  | "coral"
  | "teal"
  | "indigo"
  | "emerald"
  | "ocean"
  | "slate"
  | "amber"
  | "violet";

type HomeCardProps = {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  decorativeIcon?: React.ComponentProps<typeof Ionicons>["name"];
  tone: HomeCardTone;
  onPress: () => void;
  height?: number;
  width?: DimensionValue;
  locked?: boolean;
  accessibilityLabel?: string;
};

type ToneTokens = {
  gradient: readonly [string, string, ...string[]];
  decorTint: string;
  accentLine: string;
};

const TONES: Record<HomeCardTone, ToneTokens> = {
  coral: {
    gradient: ["#B14040", "#A03838", "#8E2F2F"] as const,
    decorTint: "rgba(255,255,255,0.22)",
    accentLine: "#FF8A66",
  },
  teal: {
    gradient: ["#2A6B6E", "#1F5A5D", "#194B4E"] as const,
    decorTint: "rgba(255,255,255,0.22)",
    accentLine: "#5EE0C7",
  },
  indigo: {
    gradient: ["#2B4A82", "#22407A", "#1B3568"] as const,
    decorTint: "rgba(255,255,255,0.22)",
    accentLine: "#7AB3FF",
  },
  emerald: {
    gradient: ["#1F6B4E", "#185A41", "#134B36"] as const,
    decorTint: "rgba(255,255,255,0.22)",
    accentLine: "#6DE2A5",
  },
  ocean: {
    gradient: ["#264D8A", "#1F4378", "#173460"] as const,
    decorTint: "rgba(255,255,255,0.22)",
    accentLine: "#7BB8FF",
  },
  slate: {
    gradient: ["#4A5566", "#3F4858", "#353C49"] as const,
    decorTint: "rgba(255,255,255,0.18)",
    accentLine: "#9DAFC6",
  },
  amber: {
    gradient: ["#8B6614", "#7A580F", "#6A4B0B"] as const,
    decorTint: "rgba(255,255,255,0.22)",
    accentLine: "#FFD074",
  },
  violet: {
    gradient: ["#4A4F8A", "#3F4477", "#353A66"] as const,
    decorTint: "rgba(255,255,255,0.22)",
    accentLine: "#A7AEFF",
  },
};

export function HomeCard({
  title,
  subtitle,
  icon,
  decorativeIcon,
  tone,
  onPress,
  height = 160,
  width = "48%",
  locked = false,
  accessibilityLabel,
}: HomeCardProps) {
  const tokens = TONES[tone];

  const handlePress = () => {
    haptics.tapLight();
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
      accessibilityState={{ disabled: locked }}
      style={[styles.touch, { width, height }]}
    >
      <LinearGradient
        colors={tokens.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative oversized icon in bottom-right */}
        {decorativeIcon ? (
          <View style={styles.decorWrap} pointerEvents="none">
            <Ionicons name={decorativeIcon} size={130} color={tokens.decorTint} />
          </View>
        ) : null}

        {/* Top row: leading icon + trailing arrow */}
        <View style={styles.topRow}>
          <View style={styles.iconBubble}>
            <Ionicons name={icon} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.arrowBubble}>
            <Ionicons
              name={locked ? "lock-closed" : "arrow-forward"}
              size={16}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* Bottom: title + subtitle */}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {subtitle ? (
            <View style={[styles.accentLine, { backgroundColor: tokens.accentLine }]} />
          ) : null}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    marginBottom: 14,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  decorWrap: {
    position: "absolute",
    right: -28,
    bottom: -20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    marginTop: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 4,
  },
  accentLine: {
    height: 2,
    width: 42,
    borderRadius: 2,
    marginTop: 8,
    opacity: 0.9,
  },
});
