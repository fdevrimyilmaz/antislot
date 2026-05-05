import { Fonts, Radius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type PlanId = "monthly" | "quarterly" | "semiannual" | "yearly";

export type PlanItem = {
  id: PlanId;
  label: string;
  sublabel?: string;
  badge?: string;
  priceLabel?: string;
  originalPriceLabel?: string;
  valueNote?: string;
  ctaLabel?: string;
  highlight?: boolean;
  disabled?: boolean;
  disabledLabel?: string;
};

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: "monthly",
    label: "Monthly Premium",
    sublabel: "Build a daily protection routine",
    ctaLabel: "Start Monthly",
  },
  {
    id: "quarterly",
    label: "3-Month Premium",
    sublabel: "Stay consistent for 90 days",
    ctaLabel: "Choose 3 Months",
  },
  {
    id: "semiannual",
    label: "6-Month Premium",
    sublabel: "Half-year structured protection",
    ctaLabel: "Choose 6 Months",
  },
  {
    id: "yearly",
    label: "Yearly Premium",
    sublabel: "Best value for consistent recovery",
    badge: "Best Value",
    ctaLabel: "Choose Yearly",
    highlight: true,
  },
];

type PremiumPlanCardsProps = {
  isPremiumActive: boolean;
  activePlanId?: PlanId | null;
  onMonthly: () => void;
  onQuarterly: () => void;
  onSemiannual: () => void;
  onYearly: () => void;
  plans?: PlanItem[];
  activeLabel?: string;
  selectLabel?: string;
  activeOtherLabel?: string;
};

export function PremiumPlanCards({
  isPremiumActive,
  activePlanId = null,
  onMonthly,
  onQuarterly,
  onSemiannual,
  onYearly,
  plans = DEFAULT_PLANS,
  activeLabel = "Premium Active",
  selectLabel = "Choose Plan",
  activeOtherLabel = "Current account active",
}: PremiumPlanCardsProps) {
  const { colors } = useTheme();

  const handlers: Record<PlanId, () => void> = {
    monthly: onMonthly,
    quarterly: onQuarterly,
    semiannual: onSemiannual,
    yearly: onYearly,
  };

  return (
    <View style={styles.container}>
      {plans.map((plan) => {
        const onPress = handlers[plan.id];
        const isCurrentPlan = isPremiumActive && activePlanId === plan.id;
        const disabled = isPremiumActive || !!plan.disabled;
        const cardStroke =
          isCurrentPlan || plan.highlight ? colors.primary : colors.border;
        const showGradient = (plan.highlight || isCurrentPlan) && !plan.disabled;
        const statusBadge = isCurrentPlan ? activeLabel : plan.badge;
        const ctaText = isPremiumActive
          ? isCurrentPlan
            ? activeLabel
            : activeOtherLabel
          : (plan.ctaLabel ?? selectLabel);
        const showDisabledOverlay =
          (isPremiumActive && !isCurrentPlan) || (!isPremiumActive && !!plan.disabled);
        const disabledOverlayText = isPremiumActive
          ? activeOtherLabel
          : (plan.disabledLabel ?? plan.ctaLabel ?? selectLabel);

        return (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.card,
              plan.disabled && styles.cardDisabled,
              { backgroundColor: colors.card, borderColor: cardStroke },
            ]}
            activeOpacity={0.85}
            onPress={onPress}
            disabled={disabled}
            testID={`premium-plan-${plan.id}`}
            accessibilityRole="button"
            accessibilityLabel={plan.label}
            accessibilityState={{ disabled }}
          >
            {showGradient ? (
              <LinearGradient
                colors={[colors.primary, colors.secondary] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
              >
                <View style={styles.cardContent}>
                  <View style={styles.headerRow}>
                    <View style={styles.titleWrap}>
                      <Text style={styles.planLabel}>{plan.label}</Text>
                      {!!plan.sublabel && (
                        <Text style={styles.planSubLabel}>{plan.sublabel}</Text>
                      )}
                    </View>
                    <View style={styles.priceWrap}>
                      {!!plan.priceLabel && (
                        <Text style={styles.priceLabel}>{plan.priceLabel}</Text>
                      )}
                      {!!plan.originalPriceLabel && (
                        <Text style={styles.originalPriceLabel}>
                          {plan.originalPriceLabel}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.footerRow}>
                    <Text style={styles.valueNote}>
                      {plan.valueNote ?? " "}
                    </Text>
                    <Text style={styles.ctaText}>{ctaText}</Text>
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                  <View style={styles.titleWrap}>
                    <View style={styles.titleLine}>
                      <Text style={[styles.planLabel, { color: colors.text }]}>
                        {plan.label}
                      </Text>
                      {statusBadge ? (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: `${colors.primary}1A`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: colors.primary },
                            ]}
                          >
                            {statusBadge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {!!plan.sublabel && (
                      <Text
                        style={[
                          styles.planSubLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {plan.sublabel}
                      </Text>
                    )}
                  </View>
                  <View style={styles.priceWrap}>
                    {!!plan.priceLabel && (
                      <Text style={[styles.priceLabel, { color: colors.text }]}>
                        {plan.priceLabel}
                      </Text>
                    )}
                    {!!plan.originalPriceLabel && (
                      <Text
                        style={[
                          styles.originalPriceLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {plan.originalPriceLabel}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.footerRow}>
                  <Text
                    style={[styles.valueNote, { color: colors.textSecondary }]}
                  >
                    {plan.valueNote ?? " "}
                  </Text>
                  <View
                    style={[
                      styles.ctaPill,
                      {
                        borderColor: colors.primary,
                        backgroundColor: `${colors.primary}14`,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.ctaPillText, { color: colors.primary }]}
                    >
                      {ctaText}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            {showDisabledOverlay ? (
              <View
                style={[
                  styles.disabledOverlay,
                  { backgroundColor: `${colors.background}80` },
                ]}
              >
                <Text
                  style={[
                    styles.disabledOverlayText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {disabledOverlayText}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", marginBottom: 20, gap: 12 },
  card: {
    width: "100%",
    borderRadius: Radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardDisabled: { opacity: 0.72 },
  gradient: { padding: 16 },
  cardContent: { padding: 16, gap: 14 },
  headerRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleWrap: { flex: 1, gap: 6 },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
  planLabel: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 20,
    color: "#FFFFFF",
    flexShrink: 1,
  },
  planSubLabel: {
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 17,
    color: "rgba(255,255,255,0.9)",
  },
  priceWrap: { alignItems: "flex-end", maxWidth: "44%", gap: 2 },
  priceLabel: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 22,
    color: "#FFFFFF",
    textAlign: "right",
  },
  originalPriceLabel: {
    fontSize: 11,
    fontFamily: Fonts.body,
    lineHeight: 14,
    textDecorationLine: "line-through",
    color: "rgba(255,255,255,0.75)",
    textAlign: "right",
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  valueNote: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.body,
    color: "rgba(255,255,255,0.9)",
  },
  ctaText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.bodySemiBold,
    color: "#FFFFFF",
  },
  ctaPill: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ctaPillText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledOverlayText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
});
