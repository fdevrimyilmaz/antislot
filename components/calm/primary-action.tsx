import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { Space, Type } from "./tokens";
import { haptics } from "@/services/haptics";

interface PrimaryActionProps {
  title: string;
  onPress: () => void;
  /** Optional one-line helper sentence shown below the title in the pill. */
  hint?: string;
  /** Optional left icon. Keep these rare — most calm screens read better without. */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  /** Use `urgent` for SOS-style red gradient. */
  tone?: "primary" | "urgent" | "soft";
  loading?: boolean;
  disabled?: boolean;
}

/**
 * The single warm CTA per screen. Tall, full-width, peach-gradient by
 * default — the warmth is deliberate against the cool purple background.
 * The whole pill is the tap target; we use `Pressable` for the iOS-style
 * scale-down haptic feel.
 *
 * Rule: only one `<PrimaryAction />` should render per screen. If you
 * need a second action, demote it to plain text or a borderless link.
 */
export function PrimaryAction({
  title,
  onPress,
  hint,
  icon,
  tone = "primary",
  loading,
  disabled,
}: PrimaryActionProps) {
  const { colors } = useTheme();

  const gradient =
    tone === "urgent"
      ? ([colors.danger, "#FF6B6B", "#FF8E8E"] as const)
      : tone === "soft"
      ? ([colors.card, colors.card] as const)
      : ([colors.accent, "#FFA06D"] as const);

  const textColor = tone === "soft" ? colors.text : "#1A0F2E";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        if (disabled || loading) return;
        haptics.tapMedium();
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.pressable,
        {
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.pill,
          tone === "soft" && { borderWidth: 1, borderColor: `${colors.primary}33` },
        ]}
      >
        <View style={styles.row}>
          {icon ? (
            <Ionicons
              name={icon}
              size={22}
              color={textColor}
              style={styles.icon}
            />
          ) : null}
          <View style={styles.textBlock}>
            <Text style={[Type.title, styles.title, { color: textColor }]}>
              {title}
            </Text>
            {hint ? (
              <Text style={[styles.hint, { color: `${textColor}CC` }]}>
                {hint}
              </Text>
            ) : null}
          </View>
          {loading ? (
            <ActivityIndicator color={textColor} style={styles.spinner} />
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
  },
  pill: {
    borderRadius: 22,
    paddingVertical: Space.lg,
    paddingHorizontal: Space.lg + 4,
    minHeight: 72,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
  },
  icon: {
    marginRight: Space.xs,
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2, lineHeight: 22 },
  hint: { marginTop: 2, fontSize: 13, lineHeight: 17, fontWeight: "500" },
  spinner: { marginLeft: Space.sm },
});
