import { Fonts, Radius } from "@/constants/theme";
import { ENABLE_SMS_ROLE } from "@/constants/featureFlags";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePremium } from "@/hooks/usePremium";
import { type SupportedLanguage } from "@/i18n/translations";
import { useAccessibilityStore } from "@/store/accessibilityStore";
import { usePrivacyStore } from "@/store/privacyStore";
import { useProgressStore } from "@/store/progressStore";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  ADDICTION_KEYS,
  type UserAddictions,
  useUserAddictionsStore,
} from "@/store/userAddictionsStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, type Href } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SETTINGS_COPY = {
  tr: {
    title: "Ayarlar",
    loading: "Yukleniyor...",
    commandCenterTitle: "Kontrol Merkezi",
    commandCenterSubtitle: "Koruma durumunu tek ekrandan yonet.",
    trackingCoverage: "Takip Kapsami",
    accessibilityStatus: "Erisilebilirlik",
    systemProtection: "Sistem Korumasi",
    profileLevel: "Profil Seviyesi",
    profileCritical: "Kritik",
    profileStrong: "Guclu",
    profileBalanced: "Dengeli",
    profileNeedsAction: "Gelistirilmeli",
    commandHealthSummary: (score: number) => `Koruma skoru ${score}/100`,
    commandTrackingReady: "Tum takip alanlari aktif.",
    commandTrackingLimited: "Takip alani sinirli.",
    commandA11yReady: "Erisilebilirlik korumasi guclu.",
    commandA11yLimited: "Erisilebilirlik guclendirilebilir.",
    commandSystemReady: "Sistem korumasi stabil.",
    commandSystemLimited: "Sistem korumasi sinirli.",
    commandRecommendationTitle: "Aksiyon onerisi",
    commandRecommendationStrong: "Mevcut konfigurasyonu koru ve haftalik takibi surdur.",
    commandRecommendationBalanced: "Kisa vadede bir preset secip koruma seviyesini sabitle.",
    commandRecommendationNeedsAction: "Kriz modu veya yuksek kontrasti acarak korumayi guclendir.",
    commandRecommendationCritical: "Defansif preset uygula ve hemen bir destek aksiyonu baslat.",
    statusOn: "Acik",
    statusOff: "Kapali",
    quickActionsTitle: "Hizli Aksiyonlar",
    quickActionsSubtitle: "Sik kullanilan guvenlik adimlarina hizli erisim.",
    quickProgress: "Ilerleme",
    quickProgressDesc: "Risk, istikrar ve momentum panelini ac.",
    quickMindfulness: "Farkindalik",
    quickMindfulnessDesc: "Anlik durtu regulesi icin seansi baslat.",
    quickPremium: "Premium",
    quickPremiumDesc: "Kilitli araclar ve koruma paketini yonet.",
    quickActionOpen: "Ac",
    quickPriorityHigh: "Yuksek oncelik",
    quickPriorityMedium: "Orta oncelik",
    quickPriorityRoutine: "Rutin",
    presetTitle: "Koruma Presetleri",
    presetSubtitle: "Tek dokunusla ayar kombinasyonu uygula.",
    presetDefensive: "Defansif",
    presetDefensiveDesc: "Yuksek risk donemlerinde maksimum koruma odagi.",
    presetBalanced: "Dengeli",
    presetBalancedDesc: "Gunluk kullanimda guvenlik ve konfor dengesi.",
    presetStandard: "Standart",
    presetStandardDesc: "Minimal mudahale ile temel ayarlar.",
    presetCustom: "Ozel",
    presetActive: "Aktif",
    presetApply: "Uygula",
    presetRecommended: "Onerilen",
    presetTraitCrisis: "Kriz",
    presetTraitContrast: "Kontrast",
    presetTraitFont: "Yazi",
    presetAppliedTitle: "Preset uygulandi",
    presetAppliedBody: "Koruma ayarlari guncellendi.",
    addictionTitle: "Bagimlilik Takibini Yonet",
    addictionSubtitle: "Takibi acip kapatabilirsin. En az bir secim gerekli.",
    addictionHint: "Takibi ac / kapat",
    addictionCoverageLabel: "Kapsam",
    addictionCoverageText: (selected: number, total: number) => `${selected}/${total} alan aktif`,
    addictionHealthStrong: "Takip profili guclu",
    addictionHealthLimited: "Takip profili sinirli",
    addictionStatusActive: "Aktif",
    addictionStatusInactive: "Pasif",
    addictionPending: (count: number) => `${count} degisiklik kaydedilmeyi bekliyor.`,
    addictionDescGambling: "Kumar durtusu ve reset dongusunu operasyonel olarak takip eder.",
    addictionMissingTitle: "En az bir secim gerekli",
    addictionMissingBody: "En az bir bagimlilik secili olmali.",
    warningAtLeastOne: "En az bir secim yapmalisin.",
    save: "Kaydet",
    saving: "Kaydediliyor...",
    savedTitle: "Kaydedildi",
    savedBody: "Takip ayarlari guncellendi.",
    saveErrorTitle: "Hata",
    saveErrorBody: "Ayarlar kaydedilemedi. Lutfen tekrar dene.",
    sectionPrivacyTitle: "Gizlilik ve Guvenlik",
    sectionPrivacySubtitle: "Politikalar, sinirlamalar ve veri kullanimi.",
    privacyScoreLabel: "Gizlilik skoru",
    privacyProfileStrong: "Siki koruma",
    privacyProfileBalanced: "Dengeli koruma",
    privacyProfileNeedsAction: "Riskli konfigurasyon",
    privacyScoreSummary: (score: number) => `Gizlilik dayanimi ${score}/100`,
    privacySignalTelemetry: "Telemetri riski",
    privacyTelemetryLow: "Dusuk",
    privacyTelemetryMedium: "Orta",
    privacyTelemetryHigh: "Yuksek",
    privacyTelemetryLowHint: "Telemetri kapali, veri maruziyeti minimum.",
    privacyTelemetryMediumHint: "Sinirli telemetri acik, maruziyet kontrollu.",
    privacyTelemetryHighHint: "Teshis ve cokme raporlari acik, maruziyet artti.",
    privacySignalMinimization: "Veri minimizasyonu",
    privacyMinimizationOnHint: "Sadece gerekli teknik veri saklaniyor.",
    privacyMinimizationOffHint: "Gereksiz veri birikimi riski artabilir.",
    privacySignalRetention: "Saklama politikasi",
    privacyRetentionValue: (days: number) => `${days} gun`,
    privacyRetentionHintStrict: "Kisa saklama penceresi, risk azaltildi.",
    privacyRetentionHintBalanced: "Standart saklama suresi.",
    privacyRetentionHintExtended: "Uzun saklama suresi, maruziyet daha yuksek.",
    privacyActionCenterTitle: "Guvenli islem merkezi",
    privacyActionCenterSubtitle: "Politika ve veri haklarini hizli yonet.",
    privacyActionDataDesc: "Telemetri ve veri minimizasyon ayarlarini yonet.",
    privacyActionLimitationsDesc: "Kapsam sinirlarini ve kritik notlari gozden gecir.",
    privacyActionPolicyDesc: "Guncel gizlilik politikasini satir satir incele.",
    privacyActionOpen: "Incele",
    privacyDeleteCta: "Veri silme talebini baslat",
    privacyDeleteHint: "Destek ekibine hazir e-posta taslagi acilir.",
    privacyData: "Gizlilik ve Veri",
    limitations: "Sinirlamalar",
    sectionA11yTitle: "Erisilebilirlik",
    sectionA11ySubtitle: "Yazi boyutu, kontrast ve kriz modunu yonet.",
    a11yScoreLabel: "Erisim",
    a11yReadabilityStrong: "Okunabilirlik guclu",
    a11yReadabilityLimited: "Okunabilirlik gelistirilmeli",
    a11yReadabilitySummary: (scale: number) => `Yazi olcegi ${scale}x, kontrast korumasi`,
    a11yBoostTitle: "Okunabilirligi hizli guclendir",
    a11yBoostBody: "Yuksek kontrast ve en az 1.1x yazi boyutu otomatik aktif edilir.",
    a11yBoostReady: "Yuksek kontrast ve yazi boyutu zaten aktif.",
    a11yBoostAction: "Aktiflestir",
    a11yBoostAppliedTitle: "Erisilebilirlik guclendirildi",
    a11yBoostAppliedBody: "Yuksek kontrast ve yazi boyutu optimize edildi.",
    a11yContrastHint: "Metin ve buton gorunurlugunu artirir.",
    a11yFontHint: "Kucuk yazilari daha kolay okunur hale getirir.",
    crisisMode: "Kriz modu (sade ekran)",
    crisisModeHint: "SOS ekraninda daha az secenek gosterir.",
    highContrast: "Yuksek kontrast",
    fontScale: "Yazi boyutu",
    sectionSmsTitle: "Mesaj Korumasi",
    sectionSmsSubtitle: "SMS spam filtresi ve ozel anahtar kelimeler.",
    smsFilter: "SMS Filtresi",
    sectionSupportTitle: "Destek ve Iletisim",
    sectionSupportSubtitle: "Destek, veri silme ve yasal belgeler.",
    dataDeleteRequest: "Veri Silme Talebi",
    supportEmail: "Destek E-postasi",
    privacyPolicy: "Gizlilik Politikasi",
    terms: "Kullanim Sartlari",
    disclaimer: "Onemli Bilgilendirme",
    sectionHelpTitle: "Yardim ve Kaynaklar",
    supportNetwork: "Destek Agi",
    sos: "SOS",
    diagnostics: "Tanilamalar",
    emailFallbackTitle: "E-posta",
    emailFallbackDelete:
      "E-posta uygulamasi acilamadi. support@antislot.app adresine Veri Silme Talebi konusu ile yazin.",
    emailFallbackSupport:
      "E-posta uygulamasi acilamadi. Lutfen support@antislot.app adresine e-posta gonderin.",
  },
  en: {
    title: "Settings",
    loading: "Loading...",
    commandCenterTitle: "Control Center",
    commandCenterSubtitle: "Manage your protection posture from one screen.",
    trackingCoverage: "Tracking Coverage",
    accessibilityStatus: "Accessibility",
    systemProtection: "System Protection",
    profileLevel: "Profile Level",
    profileCritical: "Critical",
    profileStrong: "Strong",
    profileBalanced: "Balanced",
    profileNeedsAction: "Needs Action",
    commandHealthSummary: (score: number) => `Protection score ${score}/100`,
    commandTrackingReady: "All tracking areas are active.",
    commandTrackingLimited: "Tracking coverage is limited.",
    commandA11yReady: "Accessibility protection is strong.",
    commandA11yLimited: "Accessibility can be strengthened.",
    commandSystemReady: "System protection is stable.",
    commandSystemLimited: "System protection is limited.",
    commandRecommendationTitle: "Action recommendation",
    commandRecommendationStrong: "Keep the current setup and continue weekly review.",
    commandRecommendationBalanced: "Choose a preset to stabilize your protection level.",
    commandRecommendationNeedsAction: "Enable crisis mode or high contrast to strengthen protection.",
    commandRecommendationCritical: "Apply the Defensive preset and trigger a support action now.",
    statusOn: "On",
    statusOff: "Off",
    quickActionsTitle: "Quick Actions",
    quickActionsSubtitle: "Fast access to frequently used safety steps.",
    quickProgress: "Progress",
    quickProgressDesc: "Open the risk, stability, and momentum dashboard.",
    quickMindfulness: "Mindfulness",
    quickMindfulnessDesc: "Start a session for real-time urge regulation.",
    quickPremium: "Premium",
    quickPremiumDesc: "Manage locked tools and the protection package.",
    quickActionOpen: "Open",
    quickPriorityHigh: "High priority",
    quickPriorityMedium: "Medium priority",
    quickPriorityRoutine: "Routine",
    presetTitle: "Protection Presets",
    presetSubtitle: "Apply a settings combination in one tap.",
    presetDefensive: "Defensive",
    presetDefensiveDesc: "Maximum protection focus for high-risk phases.",
    presetBalanced: "Balanced",
    presetBalancedDesc: "Safety and comfort balance for daily use.",
    presetStandard: "Standard",
    presetStandardDesc: "Core settings with minimal intervention.",
    presetCustom: "Custom",
    presetActive: "Active",
    presetApply: "Apply",
    presetRecommended: "Recommended",
    presetTraitCrisis: "Crisis",
    presetTraitContrast: "Contrast",
    presetTraitFont: "Font",
    presetAppliedTitle: "Preset applied",
    presetAppliedBody: "Protection settings were updated.",
    addictionTitle: "Manage Addiction Tracking",
    addictionSubtitle: "You can enable or disable tracking. At least one selection is required.",
    addictionHint: "Enable / disable tracking",
    addictionCoverageLabel: "Coverage",
    addictionCoverageText: (selected: number, total: number) => `${selected}/${total} areas active`,
    addictionHealthStrong: "Tracking posture is strong",
    addictionHealthLimited: "Tracking posture is limited",
    addictionStatusActive: "Active",
    addictionStatusInactive: "Inactive",
    addictionPending: (count: number) => `${count} change is waiting to be saved.`,
    addictionDescGambling: "Operationally tracks gambling urges and reset cycles.",
    addictionMissingTitle: "At least one selection required",
    addictionMissingBody: "At least one addiction must stay selected.",
    warningAtLeastOne: "You must keep at least one selection.",
    save: "Save",
    saving: "Saving...",
    savedTitle: "Saved",
    savedBody: "Tracking settings were updated.",
    saveErrorTitle: "Error",
    saveErrorBody: "Settings could not be saved. Please try again.",
    sectionPrivacyTitle: "Privacy and Security",
    sectionPrivacySubtitle: "Policies, limitations, and data usage.",
    privacyScoreLabel: "Privacy score",
    privacyProfileStrong: "Hardened posture",
    privacyProfileBalanced: "Balanced posture",
    privacyProfileNeedsAction: "Exposure risk",
    privacyScoreSummary: (score: number) => `Privacy resilience ${score}/100`,
    privacySignalTelemetry: "Telemetry exposure",
    privacyTelemetryLow: "Low",
    privacyTelemetryMedium: "Medium",
    privacyTelemetryHigh: "High",
    privacyTelemetryLowHint: "Telemetry is off, exposure remains minimal.",
    privacyTelemetryMediumHint: "Limited telemetry is active with controlled exposure.",
    privacyTelemetryHighHint: "Diagnostics and crash reports are active; exposure is higher.",
    privacySignalMinimization: "Data minimization",
    privacyMinimizationOnHint: "Only required technical data is retained.",
    privacyMinimizationOffHint: "Unnecessary data accumulation risk is higher.",
    privacySignalRetention: "Retention policy",
    privacyRetentionValue: (days: number) => `${days} days`,
    privacyRetentionHintStrict: "Short retention window with reduced risk.",
    privacyRetentionHintBalanced: "Standard retention window.",
    privacyRetentionHintExtended: "Long retention window with higher exposure.",
    privacyActionCenterTitle: "Secure action center",
    privacyActionCenterSubtitle: "Manage policies and data rights quickly.",
    privacyActionDataDesc: "Control telemetry and data minimization preferences.",
    privacyActionLimitationsDesc: "Review scope limits and critical constraints.",
    privacyActionPolicyDesc: "Inspect the latest privacy policy line by line.",
    privacyActionOpen: "Review",
    privacyDeleteCta: "Start data deletion request",
    privacyDeleteHint: "Opens a ready-to-send email draft for support.",
    privacyData: "Privacy and Data",
    limitations: "Limitations",
    sectionA11yTitle: "Accessibility",
    sectionA11ySubtitle: "Manage text size, contrast, and crisis mode.",
    a11yScoreLabel: "A11y",
    a11yReadabilityStrong: "Readability is strong",
    a11yReadabilityLimited: "Readability needs improvement",
    a11yReadabilitySummary: (scale: number) => `Text scale ${scale}x with contrast protection`,
    a11yBoostTitle: "Strengthen readability fast",
    a11yBoostBody: "High contrast and at least 1.1x text size are enabled automatically.",
    a11yBoostReady: "High contrast and text size are already active.",
    a11yBoostAction: "Activate",
    a11yBoostAppliedTitle: "Accessibility strengthened",
    a11yBoostAppliedBody: "High contrast and text size were optimized.",
    a11yContrastHint: "Improves text and button visibility.",
    a11yFontHint: "Makes smaller text easier to read.",
    crisisMode: "Crisis mode (simplified screen)",
    crisisModeHint: "Shows fewer choices on SOS screen.",
    highContrast: "High contrast",
    fontScale: "Text size",
    sectionSmsTitle: "Message Protection",
    sectionSmsSubtitle: "SMS spam filter and custom keywords.",
    smsFilter: "SMS Filter",
    sectionSupportTitle: "Support and Contact",
    sectionSupportSubtitle: "Support, data deletion, and legal documents.",
    dataDeleteRequest: "Data Deletion Request",
    supportEmail: "Support Email",
    privacyPolicy: "Privacy Policy",
    terms: "Terms of Use",
    disclaimer: "Important Disclaimer",
    sectionHelpTitle: "Help and Resources",
    supportNetwork: "Support Network",
    sos: "SOS",
    diagnostics: "Diagnostics",
    emailFallbackTitle: "Email",
    emailFallbackDelete:
      "Email app could not be opened. Send your request to support@antislot.app with the subject Data Deletion Request.",
    emailFallbackSupport:
      "Email app could not be opened. Please send an email to support@antislot.app.",
  },
} as const;

const ADDICTION_LABELS_LOCALIZED = {
  gambling: {
    tr: "Kumar",
    en: "Gambling",
    de: "Gluecksspiel",
    fr: "Jeu d'argent",
    hi: "Jua",
    lv: "Azartspeles",
    zh: "Dubo",
    tl: "Pagsusugal",
    sq: "Bixhoz",
    sr: "Kockanje",
    fi: "Rahapelaaminen",
    sv: "Spel om pengar",
    it: "Gioco d'azzardo",
    is: "Fjarmalaspil",
    ja: "Gyanburu",
    ko: "Dobak",
    es: "Juego",
    pt: "Jogo de azar",
    ms: "Judi",
    km: "Gambling",
    th: "Gambling",
  },
} as const;

const ADDICTION_DESCRIPTIONS_LOCALIZED = {
  gambling: {
    tr: "Kumar durtusu ve reset dongusunu operasyonel olarak takip eder.",
    en: "Operationally tracks gambling urges and reset cycles.",
    de: "Verfolgt Gluecksspiel-Drang und Rueckfall-Zyklus operativ.",
    fr: "Suit les envies de jeu et le cycle de rechute.",
    hi: "Jua urges aur relapse cycle ko track karta hai.",
    lv: "Operativi seko azartspelu tieksmei un recidiva ciklam.",
    zh: "Zhui zong dubo chongdong he fanfu xunhuan.",
    tl: "Sinusubaybayan ang urges sa sugal at relapse cycle.",
    sq: "Ndjek operativisht nxitjen per bixhoz dhe ciklin e rikthimit.",
    sr: "Operativno prati poriv za kockanjem i ciklus povratka.",
    fi: "Seuraa rahapelihimoja ja repsahdussykleja.",
    sv: "Folj upp spelbegar och aterfallsmönster.",
    it: "Monitora impulsi di gioco e ciclo di ricaduta.",
    is: "Fylgist med spilahvot og bakslagshring.",
    ja: "Gyanburu no shoudou to relapse cycle wo tsuiseki shimasu.",
    ko: "Dobak urge wa relapse cycle-eul chujeokhamnida.",
    es: "Sigue impulsos de juego y ciclo de recaida.",
    pt: "Acompanha impulsos de jogo e ciclo de recaida.",
    ms: "Menjejak dorongan judi dan kitaran relapse.",
    km: "Tracks gambling urges and relapse cycle.",
    th: "Tracks gambling urges and relapse cycle.",
  },
} as const;

function getAddictionLabel(key: (typeof ADDICTION_KEYS)[number], language: SupportedLanguage) {
  const table = ADDICTION_LABELS_LOCALIZED[key];
  return table[language] ?? table.en;
}

function getAddictionDescription(
  key: (typeof ADDICTION_KEYS)[number],
  language: SupportedLanguage,
  fallback: string
) {
  return ADDICTION_DESCRIPTIONS_LOCALIZED[key]?.[language] ?? ADDICTION_DESCRIPTIONS_LOCALIZED[key]?.en ?? fallback;
}

type PresetId = "defensive" | "balanced" | "standard";

export default function SettingsScreen() {
  const { t, language, selectedLanguage } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(SETTINGS_COPY);
  const { isActive: isPremiumActive } = usePremium();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);

  const { preferences: a11y, hydrated: a11yHydrated, updatePreferences: updateA11y } =
    useAccessibilityStore();
  const {
    preferences: privacyPrefs,
    hydrated: privacyHydrated,
    hydrate: hydratePrivacy,
  } = usePrivacyStore();
  const { userAddictions, hydrated, setManyAddictions } = useUserAddictionsStore();
  const [draft, setDraft] = useState<UserAddictions>(userAddictions);
  const [saving, setSaving] = useState(false);
  const [a11yAutoboostChecked, setA11yAutoboostChecked] = useState(false);

  useEffect(() => {
    if (!privacyHydrated) {
      void hydratePrivacy();
    }
  }, [hydratePrivacy, privacyHydrated]);

  useEffect(() => {
    if (hydrated) {
      setDraft(userAddictions);
    }
  }, [hydrated, userAddictions]);

  useEffect(() => {
    if (!a11yHydrated || a11yAutoboostChecked) return;
    setA11yAutoboostChecked(true);
    if (!a11y.highContrast || a11y.fontScale < 1.1) {
      void updateA11y({
        highContrast: true,
        fontScale: (a11y.fontScale >= 1.1 ? a11y.fontScale : 1.1) as 1.1 | 1.2 | 1.3,
      });
    }
  }, [a11y.fontScale, a11y.highContrast, a11yAutoboostChecked, a11yHydrated, updateA11y]);

  const selectedCount = useMemo(() => ADDICTION_KEYS.filter((key) => draft[key]).length, [draft]);
  const hasChanges = useMemo(
    () => ADDICTION_KEYS.some((key) => draft[key] !== userAddictions[key]),
    [draft, userAddictions]
  );
  const unsavedAddictionChanges = useMemo(
    () => ADDICTION_KEYS.filter((key) => draft[key] !== userAddictions[key]).length,
    [draft, userAddictions]
  );
  const addictionCoveragePercent = Math.round((selectedCount / ADDICTION_KEYS.length) * 100);
  const addictionTrackingMeta = useMemo(() => {
    const strong = selectedCount === ADDICTION_KEYS.length;
    return {
      label: strong ? copy.addictionHealthStrong : copy.addictionHealthLimited,
      color: strong ? "#1E7A55" : colors.warning ?? "#D97706",
    };
  }, [colors.warning, copy.addictionHealthLimited, copy.addictionHealthStrong, selectedCount]);
  const privacyScore = useMemo(() => {
    let score = 35;
    score += privacyPrefs.dataMinimization ? 28 : 6;

    if (!privacyPrefs.telemetryEnabled) {
      score += 24;
    } else if (!privacyPrefs.shareDiagnostics && !privacyPrefs.crashReporting) {
      score += 16;
    } else if (privacyPrefs.shareDiagnostics && privacyPrefs.crashReporting) {
      score += 6;
    } else {
      score += 11;
    }

    score += privacyPrefs.retentionDays === 7 ? 18 : privacyPrefs.retentionDays === 30 ? 11 : 6;
    return Math.min(100, score);
  }, [
    privacyPrefs.crashReporting,
    privacyPrefs.dataMinimization,
    privacyPrefs.retentionDays,
    privacyPrefs.shareDiagnostics,
    privacyPrefs.telemetryEnabled,
  ]);
  const privacyProfileMeta = useMemo(() => {
    if (privacyScore >= 80) {
      return { label: copy.privacyProfileStrong, color: "#1E7A55" };
    }
    if (privacyScore >= 60) {
      return { label: copy.privacyProfileBalanced, color: colors.primary };
    }
    return { label: copy.privacyProfileNeedsAction, color: colors.warning ?? "#D97706" };
  }, [
    colors.primary,
    colors.warning,
    copy.privacyProfileBalanced,
    copy.privacyProfileNeedsAction,
    copy.privacyProfileStrong,
    privacyScore,
  ]);
  const telemetryMeta = useMemo(() => {
    if (!privacyPrefs.telemetryEnabled) {
      return { label: copy.privacyTelemetryLow, summary: copy.privacyTelemetryLowHint, color: "#1E7A55" };
    }
    if (privacyPrefs.shareDiagnostics && privacyPrefs.crashReporting) {
      return {
        label: copy.privacyTelemetryHigh,
        summary: copy.privacyTelemetryHighHint,
        color: colors.warning ?? "#D97706",
      };
    }
    return {
      label: copy.privacyTelemetryMedium,
      summary: copy.privacyTelemetryMediumHint,
      color: colors.primary,
    };
  }, [
    colors.primary,
    colors.warning,
    copy.privacyTelemetryHigh,
    copy.privacyTelemetryHighHint,
    copy.privacyTelemetryLow,
    copy.privacyTelemetryLowHint,
    copy.privacyTelemetryMedium,
    copy.privacyTelemetryMediumHint,
    privacyPrefs.crashReporting,
    privacyPrefs.shareDiagnostics,
    privacyPrefs.telemetryEnabled,
  ]);
  const privacyRetentionSummary = useMemo(() => {
    if (privacyPrefs.retentionDays === 7) return copy.privacyRetentionHintStrict;
    if (privacyPrefs.retentionDays === 30) return copy.privacyRetentionHintBalanced;
    return copy.privacyRetentionHintExtended;
  }, [
    copy.privacyRetentionHintBalanced,
    copy.privacyRetentionHintExtended,
    copy.privacyRetentionHintStrict,
    privacyPrefs.retentionDays,
  ]);
  const privacySignals = useMemo(
    () => [
      {
        id: "telemetry",
        icon: "pulse-outline" as const,
        label: copy.privacySignalTelemetry,
        value: telemetryMeta.label,
        summary: telemetryMeta.summary,
        color: telemetryMeta.color,
      },
      {
        id: "minimization",
        icon: "funnel-outline" as const,
        label: copy.privacySignalMinimization,
        value: privacyPrefs.dataMinimization ? copy.statusOn : copy.statusOff,
        summary: privacyPrefs.dataMinimization
          ? copy.privacyMinimizationOnHint
          : copy.privacyMinimizationOffHint,
        color: privacyPrefs.dataMinimization ? "#1E7A55" : colors.warning ?? "#D97706",
      },
      {
        id: "retention",
        icon: "time-outline" as const,
        label: copy.privacySignalRetention,
        value: copy.privacyRetentionValue(privacyPrefs.retentionDays),
        summary: privacyRetentionSummary,
        color: privacyPrefs.retentionDays === 90 ? colors.warning ?? "#D97706" : colors.primary,
      },
    ],
    [
      colors.primary,
      colors.warning,
      copy,
      privacyPrefs.dataMinimization,
      privacyPrefs.retentionDays,
      privacyRetentionSummary,
      telemetryMeta.color,
      telemetryMeta.label,
      telemetryMeta.summary,
    ]
  );
  const enabledAccessibilityCount = useMemo(() => {
    let count = 0;
    if (a11y.crisisMode) count += 1;
    if (a11y.highContrast) count += 1;
    if (a11y.fontScale > 1) count += 1;
    return count;
  }, [a11y.crisisMode, a11y.fontScale, a11y.highContrast]);
  const a11yReadabilityReady = a11y.highContrast && a11y.fontScale >= 1.1;
  const a11yReadabilityScore = useMemo(() => {
    let score = 35;
    score += a11y.highContrast ? 35 : 0;
    score += a11y.fontScale >= 1.2 ? 30 : a11y.fontScale >= 1.1 ? 24 : 0;
    return Math.min(100, score);
  }, [a11y.fontScale, a11y.highContrast]);
  const a11yReadabilityMeta = useMemo(
    () => ({
      label: a11yReadabilityReady ? copy.a11yReadabilityStrong : copy.a11yReadabilityLimited,
      color: a11yReadabilityReady ? "#1E7A55" : colors.warning ?? "#D97706",
    }),
    [
      a11yReadabilityReady,
      colors.warning,
      copy.a11yReadabilityLimited,
      copy.a11yReadabilityStrong,
    ]
  );

  const protectionScore = useMemo(() => {
    let score = 35;
    score += selectedCount > 0 ? 20 : 0;
    score += a11y.crisisMode ? 14 : 0;
    score += a11y.highContrast ? 11 : 0;
    score += a11y.fontScale >= 1.2 ? 8 : a11y.fontScale > 1 ? 5 : 0;
    score += isPremiumActive ? 8 : 0;
    if (gamblingFreeDays >= 30) score += 10;
    else if (gamblingFreeDays >= 7) score += 6;
    else if (gamblingFreeDays >= 1) score += 3;
    return Math.min(100, score);
  }, [a11y.crisisMode, a11y.fontScale, a11y.highContrast, gamblingFreeDays, isPremiumActive, selectedCount]);

  const profileMeta = useMemo(() => {
    if (protectionScore >= 80) {
      return { label: copy.profileStrong, color: "#1E7A55" };
    }
    if (protectionScore >= 60) {
      return { label: copy.profileBalanced, color: colors.primary };
    }
    if (protectionScore >= 40) {
      return { label: copy.profileNeedsAction, color: colors.warning ?? "#D97706" };
    }
    return { label: copy.profileCritical, color: "#B91C1C" };
  }, [colors.primary, colors.warning, copy.profileBalanced, copy.profileCritical, copy.profileNeedsAction, copy.profileStrong, protectionScore]);

  const commandRecommendation = useMemo(() => {
    if (protectionScore >= 80) return copy.commandRecommendationStrong;
    if (protectionScore >= 60) return copy.commandRecommendationBalanced;
    if (protectionScore >= 40) return copy.commandRecommendationNeedsAction;
    return copy.commandRecommendationCritical;
  }, [
    copy.commandRecommendationBalanced,
    copy.commandRecommendationCritical,
    copy.commandRecommendationNeedsAction,
    copy.commandRecommendationStrong,
    protectionScore,
  ]);

  const commandSignals = useMemo(() => {
    const trackingGood = selectedCount === ADDICTION_KEYS.length;
    const a11yGood = enabledAccessibilityCount >= 2;
    const systemGood = isPremiumActive || gamblingFreeDays >= 7;

    return [
      {
        id: "tracking",
        icon: "layers-outline" as const,
        label: copy.trackingCoverage,
        value: `${selectedCount}/${ADDICTION_KEYS.length}`,
        summary: trackingGood ? copy.commandTrackingReady : copy.commandTrackingLimited,
        color: trackingGood ? "#1E7A55" : colors.warning ?? "#D97706",
      },
      {
        id: "a11y",
        icon: "accessibility-outline" as const,
        label: copy.accessibilityStatus,
        value: `${enabledAccessibilityCount}/3`,
        summary: a11yGood ? copy.commandA11yReady : copy.commandA11yLimited,
        color: a11yGood ? "#1E7A55" : colors.warning ?? "#D97706",
      },
      {
        id: "system",
        icon: "shield-outline" as const,
        label: copy.systemProtection,
        value: isPremiumActive ? copy.statusOn : copy.statusOff,
        summary: systemGood ? copy.commandSystemReady : copy.commandSystemLimited,
        color: systemGood ? "#1E7A55" : colors.warning ?? "#D97706",
      },
    ];
  }, [
    copy.accessibilityStatus,
    copy.commandA11yLimited,
    copy.commandA11yReady,
    copy.commandSystemLimited,
    copy.commandSystemReady,
    copy.commandTrackingLimited,
    copy.commandTrackingReady,
    copy.statusOff,
    copy.statusOn,
    copy.systemProtection,
    copy.trackingCoverage,
    enabledAccessibilityCount,
    gamblingFreeDays,
    isPremiumActive,
    selectedCount,
    colors.warning,
  ]);

  const activePreset = useMemo<PresetId | "custom">(() => {
    if (a11y.crisisMode && a11y.highContrast && a11y.fontScale === 1.2) return "defensive";
    if (!a11y.crisisMode && a11y.highContrast && a11y.fontScale === 1.1) return "balanced";
    if (!a11y.crisisMode && !a11y.highContrast && a11y.fontScale === 1) return "standard";
    return "custom";
  }, [a11y.crisisMode, a11y.fontScale, a11y.highContrast]);

  const recommendedPreset = useMemo<PresetId>(() => {
    if (protectionScore < 45) return "defensive";
    if (protectionScore < 75) return "balanced";
    return "standard";
  }, [protectionScore]);

  const presetOptions = useMemo(
    () => [
      {
        id: "defensive" as const,
        icon: "shield-half" as const,
        label: copy.presetDefensive,
        description: copy.presetDefensiveDesc,
        config: { crisisMode: true, highContrast: true, fontScale: 1.2 as const },
      },
      {
        id: "balanced" as const,
        icon: "speedometer-outline" as const,
        label: copy.presetBalanced,
        description: copy.presetBalancedDesc,
        config: { crisisMode: false, highContrast: true, fontScale: 1.1 as const },
      },
      {
        id: "standard" as const,
        icon: "planet-outline" as const,
        label: copy.presetStandard,
        description: copy.presetStandardDesc,
        config: { crisisMode: false, highContrast: false, fontScale: 1 as const },
      },
    ],
    [
      copy.presetBalanced,
      copy.presetBalancedDesc,
      copy.presetDefensive,
      copy.presetDefensiveDesc,
      copy.presetStandard,
      copy.presetStandardDesc,
    ]
  );

  const quickActionItems = useMemo(() => {
    const primaryColor = colors.primary;
    const warningColor = colors.warning ?? "#D97706";
    const premiumColor = isPremiumActive ? "#1E7A55" : warningColor;

    return [
      {
        id: "progress",
        icon: "stats-chart-outline" as const,
        label: copy.quickProgress,
        description: copy.quickProgressDesc,
        route: "/progress",
        priority: protectionScore < 60 ? copy.quickPriorityHigh : copy.quickPriorityMedium,
        color: protectionScore < 60 ? warningColor : primaryColor,
      },
      {
        id: "mindfulness",
        icon: "leaf-outline" as const,
        label: copy.quickMindfulness,
        description: copy.quickMindfulnessDesc,
        route: "/mindfulness",
        priority: protectionScore < 70 ? copy.quickPriorityHigh : copy.quickPriorityRoutine,
        color: protectionScore < 70 ? warningColor : primaryColor,
      },
      {
        id: "premium",
        icon: "diamond-outline" as const,
        label: copy.quickPremium,
        description: copy.quickPremiumDesc,
        route: "/premium",
        priority: isPremiumActive ? copy.quickPriorityRoutine : copy.quickPriorityMedium,
        color: premiumColor,
      },
    ];
  }, [
    colors.primary,
    colors.warning,
    copy.quickMindfulness,
    copy.quickMindfulnessDesc,
    copy.quickPremium,
    copy.quickPremiumDesc,
    copy.quickPriorityHigh,
    copy.quickPriorityMedium,
    copy.quickPriorityRoutine,
    copy.quickProgress,
    copy.quickProgressDesc,
    isPremiumActive,
    protectionScore,
  ]);
  const privacyActionItems = useMemo(() => {
    const warningColor = colors.warning ?? "#D97706";
    return [
      {
        id: "privacy-data",
        icon: "shield-checkmark-outline" as const,
        label: copy.privacyData,
        description: copy.privacyActionDataDesc,
        route: "/privacy-data",
        color: colors.primary,
      },
      {
        id: "limitations",
        icon: "alert-circle-outline" as const,
        label: copy.limitations,
        description: copy.privacyActionLimitationsDesc,
        route: "/limitations",
        color: warningColor,
      },
      {
        id: "privacy-policy",
        icon: "document-text-outline" as const,
        label: copy.privacyPolicy,
        description: copy.privacyActionPolicyDesc,
        route: "/privacy",
        color: "#1E7A55",
      },
    ];
  }, [
    colors.primary,
    colors.warning,
    copy.limitations,
    copy.privacyActionDataDesc,
    copy.privacyActionLimitationsDesc,
    copy.privacyActionPolicyDesc,
    copy.privacyData,
    copy.privacyPolicy,
  ]);

  const handleApplyPreset = async (preset: PresetId) => {
    try {
      if (preset === "defensive") {
        await updateA11y({ crisisMode: true, highContrast: true, fontScale: 1.2 });
      } else if (preset === "balanced") {
        await updateA11y({ crisisMode: false, highContrast: true, fontScale: 1.1 });
      } else {
        await updateA11y({ crisisMode: false, highContrast: false, fontScale: 1 });
      }
      Alert.alert(copy.presetAppliedTitle, copy.presetAppliedBody);
    } catch {
      Alert.alert(copy.saveErrorTitle, copy.saveErrorBody);
    }
  };

  const handleEnableReadability = async () => {
    try {
      await updateA11y({
        highContrast: true,
        fontScale: (a11y.fontScale >= 1.1 ? a11y.fontScale : 1.1) as 1.1 | 1.2 | 1.3,
      });
      Alert.alert(copy.a11yBoostAppliedTitle, copy.a11yBoostAppliedBody);
    } catch {
      Alert.alert(copy.saveErrorTitle, copy.saveErrorBody);
    }
  };

  const handleToggle = (key: (typeof ADDICTION_KEYS)[number]) => {
    if (draft[key] && selectedCount === 1) {
      Alert.alert(copy.addictionMissingTitle, copy.addictionMissingBody);
      return;
    }
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (selectedCount === 0 || saving) return;
    try {
      setSaving(true);
      await setManyAddictions(draft);
      Alert.alert(copy.savedTitle, copy.savedBody);
    } catch {
      Alert.alert(copy.saveErrorTitle, copy.saveErrorBody);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = () => {
    const email = "support@antislot.app";
    const subject = encodeURIComponent(language === "en" ? "Data Deletion Request" : "Veri Silme Talebi");
    const body = encodeURIComponent(
      language === "en"
        ? "Hello,\n\nPlease process my data deletion request.\n\nName:\nEmail:\n"
        : "Merhaba,\n\nVeri silme talebimin isleme alinmasini rica ediyorum.\n\nIsim:\nE-posta:\n"
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert(copy.emailFallbackTitle, copy.emailFallbackDelete);
    });
  };

  const handleSupportEmail = () => {
    const email = "support@antislot.app";
    const subject = encodeURIComponent(language === "en" ? "AntiSlot Support" : "AntiSlot Destek");
    Linking.openURL(`mailto:${email}?subject=${subject}`).catch(() => {
      Alert.alert(copy.emailFallbackTitle, copy.emailFallbackSupport);
    });
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.textSecondary }]}>{copy.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, styles.backRow]}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.commandHeader}>
            <View style={styles.commandTitleRow}>
              <View style={[styles.commandIconWrap, { backgroundColor: `${colors.primary}22` }]}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              </View>
              <View style={styles.commandTextWrap}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>{copy.commandCenterTitle}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {copy.commandCenterSubtitle}
                </Text>
              </View>
            </View>
            <View style={[styles.scoreBadge, { borderColor: `${profileMeta.color}55`, backgroundColor: `${profileMeta.color}14` }]}>
              <Text style={[styles.scoreBadgeValue, { color: profileMeta.color }]}>{protectionScore}</Text>
              <Text style={[styles.scoreBadgeLabel, { color: profileMeta.color }]}>{copy.profileLevel}</Text>
            </View>
          </View>

          <View style={styles.commandSignalList}>
            {commandSignals.map((signal) => (
              <View
                key={signal.id}
                style={[styles.commandSignalRow, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <View style={[styles.commandSignalIconWrap, { backgroundColor: `${signal.color}20` }]}>
                  <Ionicons name={signal.icon} size={16} color={signal.color} />
                </View>
                <View style={styles.commandSignalInfo}>
                  <Text style={[styles.commandSignalLabel, { color: colors.text }]}>{signal.label}</Text>
                  <Text style={[styles.commandSignalHint, { color: colors.textSecondary }]}>{signal.summary}</Text>
                </View>
                <View style={[styles.commandSignalValuePill, { backgroundColor: `${signal.color}1A` }]}>
                  <Text style={[styles.commandSignalValue, { color: signal.color }]}>{signal.value}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.scoreWrap}>
            <View style={[styles.scoreTrack, { backgroundColor: `${colors.primary}1A` }]}>
              <View style={[styles.scoreFill, { width: `${protectionScore}%`, backgroundColor: profileMeta.color }]} />
            </View>
            <View style={styles.scoreMetaRow}>
              <Text style={[styles.scoreText, { color: colors.textSecondary }]}>{copy.commandHealthSummary(protectionScore)}</Text>
              <View style={[styles.profileBadge, { backgroundColor: `${profileMeta.color}1F` }]}>
                <Text style={[styles.profileBadgeText, { color: profileMeta.color }]}>{profileMeta.label}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.commandRecommendationCard, { borderColor: colors.border, backgroundColor: `${profileMeta.color}12` }]}>
            <View style={styles.commandRecommendationHeader}>
              <Ionicons name="sparkles-outline" size={15} color={profileMeta.color} />
              <Text style={[styles.commandRecommendationTitle, { color: profileMeta.color }]}>
                {copy.commandRecommendationTitle}
              </Text>
            </View>
            <Text style={[styles.commandRecommendationBody, { color: colors.text }]}>
              {commandRecommendation}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.presetTitle}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{copy.presetSubtitle}</Text>
          <View style={styles.presetStack}>
            {presetOptions.map((preset) => {
              const isActive = activePreset === preset.id;
              const isRecommended = recommendedPreset === preset.id && !isActive;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetCard,
                    {
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? `${colors.primary}14` : colors.background,
                    },
                  ]}
                  onPress={() => void handleApplyPreset(preset.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.presetCardTop}>
                    <View style={[styles.presetCardIcon, { backgroundColor: `${colors.primary}22` }]}>
                      <Ionicons name={preset.icon} size={16} color={colors.primary} />
                    </View>
                    <View style={styles.presetCardMain}>
                      <Text style={[styles.presetCardTitle, { color: colors.text }]}>{preset.label}</Text>
                      <Text style={[styles.presetCardDesc, { color: colors.textSecondary }]}>{preset.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.presetStatePill,
                        {
                          backgroundColor: isActive
                            ? `${colors.primary}1F`
                            : isRecommended
                              ? `${colors.warning ?? "#D97706"}1F`
                              : `${colors.border}66`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetStatePillText,
                          {
                            color: isActive
                              ? colors.primary
                              : isRecommended
                                ? colors.warning ?? "#D97706"
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {isActive ? copy.presetActive : isRecommended ? copy.presetRecommended : copy.presetApply}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.presetTraitsRow}>
                    <View style={[styles.presetTraitChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <Text style={[styles.presetTraitText, { color: colors.textSecondary }]}>
                        {copy.presetTraitCrisis}: {preset.config.crisisMode ? copy.statusOn : copy.statusOff}
                      </Text>
                    </View>
                    <View style={[styles.presetTraitChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <Text style={[styles.presetTraitText, { color: colors.textSecondary }]}>
                        {copy.presetTraitContrast}: {preset.config.highContrast ? copy.statusOn : copy.statusOff}
                      </Text>
                    </View>
                    <View style={[styles.presetTraitChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <Text style={[styles.presetTraitText, { color: colors.textSecondary }]}>
                        {copy.presetTraitFont}: {preset.config.fontScale}x
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.quickActionsTitle}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{copy.quickActionsSubtitle}</Text>
          <View style={styles.quickActionStack}>
            {quickActionItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.quickActionCard, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => router.push(item.route as Href)}
                activeOpacity={0.9}
              >
                <View style={[styles.quickActionIconWrap, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={17} color={item.color} />
                </View>
                <View style={styles.quickActionInfo}>
                  <View style={styles.quickActionHeader}>
                    <Text style={[styles.quickActionTitle, { color: colors.text }]}>{item.label}</Text>
                    <View style={[styles.quickActionPriorityPill, { backgroundColor: `${item.color}1A` }]}>
                      <Text style={[styles.quickActionPriorityText, { color: item.color }]}>{item.priority}</Text>
                    </View>
                  </View>
                  <Text style={[styles.quickActionDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
                <View style={styles.quickActionCtaWrap}>
                  <Text style={[styles.quickActionCtaText, { color: colors.primary }]}>{copy.quickActionOpen}</Text>
                  <Ionicons name="chevron-forward" size={15} color={colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.trackingHeaderRow}>
            <View style={styles.trackingHeaderLeft}>
              <View style={[styles.trackingIconWrap, { backgroundColor: `${colors.primary}22` }]}>
                <Ionicons name="analytics-outline" size={17} color={colors.primary} />
              </View>
              <View style={styles.commandTextWrap}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>{copy.addictionTitle}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {copy.addictionSubtitle}
                </Text>
              </View>
            </View>
            <View style={[styles.trackingSummaryPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.trackingSummaryValue, { color: colors.text }]}>
                {selectedCount}/{ADDICTION_KEYS.length}
              </Text>
              <Text style={[styles.trackingSummaryLabel, { color: colors.textSecondary }]}>
                {copy.addictionCoverageLabel}
              </Text>
            </View>
          </View>

          <View style={styles.trackingMetaRow}>
            <View style={[styles.trackingHealthBadge, { backgroundColor: `${addictionTrackingMeta.color}1F` }]}>
              <Text style={[styles.trackingHealthText, { color: addictionTrackingMeta.color }]}>
                {addictionTrackingMeta.label}
              </Text>
            </View>
            <Text style={[styles.trackingCoverageText, { color: colors.textSecondary }]}>
              {copy.addictionCoverageText(selectedCount, ADDICTION_KEYS.length)}
            </Text>
          </View>

          <View style={[styles.scoreTrack, { backgroundColor: `${colors.primary}1A`, marginBottom: 10 }]}>
            <View style={[styles.scoreFill, { width: `${addictionCoveragePercent}%`, backgroundColor: addictionTrackingMeta.color }]} />
          </View>

          {unsavedAddictionChanges > 0 ? (
            <View style={[styles.trackingPendingCard, { borderColor: colors.border, backgroundColor: `${colors.warning ?? "#D97706"}14` }]}>
              <Ionicons name="time-outline" size={14} color={colors.warning ?? "#D97706"} />
              <Text style={[styles.trackingPendingText, { color: colors.text }]}>
                {copy.addictionPending(unsavedAddictionChanges)}
              </Text>
            </View>
          ) : null}

          <View style={styles.trackingList}>
            {ADDICTION_KEYS.map((key) => {
              const enabled = draft[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.trackingItemCard, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => handleToggle(key)}
                  activeOpacity={0.9}
                >
                  <View style={styles.trackingItemLeft}>
                    <View style={[styles.trackingItemIconWrap, { backgroundColor: `${colors.primary}20` }]}>
                      <Ionicons name={enabled ? "checkmark-circle-outline" : "ellipse-outline"} size={16} color={enabled ? "#1E7A55" : colors.textSecondary} />
                    </View>
                    <View style={styles.trackingItemInfo}>
                      <View style={styles.trackingItemTop}>
                        <Text style={[styles.trackingItemLabel, { color: colors.text }]}>{getAddictionLabel(key, selectedLanguage)}</Text>
                        <View style={[styles.trackingItemStatePill, { backgroundColor: `${enabled ? "#1E7A55" : colors.warning ?? "#D97706"}1A` }]}>
                          <Text style={[styles.trackingItemStateText, { color: enabled ? "#1E7A55" : colors.warning ?? "#D97706" }]}>
                            {enabled ? copy.addictionStatusActive : copy.addictionStatusInactive}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.trackingItemDesc, { color: colors.textSecondary }]}>
                        {getAddictionDescription(key, selectedLanguage, copy.addictionDescGambling)}
                      </Text>
                      <Text style={[styles.trackingItemHint, { color: colors.textSecondary }]}>{copy.addictionHint}</Text>
                    </View>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={() => handleToggle(key)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedCount === 0 ? (
            <Text style={[styles.warning, { color: colors.warning ?? "#D97706" }]}>{copy.warningAtLeastOne}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
            (!hasChanges || selectedCount === 0 || saving) && [
              styles.primaryButtonDisabled,
              { backgroundColor: colors.disabled },
            ],
          ]}
          onPress={handleSave}
          disabled={!hasChanges || selectedCount === 0 || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>{saving ? copy.saving : copy.save}</Text>
        </TouchableOpacity>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.privacyHeaderRow}>
            <View style={styles.privacyHeaderLeft}>
              <View style={[styles.privacyIconWrap, { backgroundColor: `${colors.primary}22` }]}>
                <Ionicons name="lock-closed-outline" size={17} color={colors.primary} />
              </View>
              <View style={styles.commandTextWrap}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>{copy.sectionPrivacyTitle}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {copy.sectionPrivacySubtitle}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.privacyScoreBadge,
                {
                  borderColor: `${privacyProfileMeta.color}55`,
                  backgroundColor: `${privacyProfileMeta.color}14`,
                },
              ]}
            >
              <Text style={[styles.privacyScoreValue, { color: privacyProfileMeta.color }]}>{privacyScore}</Text>
              <Text style={[styles.privacyScoreLabel, { color: privacyProfileMeta.color }]}>{copy.privacyScoreLabel}</Text>
            </View>
          </View>

          <View style={styles.privacyMetaRow}>
            <View style={[styles.privacyHealthBadge, { backgroundColor: `${privacyProfileMeta.color}1F` }]}>
              <Text style={[styles.privacyHealthText, { color: privacyProfileMeta.color }]}>{privacyProfileMeta.label}</Text>
            </View>
            <Text style={[styles.privacySummaryText, { color: colors.textSecondary }]}>
              {copy.privacyScoreSummary(privacyScore)}
            </Text>
          </View>

          <View style={[styles.scoreTrack, { backgroundColor: `${colors.primary}1A`, marginBottom: 10 }]}>
            <View style={[styles.scoreFill, { width: `${privacyScore}%`, backgroundColor: privacyProfileMeta.color }]} />
          </View>

          <View style={styles.privacySignalList}>
            {privacySignals.map((signal) => (
              <View
                key={signal.id}
                style={[styles.privacySignalRow, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <View style={[styles.privacySignalIconWrap, { backgroundColor: `${signal.color}1F` }]}>
                  <Ionicons name={signal.icon} size={15} color={signal.color} />
                </View>
                <View style={styles.privacySignalInfo}>
                  <View style={styles.privacySignalTop}>
                    <Text style={[styles.privacySignalLabel, { color: colors.text }]}>{signal.label}</Text>
                    <View style={[styles.privacySignalValuePill, { backgroundColor: `${signal.color}1A` }]}>
                      <Text style={[styles.privacySignalValue, { color: signal.color }]}>{signal.value}</Text>
                    </View>
                  </View>
                  <Text style={[styles.privacySignalHint, { color: colors.textSecondary }]}>{signal.summary}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.privacyActionHeader}>
            <Text style={[styles.privacyActionTitle, { color: colors.text }]}>{copy.privacyActionCenterTitle}</Text>
            <Text style={[styles.privacyActionSubtitle, { color: colors.textSecondary }]}>
              {copy.privacyActionCenterSubtitle}
            </Text>
          </View>

          <View style={styles.privacyActionStack}>
            {privacyActionItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.privacyActionCard, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => router.push(item.route as Href)}
                activeOpacity={0.9}
              >
                <View style={[styles.privacyActionIconWrap, { backgroundColor: `${item.color}1F` }]}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                </View>
                <View style={styles.privacyActionInfo}>
                  <Text style={[styles.privacyActionCardTitle, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.privacyActionCardDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>
                <View style={styles.privacyActionCta}>
                  <Text style={[styles.privacyActionCtaText, { color: item.color }]}>{copy.privacyActionOpen}</Text>
                  <Ionicons name="chevron-forward" size={15} color={item.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.privacyDeleteButton,
              { borderColor: colors.border, backgroundColor: `${colors.warning ?? "#D97706"}14` },
            ]}
            onPress={handleDeleteRequest}
            activeOpacity={0.9}
          >
            <Ionicons name="mail-open-outline" size={16} color={colors.warning ?? "#D97706"} />
            <View style={styles.privacyDeleteInfo}>
              <Text style={[styles.privacyDeleteTitle, { color: colors.text }]}>{copy.privacyDeleteCta}</Text>
              <Text style={[styles.privacyDeleteHint, { color: colors.textSecondary }]}>{copy.privacyDeleteHint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.warning ?? "#D97706"} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.a11yHeaderRow}>
            <View style={styles.a11yHeaderLeft}>
              <View style={[styles.a11yIconWrap, { backgroundColor: `${colors.primary}22` }]}>
                <Ionicons name="accessibility-outline" size={17} color={colors.primary} />
              </View>
              <View style={styles.commandTextWrap}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>{copy.sectionA11yTitle}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {copy.sectionA11ySubtitle}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.a11yScoreBadge,
                { borderColor: `${a11yReadabilityMeta.color}55`, backgroundColor: `${a11yReadabilityMeta.color}14` },
              ]}
            >
              <Text style={[styles.a11yScoreValue, { color: a11yReadabilityMeta.color }]}>{a11yReadabilityScore}</Text>
              <Text style={[styles.a11yScoreLabel, { color: a11yReadabilityMeta.color }]}>{copy.a11yScoreLabel}</Text>
            </View>
          </View>

          <View style={styles.a11yMetaRow}>
            <View style={[styles.a11yHealthBadge, { backgroundColor: `${a11yReadabilityMeta.color}1F` }]}>
              <Text style={[styles.a11yHealthText, { color: a11yReadabilityMeta.color }]}>
                {a11yReadabilityMeta.label}
              </Text>
            </View>
            <Text style={[styles.a11yMetaText, { color: colors.textSecondary }]}>
              {copy.a11yReadabilitySummary(a11y.fontScale)}
            </Text>
          </View>

          <View style={[styles.scoreTrack, { backgroundColor: `${colors.primary}1A`, marginBottom: 10 }]}>
            <View
              style={[
                styles.scoreFill,
                { width: `${a11yReadabilityScore}%`, backgroundColor: a11yReadabilityMeta.color },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.a11yBoostCard,
              { borderColor: colors.border, backgroundColor: `${a11yReadabilityMeta.color}12` },
            ]}
            onPress={() => void handleEnableReadability()}
            activeOpacity={0.9}
            disabled={a11yReadabilityReady}
          >
            <View style={[styles.a11yBoostIconWrap, { backgroundColor: `${a11yReadabilityMeta.color}20` }]}>
              <Ionicons
                name={a11yReadabilityReady ? "checkmark-done-circle-outline" : "sparkles-outline"}
                size={16}
                color={a11yReadabilityMeta.color}
              />
            </View>
            <View style={styles.a11yBoostInfo}>
              <Text style={[styles.a11yBoostTitle, { color: colors.text }]}>{copy.a11yBoostTitle}</Text>
              <Text style={[styles.a11yBoostBody, { color: colors.textSecondary }]}>
                {a11yReadabilityReady ? copy.a11yBoostReady : copy.a11yBoostBody}
              </Text>
            </View>
            <View
              style={[
                styles.a11yBoostPill,
                { backgroundColor: `${a11yReadabilityReady ? a11yReadabilityMeta.color : colors.primary}1A` },
              ]}
            >
              <Text
                style={[
                  styles.a11yBoostPillText,
                  { color: a11yReadabilityReady ? a11yReadabilityMeta.color : colors.primary },
                ]}
              >
                {a11yReadabilityReady ? copy.statusOn : copy.a11yBoostAction}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
            onPress={() => void updateA11y({ crisisMode: !a11y.crisisMode })}
            activeOpacity={0.85}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{copy.crisisMode}</Text>
              <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>{copy.crisisModeHint}</Text>
            </View>
            <Switch
              value={a11y.crisisMode}
              onValueChange={(value) => void updateA11y({ crisisMode: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
            onPress={() => void updateA11y({ highContrast: !a11y.highContrast })}
            activeOpacity={0.85}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{copy.highContrast}</Text>
              <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>{copy.a11yContrastHint}</Text>
            </View>
            <Switch
              value={a11y.highContrast}
              onValueChange={(value) => void updateA11y({ highContrast: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={[styles.toggleHint, { color: colors.textSecondary, marginTop: 8 }]}>{copy.fontScale}</Text>
          <Text style={[styles.a11yScaleHint, { color: colors.textSecondary }]}>{copy.a11yFontHint}</Text>
          <View style={styles.scaleRow}>
            {[1, 1.1, 1.2, 1.3].map((scale) => (
              <TouchableOpacity
                key={scale}
                style={[
                  styles.scaleChip,
                  { borderColor: colors.border },
                  a11y.fontScale === scale && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => void updateA11y({ fontScale: scale as 1 | 1.1 | 1.2 | 1.3 })}
              >
                <Text
                  style={[
                    styles.scaleChipText,
                    { color: colors.text },
                    a11y.fontScale === scale && { color: "#FFFFFF" },
                  ]}
                >
                  {scale}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {ENABLE_SMS_ROLE && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.sectionSmsTitle}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{copy.sectionSmsSubtitle}</Text>
            <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push("/sms-filter")}>
              <Text style={[styles.linkLabel, { color: colors.text }]}>{copy.smsFilter}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.sectionSupportTitle}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{copy.sectionSupportSubtitle}</Text>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={handleDeleteRequest}>
            <Text style={[styles.linkLabel, { color: colors.text }]}>{copy.dataDeleteRequest}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={handleSupportEmail}>
            <Text style={[styles.linkLabel, { color: colors.text }]}>{copy.supportEmail}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push("/privacy")}>
            <Text style={[styles.linkLabel, { color: colors.text }]}>{copy.privacyPolicy}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push("/terms")}>
            <Text style={[styles.linkLabel, { color: colors.text }]}>{copy.terms}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push("/disclaimer")}>
            <Text style={[styles.linkLabel, { color: colors.text }]}>{copy.disclaimer}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.sectionHelpTitle}</Text>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push("/community")}>
            <Text style={[styles.linkLabel, { color: colors.text }]}>{copy.supportNetwork}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push("/sos")}>
            <Text style={[styles.linkLabel, { color: colors.text }]}>{copy.sos}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push("/diagnostics")}>
            <Text style={[styles.linkLabel, { color: colors.text }]}>{copy.diagnostics}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 10 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 15, fontFamily: Fonts.bodyMedium },
  title: { fontSize: 26, fontFamily: Fonts.display },
  section: {
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.bodySemiBold, marginBottom: 6, lineHeight: 22, flexShrink: 1 },
  sectionSubtitle: { fontSize: 13, fontFamily: Fonts.body, marginBottom: 16, lineHeight: 18, flexShrink: 1 },
  commandHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  commandTitleRow: { flexDirection: "row", flex: 1, gap: 10, minWidth: 0 },
  commandIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  commandTextWrap: { flex: 1, minWidth: 0 },
  scoreBadge: {
    width: 92,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadgeValue: {
    fontSize: 24,
    fontFamily: Fonts.display,
    lineHeight: 28,
  },
  scoreBadgeLabel: {
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
    marginTop: 1,
    textAlign: "center",
    width: "100%",
  },
  profileBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  profileBadgeText: { fontSize: 11, fontFamily: Fonts.bodySemiBold },
  commandSignalList: { gap: 8, marginBottom: 10 },
  commandSignalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  commandSignalIconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  commandSignalInfo: { flex: 1, minWidth: 0 },
  commandSignalLabel: { fontSize: 13, fontFamily: Fonts.bodySemiBold, marginBottom: 1, flexShrink: 1 },
  commandSignalHint: { fontSize: 11, fontFamily: Fonts.body, lineHeight: 15, flexShrink: 1 },
  commandSignalValuePill: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  commandSignalValue: { fontSize: 11, fontFamily: Fonts.bodySemiBold },
  scoreWrap: { marginTop: 4 },
  scoreTrack: {
    height: 10,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginBottom: 6,
  },
  scoreFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  scoreMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  scoreText: { fontSize: 12, fontFamily: Fonts.bodyMedium },
  commandRecommendationCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 10,
  },
  commandRecommendationHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  commandRecommendationTitle: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
  commandRecommendationBody: { fontSize: 13, lineHeight: 19, fontFamily: Fonts.bodyMedium },
  presetStack: { gap: 10 },
  presetCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
  },
  presetCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  presetCardIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  presetCardMain: { flex: 1, minWidth: 0 },
  presetCardTitle: { fontSize: 14, fontFamily: Fonts.bodySemiBold, marginBottom: 2, flexShrink: 1 },
  presetCardDesc: { fontSize: 12, lineHeight: 17, fontFamily: Fonts.body, flexShrink: 1 },
  presetStatePill: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presetStatePillText: { fontSize: 10, fontFamily: Fonts.bodySemiBold },
  presetTraitsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  presetTraitChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presetTraitText: { fontSize: 10, fontFamily: Fonts.bodyMedium },
  quickActionStack: { gap: 8 },
  quickActionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickActionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionInfo: { flex: 1, minWidth: 0 },
  quickActionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  quickActionTitle: { fontSize: 13, fontFamily: Fonts.bodySemiBold, flexShrink: 1, lineHeight: 17 },
  quickActionDescription: { fontSize: 11, lineHeight: 16, fontFamily: Fonts.body, flexShrink: 1 },
  quickActionPriorityPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickActionPriorityText: { fontSize: 10, fontFamily: Fonts.bodySemiBold },
  quickActionCtaWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
  quickActionCtaText: { fontSize: 11, fontFamily: Fonts.bodySemiBold },
  trackingHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  trackingHeaderLeft: { flexDirection: "row", flex: 1, gap: 10, minWidth: 0 },
  trackingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  trackingSummaryPill: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: "flex-start",
    width: 90,
    alignItems: "center",
  },
  trackingSummaryValue: { fontSize: 14, fontFamily: Fonts.bodySemiBold, lineHeight: 16 },
  trackingSummaryLabel: { fontSize: 10, fontFamily: Fonts.body, textAlign: "center", width: "100%" },
  trackingMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  trackingHealthBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trackingHealthText: { fontSize: 10, fontFamily: Fonts.bodySemiBold },
  trackingCoverageText: { fontSize: 11, fontFamily: Fonts.bodyMedium, flex: 1, textAlign: "right" },
  trackingPendingCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  trackingPendingText: { fontSize: 12, fontFamily: Fonts.bodyMedium, lineHeight: 16, flex: 1 },
  trackingList: { gap: 8 },
  trackingItemCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  trackingItemLeft: { flexDirection: "row", alignItems: "flex-start", gap: 9, flex: 1 },
  trackingItemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  trackingItemInfo: { flex: 1, minWidth: 0 },
  trackingItemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 2 },
  trackingItemLabel: { fontSize: 14, fontFamily: Fonts.bodySemiBold, flex: 1, paddingRight: 4 },
  trackingItemStatePill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  trackingItemStateText: { fontSize: 10, fontFamily: Fonts.bodySemiBold },
  trackingItemDesc: { fontSize: 12, lineHeight: 17, fontFamily: Fonts.body },
  trackingItemHint: { fontSize: 10, marginTop: 4, fontFamily: Fonts.bodyMedium },
  privacyHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  privacyHeaderLeft: { flexDirection: "row", flex: 1, gap: 10, minWidth: 0 },
  privacyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  privacyScoreBadge: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: "flex-start",
    width: 90,
    alignItems: "center",
  },
  privacyScoreValue: { fontSize: 14, fontFamily: Fonts.bodySemiBold, lineHeight: 16 },
  privacyScoreLabel: { fontSize: 10, fontFamily: Fonts.body, textAlign: "center", width: "100%" },
  privacyMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  privacyHealthBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  privacyHealthText: { fontSize: 10, fontFamily: Fonts.bodySemiBold },
  privacySummaryText: { fontSize: 11, fontFamily: Fonts.bodyMedium, flex: 1, textAlign: "right" },
  privacySignalList: { gap: 8, marginBottom: 12 },
  privacySignalRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  privacySignalIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  privacySignalInfo: { flex: 1, minWidth: 0 },
  privacySignalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 2 },
  privacySignalLabel: { fontSize: 13, fontFamily: Fonts.bodySemiBold, flex: 1, paddingRight: 4 },
  privacySignalValuePill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  privacySignalValue: { fontSize: 10, fontFamily: Fonts.bodySemiBold },
  privacySignalHint: { fontSize: 11, lineHeight: 16, fontFamily: Fonts.body },
  privacyActionHeader: { marginBottom: 8 },
  privacyActionTitle: { fontSize: 13, fontFamily: Fonts.bodySemiBold, marginBottom: 2 },
  privacyActionSubtitle: { fontSize: 11, lineHeight: 15, fontFamily: Fonts.body },
  privacyActionStack: { gap: 8, marginBottom: 10 },
  privacyActionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  privacyActionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  privacyActionInfo: { flex: 1, minWidth: 0 },
  privacyActionCardTitle: { fontSize: 13, fontFamily: Fonts.bodySemiBold, marginBottom: 1, flexShrink: 1 },
  privacyActionCardDesc: { fontSize: 11, lineHeight: 16, fontFamily: Fonts.body, flexShrink: 1 },
  privacyActionCta: { flexDirection: "row", alignItems: "center", gap: 2 },
  privacyActionCtaText: { fontSize: 11, fontFamily: Fonts.bodySemiBold },
  privacyDeleteButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  privacyDeleteInfo: { flex: 1 },
  privacyDeleteTitle: { fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 1 },
  privacyDeleteHint: { fontSize: 11, lineHeight: 15, fontFamily: Fonts.body },
  a11yHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  a11yHeaderLeft: { flexDirection: "row", flex: 1, gap: 10, minWidth: 0 },
  a11yIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  a11yScoreBadge: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: "flex-start",
    width: 92,
    alignItems: "center",
  },
  a11yScoreValue: { fontSize: 14, fontFamily: Fonts.bodySemiBold, lineHeight: 16 },
  a11yScoreLabel: { fontSize: 10, fontFamily: Fonts.body, textAlign: "center", width: "100%" },
  a11yMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  a11yHealthBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  a11yHealthText: { fontSize: 10, fontFamily: Fonts.bodySemiBold },
  a11yMetaText: { fontSize: 11, fontFamily: Fonts.bodyMedium, flex: 1, textAlign: "right" },
  a11yBoostCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  a11yBoostIconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  a11yBoostInfo: { flex: 1, minWidth: 0 },
  a11yBoostTitle: { fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 1, flexShrink: 1 },
  a11yBoostBody: { fontSize: 11, lineHeight: 16, fontFamily: Fonts.body, flexShrink: 1 },
  a11yBoostPill: { borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 5 },
  a11yBoostPillText: { fontSize: 10, fontFamily: Fonts.bodySemiBold },
  a11yScaleHint: { fontSize: 11, fontFamily: Fonts.body, marginTop: 2 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleInfo: { flex: 1, paddingRight: 12, minWidth: 0 },
  toggleLabel: { fontSize: 15, fontFamily: Fonts.bodySemiBold, flexShrink: 1, lineHeight: 20 },
  toggleHint: { fontSize: 12, fontFamily: Fonts.body, marginTop: 2 },
  warning: { fontSize: 12, fontFamily: Fonts.bodyMedium, marginTop: 12 },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: Radius.xl,
    alignItems: "center",
  },
  primaryButtonDisabled: {},
  primaryButtonText: { color: "#FFFFFF", fontFamily: Fonts.bodySemiBold, fontSize: 16 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  linkLabel: { fontSize: 14, fontFamily: Fonts.bodySemiBold, flex: 1, lineHeight: 19 },
  scaleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  scaleChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scaleChipText: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loaderText: { fontSize: 14, fontFamily: Fonts.body },
});
