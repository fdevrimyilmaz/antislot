import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { GradientProgressBar } from "./GradientProgressBar";
import { COLORS, GRADIENTS, progressCardStyles } from "./styles";

const XP_PER_LEVEL = 100;

type Props = {
  xp: number;
  level: number;
  nextLevelXP: number;
  xpInLevel: number;
};

export function GamificationCard({ xp, level, nextLevelXP, xpInLevel }: Props) {
  const progress = XP_PER_LEVEL > 0 ? xpInLevel / XP_PER_LEVEL : 0;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (level > 0) {
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 180, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [level, pulse]);

  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <LinearGradient
        colors={[...GRADIENTS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentStrip}
      />
      <Text style={styles.title}>Seviye</Text>
      <View style={styles.levelRow}>
        <Animated.View style={[styles.levelBadgeWrap, { transform: [{ scale: pulse }] }]}>
          <LinearGradient
            colors={[...GRADIENTS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelBadge}
          >
            <Text style={styles.levelNumber}>{level}</Text>
          </LinearGradient>
        </Animated.View>
        <View style={styles.xpWrap}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>XP (toplam: {xp})</Text>
            <Text style={styles.xpValue}>
              {xpInLevel} / {XP_PER_LEVEL}
            </Text>
          </View>
          <GradientProgressBar progress={progress} gradient={GRADIENTS.primary} height={10} />
          <Text style={styles.nextLevelHint}>Sıradaki seviye: {(level + 1) * XP_PER_LEVEL} XP</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14, position: "relative" },
  accentStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.primary, marginBottom: 14, letterSpacing: 0.2 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  levelBadgeWrap: {},
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  levelNumber: { fontSize: 26, fontWeight: "800", color: "#FFFFFF" },
  xpWrap: { flex: 1 },
  xpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  xpLabel: { fontSize: 12, color: "#64748B" },
  xpValue: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  nextLevelHint: { fontSize: 11, color: "#94A3B8", marginTop: 8 },
});
