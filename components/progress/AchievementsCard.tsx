import { BADGE_MILESTONES } from "@/store/progressStore";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GradientProgressBar } from "./GradientProgressBar";
import { COLORS, GRADIENTS, progressCardStyles } from "./styles";

type Props = {
  bestStreak: number;
  currentCleanDays: number;
};

export function AchievementsCard({ bestStreak, currentCleanDays }: Props) {
  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <View style={styles.titleRow}>
        <View style={styles.titleAccent} />
        <Text style={styles.title}>Başarılar</Text>
      </View>
      <View style={styles.list}>
        {BADGE_MILESTONES.map((days, idx) => {
          const unlocked = bestStreak >= days;
          const progress = days > 0 ? Math.min(1, currentCleanDays / days) : 0;
          const inProgress = currentCleanDays < days && currentCleanDays > 0;
          const isLast = idx === BADGE_MILESTONES.length - 1;
          return (
            <View key={days} style={[styles.row, !isLast && styles.rowBorder]}>
              <View style={[styles.iconWrap, unlocked && styles.iconUnlocked]}>
                {unlocked ? (
                  <LinearGradient
                    colors={[...GRADIENTS.success]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                  >
                    <Text style={styles.icon}>✓</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.iconLocked}>○</Text>
                )}
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.label, unlocked && styles.labelUnlocked]}>
                  {days} gün temiz
                </Text>
                {unlocked && (
                  <Text style={styles.sublabel}>En iyi seride ulaşıldı</Text>
                )}
                {inProgress && !unlocked && (
                  <View style={styles.progressWrap}>
                    <GradientProgressBar
                      progress={progress}
                      height={6}
                      gradient={GRADIENTS.primary}
                      borderRadius={3}
                    />
                    <Text style={styles.progressText}>
                      {currentCleanDays} / {days}
                    </Text>
                  </View>
                )}
              </View>
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
  list: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconUnlocked: { overflow: "hidden" },
  iconGradient: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  icon: { fontSize: 14, fontWeight: "800", color: "#FFF" },
  iconLocked: { fontSize: 16, fontWeight: "700", color: "#94A3B8" },
  textWrap: { flex: 1 },
  label: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  labelUnlocked: { color: COLORS.primary },
  sublabel: { fontSize: 11, color: "#22C55E", marginTop: 2, fontWeight: "600" },
  progressWrap: { marginTop: 8 },
  progressText: { fontSize: 11, color: "#64748B", marginTop: 4 },
});
