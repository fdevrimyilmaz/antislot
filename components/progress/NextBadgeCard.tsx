import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { GradientProgressBar } from "./GradientProgressBar";
import { COLORS, GRADIENTS, progressCardStyles } from "./styles";

type Props = {
  currentCleanDays: number;
  nextBadgeTarget: number;
};

export function NextBadgeCard({ currentCleanDays, nextBadgeTarget }: Props) {
  const progress = nextBadgeTarget > 0 ? Math.min(1, currentCleanDays / nextBadgeTarget) : 0;
  const unlocked = currentCleanDays >= nextBadgeTarget;
  const scaleAnim = useRef(new Animated.Value(unlocked ? 1 : 0.92)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: unlocked ? 1 : 0.92,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  }, [unlocked, scaleAnim]);

  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <LinearGradient
        colors={[...GRADIENTS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentStrip}
      />
      <View style={styles.header}>
        <Text style={styles.title}>Sonraki Kupa</Text>
        <Text style={styles.subtitle}>{nextBadgeTarget} gün temiz</Text>
      </View>
      <View style={styles.badgeRow}>
        <Animated.View style={[styles.badgeWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.badgeOuter, unlocked && styles.badgeOuterUnlocked]}>
            <View style={[styles.badge, unlocked && styles.badgeUnlocked]}>
              <Text style={styles.badgeIcon}>{unlocked ? "🏆" : "🔒"}</Text>
            </View>
          </View>
        </Animated.View>
        <View style={styles.progressWrap}>
          <GradientProgressBar progress={progress} height={10} gradient={GRADIENTS.primary} />
          <Text style={styles.fraction}>
            {currentCleanDays} / {nextBadgeTarget} gün
          </Text>
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
  header: { marginBottom: 14 },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.primary, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  badgeWrap: { alignSelf: "flex-start" },
  badgeOuter: {
    padding: 3,
    borderRadius: 32,
    backgroundColor: COLORS.border,
  },
  badgeOuterUnlocked: {
    backgroundColor: COLORS.goldLight,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeUnlocked: { backgroundColor: "#FEF9C3" },
  badgeIcon: { fontSize: 30 },
  progressWrap: { flex: 1 },
  fraction: { fontSize: 12, color: "#64748B", marginTop: 8, fontWeight: "600" },
});
