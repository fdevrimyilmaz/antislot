import { SOSQuickAccess } from "@/components/sos-quick-access";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUrgeStore } from "@/store/urgeStore";
import type { InterventionType } from "@/types/urge";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

type InterventionMeta = {
  type: InterventionType;
  badge: string;
  descriptionTr: string;
  descriptionEn: string;
  duration?: number;
};

const INTERVENTIONS: InterventionMeta[] = [
  { type: "breathing", badge: "BREATH", descriptionTr: "4-4-6 nefes egzersizi", descriptionEn: "4-4-6 breathing exercise", duration: 60 },
  { type: "grounding", badge: "GROUND", descriptionTr: "5-4-3-2-1 topraklama", descriptionEn: "5-4-3-2-1 grounding technique" },
  { type: "reframing", badge: "REFRAME", descriptionTr: "Dusunceyi yeniden cercevele", descriptionEn: "Reframe thought patterns" },
  { type: "redirection", badge: "REDIR", descriptionTr: "Kisa bir aktiviteye gec", descriptionEn: "Switch to a quick activity" },
  { type: "delay", badge: "DELAY", descriptionTr: "10 dakikalik urge surfing", descriptionEn: "10-minute urge surfing", duration: 600 },
  { type: "support", badge: "SUPPORT", descriptionTr: "Destek kaynaklarina baglan", descriptionEn: "Connect to support resources" },
  { type: "sos", badge: "SOS", descriptionTr: "Acil destek adimlari", descriptionEn: "Immediate support steps" },
];

const INTERVENE_COPY = {
  tr: {
    highIntensityHint: "Yuksek yogunluk algilandi. Gerekirse SOS adimina gec.",
  },
  en: {
    highIntensityHint: "High intensity detected. Move to SOS if needed.",
  },
} as const;

export default function UrgeInterveneScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { activeUrge, hydrated, addIntervention, getEffectiveInterventions } = useUrgeStore();
  const copy = useLocalizedCopy(INTERVENE_COPY);
  const isTr = language === "tr";

  useEffect(() => {
    if (hydrated && !activeUrge) {
      router.replace("/urge/detect");
    }
  }, [hydrated, activeUrge]);

  if (!activeUrge) return null;

  const handleIntervention = async (type: InterventionType) => {
    const found = INTERVENTIONS.find((item) => item.type === type);
    await addIntervention(type, found?.duration);

    switch (type) {
      case "breathing":
        router.push("/urge/breathing");
        break;
      case "grounding":
        router.push("/urge/grounding");
        break;
      case "reframing":
        router.push("/urge/reframing");
        break;
      case "redirection":
        router.push("/urge/redirection");
        break;
      case "delay":
        router.push("/urge/delay");
        break;
      case "support":
        router.push("/urge/support");
        break;
      case "sos":
        router.push("/sos");
        break;
    }
  };

  const suggestedTypes = getEffectiveInterventions(activeUrge.trigger);
  const suggestedSet = new Set(suggestedTypes);
  const suggested = INTERVENTIONS.filter((item) => suggestedSet.has(item.type));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>{`<- ${t.urgeBack}`}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>{t.urgeInterveneTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.urgeInterveneSubtitle}</Text>
        </View>

        {activeUrge.currentIntensity >= 7 ? (
          <View style={[styles.alertCard, { backgroundColor: `${colors.warning ?? "#D97706"}20`, borderColor: colors.warning ?? "#D97706" }]}>
            <Text style={[styles.alertText, { color: colors.warning ?? "#D97706" }]}>{copy.highIntensityHint}</Text>
          </View>
        ) : null}

        {suggested.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.urgeSuggested}</Text>
            <View style={styles.grid}>
              {suggested.map((item) => (
                <TouchableOpacity
                  key={`s-${item.type}`}
                  style={[styles.card, { backgroundColor: `${colors.primary}12`, borderColor: colors.primary }]}
                  onPress={() => void handleIntervention(item.type)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{item.badge}</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.primary }]}>
                    {t.urgeInterventionLabels[item.type] || item.type}
                  </Text>
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                    {isTr ? item.descriptionTr : item.descriptionEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.urgeAllInterventions}</Text>
          <View style={styles.grid}>
            {INTERVENTIONS.map((item) => (
              <TouchableOpacity
                key={item.type}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => void handleIntervention(item.type)}
                activeOpacity={0.8}
              >
                <View style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{item.badge}</Text>
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {t.urgeInterventionLabels[item.type] || item.type}
                </Text>
                <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                  {isTr ? item.descriptionTr : item.descriptionEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.skipButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => router.push("/urge/complete")}
          activeOpacity={0.82}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t.urgeSkip}</Text>
        </TouchableOpacity>
      </ScrollView>
      <SOSQuickAccess variant="floating" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: { marginBottom: Spacing.base },
  backButton: { alignSelf: "flex-start" },
  backText: { fontSize: 16, fontFamily: Fonts.bodySemiBold },
  section: { marginBottom: Spacing.lg },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.display,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
  alertCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: Spacing.base,
  },
  alertText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: "47%",
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: "center",
    ...Shadows.card,
  },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
    fontFamily: Fonts.bodySemiBold,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
    textAlign: "center",
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  skipButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  skipText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
  },
});
