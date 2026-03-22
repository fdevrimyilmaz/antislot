import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import type { ExploreModuleMeta } from "@/types/explore";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ModuleCard } from "./ModuleCard";

export function ModuleSection({
  title,
  modules,
}: {
  title: string;
  modules: ExploreModuleMeta[];
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={styles.grid}>
        {modules.map((module) => (
          <View key={module.id} style={styles.cardFlex}>
            <ModuleCard module={module} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cardFlex: {
    flex: 1,
    minWidth: "47%",
    maxWidth: "47%",
  },
});
