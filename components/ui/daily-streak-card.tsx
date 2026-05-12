import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";

type DailyStreakCardProps = {
  days: number;
  /** Headline shown above the motivation copy (e.g. "BUGÜN YENİ BİR BAŞLANGIÇ"). */
  headline: string;
  /** Longer supportive line (e.g. "İlk adımı attın. 10 dakika bile çok değerli."). */
  message: string;
};

const MONTHS = ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"];

export function DailyStreakCard({ days, headline, message }: DailyStreakCardProps) {
  const { colors } = useTheme();
  const now = new Date();
  const month = MONTHS[now.getMonth()] ?? MONTHS[0];
  const day = now.getDate();

  return (
    <LinearGradient
      colors={colors.heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
      accessible
      accessibilityLabel={`${days} gün. ${headline}. ${message}`}
    >
      {/* Decorative big-circle motif behind */}
      <View style={styles.decorCircleLg} pointerEvents="none" />
      <View style={styles.decorCircleSm} pointerEvents="none" />

      {/* Top sparkle row */}
      <View style={styles.sparkleRow} pointerEvents="none">
        <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.9)" />
        <View style={styles.sparkleDot} />
      </View>

      <View style={styles.content}>
        <View style={styles.leftCol}>
          <Text style={styles.daysNumber}>{days}</Text>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.calendar}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarMonth}>{month}</Text>
            </View>
            <View style={styles.calendarBody}>
              <Text style={styles.calendarDay}>{day}</Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  decorCircleLg: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
    right: -40,
    top: -30,
  },
  decorCircleSm: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.07)",
    right: 60,
    top: 70,
  },
  sparkleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  sparkleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  leftCol: {
    flex: 1,
    minWidth: 0,
  },
  daysNumber: {
    color: "#FFFFFF",
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 60,
    letterSpacing: -1,
    marginBottom: 6,
  },
  headline: {
    color: "rgba(255,255,255,0.94)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  message: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  rightCol: {
    alignItems: "flex-end",
  },
  calendar: {
    width: 58,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  calendarHeader: {
    width: "100%",
    backgroundColor: "#E05858",
    paddingVertical: 3,
    alignItems: "center",
  },
  calendarMonth: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
  calendarBody: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 8,
  },
  calendarDay: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1F2937",
  },
});
