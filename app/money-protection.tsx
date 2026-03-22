import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buildAccountabilityMessage, openAccountabilityPartnerSms } from "@/services/accountability";
import { SectionLead } from "@/components/ui/section-lead";
import { Fonts, Radius } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAutoTranslatedValue } from "@/hooks/useLocalizedCopy";
import { usePremium } from "@/hooks/usePremium";
import { useAccountabilityStore } from "@/store/accountabilityStore";
import { useMoneyProtectionStore } from "@/store/moneyProtectionStore";
import { usePremiumStore } from "@/store/premiumStore";
import { ScreenHero } from "@/components/ui/screen-hero";
const DEFAULT_RISK_LOCK_MINUTES = 20;

function formatLastCheck(
  timestamp: number | null,
  template: string,
): string | null {
  if (!timestamp) return null;

  try {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const formatted = `${day}.${month}.${year} ${hours}:${minutes}`;
    return template.replace("{{date}}", formatted);
  } catch {
    return null;
  }
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(",", ".").replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

function formatTRY(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} TRY`;
  }
}

export default function MoneyProtectionScreen() {
  const { language, selectedLanguage, locale, t } = useLanguage();
  const { colors } = useTheme();
  const { isActive: isPremiumActive } = usePremium();
  const hydratePremium = usePremiumStore((s) => s.hydrate);
  const hydrateAccountability = useAccountabilityStore((state) => state.hydrate);
  const accountabilityHydrated = useAccountabilityStore((state) => state.hydrated);
  const partnerName = useAccountabilityStore((state) => state.partnerName);
  const partnerPhone = useAccountabilityStore((state) => state.partnerPhone);
  const hasPartner = useAccountabilityStore((state) => state.hasPartner);
  const notifyOnHighRisk = useAccountabilityStore((state) => state.notifyOnHighRisk);
  const notifyOnCriticalRisk = useAccountabilityStore((state) => state.notifyOnCriticalRisk);
  const proactiveInterventionEnabled = useAccountabilityStore(
    (state) => state.proactiveInterventionEnabled
  );
  const alertCooldownMinutes = useAccountabilityStore((state) => state.alertCooldownMinutes);
  const setPartner = useAccountabilityStore((state) => state.setPartner);
  const clearPartner = useAccountabilityStore((state) => state.clearPartner);
  const updateAccountabilityPolicy = useAccountabilityStore((state) => state.updatePolicy);
  const shouldNotifyForRisk = useAccountabilityStore((state) => state.shouldNotifyForRisk);
  const canSendPartnerAlert = useAccountabilityStore((state) => state.canSendAlert);
  const recordPartnerAlert = useAccountabilityStore((state) => state.recordAlert);
  const {
    cardAway,
    alone,
    emotionalDistress,
    escapeNeed,
    emotionalVoid,
    bankAppHidden,
    paymentsDisabled,
    lastSafeCheck,
    dailyLimitTRY,
    savedTodayTRY,
    completedChecks,
    totalChecks,
    protectionScore,
    canConfirmSafe,
    riskLevel,
    lockActive,
    lockRemainingSec,
    hydrated,
    hydrate,
    updateChecks,
    markSafeToday,
    setDailyLimitTRY,
    addSpendTRY,
    startLock,
    stopLock,
    refreshLockState,
    syncWithServer,
  } = useMoneyProtectionStore();

  const [dailyLimitInput, setDailyLimitInput] = useState("");
  const [spendInput, setSpendInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [partnerNameInput, setPartnerNameInput] = useState("");
  const [partnerPhoneInput, setPartnerPhoneInput] = useState("");
  const [cooldownInput, setCooldownInput] = useState("");
  const monthlyProjection = savedTodayTRY * 30;

  /* cspell:disable */
  const baseCopy = useMemo(
    () =>
      language === "tr"
        ? {
            lockPrefix: "Kilit geri sayim",
            lockActiveStatus: "Kilit aktif",
            lockActionDisabled: "Kilit aktifken ek risk akisi kapali",
            riskPrefix: "Risk seviyesi",
            riskSafe: "Dusuk",
            riskWarning: "Orta",
            riskHigh: "Yuksek",
            proactiveTitle: "Proaktif Mudahale",
            proactiveSubtitle:
              "Risk yukselince tek tikla kilit, durtu akisi ve destek adimlarini devreye al.",
            proactiveEnable: "Proaktif mod acik",
            proactiveAction: "Proaktif plani uygula",
            proactiveSummarySafe: "Risk su an dusuk. Nefes veya mini check-in yeterli.",
            proactiveSummaryWarning: "Risk orta. Kisa lock ve dikkat dagitici adim onerilir.",
            proactiveSummaryHigh: "Risk yuksek. Lock + urge akisi + partner bildirimini oner.",
            financeTitle: "Finansal koruma kontrolleri",
            financeSubtitle:
              "Gunluk limit belirleyin, harcamayi kaydedin ve gerekirse acil kilit baslatin.",
            accountabilityTitle: "Partner Accountability",
            accountabilitySubtitle:
              "Guvendigin bir kisiyi ekle. Yuksek riskte bilgilendirip nuks tekrarini erken durdur.",
            partnerNameLabel: "Partner adi",
            partnerPhoneLabel: "Partner telefon",
            partnerNamePlaceholder: "Orn. Kardesim",
            partnerPhonePlaceholder: "Orn. +90...",
            savePartner: "Partneri kaydet",
            removePartner: "Partneri kaldir",
            notifyOnHighRisk: "Yuksek riskte otomatik bildirim",
            notifyOnCriticalRisk: "Kritik riskte otomatik bildirim",
            alertCooldownLabel: "Bildirim bekleme suresi (dk)",
            sendCheckIn: "Check-in mesaji gonder",
            partnerSaved: "Partner bilgisi kaydedildi.",
            partnerRemoved: "Partner kaydi silindi.",
            partnerMissing: "Partner bilgisi eksik.",
            partnerCooldown: "Son bildirim cok yeni. Biraz sonra tekrar deneyin.",
            partnerAlertSent: "Partner bildirimi gonderildi.",
            partnerAlertFailed: "Partner bildirimi acilamadi.",
            dailyLimitLabel: "Gunluk limit (TRY)",
            dailyLimitPlaceholder: "Orn. 500",
            saveLimitButton: "Limiti kaydet",
            spentTodayLabel: "Bugun kaydedilen harcama",
            addSpendPlaceholder: "Harcama tutari",
            addSpendButton: "Harcamayi ekle",
            startLockButton: "20 dk acil kilit",
            extendedLockButton: "1 Saat Kilit (Premium)",
            stopLockButton: "Kilidi bitir",
            limitExceeded: "Gunluk limit asildi. Risk yuksek modunda kalin.",
            syncTitle: "Bulut senkronu",
            syncSubtitle:
              "Verileri sunucu ile esitleyip kayitlarini guncel tut.",
            syncAction: "Senkronize et",
            syncing: "Senkronize ediliyor...",
            syncSuccess: "Bulut senkronu basarili.",
            syncFailed: "Bulut senkronu basarisiz. Tekrar deneyin.",
            premiumRequiredTitle: "Premium Gerekli",
            premiumRequiredMessage: "Uzun sureli kilit icin Premium'a gecin.",
            cancel: "Vazgec",
            viewPlans: "Incele",
            riskAnalysisBtn: "Detaylı Risk Analizi",
            monthlyProjectionTitle: "Aylık Projeksiyon",
            premiumLocked: "Görmek için Premium",
            riskReportTitle: "Risk Analiz Raporu",
            riskScore: "Güvenlik Skoru",
            riskStatus: "Risk Durumu",
            riskSignals: "Risk Sinyalleri",
            riskChecks: "Koruma Kontrolleri",
            riskDailyLimit: "Gunluk Limit",
            riskTodaySpent: "Bugun Harcanan",
            riskMonthlyProjection: "Aylik Projeksiyon",
            riskLockStatus: "Kilit Durumu",
            lockInactiveStatus: "Kilit pasif",
            notSet: "Belirlenmedi",
            limitExceededSuffix: "(Limit Asildi)",
            close: "Kapat",
          }
        : {
            lockPrefix: "Lock countdown",
            lockActiveStatus: "Lock is active",
            lockActionDisabled: "Risk flow is disabled while lock is active",
            riskPrefix: "Risk level",
            riskSafe: "Low",
            riskWarning: "Medium",
            riskHigh: "High",
            proactiveTitle: "Proactive Intervention",
            proactiveSubtitle:
              "When risk rises, trigger lock, urge flow, and support actions with one tap.",
            proactiveEnable: "Proactive mode enabled",
            proactiveAction: "Apply proactive plan",
            proactiveSummarySafe: "Risk is low right now. Breathing or a short check-in is enough.",
            proactiveSummaryWarning: "Risk is medium. A short lock and distraction step is recommended.",
            proactiveSummaryHigh: "Risk is high. Run lock + urge flow + partner alert.",
            financeTitle: "Financial protection controls",
            financeSubtitle:
              "Set a daily limit, log spending, and start a quick lock when needed.",
            accountabilityTitle: "Partner Accountability",
            accountabilitySubtitle:
              "Add a trusted person and notify them during high-risk moments to reduce relapse repetition.",
            partnerNameLabel: "Partner name",
            partnerPhoneLabel: "Partner phone",
            partnerNamePlaceholder: "e.g. Brother",
            partnerPhonePlaceholder: "e.g. +1...",
            savePartner: "Save partner",
            removePartner: "Remove partner",
            notifyOnHighRisk: "Auto-alert on high risk",
            notifyOnCriticalRisk: "Auto-alert on critical risk",
            alertCooldownLabel: "Alert cooldown (min)",
            sendCheckIn: "Send check-in",
            partnerSaved: "Partner details saved.",
            partnerRemoved: "Partner removed.",
            partnerMissing: "Partner details are missing.",
            partnerCooldown: "A recent alert was already sent. Please wait.",
            partnerAlertSent: "Partner alert sent.",
            partnerAlertFailed: "Could not open partner alert.",
            dailyLimitLabel: "Daily limit (TRY)",
            dailyLimitPlaceholder: "e.g. 500",
            saveLimitButton: "Save limit",
            spentTodayLabel: "Spent today",
            addSpendPlaceholder: "Spending amount",
            addSpendButton: "Add spend",
            startLockButton: "Start 20m lock",
            extendedLockButton: "1 Hour Lock (Premium)",
            stopLockButton: "Stop lock",
            limitExceeded: "Daily limit reached. Staying in high-risk mode.",
            syncTitle: "Cloud sync",
            syncSubtitle: "Keep your records updated by syncing with server.",
            syncAction: "Sync now",
            syncing: "Syncing...",
            syncSuccess: "Cloud sync completed.",
            syncFailed: "Cloud sync failed. Please try again.",
            premiumRequiredTitle: "Premium Required",
            premiumRequiredMessage:
              "Upgrade to Premium for extended lock duration.",
            cancel: "Cancel",
            viewPlans: "View Plans",
            riskAnalysisBtn: "Detailed Risk Analysis",
            monthlyProjectionTitle: "Monthly Projection",
            premiumLocked: "Premium to view",
            riskReportTitle: "Risk Analysis Report",
            riskScore: "Safety Score",
            riskStatus: "Risk Status",
            riskSignals: "Risk Signals",
            riskChecks: "Protection Checks",
            riskDailyLimit: "Daily Limit",
            riskTodaySpent: "Spent Today",
            riskMonthlyProjection: "Monthly Projection",
            riskLockStatus: "Lock Status",
            lockInactiveStatus: "Lock inactive",
            notSet: "Not set",
            limitExceededSuffix: "(Limit Exceeded)",
            close: "Close",
          },
    [language],
  );
  const copy = useAutoTranslatedValue(baseCopy);
  /* cspell:enable */

  useEffect(() => {
    hydratePremium();
  }, [hydratePremium]);

  useEffect(() => {
    void hydrateAccountability();
  }, [hydrateAccountability]);

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
    }
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    void refreshLockState();
    if (!lockActive) return;
    const timer = setInterval(() => {
      void refreshLockState();
    }, 1000);
    return () => clearInterval(timer);
  }, [hydrated, lockActive, refreshLockState]);

  useEffect(() => {
    setDailyLimitInput(dailyLimitTRY > 0 ? String(dailyLimitTRY) : "");
  }, [dailyLimitTRY]);

  useEffect(() => {
    if (!accountabilityHydrated) return;
    setPartnerNameInput(partnerName);
    setPartnerPhoneInput(partnerPhone);
    setCooldownInput(String(alertCooldownMinutes));
  }, [accountabilityHydrated, partnerName, partnerPhone, alertCooldownMinutes]);

  const lastCheckText = formatLastCheck(
    lastSafeCheck,
    t.moneyProtectionLastChecked,
  );
  const riskWarningColor = colors.warning ?? "#D97706";
  const riskHighColor = "#DC2626";
  const riskColor =
    riskLevel === "safe"
      ? colors.primary
      : riskLevel === "warning"
        ? riskWarningColor
        : riskHighColor;
  const riskText =
    riskLevel === "safe"
      ? copy.riskSafe
      : riskLevel === "warning"
        ? copy.riskWarning
        : copy.riskHigh;
  const proactiveSummary =
    riskLevel === "safe"
      ? copy.proactiveSummarySafe
      : riskLevel === "warning"
        ? copy.proactiveSummaryWarning
        : copy.proactiveSummaryHigh;
  const statusText = lockActive
    ? copy.lockActiveStatus
    : canConfirmSafe
      ? t.moneyProtectionPrimaryCta
      : t.moneyProtectionSecondaryCta;
  const statusColor = lockActive
    ? riskHighColor
    : canConfirmSafe
      ? colors.primary
      : riskWarningColor;
  const limitExceeded = dailyLimitTRY > 0 && savedTodayTRY >= dailyLimitTRY;
  const emotionalRiskSignals = [
    alone,
    emotionalDistress,
    escapeNeed,
    emotionalVoid,
  ].filter(Boolean).length;
  const checksSummary = `${completedChecks}/${totalChecks}`;
  const lockStatusText = lockActive
    ? `${copy.lockActiveStatus} (${formatDuration(lockRemainingSec)})`
    : copy.lockInactiveStatus;
  const shouldAlertForCurrentRisk =
    riskLevel === "high" && shouldNotifyForRisk("high") && canSendPartnerAlert();
  const featureStyles = styles as typeof styles & {
    riskAnalysisBtn: unknown;
    riskAnalysisText: unknown;
    projectionCard: unknown;
    projectionHeader: unknown;
    projectionTitleRow: unknown;
    projectionTitle: unknown;
    projectionValue: unknown;
    projectionBlur: unknown;
  };

  const handleSaveLimit = async () => {
    const nextLimit = parseCurrencyInput(dailyLimitInput);
    await setDailyLimitTRY(nextLimit);
  };

  const handleAddSpend = async () => {
    const spend = parseCurrencyInput(spendInput);
    if (spend <= 0) return;
    await addSpendTRY(spend);
    setSpendInput("");
  };

  const sendPartnerAlert = async (
    reason: "manual_check_in" | "high_risk_detected" | "proactive_lock_started",
    options?: { silent?: boolean; overrideRisk?: "warning" | "high" | "critical" }
  ): Promise<boolean> => {
    if (!hasPartner || !partnerPhone.trim()) {
      if (!options?.silent) {
        Alert.alert(copy.accountabilityTitle, copy.partnerMissing);
      }
      return false;
    }

    if (!canSendPartnerAlert()) {
      if (!options?.silent) {
        Alert.alert(copy.accountabilityTitle, copy.partnerCooldown);
      }
      return false;
    }

    const riskForMessage =
      options?.overrideRisk ?? (riskLevel === "high" ? "high" : riskLevel === "warning" ? "warning" : undefined);
    const message = buildAccountabilityMessage({
      language: selectedLanguage,
      reason,
      riskLevel: riskForMessage,
      score: protectionScore,
    });

    const sent = await openAccountabilityPartnerSms({
      phone: partnerPhone,
      message,
      language: selectedLanguage,
    });

    if (sent) {
      await recordPartnerAlert();
      if (!options?.silent) {
        Alert.alert(copy.accountabilityTitle, copy.partnerAlertSent);
      }
      return true;
    }

    if (!options?.silent) {
      Alert.alert(copy.accountabilityTitle, copy.partnerAlertFailed);
    }
    return false;
  };

  const handleSavePartner = async () => {
    if (!partnerNameInput.trim() || !partnerPhoneInput.trim()) {
      Alert.alert(copy.accountabilityTitle, copy.partnerMissing);
      return;
    }
    await setPartner(partnerNameInput.trim(), partnerPhoneInput.trim());
    Alert.alert(copy.accountabilityTitle, copy.partnerSaved);
  };

  const handleRemovePartner = async () => {
    await clearPartner();
    setPartnerNameInput("");
    setPartnerPhoneInput("");
    Alert.alert(copy.accountabilityTitle, copy.partnerRemoved);
  };

  const handlePartnerCheckIn = async () => {
    await sendPartnerAlert("manual_check_in");
  };

  const handleSaveCooldown = async () => {
    const parsed = Number(cooldownInput);
    const normalized = Number.isFinite(parsed) ? Math.max(1, Math.min(240, Math.round(parsed))) : alertCooldownMinutes;
    await updateAccountabilityPolicy({ alertCooldownMinutes: normalized });
    setCooldownInput(String(normalized));
  };

  const handleRiskPress = async () => {
    if (!hydrated || lockActive) return;
    await startLock(DEFAULT_RISK_LOCK_MINUTES);
    if (shouldAlertForCurrentRisk) {
      await sendPartnerAlert("high_risk_detected", { silent: true, overrideRisk: "high" });
    }
    router.push("/urge/detect");
  };

  const handleStartLock = async () => {
    if (!hydrated || lockActive) return;
    await startLock(DEFAULT_RISK_LOCK_MINUTES);
    if (notifyOnHighRisk && riskLevel === "high") {
      await sendPartnerAlert("proactive_lock_started", { silent: true, overrideRisk: "high" });
    }
  };

  const handleApplyProactivePlan = async () => {
    if (!hydrated || lockActive) return;

    if (riskLevel === "high") {
      await startLock(DEFAULT_RISK_LOCK_MINUTES);
      if (shouldNotifyForRisk("high")) {
        await sendPartnerAlert("high_risk_detected", { silent: true, overrideRisk: "high" });
      }
      router.push("/urge/detect");
      return;
    }

    if (riskLevel === "warning") {
      await startLock(10);
    }
    router.push("/urge/breathing");
  };

  const handleExtendedLock = async () => {
    if (!hydrated || lockActive) return;
    if (!isPremiumActive) {
      Alert.alert(
        copy.premiumRequiredTitle,
        copy.premiumRequiredMessage,
        [
          { text: copy.cancel, style: "cancel" },
          {
            text: copy.viewPlans,
            onPress: () => router.push("/premium"),
          },
        ],
      );
      return;
    }
    await startLock(60);
  };

  const handleStopLock = async () => {
    if (!hydrated || !lockActive) return;
    await stopLock();
  };

  const handleManualSync = async () => {
    if (!hydrated || syncing) return;
    setSyncing(true);
    setSyncNotice(null);
    try {
      await syncWithServer();
      setSyncNotice(copy.syncSuccess);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : copy.syncFailed;
      setSyncNotice(message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="money-protection-screen"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={[styles.backText, { color: colors.textSecondary }]}>
              {"< "}
              {t.generalBack}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {t.moneyProtectionTitle}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.moneyProtectionSubtitle}
          </Text>
        </View>

        <ScreenHero
          icon="shield-checkmark-outline"
          title={t.moneyProtectionCardTitle}
          subtitle={t.moneyProtectionCardSubtitle}
          description={copy.financeSubtitle}
          badge={copy.riskPrefix}
          gradient={["#0B5B67", "#117C8B"]}
          style={styles.imageWrapper}
        />

        <SectionLead
          icon="pulse-outline"
          title={copy.riskPrefix}
          subtitle={copy.proactiveSubtitle}
          badge={`${protectionScore}%`}
          tone={riskLevel === "high" ? "danger" : riskLevel === "warning" ? "warning" : "success"}
          style={styles.sectionLead}
        />

        <View
          style={[
            styles.statusCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          testID="money-protection-status-card"
        >
          <View style={styles.statusMeta}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
              {t.moneyProtectionCardTitle}
            </Text>
            <Text style={[styles.statusValue, { color: statusColor }]}>
              {statusText}
            </Text>
            <Text style={[styles.riskValue, { color: riskColor }]}>
              {copy.riskPrefix}: {riskText}
            </Text>
          </View>
          <View
            style={[
              styles.scorePill,
              {
                backgroundColor: colors.primary + "18",
                borderColor: colors.primary + "40",
              },
            ]}
          >
            <Text style={[styles.scoreText, { color: colors.primary }]}>
              {protectionScore}%
            </Text>
            <Text
              style={[styles.scoreSubText, { color: colors.textSecondary }]}
            >
              {completedChecks}/{totalChecks}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            featureStyles.riskAnalysisBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => {
            if (!isPremiumActive) router.push("/premium");
            else setShowRiskModal(true);
          }}
          activeOpacity={0.9}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="pulse-outline"
              size={18}
              color={colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text style={[featureStyles.riskAnalysisText, { color: colors.text }]}>
              {copy.riskAnalysisBtn}
            </Text>
          </View>
          {!isPremiumActive && (
            <Ionicons
              name="lock-closed"
              size={16}
              color={colors.textSecondary}
            />
          )}
        </TouchableOpacity>

        {lockActive && (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: colors.primary + "12",
                borderColor: colors.primary + "33",
              },
            ]}
          >
            <Text style={[styles.infoText, { color: colors.primary }]}>
              {copy.lockPrefix}: {formatDuration(lockRemainingSec)}
            </Text>
          </View>
        )}

        {limitExceeded && (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: riskHighColor + "14",
                borderColor: riskHighColor + "3D",
              },
            ]}
          >
            <Text style={[styles.infoText, { color: riskHighColor }]}>
              {copy.limitExceeded}
            </Text>
          </View>
        )}

        <SectionLead
          icon="layers-outline"
          title={copy.proactiveTitle}
          subtitle={copy.proactiveSubtitle}
          tone="primary"
          style={styles.sectionLead}
        />

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          testID="money-protection-proactive-section"
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {copy.proactiveTitle}
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            {copy.proactiveSubtitle}
          </Text>
          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                {copy.proactiveEnable}
              </Text>
            </View>
            <Switch
              value={proactiveInterventionEnabled}
              onValueChange={(value) =>
                void updateAccountabilityPolicy({ proactiveInterventionEnabled: value })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={[styles.sectionHint, { color: colors.textSecondary, marginTop: 12 }]}>
            {proactiveSummary}
          </Text>
          {shouldAlertForCurrentRisk ? (
            <Text style={[styles.sectionHint, { color: riskWarningColor }]}>
              {copy.notifyOnHighRisk}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor:
                  !proactiveInterventionEnabled || lockActive ? colors.disabled : colors.primary,
                marginTop: 6,
              },
            ]}
            onPress={() => void handleApplyProactivePlan()}
            disabled={!proactiveInterventionEnabled || !hydrated || lockActive}
            testID="money-protection-proactive-apply-btn"
          >
            <Text style={styles.primaryButtonText}>{copy.proactiveAction}</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.moneyProtectionCardSubtitle}
          </Text>

          <View
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                {t.moneyProtectionCardAway}
              </Text>
            </View>
            <Switch
              value={cardAway}
              onValueChange={(value) => void updateChecks({ cardAway: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              disabled={!hydrated}
            />
          </View>

          <View
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.toggleInfo}>
              <Text
                style={[
                  styles.toggleLabel,
                  { color: alone ? riskWarningColor : colors.text },
                ]}
              >
                {t.moneyProtectionAlone}
              </Text>
            </View>
            <Switch
              value={alone}
              onValueChange={(value) => void updateChecks({ alone: value })}
              trackColor={{ false: colors.border, true: riskWarningColor }}
              thumbColor="#FFFFFF"
              disabled={!hydrated}
            />
          </View>

          <View
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.toggleInfo}>
              <Text
                style={[
                  styles.toggleLabel,
                  { color: emotionalDistress ? riskWarningColor : colors.text },
                ]}
              >
                {t.moneyProtectionEmotionalDistress}
              </Text>
            </View>
            <Switch
              value={emotionalDistress}
              onValueChange={(value) =>
                void updateChecks({ emotionalDistress: value })
              }
              trackColor={{ false: colors.border, true: riskWarningColor }}
              thumbColor="#FFFFFF"
              disabled={!hydrated}
            />
          </View>

          <View
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.toggleInfo}>
              <Text
                style={[
                  styles.toggleLabel,
                  { color: escapeNeed ? riskWarningColor : colors.text },
                ]}
              >
                {t.moneyProtectionEscapeNeed}
              </Text>
            </View>
            <Switch
              value={escapeNeed}
              onValueChange={(value) =>
                void updateChecks({ escapeNeed: value })
              }
              trackColor={{ false: colors.border, true: riskWarningColor }}
              thumbColor="#FFFFFF"
              disabled={!hydrated}
            />
          </View>

          <View
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.toggleInfo}>
              <Text
                style={[
                  styles.toggleLabel,
                  { color: emotionalVoid ? riskWarningColor : colors.text },
                ]}
              >
                {t.moneyProtectionEmotionalVoid}
              </Text>
            </View>
            <Switch
              value={emotionalVoid}
              onValueChange={(value) =>
                void updateChecks({ emotionalVoid: value })
              }
              trackColor={{ false: colors.border, true: riskWarningColor }}
              thumbColor="#FFFFFF"
              disabled={!hydrated}
            />
          </View>

          <View
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                {t.moneyProtectionBankHidden}
              </Text>
            </View>
            <Switch
              value={bankAppHidden}
              onValueChange={(value) =>
                void updateChecks({ bankAppHidden: value })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              disabled={!hydrated}
            />
          </View>

          <View
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                {t.moneyProtectionPaymentsDisabled}
              </Text>
            </View>
            <Switch
              value={paymentsDisabled}
              onValueChange={(value) =>
                void updateChecks({ paymentsDisabled: value })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              disabled={!hydrated}
            />
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {copy.financeTitle}
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            {copy.financeSubtitle}
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {copy.dailyLimitLabel}
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              value={dailyLimitInput}
              onChangeText={setDailyLimitInput}
              keyboardType="decimal-pad"
              placeholder={copy.dailyLimitPlaceholder}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              editable={hydrated && !lockActive}
              testID="money-protection-daily-limit-input"
            />
            <TouchableOpacity
              style={[
                styles.inlineButton,
                {
                  backgroundColor: lockActive
                    ? colors.disabled
                    : colors.primary,
                },
              ]}
              onPress={() => void handleSaveLimit()}
              disabled={!hydrated || lockActive}
              activeOpacity={0.9}
              testID="money-protection-daily-limit-save-btn"
            >
              <Text style={styles.inlineButtonText}>
                {copy.saveLimitButton}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.spentText, { color: colors.textSecondary }]}>
            {copy.spentTodayLabel}: {formatTRY(savedTodayTRY, locale)}
          </Text>

          <View
            style={[
              featureStyles.projectionCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={featureStyles.projectionHeader}>
              <View style={featureStyles.projectionTitleRow}>
                <Ionicons
                  name="stats-chart-outline"
                  size={14}
                  color={colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    featureStyles.projectionTitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {copy.monthlyProjectionTitle}
                </Text>
              </View>
              {!isPremiumActive && (
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color={colors.warning ?? "#D97706"}
                />
              )}
            </View>
            {isPremiumActive ? (
              <Text style={[featureStyles.projectionValue, { color: colors.primary }]}>
                {formatTRY(monthlyProjection, locale)}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/premium")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    featureStyles.projectionBlur,
                    { color: colors.textSecondary },
                  ]}
                >
                  {copy.premiumLocked}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={spendInput}
              onChangeText={setSpendInput}
              keyboardType="decimal-pad"
              placeholder={copy.addSpendPlaceholder}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              editable={hydrated && !lockActive}
              testID="money-protection-spend-input"
            />
            <TouchableOpacity
              style={[
                styles.inlineButton,
                {
                  backgroundColor: lockActive
                    ? colors.disabled
                    : colors.primary,
                },
              ]}
              onPress={() => void handleAddSpend()}
              disabled={!hydrated || lockActive}
              activeOpacity={0.9}
              testID="money-protection-spend-add-btn"
            >
              <Text style={styles.inlineButtonText}>{copy.addSpendButton}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.lockButtons}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => void handleStartLock()}
              activeOpacity={0.9}
              disabled={!hydrated || lockActive}
              testID="money-protection-lock-start-btn"
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: lockActive ? colors.textSecondary : colors.primary },
                ]}
              >
                {copy.startLockButton}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => void handleExtendedLock()}
              activeOpacity={0.9}
              disabled={!hydrated || lockActive}
              testID="money-protection-lock-extended-btn"
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: lockActive ? colors.textSecondary : "#B8860B" },
                ]}
              >
                {copy.extendedLockButton}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => void handleStopLock()}
              activeOpacity={0.9}
              disabled={!hydrated || !lockActive}
              testID="money-protection-lock-stop-btn"
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  {
                    color: !lockActive ? colors.textSecondary : colors.primary,
                  },
                ]}
              >
                {copy.stopLockButton}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          testID="money-protection-accountability-section"
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {copy.accountabilityTitle}
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            {copy.accountabilitySubtitle}
          </Text>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {copy.partnerNameLabel}
          </Text>
          <TextInput
            value={partnerNameInput}
            onChangeText={setPartnerNameInput}
            placeholder={copy.partnerNamePlaceholder}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            testID="money-protection-partner-name-input"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {copy.partnerPhoneLabel}
          </Text>
          <TextInput
            value={partnerPhoneInput}
            onChangeText={setPartnerPhoneInput}
            placeholder={copy.partnerPhonePlaceholder}
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            testID="money-protection-partner-phone-input"
          />

          <View style={styles.lockButtons}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => void handleSavePartner()}
              activeOpacity={0.9}
              testID="money-protection-partner-save-btn"
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                {copy.savePartner}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => void handlePartnerCheckIn()}
              activeOpacity={0.9}
              disabled={!hasPartner}
              testID="money-protection-partner-checkin-btn"
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: hasPartner ? colors.primary : colors.textSecondary },
                ]}
              >
                {copy.sendCheckIn}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => void handleRemovePartner()}
              activeOpacity={0.9}
              disabled={!hasPartner}
              testID="money-protection-partner-remove-btn"
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: hasPartner ? colors.warning ?? "#D97706" : colors.textSecondary },
                ]}
              >
                {copy.removePartner}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                {copy.notifyOnHighRisk}
              </Text>
            </View>
            <Switch
              value={notifyOnHighRisk}
              onValueChange={(value) => void updateAccountabilityPolicy({ notifyOnHighRisk: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                {copy.notifyOnCriticalRisk}
              </Text>
            </View>
            <Switch
              value={notifyOnCriticalRisk}
              onValueChange={(value) => void updateAccountabilityPolicy({ notifyOnCriticalRisk: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
            {copy.alertCooldownLabel}
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              value={cooldownInput}
              onChangeText={setCooldownInput}
              keyboardType="number-pad"
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              testID="money-protection-alert-cooldown-input"
            />
            <TouchableOpacity
              style={[styles.inlineButton, { backgroundColor: colors.primary }]}
              onPress={() => void handleSaveCooldown()}
              activeOpacity={0.9}
              testID="money-protection-alert-cooldown-save-btn"
            >
              <Text style={styles.inlineButtonText}>{copy.saveLimitButton}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {lastCheckText && (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: colors.primary + "12",
                borderColor: colors.primary + "33",
              },
            ]}
          >
            <Text style={[styles.infoText, { color: colors.primary }]}>
              {lastCheckText}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            testID="money-protection-safe-btn"
            style={[
              styles.primaryButton,
              {
                backgroundColor: canConfirmSafe
                  ? colors.primary
                  : colors.disabled,
              },
            ]}
            onPress={() => void markSafeToday()}
            activeOpacity={0.9}
            disabled={!canConfirmSafe || !hydrated || lockActive}
          >
            <Text style={styles.primaryButtonText}>
              {t.moneyProtectionPrimaryCta}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="money-protection-risk-btn"
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => void handleRiskPress()}
            activeOpacity={0.9}
            disabled={!hydrated || lockActive}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: lockActive ? colors.textSecondary : colors.primary },
              ]}
            >
              {lockActive
                ? copy.lockActionDisabled
                : t.moneyProtectionSecondaryCta}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {copy.syncTitle}
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            {syncNotice ?? copy.syncSubtitle}
          </Text>
          <TouchableOpacity
            testID="money-protection-sync-btn"
            style={[
              styles.primaryButton,
              { backgroundColor: syncing ? colors.disabled : colors.primary },
            ]}
            onPress={() => void handleManualSync()}
            activeOpacity={0.9}
            disabled={!hydrated || syncing}
          >
            <Text style={styles.primaryButtonText}>
              {syncing ? copy.syncing : copy.syncAction}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t.moneyProtectionSubtitle}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showRiskModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRiskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {copy.riskReportTitle}
            </Text>

            <View style={styles.reportRow}>
              <Text
                style={[styles.reportLabel, { color: colors.textSecondary }]}
              >
                {copy.riskScore}
              </Text>
              <Text style={[styles.reportValue, { color: colors.primary }]}>
                {protectionScore}/100
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text
                style={[styles.reportLabel, { color: colors.textSecondary }]}
              >
                {copy.riskStatus}
              </Text>
              <Text style={[styles.reportValue, { color: riskColor }]}>
                {riskText} {limitExceeded ? copy.limitExceededSuffix : ""}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text
                style={[styles.reportLabel, { color: colors.textSecondary }]}
              >
                {copy.riskSignals}
              </Text>
              <Text
                style={[
                  styles.reportValue,
                  {
                    color:
                      emotionalRiskSignals > 0 ? riskWarningColor : colors.primary,
                  },
                ]}
              >
                {emotionalRiskSignals}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text
                style={[styles.reportLabel, { color: colors.textSecondary }]}
              >
                {copy.riskChecks}
              </Text>
              <Text style={[styles.reportValue, { color: colors.text }]}>
                {checksSummary}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text
                style={[styles.reportLabel, { color: colors.textSecondary }]}
              >
                {copy.riskDailyLimit}
              </Text>
              <Text style={[styles.reportValue, { color: colors.text }]}>
                {dailyLimitTRY > 0
                  ? formatTRY(dailyLimitTRY, locale)
                  : copy.notSet}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text
                style={[styles.reportLabel, { color: colors.textSecondary }]}
              >
                {copy.riskTodaySpent}
              </Text>
              <Text style={[styles.reportValue, { color: colors.text }]}>
                {formatTRY(savedTodayTRY, locale)}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text
                style={[styles.reportLabel, { color: colors.textSecondary }]}
              >
                {copy.riskMonthlyProjection}
              </Text>
              <Text style={[styles.reportValue, { color: colors.text }]}>
                {formatTRY(monthlyProjection, locale)}
              </Text>
            </View>

            <View style={styles.reportRow}>
              <Text
                style={[styles.reportLabel, { color: colors.textSecondary }]}
              >
                {copy.riskLockStatus}
              </Text>
              <Text
                style={[
                  styles.reportValue,
                  { color: lockActive ? riskHighColor : colors.primary },
                ]}
              >
                {lockStatusText}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => setShowRiskModal(false)}
            >
              <Text style={styles.modalCloseText}>{copy.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 10 },
  backText: { fontSize: 15, fontFamily: Fonts.bodyMedium },
  title: { fontSize: 26, fontFamily: Fonts.display, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: Fonts.body, lineHeight: 20 },
  imageWrapper: {
    marginBottom: 20,
    borderRadius: Radius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionLead: {
    marginBottom: 12,
  },
  heroImage: {
    width: "100%",
    height: 180,
  },
  statusCard: {
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusMeta: {
    flex: 1,
    paddingRight: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  riskValue: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  scorePill: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 72,
  },
  scoreText: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 18,
  },
  scoreSubText: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    lineHeight: 14,
  },
  riskAnalysisBtn: {
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  riskAnalysisText: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  section: {
    borderRadius: Radius.xl,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: Fonts.body,
    marginBottom: 12,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15, fontFamily: Fonts.bodyMedium },
  inputLabel: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  inlineButton: {
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inlineButtonText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  spentText: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  projectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  projectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  projectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
  projectionValue: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  projectionBlur: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  lockButtons: {
    marginTop: 8,
    gap: 10,
  },
  infoBox: {
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoText: { fontSize: 13, fontFamily: Fonts.bodyMedium },
  actions: { marginTop: 8, gap: 10 },
  primaryButton: {
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  secondaryButton: {
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  footerNote: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 16,
    textAlign: "center",
  },
  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  reportLabel: { fontSize: 14, fontFamily: Fonts.body },
  reportValue: { fontSize: 14, fontFamily: Fonts.bodySemiBold },
  modalCloseBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
});
