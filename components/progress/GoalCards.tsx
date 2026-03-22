import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GradientProgressBar } from "./GradientProgressBar";
import { COLORS, GRADIENTS, progressCardStyles } from "./styles";

const GOALS = [
  { key: "short", days: 3, label: "3 gün", gradient: GRADIENTS.primary },
  { key: "medium", days: 7, label: "7 gün", gradient: GRADIENTS.primaryShort },
  { key: "mid", days: 14, label: "14 gün", gradient: GRADIENTS.success },
  { key: "long", days: 30, label: "30 gün", gradient: GRADIENTS.gold },
  { key: "extra", days: 60, label: "60 gün", gradient: GRADIENTS.warm },
] as const;

type Props = {
  currentCleanDays: number;
};

function pct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(1, current / target);
}

export function GoalCards({ currentCleanDays }: Props) {
  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <View style={styles.titleRow}>
        <View style={styles.titleAccent} />
        <Text style={styles.title}>Hedefler</Text>
      </View>
      <View style={styles.grid}>
        {GOALS.map(({ key, days, label, gradient }) => {
          const progress = pct(currentCleanDays, days);
          const pctNum = Math.min(100, Math.round(progress * 100));
          const reached = currentCleanDays >= days;
          return (
            <View key={key} style={[styles.goalBox, reached && styles.goalBoxReached]}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalLabel, reached && styles.goalLabelReached]}>{label}</Text>
                <Text style={[styles.goalPct, reached && styles.goalPctReached]}>{pctNum}%</Text>
              </View>
              <GradientProgressBar progress={progress} height={8} gradient={gradient} borderRadius={4} />
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  goalBox: {
    minWidth: "30%",
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalBoxReached: {
    backgroundColor: "#F0F9FF",
    borderColor: COLORS.primaryLight,
  },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  goalLabel: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  goalLabelReached: { color: COLORS.primary },
  goalPct: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  goalPctReached: { color: COLORS.primaryLight },
});
