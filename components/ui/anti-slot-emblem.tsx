import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type AntiSlotEmblemProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function AntiSlotEmblem({
  size = 36,
  style,
  accessibilityLabel = "Antislot emblem icon",
}: AntiSlotEmblemProps) {
  const coreSize = Math.round(size * 0.74);
  const badgeSize = Math.max(12, Math.round(size * 0.38));
  const symbolSize = Math.max(11, Math.round(size * 0.34));
  const slashWidth = Math.max(2, Math.round(size * 0.09));
  const slashHeight = Math.round(size * 0.66);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, { width: size, height: size }, style]}
    >
      <LinearGradient
        colors={["#0F5B7A", "#0B2D4A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.outer, { borderRadius: size / 2 }]}
      >
        <LinearGradient
          colors={["#1E6F95", "#133A5A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.core, { width: coreSize, height: coreSize, borderRadius: coreSize / 2 }]}
        >
          <Ionicons name="dice-outline" size={symbolSize} color="#F8FAFC" />
          <View
            style={[
              styles.blockSlash,
              {
                width: slashWidth,
                height: slashHeight,
                borderRadius: slashWidth / 2,
                top: (coreSize - slashHeight) / 2,
              },
            ]}
          />
        </LinearGradient>

        <View
          style={[
            styles.guardBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              right: -Math.round(size * 0.04),
              bottom: -Math.round(size * 0.04),
            },
          ]}
        >
          <LinearGradient
            colors={["#D14343", "#9F1239"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.guardBadgeGradient, { borderRadius: badgeSize / 2 }]}
          >
            <Ionicons name="shield-checkmark" size={Math.round(badgeSize * 0.5)} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
  },
  outer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B2D4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  core: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(248, 250, 252, 0.28)",
  },
  blockSlash: {
    position: "absolute",
    backgroundColor: "#F97316",
    opacity: 0.95,
    transform: [{ rotate: "38deg" }],
  },
  guardBadge: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    overflow: "hidden",
  },
  guardBadgeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
