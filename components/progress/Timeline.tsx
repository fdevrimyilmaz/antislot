import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, GRADIENTS, progressCardStyles } from "./styles";

const MILESTONES = [1, 3, 7, 30];

type Props = {
  currentCleanDays: number;
};

export function Timeline({ currentCleanDays }: Props) {
  return (
    <View style={[progressCardStyles.card, styles.card]}>
      <View style={styles.titleRow}>
        <View style={styles.titleAccent} />
        <Text style={styles.title}>Yol haritası</Text>
      </View>
      <View style={styles.timeline}>
        {MILESTONES.map((day, i) => {
          const reached = currentCleanDays >= day;
          const isNextTarget =
            currentCleanDays < day && (i === 0 || currentCleanDays >= MILESTONES[i - 1]);
          const isActive = reached || isNextTarget;
          return (
            <React.Fragment key={day}>
              <View style={styles.nodeWrap}>
                {isActive ? (
                  <LinearGradient
                    colors={[...GRADIENTS.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.node,
                      styles.nodeActive,
                      isNextTarget && styles.nodeGlow,
                    ]}
                  >
                    <Text style={styles.nodeTextActive}>Gün {day}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.node}>
                    <Text style={styles.nodeText}>Gün {day}</Text>
                  </View>
                )}
              </View>
              {i < MILESTONES.length - 1 && (
                <View style={styles.connectorWrap}>
                  <View style={[styles.connector, reached && styles.connectorFilled]} />
                  {reached && (
                    <View style={styles.connectorDot} />
                  )}
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  titleAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.primary, letterSpacing: 0.2 },
  timeline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nodeWrap: { minWidth: 68 },
  node: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
  },
  nodeActive: {
    borderRadius: 14,
    overflow: "hidden",
  },
  nodeGlow: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  nodeText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  nodeTextActive: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
  connectorWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 6,
    maxWidth: 28,
  },
  connector: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
  },
  connectorFilled: {
    backgroundColor: COLORS.primaryLight,
  },
  connectorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginLeft: -2,
  },
});
