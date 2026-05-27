import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/contexts/ThemeContext";

/**
 * The full-screen base for every calm screen. A three-stop vertical
 * gradient using the active theme's `backgroundGradient`, plus two soft
 * radial-feel glow blobs to give depth without distracting illustrations.
 *
 * Don't put borders or sharp shapes on top of this — the screen should
 * feel like one continuous surface.
 */
export function CalmBackground({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.fill}
    >
      <View pointerEvents="none" style={styles.glowsLayer}>
        <View
          style={[
            styles.glowOne,
            { backgroundColor: `${colors.primary}22` },
          ]}
        />
        <View
          style={[
            styles.glowTwo,
            { backgroundColor: `${colors.accent}14` },
          ]}
        />
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  glowsLayer: { ...StyleSheet.absoluteFillObject },
  glowOne: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.9,
  },
  glowTwo: {
    position: "absolute",
    bottom: -160,
    left: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    opacity: 0.9,
  },
});
