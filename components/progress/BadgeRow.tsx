import { BADGE_MILESTONES } from "@/store/progressStore";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, GRADIENTS, progressCardStyles } from "./styles";

type Props = {
  bestStreak: number;
};

export function BadgeRow({ bestStreak }: Props) {
  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <View style={styles.titleRow}>
        <View style={styles.titleAccent} />
        <Text style={styles.title}>Kupalar</Text>
      </View>
      <View style={styles.row}>
        {BADGE_MILESTONES.map((days) => {
          const unlocked = bestStreak >= days;
          return (
            <View key={days} style={styles.badgeWrap}>
              {unlocked ? (
                <LinearGradient
                  colors={[...GRADIENTS.gold]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.badgeBox, styles.badgeUnlocked]}
                >
                  <View style={styles.badgeInner}>
                    <Text style={styles.badgeIcon}>🏆</Text>
                    <Text style={styles.badgeLabelUnlocked}>{days}g</Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.badgeBox, styles.badgeLocked]}>
                  <Text style={styles.badgeIcon}>🔒</Text>
                  <Text style={styles.badgeLabel}>{days}g</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 },
  titleAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.primary, letterSpacing: 0.2 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  badgeWrap: { flex: 1 },
  badgeBox: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    minHeight: 80,
    justifyContent: "center",
  },
  badgeLocked: {
    backgroundColor: "#E2E8F0",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeUnlocked: {
    borderWidth: 0,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeInner: { alignItems: "center" },
  badgeIcon: { fontSize: 28, marginBottom: 6 },
  badgeLabel: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  badgeLabelUnlocked: { fontSize: 12, fontWeight: "800", color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.2)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
});
