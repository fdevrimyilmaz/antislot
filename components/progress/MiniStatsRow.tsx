import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GRADIENTS, progressCardStyles } from "./styles";

type Props = {
  cleanToday: boolean;
  currentStreak: number;
  bestStreak: number;
};

const StatBox = ({
  icon,
  value,
  label,
  gradient,
}: {
  icon: string;
  value: string | number;
  label: string;
  gradient: readonly [string, string, ...string[]];
}) => (
  <View style={styles.boxOuter}>
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.boxGradient}
    >
      <View style={styles.boxInner}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </LinearGradient>
  </View>
);

export function MiniStatsRow({ cleanToday, currentStreak, bestStreak }: Props) {
  return (
    <View style={[progressCardStyles.card, styles.row]}>
      <StatBox
        icon="📅"
        value={cleanToday ? 1 : 0}
        label="Bugün"
        gradient={cleanToday ? GRADIENTS.success : GRADIENTS.muted}
      />
      <StatBox
        icon="🔥"
        value={currentStreak}
        label="Seri"
        gradient={GRADIENTS.warm}
      />
      <StatBox
        icon="⭐"
        value={bestStreak}
        label="En iyi seri"
        gradient={GRADIENTS.gold}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 10,
  },
  boxOuter: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    ...progressCardStyles.cardShadow,
  },
  boxGradient: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    minHeight: 88,
  },
  boxInner: { alignItems: "center" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: { fontSize: 18 },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  label: { fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 4, fontWeight: "600" },
});
