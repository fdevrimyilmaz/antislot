import { Fonts, Radius } from "@/constants/theme";
import { PREMIUM_FEATURE_LABELS, type PremiumFeatureId } from "@/types/premium";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type PremiumFeatureListProps = {
  hasFeature: (id: PremiumFeatureId | string) => boolean;
  title?: string;
  textColor?: string;
  cardColor?: string;
  borderColor?: string;
  labels?: Partial<Record<PremiumFeatureId, string>>;
};

const FEATURE_ORDER: PremiumFeatureId[] = [
  "blocker",
  "premium_sessions",
  "premium_insights",
  "premium_ai_features",
  "live_support",
  "advanced_stats",
];

export function PremiumFeatureList({
  hasFeature,
  title = "Premium ile açılanlar",
  textColor = "#111",
  cardColor = "#fff",
  borderColor = "rgba(0,0,0,0.08)",
  labels,
}: PremiumFeatureListProps) {
  return (
    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <View style={styles.list}>
        {FEATURE_ORDER.map((id) => {
          const unlocked = hasFeature(id);
          const label = labels?.[id] ?? PREMIUM_FEATURE_LABELS[id];
          return (
            <View key={id} style={styles.row}>
              <Text style={styles.icon}>{unlocked ? "✨" : "🔒"}</Text>
              <Text style={[styles.label, { color: textColor }]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: Radius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  list: { gap: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: { fontSize: 22, marginRight: 12 },
  label: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    flex: 1,
    lineHeight: 22,
  },
});
