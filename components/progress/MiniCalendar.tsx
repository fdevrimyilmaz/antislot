import type { DayStatus } from "@/store/progressStore";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS, GRADIENTS, progressCardStyles } from "./styles";

type DayEntry = { date: string; status: DayStatus };

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

type Props = {
  last7Days: DayEntry[];
};

function DayDot({ status }: { status: DayStatus }) {
  if (status === "clean") {
    return (
      <View style={styles.dotWrap}>
        <LinearGradient
          colors={[...GRADIENTS.success]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dotClean}
        />
        <View style={styles.dotCleanInner} />
      </View>
    );
  }
  if (status === "reset") {
    return (
      <View style={[styles.dotWrap, styles.dotResetWrap]}>
        <View style={styles.dotReset} />
      </View>
    );
  }
  return <View style={styles.dot} />;
}

export function MiniCalendar({ last7Days }: Props) {
  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <View style={styles.titleRow}>
        <View style={styles.titleAccent} />
        <Text style={styles.title}>Son 7 gün</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {last7Days.map(({ date, status }) => (
          <View key={date} style={styles.dayColumn}>
            <DayDot status={status} />
            <Text style={styles.dayLabel}>{formatDayLabel(date)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 },
  titleAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.primary, letterSpacing: 0.2 },
  scrollContent: { flexDirection: "row", gap: 18, paddingVertical: 6 },
  dayColumn: { alignItems: "center", minWidth: 48 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.muted,
    marginBottom: 8,
    opacity: 0.6,
  },
  dotWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  dotClean: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dotCleanInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotResetWrap: { backgroundColor: "transparent" },
  dotReset: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.dangerLight,
  },
  dayLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },
});
