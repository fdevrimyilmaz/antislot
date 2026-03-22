import { SOSQuickAccess } from "@/components/sos-quick-access";
import { ScreenHero } from "@/components/ui/screen-hero";
import { SectionLead } from "@/components/ui/section-lead";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { buildAccountabilityMessage, openAccountabilityPartnerSms } from "@/services/accountability";
import { inferUrgeFromContext, type UrgeInferenceResult } from "@/services/urgeTriggerInference";
import { useAccountabilityStore } from "@/store/accountabilityStore";
import { useUrgeStore } from "@/store/urgeStore";
import type { UrgeIntensity, UrgeTrigger } from "@/types/urge";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

type TriggerMeta = { value: UrgeTrigger; fallbackLabel: string; badge: string };

const INTENSITY_VALUES: UrgeIntensity[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const MAIN_TRIGGERS: TriggerMeta[] = [
  { value: "emotional", fallbackLabel: "Emotional", badge: "EMO" },
  { value: "environmental", fallbackLabel: "Environmental", badge: "ENV" },
  { value: "cognitive", fallbackLabel: "Thoughts", badge: "COG" },
  { value: "unknown", fallbackLabel: "Not sure", badge: "UNK" },
];

const CONTEXT_TRIGGERS: TriggerMeta[] = [
  { value: "physical", fallbackLabel: "Physical", badge: "PHY" },
  { value: "social", fallbackLabel: "Social", badge: "SOC" },
  { value: "financial", fallbackLabel: "Financial", badge: "FIN" },
];

const AI_COPY = {
  tr: {
    contextPlaceholder: "Neler oldu? Kisa bir not yaz (istege bagli)",
    analyzeCta: "AI ile tetikleyiciyi analiz et",
    noSignal: "Yeterli sinyal bulunamadi. Istersen elle secime devam edebilirsin.",
    suggestionTitle: "AI onerisi",
    suggestedTrigger: "Onerilen tetikleyici",
    suggestedIntensity: "Onerilen yogunluk",
    confidence: "Guven",
    matchedSignals: "Eslesen sinyaller",
    recommendedActions: "Onerilen proaktif adimlar",
    applySuggestion: "Oneriyi uygula",
    criticalHint: "Bu metin yuksek risk sinyali iceriyor. Istersen hemen SOS secenegine gecebilirsin.",
    notifyPartner: "Yakinini haberdar et",
    partnerMissing: "Guvendigin kisi bulunamadi. SOS ekranindan kisi ekleyebilirsin.",
    partnerCooldown: "Son bildirim cok yeni. Biraz sonra tekrar dener misin?",
    actionLabel: {
      breathing_reset: "Nefes sifirlama",
      delay_urge: "Durtuyu ertele",
      start_lock: "Acil kilit baslat",
      notify_partner: "Yakinina haber ver",
      open_sos: "SOS ekranina gec",
    },
  },
  en: {
    contextPlaceholder: "What happened? Add a short note (optional)",
    analyzeCta: "Analyze trigger with AI",
    noSignal: "Not enough signal found. You can continue with manual selection.",
    suggestionTitle: "AI suggestion",
    suggestedTrigger: "Suggested trigger",
    suggestedIntensity: "Suggested intensity",
    confidence: "Confidence",
    matchedSignals: "Matched signals",
    recommendedActions: "Recommended proactive actions",
    applySuggestion: "Apply suggestion",
    criticalHint: "This note contains high-risk signals. You can switch to SOS immediately if needed.",
    notifyPartner: "Notify trusted contact",
    partnerMissing: "No trusted contact configured yet. Add one in the SOS screen.",
    partnerCooldown: "A recent alert was already sent. Please wait before sending another one.",
    actionLabel: {
      breathing_reset: "Breathing reset",
      delay_urge: "Delay the urge",
      start_lock: "Start emergency lock",
      notify_partner: "Notify trusted contact",
      open_sos: "Open SOS",
    },
  },
} as const;

export default function UrgeDetectScreen() {
  const { t, language, selectedLanguage } = useLanguage();
  const { colors } = useTheme();
  const { startUrge, assessSafety, markCrisis } = useUrgeStore();
  const hydrateAccountability = useAccountabilityStore((state) => state.hydrate);
  const partnerName = useAccountabilityStore((state) => state.partnerName);
  const partnerPhone = useAccountabilityStore((state) => state.partnerPhone);
  const hasPartner = useAccountabilityStore((state) => state.hasPartner);
  const canSendAlert = useAccountabilityStore((state) => state.canSendAlert);
  const recordAlert = useAccountabilityStore((state) => state.recordAlert);
  const copy = useLocalizedCopy(AI_COPY);

  const [intensity, setIntensity] = useState<UrgeIntensity | null>(null);
  const [trigger, setTrigger] = useState<UrgeTrigger | undefined>(undefined);
  const [contextNote, setContextNote] = useState("");
  const [aiResult, setAiResult] = useState<UrgeInferenceResult | null>(null);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);
  const [showCrisisChoice, setShowCrisisChoice] = useState(false);

  useEffect(() => {
    void hydrateAccountability();
  }, [hydrateAccountability]);

  const handleContinue = async () => {
    if (!intensity) return;
    const safeContext = contextNote.trim().slice(0, 500);

    const assessment = assessSafety(intensity, trigger);
    if (assessment.level === "crisis" || assessment.recommendedAction === "sos" || intensity >= 9) {
      await startUrge(intensity, trigger, safeContext);
      await markCrisis();
      setShowCrisisChoice(true);
      return;
    }

    await startUrge(intensity, trigger, safeContext);
    router.push("/urge/intervene");
  };

  const handleAnalyzeContext = () => {
    setAnalysisAttempted(true);
    const result = inferUrgeFromContext(contextNote);
    if (!result.hasSignals) {
      setAiResult(null);
      return;
    }
    setAiResult(result);
  };

  const handleApplySuggestion = () => {
    if (!aiResult) return;
    if (aiResult.trigger) {
      setTrigger(aiResult.trigger);
    }
    setIntensity(aiResult.suggestedIntensity);
  };

  const handleContextChange = (value: string) => {
    setContextNote(value);
    setAiResult(null);
    setAnalysisAttempted(false);
  };

  const handleNotifyPartnerFromAi = async () => {
    if (!aiResult) return;
    if (!hasPartner || !partnerPhone.trim()) {
      Alert.alert(copy.suggestionTitle, copy.partnerMissing);
      return;
    }
    if (!canSendAlert()) {
      Alert.alert(copy.suggestionTitle, copy.partnerCooldown);
      return;
    }

    const reason = aiResult.riskLevel === "critical" ? "critical_urge_detected" : "high_risk_detected";
    const accountabilityRiskLevel = aiResult.riskLevel === "critical" ? "critical" : "high";

    const message = buildAccountabilityMessage({
      language: selectedLanguage,
      reason,
      riskLevel: accountabilityRiskLevel,
      score: Math.round((11 - aiResult.suggestedIntensity) * 10),
    });

    const sent = await openAccountabilityPartnerSms({
      phone: partnerPhone,
      message: partnerName ? `${partnerName},\n${message}` : message,
      language: selectedLanguage,
    });

    if (sent) {
      await recordAlert();
    }
  };

  const renderTriggerCard = (option: TriggerMeta) => {
    const isSelected = trigger === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.triggerButton,
          isSelected
            ? { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }
            : { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setTrigger(option.value)}
        activeOpacity={0.78}
      >
        <View style={[styles.triggerBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.triggerBadgeText, { color: colors.primary }]}>{option.badge}</Text>
        </View>
        <Text
          style={[
            styles.triggerLabel,
            { color: isSelected ? colors.primary : colors.text },
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {t.urgeTriggerLabels[option.value] || option.fallbackLabel}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>{`<- ${t.urgeBack}`}</Text>
          </TouchableOpacity>
        </View>

        <ScreenHero
          icon="pulse-outline"
          title={t.urgeDetectTitle}
          subtitle={t.urgeDetectSubtitle}
          description={t.urgeTriggerSubtitle}
          badge="AI"
          gradient={["#7A1D1D", "#B33A1B"]}
          style={styles.section}
        />

        <View style={styles.section}>
          <SectionLead
            icon="speedometer-outline"
            title={t.urgeIntensity}
            subtitle={t.urgeIntensitySubtitle}
            tone="warning"
            style={styles.sectionLead}
          />
          <View style={styles.intensityGrid}>
            {INTENSITY_VALUES.map((value) => {
              const isSelected = intensity === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.intensityButton,
                    isSelected
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => setIntensity(value)}
                  activeOpacity={0.78}
                >
                  <Text style={[styles.intensityValue, { color: isSelected ? "#FFFFFF" : colors.text }]}>
                    {value}
                  </Text>
                  <Text style={[styles.intensityLabel, { color: isSelected ? "#FFFFFF" : colors.textSecondary }]}>
                    {t.urgeIntensityLabels[value]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionLead
            icon="flash-outline"
            title={t.urgeTrigger}
            subtitle={t.urgeTriggerSubtitle}
            tone="danger"
            style={styles.sectionLead}
          />
          <View style={styles.triggerGrid}>{MAIN_TRIGGERS.map(renderTriggerCard)}</View>
        </View>

        <View style={styles.section}>
          <SectionLead
            icon="bulb-outline"
            title={t.urgeContext}
            subtitle={t.urgeContextSubtitle}
            badge="AI"
            tone="primary"
            style={styles.sectionLead}
          />
          <View style={styles.triggerGrid}>{CONTEXT_TRIGGERS.map(renderTriggerCard)}</View>
          <View style={styles.contextHint}>
            <TextInput
              style={[
                styles.contextInput,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
              ]}
              placeholder={copy.contextPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={contextNote}
              onChangeText={handleContextChange}
              multiline
              maxLength={500}
              accessibilityLabel={t.urgeContext}
            />
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                contextNote.trim().length < 8 ? styles.disabledButton : null,
              ]}
              onPress={handleAnalyzeContext}
              disabled={contextNote.trim().length < 8}
              activeOpacity={0.82}
            >
              <Text style={[styles.analyzeButtonText, { color: colors.primary }]}>{copy.analyzeCta}</Text>
            </TouchableOpacity>

            {!aiResult && analysisAttempted ? (
              <Text style={[styles.aiEmptyText, { color: colors.textSecondary }]}>{copy.noSignal}</Text>
            ) : null}

            {aiResult ? (
              <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.aiTitle, { color: colors.text }]}>{copy.suggestionTitle}</Text>
                <Text style={[styles.aiLine, { color: colors.textSecondary }]}>
                  {copy.suggestedTrigger}:{" "}
                  <Text style={[styles.aiLineStrong, { color: colors.text }]}>
                    {aiResult.trigger ? t.urgeTriggerLabels[aiResult.trigger] : t.urgeTriggerLabels.unknown}
                  </Text>
                </Text>
                <Text style={[styles.aiLine, { color: colors.textSecondary }]}>
                  {copy.suggestedIntensity}:{" "}
                  <Text style={[styles.aiLineStrong, { color: colors.text }]}>{aiResult.suggestedIntensity}/10</Text>
                </Text>
                <Text style={[styles.aiLine, { color: colors.textSecondary }]}>
                  {copy.confidence}:{" "}
                  <Text style={[styles.aiLineStrong, { color: colors.text }]}>
                    %{Math.round(aiResult.confidence * 100)}
                  </Text>
                </Text>
                <Text style={[styles.aiLine, { color: colors.textSecondary }]}>
                  {copy.matchedSignals}:{" "}
                  <Text style={[styles.aiLineStrong, { color: colors.text }]}>
                    {aiResult.matchedSignalCount}/{aiResult.librarySignalCount}
                  </Text>
                </Text>
                <Text style={[styles.aiLine, { color: colors.textSecondary }]}>
                  {copy.recommendedActions}:{" "}
                  <Text style={[styles.aiLineStrong, { color: colors.text }]}>
                    {aiResult.recommendedActions.map((action) => copy.actionLabel[action]).join(" | ")}
                  </Text>
                </Text>
                {aiResult.riskLevel === "critical" ? (
                  <Text style={[styles.aiCriticalText, { color: colors.warning ?? "#B45309" }]}>
                    {copy.criticalHint}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={[styles.applySuggestionButton, { backgroundColor: colors.primary }]}
                  onPress={handleApplySuggestion}
                >
                  <Text style={styles.applySuggestionText}>{copy.applySuggestion}</Text>
                </TouchableOpacity>
                {(aiResult.riskLevel === "high" || aiResult.riskLevel === "critical") && hasPartner ? (
                  <TouchableOpacity
                    style={[styles.notifyPartnerButton, { backgroundColor: colors.warning ?? "#D97706" }]}
                    onPress={() => void handleNotifyPartnerFromAi()}
                  >
                    <Text style={styles.notifyPartnerText}>{copy.notifyPartner}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: intensity ? colors.primary : colors.disabled, opacity: intensity ? 1 : 0.55 },
          ]}
          onPress={handleContinue}
          disabled={!intensity}
          activeOpacity={0.82}
        >
          <Text style={styles.continueButtonText}>{t.urgeDetectCta}</Text>
        </TouchableOpacity>

        {showCrisisChoice ? (
          <View style={[styles.overlay, { backgroundColor: colors.background }]}>
            <View style={[styles.overlayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.overlayTitle, { color: colors.text }]}>{t.urgeCrisisChoiceTitle}</Text>
              <Text style={[styles.overlaySubtitle, { color: colors.textSecondary }]}>{t.urgeCrisisChoiceSubtitle}</Text>

              <TouchableOpacity
                style={[styles.primaryAction, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/urge/crisis")}
                activeOpacity={0.82}
              >
                <Text style={styles.primaryActionTitle}>{t.urgeCrisisChoicePrimary}</Text>
                <Text style={styles.primaryActionBody}>{t.urgeCrisisChoicePrimaryDesc}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryAction, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  setShowCrisisChoice(false);
                  router.push("/urge/intervene");
                }}
                activeOpacity={0.82}
              >
                <Text style={[styles.secondaryActionTitle, { color: colors.text }]}>{t.urgeCrisisChoiceSecondary}</Text>
                <Text style={[styles.secondaryActionBody, { color: colors.textSecondary }]}>
                  {t.urgeCrisisChoiceSecondaryDesc}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
  sectionLead: { marginBottom: 12 },
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.body,
    marginBottom: 12,
  },
  intensityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  intensityButton: {
    width: "18%",
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  intensityValue: {
    fontSize: 19,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 2,
  },
  intensityLabel: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
    fontFamily: Fonts.body,
  },
  triggerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  triggerButton: {
    width: "31%",
    minHeight: 88,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 7,
  },
  triggerBadgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
    fontFamily: Fonts.bodySemiBold,
  },
  triggerLabel: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    fontFamily: Fonts.bodyMedium,
  },
  contextHint: { marginTop: 14 },
  contextInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 88,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  analyzeButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 11,
    alignItems: "center",
    marginBottom: 8,
  },
  analyzeButtonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  disabledButton: { opacity: 0.55 },
  aiEmptyText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
  },
  aiCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 4,
  },
  aiTitle: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  aiLine: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
    marginBottom: 3,
  },
  aiLineStrong: {
    fontFamily: Fonts.bodySemiBold,
  },
  aiCriticalText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.bodySemiBold,
    marginTop: 6,
    marginBottom: 8,
  },
  applySuggestionButton: {
    marginTop: 8,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  applySuggestionText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  notifyPartnerButton: {
    marginTop: 8,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  notifyPartnerText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  continueButton: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    ...Shadows.button,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    justifyContent: "center",
  },
  overlayCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.modal,
  },
  overlayTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: Fonts.displayMedium,
    marginBottom: 8,
    textAlign: "center",
  },
  overlaySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
    marginBottom: 14,
    textAlign: "center",
  },
  primaryAction: {
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
  },
  primaryActionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
    textAlign: "center",
  },
  primaryActionBody: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  secondaryAction: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
  },
  secondaryActionTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
    textAlign: "center",
  },
  secondaryActionBody: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
});
