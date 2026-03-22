import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GradientProgressBar } from "./GradientProgressBar";
import { COLORS, GRADIENTS, progressCardStyles } from "./styles";

type Props = {
  weekCleanCount: number;
  totalDaysInWeek?: number;
};

export function WeeklySummaryCard({ weekCleanCount, totalDaysInWeek = 7 }: Props) {
  const pct = totalDaysInWeek > 0 ? weekCleanCount / totalDaysInWeek : 0;
  const pctNum = Math.round(pct * 100);
  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <View style={styles.titleRow}>
        <View style={styles.titleAccent} />
        <Text style={styles.title}>Bu hafta (son 7 gün)</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.statWrap}>
          <LinearGradient
            colors={[...GRADIENTS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statBox}
          >
            <Text style={styles.number}>{weekCleanCount}</Text>
            <Text style={styles.label}>temiz gün</Text>
          </LinearGradient>
        </View>
        <View style={styles.divider} />
        <View style={styles.statWrap}>
          <LinearGradient
            colors={[...GRADIENTS.success]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statBox}
          >
            <Text style={styles.number}>{pctNum}%</Text>
            <Text style={styles.label}>doluluk</Text>
          </LinearGradient>
        </View>
      </View>
      <View style={styles.barWrap}>
        <GradientProgressBar progress={pct} height={10} gradient={GRADIENTS.primary} />
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
  row: { flexDirection: "row", alignItems: "stretch", marginBottom: 14 },
  statWrap: { flex: 1 },
  statBox: {
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    minHeight: 88,
    justifyContent: "center",
  },
  number: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  label: { fontSize: 12, color: "rgba(255,255,255,0.95)", marginTop: 6, fontWeight: "600" },
  divider: { width: 2, backgroundColor: COLORS.border, marginHorizontal: 8, borderRadius: 1 },
  barWrap: { marginTop: 4 },
});
