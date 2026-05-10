import React from "react";
import { StyleSheet, View } from "react-native";

type ThemeTextureProps = {
  primary: string;
  secondary: string;
  accent: string;
};

export function ThemeTexture({ primary, secondary, accent }: ThemeTextureProps) {
  const dots = Array.from({ length: 30 }, (_, index) => index);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={[styles.blobTopLeft, { backgroundColor: primary + "22" }]} />
      <View style={[styles.blobTopRight, { backgroundColor: secondary + "1C" }]} />
      <View style={[styles.blobBottom, { backgroundColor: accent + "1A" }]} />

      <View style={styles.dotGrid}>
        {dots.map((item) => (
          <View key={item} style={[styles.dot, { backgroundColor: accent + "55" }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blobTopLeft: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -90,
    left: -70,
  },
  blobTopRight: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    top: 110,
    right: -70,
  },
  blobBottom: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: -150,
    left: 30,
  },
  dotGrid: {
    position: "absolute",
    right: 14,
    bottom: 140,
    width: 96,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
