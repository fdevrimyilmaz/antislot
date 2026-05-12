import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";

export type PremiumPlanId = "monthly" | "quarterly" | "semiannual" | "annual";

type PremiumPlanCardProps = {
  id: PremiumPlanId;
  title: string;
  subtitle: string;
  /** Whether the card is the highlighted "best" plan. */
  best?: boolean;
  /** Whether this card is currently selected. */
  selected?: boolean;
  /** Price label (or fallback like "Mağaza bağlantısı yok"). */
  priceLabel: string;
  /** Optional secondary price line (e.g. "₺40 / ay"). */
  priceHint?: string;
  /** Optional discount badge (e.g. "−50%"). */
  saveLabel?: string;
  /** Whether store products are available. When false, the CTA is disabled. */
  available?: boolean;
  onPress: () => void;
};

export function PremiumPlanCard({
  title,
  subtitle,
  best = false,
  selected = false,
  priceLabel,
  priceHint,
  saveLabel,
  available = true,
  onPress,
}: PremiumPlanCardProps) {
  const { colors } = useTheme();

  const borderColor = best
    ? colors.warning
    : selected
    ? colors.primary
    : colors.cardBorder;

  const handlePress = () => {
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor,
          borderWidth: best || selected ? 2 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${subtitle}. ${priceLabel}`}
      accessibilityState={{ selected, disabled: !available }}
    >
      {best ? (
        <View style={styles.bestRibbon}>
          <LinearGradient
            colors={[colors.warning, "#F59E0B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bestPill}
          >
            <Ionicons name="star" size={11} color="#FFFFFF" />
            <Text style={styles.bestText}>EN İYİ DEĞER</Text>
          </LinearGradient>
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
          {saveLabel ? (
            <View style={[styles.saveBadge, { backgroundColor: `${colors.success}1F` }]}>
              <Ionicons name="trending-down" size={11} color={colors.success} />
              <Text style={[styles.saveText, { color: colors.success }]}>{saveLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.right}>
          {available ? (
            <>
              <Text style={[styles.price, { color: colors.text }]}>{priceLabel}</Text>
              {priceHint ? (
                <Text style={[styles.priceHint, { color: colors.textMuted }]}>{priceHint}</Text>
              ) : null}
            </>
          ) : (
            <View style={[styles.unavailableChip, { backgroundColor: `${colors.textMuted}14` }]}>
              <Ionicons name="cloud-offline-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.unavailableText, { color: colors.textMuted }]}>
                Yakında
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    paddingTop: 18,
    overflow: "hidden",
    position: "relative",
  },
  bestRibbon: {
    position: "absolute",
    top: -1,
    right: 14,
    zIndex: 2,
  },
  bestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  bestText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  left: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  saveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  saveText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  right: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  price: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  priceHint: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  unavailableChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
