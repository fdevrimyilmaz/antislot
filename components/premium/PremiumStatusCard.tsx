import { Fonts, Radius } from "@/constants/theme";
import type { PremiumSource, PremiumState } from "@/types/premium";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const STATUS_TONES = {
  active: { background: "#D1FADF", text: "#027A48" },
  trial: { background: "#FEF0C7", text: "#B54708" },
  inactive: { background: "#FEE4E2", text: "#B42318" },
  neutral: { background: "#F2F4F7", text: "#667085" },
} as const;

type PremiumStatusCardProps = {
  state: PremiumState;
  loading?: boolean;
  freeMode?: boolean;
  cardColor?: string;
  borderColor?: string;
  textColor?: string;
  labelColor?: string;
  locale?: string;
  statusLabel?: string;
  loadingBadge?: string;
  loadingValue?: string;
  freeBadge?: string;
  freeValue?: string;
  freeHint?: string;
  inactiveBadge?: string;
  inactiveValue?: string;
  inactiveHint?: string;
  trialBadge?: string;
  trialValue?: string;
  trialHint?: (days: number) => string;
  planLabels?: Partial<Record<PremiumSource, string>>;
  activeFallbackLabel?: string;
  activeValue?: (planLabel: string) => string;
  activeHintLifetime?: string;
  activeHintRenewalPrefix?: string;
  activeHintSubscription?: string;
};

export function PremiumStatusCard({
  state,
  loading = false,
  freeMode = false,
  cardColor = "#fff",
  borderColor = "rgba(0,0,0,0.08)",
  textColor = "#111",
  labelColor = "rgba(0,0,0,0.6)",
  locale = "tr-TR",
  statusLabel = "Durum",
  loadingBadge = "Kontrol",
  loadingValue = "Premium durumu yükleniyor...",
  freeBadge = "Ücretsiz",
  freeValue = "Tüm özellikler şu an herkese açık",
  freeHint = "İleride ücretli planlar sunulabilir.",
  inactiveBadge = "Kapalı",
  inactiveValue = "Premium erişimi kapalı",
  inactiveHint = "Koruma seviyesini yükselt - kilidi aç.",
  trialBadge = "Deneme",
  trialValue = "Premium deneme aktif",
  trialHint = (days) => `${days} gün deneme kaldı`,
  planLabels,
  activeFallbackLabel = "Aktif",
  activeValue = (planLabel) => `${planLabel} Premium aktif`,
  activeHintLifetime = "Bu hesabın Premium erişimi açık.",
  activeHintRenewalPrefix = "Yenileme:",
  activeHintSubscription = "Abonelik aktif.",
}: PremiumStatusCardProps) {
  const defaultPlanLabels: Record<PremiumSource, string> = {
    subscription_monthly: "Aylık",
    subscription_yearly: "Yıllık",
    lifetime: "Süresiz",
    code: "Kod",
    admin: "Admin",
    trial: "Deneme",
  };
  const resolvedPlanLabels = { ...defaultPlanLabels, ...planLabels };

  const meta = (() => {
    if (loading) {
      return {
        badge: loadingBadge,
        value: loadingValue,
        hint: null as string | null,
        tone: "neutral" as const,
      };
    }

    if (freeMode) {
      return {
        badge: freeBadge,
        value: freeValue,
        hint: freeHint,
        tone: "active" as const,
      };
    }

    if (!state.isActive) {
      return {
        badge: inactiveBadge,
        value: inactiveValue,
        hint: inactiveHint,
        tone: "inactive" as const,
      };
    }

    if (state.source === "trial" && state.trialEndsAt) {
      const days = Math.max(0, Math.ceil((state.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)));
      return {
        badge: trialBadge,
        value: trialValue,
        hint: trialHint(days),
        tone: "trial" as const,
      };
    }

    const planLabel = state.source ? resolvedPlanLabels[state.source] ?? activeFallbackLabel : activeFallbackLabel;
    const hint =
      state.source === "lifetime" || state.source === "admin"
        ? activeHintLifetime
        : state.expiresAt
          ? `${activeHintRenewalPrefix} ${new Date(state.expiresAt).toLocaleDateString(locale)}`
          : activeHintSubscription;

    return {
      badge: planLabel,
      value: activeValue(planLabel),
      hint,
      tone: "active" as const,
    };
  })();

  const tone = STATUS_TONES[meta.tone];

  return (
    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: labelColor }]}>{statusLabel}</Text>
        <View style={[styles.badge, { backgroundColor: tone.background }]}>
          <Text style={[styles.badgeText, { color: tone.text }]}>{meta.badge}</Text>
        </View>
      </View>
      <Text style={[styles.value, { color: textColor }]}>{meta.value}</Text>
      {meta.hint ? <Text style={[styles.hint, { color: labelColor }]}>{meta.hint}</Text> : null}
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
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 13, fontFamily: Fonts.bodyMedium },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
  value: { fontSize: 20, fontFamily: Fonts.bodySemiBold },
  hint: { marginTop: 6, fontSize: 12, fontFamily: Fonts.body },
});
