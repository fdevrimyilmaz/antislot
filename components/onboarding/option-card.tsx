import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  type?: "check" | "radio";
};

export function OptionCard({ label, selected, onPress, type = "check" }: OptionCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: selected ? `${colors.primary}12` : colors.card,
          borderColor: selected ? colors.primary : colors.cardBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole={type === "radio" ? "radio" : "checkbox"}
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={label}
    >
      {type === "check" ? (
        <View
          style={[
            styles.box,
            {
              borderColor: colors.primary,
              backgroundColor: selected ? colors.primary : "transparent",
            },
          ]}
        >
          {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
        </View>
      ) : (
        <View style={[styles.radioOuter, { borderColor: colors.primary }]}>
          {selected ? (
            <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
          ) : null}
        </View>
      )}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
});
