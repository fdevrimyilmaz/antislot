import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  meta?: string;
};

export function SectionHeader({ title, subtitle, icon, meta }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.titleGroup}>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={colors.primary}
              style={styles.icon}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ) : null}
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
        </View>
        {meta ? (
          <Text
            style={[styles.meta, { color: colors.primary }]}
            accessibilityLabel={`${title}: ${meta}`}
          >
            {meta}
          </Text>
        ) : null}
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    flexShrink: 1,
  },
  meta: {
    fontSize: 13,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
});
