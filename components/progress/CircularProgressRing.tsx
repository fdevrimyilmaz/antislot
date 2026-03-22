import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import { GRADIENTS } from "./styles";

type Props = {
  size: number;
  strokeWidth?: number;
  progress?: number;
  gradient?: readonly [string, string, ...string[]];
  children?: React.ReactNode;
};

/**
 * Circular ring with gradient border; optional inner content.
 * Progress is shown by gradient sweep (simplified: full ring when progress >= 1).
 */
export function CircularProgressRing({
  size,
  strokeWidth = 4,
  progress = 0,
  gradient = GRADIENTS.primary,
  children,
}: Props) {
  const r = size / 2;
  const innerSize = size - strokeWidth * 2;

  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: r, overflow: "hidden" }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientRing, { width: size, height: size, borderRadius: r }]}
      />
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            top: strokeWidth,
            left: strokeWidth,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  gradientRing: {
    position: "absolute",
  },
  inner: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.04)",
  },
});
