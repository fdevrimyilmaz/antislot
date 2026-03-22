import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, progressCardStyles } from "./styles";

type Props = {
  totalCleanDaysAllTime: number;
};

export function AllTimeCard({ totalCleanDaysAllTime }: Props) {
  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <View style={styles.titleRow}>
        <View style={styles.titleAccent} />
        <Text style={styles.title}>Toplam temiz gün</Text>
      </View>
      <LinearGradient
        colors={["#F0F9FF", "#E0F2FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.contentWrap}
      >
        <View style={styles.numberWrap}>
          <Text style={styles.number}>{totalCleanDaysAllTime}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Tüm zamanlar</Text>
          </View>
        </View>
        <View style={styles.decoDots}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.decoDot, { opacity: 0.15 + i * 0.1 }]} />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  titleAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.primary, letterSpacing: 0.2 },
  contentWrap: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(29, 76, 114, 0.12)",
  },
  numberWrap: { alignItems: "center" },
  number: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -1,
    textShadowColor: "rgba(29, 76, 114, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badge: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "rgba(29, 76, 114, 0.12)",
    borderRadius: 20,
  },
  badgeText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  decoDots: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -20,
    gap: 8,
  },
  decoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
