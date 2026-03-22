import { Fonts, Radius, Spacing } from "@/constants/theme";
import { ENABLE_SMS_ROLE } from "@/constants/featureFlags";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ScreenHero } from "@/components/ui/screen-hero";
import { SectionLead } from "@/components/ui/section-lead";
import { SharedConfig } from "@/react-native-bridge/SharedConfigModule";
import { isDefaultSmsApp, requestDefaultSmsRole } from "@/react-native-bridge/SmsRoleModule";
import { normalizeSmsKeyword, SMSFilterService } from "@/services/sms-filter";
import { getAllKeywords } from "@/services/sms-filter/keywords";
import { FilterSettings, SpamCategory, SpamDetectionResult } from "@/services/sms-filter/types";
import { useAutoTranslatedValue, useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  getFilterStats,
  incrementAllowed,
  incrementBlocked,
  resetFilterStats,
} from "@/store/smsFilterStatsStore";
import {
  addCustomKeyword,
  getFilterSettings,
  removeCustomKeyword,
  toggleFilter,
  updateFilterSettings,
} from "@/store/smsFilterStore";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SMS_FILTER_COPY = {
  tr: {
    unknownSender: "Bilinmiyor",
    loadingErrorTitle: "Hata",
    loadingErrorBody: "Ayarlar yuklenemedi.",
    defaultSmsRequiredTitle: "Varsayilan SMS Gerekli",
    defaultSmsRequiredBody: "SMS filtreleme icin varsayilan SMS uygulamasi olmalisin.",
    updateError: "Ayarlar guncellenemedi.",
    invalidKeywordTitle: "Gecersiz",
    invalidKeywordBody: "Lutfen bir anahtar kelime girin.",
    duplicateTitle: "Yinelenen",
    duplicateBody: "Bu anahtar kelime zaten var.",
    addKeywordError: "Anahtar kelime eklenemedi.",
    removeKeywordTitle: "Anahtar Kelimeyi Kaldir",
    removeKeywordBody: (keyword: string) => `"${keyword}" anahtar kelimesi kaldirilsin mi?`,
    cancel: "Iptal",
    remove: "Kaldir",
    autoDeleteError: "Otomatik silme ayari guncellenemedi.",
    removeKeywordError: "Anahtar kelime kaldirilamadi.",
    strengthMaximum: "Maksimum",
    strengthHigh: "Yuksek",
    strengthStrong: "Guclu",
    strengthStandard: "Standart",
    emptyMessageTitle: "Bos Mesaj",
    emptyMessageBody: "Test etmek icin bir mesaj girin.",
    disabledTitle: "SMS Filtresi Devre Disi",
    disabledBody: "Bu ozellik bu surumde kullanilamiyor.",
    title: "SMS Spam Filtresi",
    protectionTitle: "Koruma Etkin",
    protectionBody:
      "Kumar, bahis, dolandiricilik ve istenmeyen reklamlar iceren spam mesajlari engeller.",
    protectionStats: (total: number, custom: number, strength: string) =>
      `${total} anahtar kelime - ${custom} ozel - Guc: ${strength}`,
    protectionSignalTitle: "Koruma Sinyalleri",
    protectionSignalDefaultOk: "Varsayilan SMS rolu aktif",
    protectionSignalDefaultMissing: "Varsayilan SMS rolu eksik",
    protectionSignalStrictOn: "Junk modu: Agresif",
    protectionSignalStrictOff: "Junk modu: Dengeli",
    protectionSignalAutoDelete: (days: number | null) =>
      days === null ? "Oto temizleme: Kapali" : `Oto temizleme: ${days} gun`,
    roleTitle: "Varsayilan SMS Uygulamasi",
    roleBody:
      "Android'de SMS filtreleme icin AntiSlot'u varsayilan SMS uygulamasi olarak ayarlamalisin.",
    roleLoading: "Isleniyor...",
    roleAction: "Varsayilan Yap",
    blocked: "Engellendi",
    allowed: "Izin Verildi",
    reset: "Sifirla",
    enableFilter: "Spam Filtresini Etkinlestir",
    enableFilterBody: "Tespit edilen spam mesajlari otomatik engeller",
    strictMode: "Junk Koruma Modu",
    strictModeBody: "Junk mesajlarini daha agresif yakalar (daha fazla spam engeller).",
    strictModeAggressive: "Agresif koruma acik",
    strictModeBalanced: "Dengeli koruma aktif",
    customKeywords: "Ozel Anahtar Kelimeler",
    customKeywordsBody:
      "Engellemek icin kendi anahtar kelimelerini ekle. Bu kelimeleri iceren mesajlar filtrelenir.",
    keywordPlaceholder: "Anahtar kelime girin (orn. casino, promo)",
    keywordHealthTitle: "Anahtar Kelime Kalitesi",
    keywordHealthBody: (count: number, avgLen: number) =>
      `${count} ozel kelime - Ortalama uzunluk ${avgLen.toFixed(1)} karakter`,
    add: "Ekle",
    noCustomKeywords: "Henuz ozel anahtar kelime eklenmedi",
    autoDeleteTitle: "Engellenen Mesajlari Otomatik Sil",
    autoDeleteBody: "Engellenen mesajlari secilen gun sonrasinda otomatik sil",
    autoDeleteNow: "Simdi Temizle",
    autoDeleteRunning: "Temizleniyor...",
    autoDeleteResult: (count: number) =>
      count > 0 ? `${count} spam mesaj silindi.` : "Silinecek eski spam mesaj bulunmadi.",
    never: "Hicbir zaman",
    daySuffix: (days: number) => `${days} gun`,
    testTitle: "SMS Filtresini Test Et",
    testBody: "Siniflandiricinin nasil tepki verdigini gormek icin bir mesaj yapistirin.",
    testQuickScenarios: "Hazir Senaryolar",
    runSuite: "Toplu Testi Calistir",
    suiteTitle: "Toplu Test Sonucu",
    suiteSummary: (passed: number, total: number) => `${passed}/${total} senaryo basarili`,
    suiteExpectedBlock: "Beklenen: Engellensin",
    suiteExpectedAllow: "Beklenen: Izin verilsin",
    testMatchedKeywords: "Eslesen anahtar kelimeler",
    testMatchedPatterns: "Eslesen patternler",
    testRisk: "Risk Seviyesi",
    testAction: "Onerilen Aksiyon",
    riskLabels: {
      low: "Dusuk",
      medium: "Orta",
      high: "Yuksek",
      critical: "Kritik",
    },
    actionLabels: {
      allow: "Izin ver",
      block: "Engelle",
      review_or_block: "Incele veya engelle",
      block_and_delete: "Engelle ve sil",
    },
    patternLabels: {
      "Contains HTTP/HTTPS URL": "HTTP/HTTPS baglantisi var",
      "Contains web URL": "Web baglantisi var",
      "Contains shortened URL service": "Kisaltilmis baglanti servisi var",
      "Contains suspicious domain TLD": "Supheli alan adi uzantisi var",
      "Contains promo code pattern": "Promosyon kodu kalibi var",
      "Gambling keyword followed by link": "Kumar kelimesi ve ardindan baglanti var",
      "Contains urgency language": "Acil baskisi yapan dil var",
      "Action word followed by link": "Eylem cagrisi ve baglanti birlikte",
      "Financial verification lure": "Finansal dogrulama yemlemesi var",
      "Messaging app invitation": "Mesajlasma uygulamasi daveti var",
      "Free spin/free bet campaign": "Bedava spin/free bet kampanyasi var",
      "Deposit/withdrawal promotion": "Yatirim/cekim odakli tanitim var",
      "Contains monetary amount": "Parasal tutar var",
      "Contains very long number sequence": "Cok uzun sayi dizisi var",
      "Contains shouty alphanumeric token": "Asiri dikkat ceken alfasayisal ifade var",
    },
    reasonEmptyMessage: "Mesaj bos.",
    reasonMatchedCustomKeywords: (count: number) => `${count} ozel anahtar kelime eslesti`,
    reasonMatchedGamblingKeywords: (count: number) => `${count} kumar anahtar kelimesi eslesti`,
    reasonMatchedScamKeywords: (count: number) => `${count} dolandiricilik anahtar kelimesi eslesti`,
    reasonMatchedAdvertisementKeywords: (count: number) =>
      `${count} reklam anahtar kelimesi eslesti`,
    reasonSenderLongNumericAddress: "Gonderen uzun bir sayisal adrese benziyor",
    reasonSenderNumericOnly: "Gonderen yalnizca rakamlardan olusuyor",
    reasonSenderRandomAlphanumeric: "Gonderen rastgele alfasayisal kaliba benziyor",
    reasonSenderUnusualCharacters: "Gonderende alisilmadik karakterler var",
    reasonContainsSuspiciousDomainTld: "Supheli alan adi uzantisi tespit edildi",
    reasonContainsUrlWithGamblingSignal: "Kumar sinyali iceren URL bulundu",
    reasonContainsUrlWithScamSignal: "Dolandiricilik sinyali iceren URL bulundu",
    reasonShortUrlWithManipulativeContext: "Manipulatif baglamla birlikte kisa URL bulundu",
    reasonLooksLikeTransactionalOtpMessage: "Mesaj islemsel OTP mesajina benziyor",
    reasonJunkLikeCombinationDetected: (count: number) =>
      `Junk benzeri kombinasyon tespit edildi (${count} sinyal)`,
    testMessagePlaceholder: "Mesaj icerigi...",
    testSenderPlaceholder: "Gonderen (istege bagli)",
    runTest: "Testi Calistir",
    result: (isSpam: boolean) => `Sonuc: ${isSpam ? "Engellendi" : "Izin Verildi"}`,
    category: "Kategori",
    confidence: "Guven",
    reasons: "Nedenler",
    iosTitle: "iOS Kurulum",
    iosBody:
      "iOS'ta Ayarlar > Mesajlar > Bilinmeyen ve Spam altindan AntiSlot SMS Filter secenegini ac.",
    categoryLabels: {
      gambling: "Kumar",
      scam: "Dolandiricilik",
      advertisement: "Reklam",
      normal: "Normal",
    },
  },
  en: {
    unknownSender: "Unknown",
    loadingErrorTitle: "Error",
    loadingErrorBody: "Settings could not be loaded.",
    defaultSmsRequiredTitle: "Default SMS Required",
    defaultSmsRequiredBody: "You must be the default SMS app to filter messages.",
    updateError: "Settings could not be updated.",
    invalidKeywordTitle: "Invalid",
    invalidKeywordBody: "Please enter a keyword.",
    duplicateTitle: "Duplicate",
    duplicateBody: "This keyword already exists.",
    addKeywordError: "Keyword could not be added.",
    removeKeywordTitle: "Remove Keyword",
    removeKeywordBody: (keyword: string) => `Remove "${keyword}" from blocked keyword list?`,
    cancel: "Cancel",
    remove: "Remove",
    autoDeleteError: "Auto-delete setting could not be updated.",
    removeKeywordError: "Keyword could not be removed.",
    strengthMaximum: "Maximum",
    strengthHigh: "High",
    strengthStrong: "Strong",
    strengthStandard: "Standard",
    emptyMessageTitle: "Empty Message",
    emptyMessageBody: "Enter a message to test.",
    disabledTitle: "SMS Filter Disabled",
    disabledBody: "This feature is unavailable in this build.",
    title: "SMS Spam Filter",
    protectionTitle: "Protection Active",
    protectionBody:
      "Blocks spam messages containing gambling, betting, fraud, and unwanted promotion patterns.",
    protectionStats: (total: number, custom: number, strength: string) =>
      `${total} keywords - ${custom} custom - Strength: ${strength}`,
    protectionSignalTitle: "Protection Signals",
    protectionSignalDefaultOk: "Default SMS role is active",
    protectionSignalDefaultMissing: "Default SMS role is missing",
    protectionSignalStrictOn: "Junk mode: Aggressive",
    protectionSignalStrictOff: "Junk mode: Balanced",
    protectionSignalAutoDelete: (days: number | null) =>
      days === null ? "Auto cleanup: Off" : `Auto cleanup: ${days} days`,
    roleTitle: "Default SMS App",
    roleBody: "On Android, AntiSlot must be set as the default SMS app for filtering.",
    roleLoading: "Processing...",
    roleAction: "Set as Default",
    blocked: "Blocked",
    allowed: "Allowed",
    reset: "Reset",
    enableFilter: "Enable Spam Filter",
    enableFilterBody: "Automatically blocks detected spam messages",
    strictMode: "Junk Protection Mode",
    strictModeBody: "Catches junk messages more aggressively (blocks more spam).",
    strictModeAggressive: "Aggressive protection enabled",
    strictModeBalanced: "Balanced protection active",
    customKeywords: "Custom Keywords",
    customKeywordsBody:
      "Add your own keywords to block. Messages containing these keywords will be filtered.",
    keywordPlaceholder: "Enter keyword (e.g. casino, promo)",
    keywordHealthTitle: "Keyword Quality",
    keywordHealthBody: (count: number, avgLen: number) =>
      `${count} custom keywords - Avg length ${avgLen.toFixed(1)} chars`,
    add: "Add",
    noCustomKeywords: "No custom keywords added yet",
    autoDeleteTitle: "Auto-delete Blocked Messages",
    autoDeleteBody: "Automatically delete blocked messages after selected days",
    autoDeleteNow: "Clean Now",
    autoDeleteRunning: "Cleaning...",
    autoDeleteResult: (count: number) =>
      count > 0 ? `${count} spam messages removed.` : "No old spam messages found to remove.",
    never: "Never",
    daySuffix: (days: number) => `${days} days`,
    testTitle: "Test SMS Filter",
    testBody: "Paste a message to see how the classifier reacts.",
    testQuickScenarios: "Quick Scenarios",
    runSuite: "Run Test Suite",
    suiteTitle: "Suite Result",
    suiteSummary: (passed: number, total: number) => `${passed}/${total} scenarios passed`,
    suiteExpectedBlock: "Expected: Blocked",
    suiteExpectedAllow: "Expected: Allowed",
    testMatchedKeywords: "Matched keywords",
    testMatchedPatterns: "Matched patterns",
    testRisk: "Risk level",
    testAction: "Recommended action",
    riskLabels: {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    },
    actionLabels: {
      allow: "Allow",
      block: "Block",
      review_or_block: "Review or block",
      block_and_delete: "Block and delete",
    },
    patternLabels: {
      "Contains HTTP/HTTPS URL": "Contains HTTP/HTTPS URL",
      "Contains web URL": "Contains web URL",
      "Contains shortened URL service": "Contains shortened URL service",
      "Contains suspicious domain TLD": "Contains suspicious domain TLD",
      "Contains promo code pattern": "Contains promo code pattern",
      "Gambling keyword followed by link": "Gambling keyword followed by link",
      "Contains urgency language": "Contains urgency language",
      "Action word followed by link": "Action word followed by link",
      "Financial verification lure": "Financial verification lure",
      "Messaging app invitation": "Messaging app invitation",
      "Free spin/free bet campaign": "Free spin/free bet campaign",
      "Deposit/withdrawal promotion": "Deposit/withdrawal promotion",
      "Contains monetary amount": "Contains monetary amount",
      "Contains very long number sequence": "Contains very long number sequence",
      "Contains shouty alphanumeric token": "Contains shouty alphanumeric token",
    },
    reasonEmptyMessage: "Empty message.",
    reasonMatchedCustomKeywords: (count: number) => `Matched ${count} custom keyword(s)`,
    reasonMatchedGamblingKeywords: (count: number) => `Matched ${count} gambling keyword(s)`,
    reasonMatchedScamKeywords: (count: number) => `Matched ${count} scam keyword(s)`,
    reasonMatchedAdvertisementKeywords: (count: number) =>
      `Matched ${count} advertisement keyword(s)`,
    reasonSenderLongNumericAddress: "Sender is a long numeric address",
    reasonSenderNumericOnly: "Sender is numeric only",
    reasonSenderRandomAlphanumeric: "Sender has random alphanumeric pattern",
    reasonSenderUnusualCharacters: "Sender contains unusual characters",
    reasonContainsSuspiciousDomainTld: "Contains suspicious domain TLD",
    reasonContainsUrlWithGamblingSignal: "Contains URL with gambling signal",
    reasonContainsUrlWithScamSignal: "Contains URL with scam signal",
    reasonShortUrlWithManipulativeContext: "Short URL with manipulative context",
    reasonLooksLikeTransactionalOtpMessage: "Looks like transactional OTP message",
    reasonJunkLikeCombinationDetected: (count: number) =>
      `Junk-like combination detected (${count} signals)`,
    testMessagePlaceholder: "Message content...",
    testSenderPlaceholder: "Sender (optional)",
    runTest: "Run Test",
    result: (isSpam: boolean) => `Result: ${isSpam ? "Blocked" : "Allowed"}`,
    category: "Category",
    confidence: "Confidence",
    reasons: "Reasons",
    iosTitle: "iOS Setup",
    iosBody:
      "On iOS, open Settings > Messages > Unknown & Spam and enable AntiSlot SMS Filter.",
    categoryLabels: {
      gambling: "Gambling",
      scam: "Scam",
      advertisement: "Advertisement",
      normal: "Normal",
    },
  },
} as const;

const IS_PRODUCTION_BUILD =
  !__DEV__ && (process.env.EXPO_PUBLIC_SENTRY_ENV ?? "").trim().toLowerCase() === "production";
const AUTO_DELETE_OPTIONS = [null, 1, 3, 7, 14, 30] as const;
const KEYWORD_TEMPLATE_TOKEN = "[[KEYWORD]]";

type QuickScenario = {
  id: string;
  label: { tr: string; en: string };
  body: { tr: string; en: string };
  sender: string;
};

type SuiteCase = {
  id: string;
  expectedSpam: boolean;
  categoryHint?: SpamCategory;
  body: string;
  sender: string;
};

type SuiteResult = {
  passed: number;
  total: number;
  rows: {
    id: string;
    expectedSpam: boolean;
    actualSpam: boolean;
    confidence: number;
    category: SpamCategory;
  }[];
};

const QUICK_SCENARIOS: QuickScenario[] = [
  {
    id: "gambling_link",
    label: { tr: "Bahis + link", en: "Betting + link" },
    body: {
      tr: "Kazandiracak VIP freebet firsati! Hemen tikla https://bit.ly/bonus99",
      en: "VIP freebet opportunity! Click now: https://bit.ly/bonus99",
    },
    sender: "TRX889991",
  },
  {
    id: "scam_verify",
    label: { tr: "Sahte dogrulama", en: "Fake verification" },
    body: {
      tr: "Guvenlik uyarisi! Hesabinizi dogrulayin: www.secure-verify.xyz",
      en: "Security alert! Verify your account: www.secure-verify.xyz",
    },
    sender: "905556677889",
  },
  {
    id: "normal_otp",
    label: { tr: "Normal OTP", en: "Normal OTP" },
    body: {
      tr: "Bankanizdan tek kullanimlik dogrulama kodunuz 572941. Kimseyle paylasmayin.",
      en: "Your one-time verification code is 572941. Do not share it.",
    },
    sender: "AKBANK",
  },
  {
    id: "ad_offer",
    label: { tr: "Reklam teklifi", en: "Ad offer" },
    body: {
      tr: "Bugune ozel indirim! Kupon kodu KAZAN50 ile hemen al.",
      en: "Special discount today! Use coupon code WIN50 now.",
    },
    sender: "MARKETX",
  },
];

const SUITE_CASES: SuiteCase[] = [
  {
    id: "suite_gambling_1",
    expectedSpam: true,
    categoryHint: SpamCategory.GAMBLING,
    body: "B A H 1 S bonusu! Simdi tikla https://tinyurl.com/a12b9",
    sender: "TRX889991",
  },
  {
    id: "suite_gambling_2",
    expectedSpam: true,
    categoryHint: SpamCategory.GAMBLING,
    body: "Casino giris linki acildi. freebet kodu QWER77 ile kazan",
    sender: "VIP7788",
  },
  {
    id: "suite_scam_1",
    expectedSpam: true,
    categoryHint: SpamCategory.SCAM,
    body: "Account frozen. Verify now at secure-check.top to avoid suspension.",
    sender: "88990011",
  },
  {
    id: "suite_ad_1",
    expectedSpam: true,
    categoryHint: SpamCategory.ADVERTISEMENT,
    body: "Super fiyat! Bugune ozel kupon kodu SALE44.",
    sender: "SHOPLINE",
  },
  {
    id: "suite_safe_otp",
    expectedSpam: false,
    body: "Tek kullanimlik sifreniz: 123456. Bu kodu kimseyle paylasmayin.",
    sender: "BANKA",
  },
  {
    id: "suite_safe_delivery",
    expectedSpam: false,
    body: "Kargo teslimatiniz yarin 10:00-12:00 arasinda yapilacaktir.",
    sender: "YURTICI",
  },
];

export default function SMSFilterScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(SMS_FILTER_COPY);
  const shouldRedirectWhenDisabled = !ENABLE_SMS_ROLE && IS_PRODUCTION_BUILD;

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FilterSettings>({
    enabled: true,
    customKeywords: [],
    autoDeleteDays: null,
    strictMode: true,
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testSender, setTestSender] = useState("");
  const [testResult, setTestResult] = useState<SpamDetectionResult | null>(null);
  const [stats, setStats] = useState({ blocked: 0, allowed: 0 });
  const [defaultSms, setDefaultSms] = useState<boolean | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [lastCleanupDeleted, setLastCleanupDeleted] = useState<number | null>(null);
  const [suiteResult, setSuiteResult] = useState<SuiteResult | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const [loadedSettings, currentStats] = await Promise.all([
        getFilterSettings(),
        getFilterStats(),
      ]);
      setSettings(loadedSettings);
      setStats(currentStats);

      if (Platform.OS === "android") {
        const isDefault = await isDefaultSmsApp();
        setDefaultSms(isDefault);
      }
    } catch (error) {
      console.error("SMS settings load error:", error);
      Alert.alert(copy.loadingErrorTitle, copy.loadingErrorBody);
    } finally {
      setLoading(false);
    }
  }, [copy.loadingErrorBody, copy.loadingErrorTitle]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleRequestDefaultSms() {
    if (Platform.OS !== "android") return;
    setRoleLoading(true);
    try {
      const granted = await requestDefaultSmsRole();
      setDefaultSms(granted);
      if (!granted) {
        Alert.alert(copy.defaultSmsRequiredTitle, copy.defaultSmsRequiredBody);
      }
    } finally {
      setRoleLoading(false);
    }
  }

  async function handleToggleEnabled(value: boolean) {
    if (value && Platform.OS === "android" && defaultSms === false) {
      Alert.alert(copy.defaultSmsRequiredTitle, copy.defaultSmsRequiredBody);
      return;
    }
    try {
      await toggleFilter(value);
      setSettings((prev) => ({ ...prev, enabled: value }));
    } catch {
      Alert.alert(copy.loadingErrorTitle, copy.updateError);
    }
  }

  async function handleToggleStrictMode(value: boolean) {
    try {
      await updateFilterSettings({ strictMode: value });
      setSettings((prev) => ({ ...prev, strictMode: value }));
    } catch {
      Alert.alert(copy.loadingErrorTitle, copy.updateError);
    }
  }

  async function handleAddKeyword() {
    const trimmed = normalizeSmsKeyword(newKeyword);
    if (!trimmed) {
      Alert.alert(copy.invalidKeywordTitle, copy.invalidKeywordBody);
      return;
    }

    if (settings.customKeywords.includes(trimmed)) {
      Alert.alert(copy.duplicateTitle, copy.duplicateBody);
      setNewKeyword("");
      return;
    }

    try {
      await addCustomKeyword(trimmed);
      setSettings((prev) => ({ ...prev, customKeywords: [...prev.customKeywords, trimmed] }));
      setNewKeyword("");
    } catch {
      Alert.alert(copy.loadingErrorTitle, copy.addKeywordError);
    }
  }

  function handleRemoveKeyword(keyword: string) {
    Alert.alert(copy.removeKeywordTitle, removeKeywordBodyTemplate.replace(KEYWORD_TEMPLATE_TOKEN, keyword), [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.remove,
        style: "destructive",
        onPress: async () => {
          try {
            await removeCustomKeyword(keyword);
            setSettings((prev) => ({
              ...prev,
              customKeywords: prev.customKeywords.filter((item) => item !== keyword),
            }));
          } catch {
            Alert.alert(copy.loadingErrorTitle, copy.removeKeywordError);
          }
        },
      },
    ]);
  }

  async function handleAutoDeleteChange(days: number | null) {
    try {
      await updateFilterSettings({ autoDeleteDays: days });
      setSettings((prev) => ({ ...prev, autoDeleteDays: days }));
    } catch {
      Alert.alert(copy.loadingErrorTitle, copy.autoDeleteError);
    }
  }

  async function handleResetStats() {
    await resetFilterStats();
    const updated = await getFilterStats();
    setStats(updated);
  }

  async function handleRunCleanupNow() {
    if (Platform.OS !== "android") {
      setLastCleanupDeleted(0);
      return;
    }
    setCleanupLoading(true);
    try {
      const deleted = await SharedConfig.cleanupSpamInboxNow();
      setLastCleanupDeleted(deleted);
      const updated = await getFilterStats();
      setStats(updated);
    } finally {
      setCleanupLoading(false);
    }
  }

  function handleApplyQuickScenario(scenario: { body: string; sender: string }) {
    setTestMessage(scenario.body);
    setTestSender(scenario.sender);
    setTestResult(null);
  }

  function handleRunSuite() {
    const service = new SMSFilterService(settings.customKeywords, settings.strictMode);
    setTestResult(null);
    let passed = 0;
    const rows = SUITE_CASES.map((suiteCase) => {
      const result = service.classify({
        body: suiteCase.body,
        sender: suiteCase.sender,
      });
      const success = result.isSpam === suiteCase.expectedSpam;
      if (success) passed += 1;
      return {
        id: suiteCase.id,
        expectedSpam: suiteCase.expectedSpam,
        actualSpam: result.isSpam,
        confidence: result.confidence,
        category: result.category,
      };
    });

    setSuiteResult({
      passed,
      total: SUITE_CASES.length,
      rows,
    });
  }

  const quickScenariosByBaseLanguage = useMemo(
    () => ({
      tr: QUICK_SCENARIOS.map((scenario) => ({
        id: scenario.id,
        body: scenario.body.tr,
        sender: scenario.sender,
        label: scenario.label.tr,
      })),
      en: QUICK_SCENARIOS.map((scenario) => ({
        id: scenario.id,
        body: scenario.body.en,
        sender: scenario.sender,
        label: scenario.label.en,
      })),
    }),
    []
  );
  const quickScenarios = useLocalizedCopy(quickScenariosByBaseLanguage);

  const customKeywordAverageLength = useMemo(() => {
    if (settings.customKeywords.length === 0) return 0;
    const total = settings.customKeywords.reduce((sum, keyword) => sum + keyword.length, 0);
    return total / settings.customKeywords.length;
  }, [settings.customKeywords]);

  const totalKeywords = getAllKeywords().length + settings.customKeywords.length;
  const strengthLabel = useMemo(() => {
    if (settings.strictMode && totalKeywords > 150) return copy.strengthMaximum;
    if (settings.strictMode) return copy.strengthHigh;
    if (totalKeywords > 150) return copy.strengthStrong;
    return copy.strengthStandard;
  }, [
    copy.strengthHigh,
    copy.strengthMaximum,
    copy.strengthStandard,
    copy.strengthStrong,
    settings.strictMode,
    totalKeywords,
  ]);

  const removeKeywordBodyTemplate = useAutoTranslatedValue(
    copy.removeKeywordBody(KEYWORD_TEMPLATE_TOKEN)
  );
  const protectionStatsText = useAutoTranslatedValue(
    copy.protectionStats(totalKeywords, settings.customKeywords.length, strengthLabel)
  );
  const keywordHealthText = useAutoTranslatedValue(
    copy.keywordHealthBody(settings.customKeywords.length, customKeywordAverageLength)
  );
  const autoDeleteOptionLabelsBase = useMemo(
    () => AUTO_DELETE_OPTIONS.map((days) => (days === null ? copy.never : copy.daySuffix(days))),
    [copy.daySuffix, copy.never]
  );
  const autoDeleteOptionLabels = useAutoTranslatedValue(autoDeleteOptionLabelsBase);
  const cleanupResultText = useAutoTranslatedValue(
    lastCleanupDeleted !== null ? copy.autoDeleteResult(lastCleanupDeleted) : ""
  );
  const resultLabelsBase = useMemo(
    () => ({
      blocked: copy.result(true),
      allowed: copy.result(false),
    }),
    [copy.result]
  );
  const resultLabels = useAutoTranslatedValue(resultLabelsBase);
  const suiteSummaryText = useAutoTranslatedValue(
    suiteResult ? copy.suiteSummary(suiteResult.passed, suiteResult.total) : ""
  );
  const protectionSignalsBase = useMemo(() => {
    const defaultSignal =
      Platform.OS === "android"
        ? defaultSms === false
          ? copy.protectionSignalDefaultMissing
          : copy.protectionSignalDefaultOk
        : copy.protectionSignalDefaultOk;
    return [
      defaultSignal,
      settings.strictMode ? copy.protectionSignalStrictOn : copy.protectionSignalStrictOff,
      copy.protectionSignalAutoDelete(settings.autoDeleteDays),
    ];
  }, [
    copy.protectionSignalAutoDelete,
    copy.protectionSignalDefaultMissing,
    copy.protectionSignalDefaultOk,
    copy.protectionSignalStrictOff,
    copy.protectionSignalStrictOn,
    defaultSms,
    settings.autoDeleteDays,
    settings.strictMode,
  ]);
  const protectionSignals = useAutoTranslatedValue(protectionSignalsBase);

  async function handleTestMessage() {
    if (!testMessage.trim()) {
      Alert.alert(copy.emptyMessageTitle, copy.emptyMessageBody);
      return;
    }

    const service = new SMSFilterService(settings.customKeywords, settings.strictMode);
    const result = service.classify({
      body: testMessage,
      sender: testSender.trim() || copy.unknownSender,
    });

    setSuiteResult(null);
    setTestResult(result);

    if (result.isSpam) {
      await incrementBlocked();
    } else {
      await incrementAllowed();
    }

    const updatedStats = await getFilterStats();
    setStats(updatedStats);
  }

  const categoryLabel = (category: SpamCategory) => copy.categoryLabels[category];
  const resultText = (isSpam: boolean) => (isSpam ? resultLabels.blocked : resultLabels.allowed);
  const mapReasonToLabel = (reason: string): string => {
    const customMatch = reason.match(/^Matched (\d+) custom keyword\(s\)$/i);
    if (customMatch) return copy.reasonMatchedCustomKeywords(Number(customMatch[1]));

    const gamblingMatch = reason.match(/^Matched (\d+) gambling keyword\(s\)$/i);
    if (gamblingMatch) return copy.reasonMatchedGamblingKeywords(Number(gamblingMatch[1]));

    const scamMatch = reason.match(/^Matched (\d+) scam keyword\(s\)$/i);
    if (scamMatch) return copy.reasonMatchedScamKeywords(Number(scamMatch[1]));

    const adMatch = reason.match(/^Matched (\d+) advertisement keyword\(s\)$/i);
    if (adMatch) return copy.reasonMatchedAdvertisementKeywords(Number(adMatch[1]));

    const junkMatch = reason.match(/^Junk-like combination detected \((\d+) signals\)$/i);
    if (junkMatch) return copy.reasonJunkLikeCombinationDetected(Number(junkMatch[1]));

    switch (reason) {
      case "Empty message":
        return copy.reasonEmptyMessage;
      case "Sender is a long numeric address":
        return copy.reasonSenderLongNumericAddress;
      case "Sender is numeric only":
        return copy.reasonSenderNumericOnly;
      case "Sender has random alphanumeric pattern":
        return copy.reasonSenderRandomAlphanumeric;
      case "Sender contains unusual characters":
        return copy.reasonSenderUnusualCharacters;
      case "Contains suspicious domain TLD":
        return copy.reasonContainsSuspiciousDomainTld;
      case "Contains URL with gambling signal":
        return copy.reasonContainsUrlWithGamblingSignal;
      case "Contains URL with scam signal":
        return copy.reasonContainsUrlWithScamSignal;
      case "Short URL with manipulative context":
        return copy.reasonShortUrlWithManipulativeContext;
      case "Looks like transactional OTP message":
        return copy.reasonLooksLikeTransactionalOtpMessage;
      default:
        return reason;
    }
  };
  const localizedMatchedPatternsBase = useMemo(() => {
    if (!testResult) return [];
    return testResult.matchedPatterns.map((pattern) => {
      const label = copy.patternLabels[pattern as keyof typeof copy.patternLabels];
      return label ?? pattern;
    });
  }, [copy.patternLabels, testResult]);
  const localizedMatchedPatterns = useAutoTranslatedValue(localizedMatchedPatternsBase);
  const localizedReasonsBase = useMemo(() => {
    if (!testResult) return [];
    return testResult.reasons.map((reason) => mapReasonToLabel(reason));
  }, [copy, testResult]);
  const localizedReasons = useAutoTranslatedValue(localizedReasonsBase);
  const localizedRecommendedActionBase = useMemo(() => {
    if (!testResult?.recommendedAction) return "";
    const label =
      copy.actionLabels[
        testResult.recommendedAction as keyof typeof copy.actionLabels
      ];
    return label ?? testResult.recommendedAction;
  }, [copy.actionLabels, testResult?.recommendedAction]);
  const localizedRecommendedAction = useAutoTranslatedValue(localizedRecommendedActionBase);

  useEffect(() => {
    if (shouldRedirectWhenDisabled) {
      router.replace("/");
    }
  }, [shouldRedirectWhenDisabled]);

  if (shouldRedirectWhenDisabled) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="sms-filter-prod-redirect">
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ENABLE_SMS_ROLE) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="sms-filter-disabled-screen">
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>{copy.disabledTitle}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{copy.disabledBody}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="sms-filter-screen-loading">
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="sms-filter-screen">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        </View>

        <ScreenHero
          icon="mail-unread-outline"
          title={copy.protectionTitle}
          subtitle={copy.title}
          description={copy.protectionBody}
          badge={copy.protectionSignalTitle}
          gradient={["#505E75", "#69778F"]}
          style={styles.infoCard}
        />

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.infoTitle, { color: colors.text }]}>{copy.protectionTitle}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{copy.protectionBody}</Text>
          <Text style={[styles.infoStats, { color: colors.primary }]}> 
            {protectionStatsText}
          </Text>
          <Text style={[styles.infoSignalTitle, { color: colors.text }]}>{copy.protectionSignalTitle}</Text>
          <View style={styles.signalStack}>
            {protectionSignals.map((signal, index) => (
              <View
                key={`${signal}-${index}`}
                style={[styles.signalChip, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <Text style={[styles.signalChipText, { color: colors.textSecondary }]}>{signal}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionLead
          icon="shield-checkmark-outline"
          title={copy.protectionSignalTitle}
          subtitle={protectionStatsText}
          badge={`${stats.blocked}`}
          tone="warning"
          style={styles.sectionLead}
        />

        {Platform.OS === "android" && defaultSms === false ? (
          <View
            style={[
              styles.roleCard,
              {
                backgroundColor: `${colors.warning ?? "#D97706"}14`,
                borderColor: `${colors.warning ?? "#D97706"}44`,
              },
            ]}
          >
            <Text style={[styles.roleTitle, { color: colors.warning ?? "#D97706" }]}>{copy.roleTitle}</Text>
            <Text style={[styles.roleText, { color: colors.textSecondary }]}>{copy.roleBody}</Text>
            <TouchableOpacity
              style={[styles.roleButton, { backgroundColor: colors.warning ?? "#D97706" }]}
              onPress={() => void handleRequestDefaultSms()}
              disabled={roleLoading}
            >
              <Text style={styles.roleButtonText}>{roleLoading ? copy.roleLoading : copy.roleAction}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            testID="sms-filter-blocked-stat-card"
          >
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.blocked}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{copy.blocked}</Text>
          </View>
          <View
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            testID="sms-filter-allowed-stat-card"
          >
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.allowed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{copy.allowed}</Text>
          </View>
          <TouchableOpacity
            style={[styles.resetStatsBtn, { backgroundColor: colors.warning ?? "#D97706" }]}
            onPress={() => void handleResetStats()}
            testID="sms-filter-reset-stats-btn"
          >
            <Text style={styles.resetStatsText}>{copy.reset}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => void handleToggleEnabled(!settings.enabled)}
            activeOpacity={0.85}
          >
            <View style={styles.settingLeft}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{copy.enableFilter}</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{copy.enableFilterBody}</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => void handleToggleEnabled(value)}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor="#fff"
              testID="sms-filter-enabled-switch"
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => void handleToggleStrictMode(!settings.strictMode)}
            activeOpacity={0.85}
          >
            <View style={styles.settingLeft}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{copy.strictMode}</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{copy.strictModeBody}</Text>
            </View>
            <Switch
              value={settings.strictMode}
              onValueChange={(value) => void handleToggleStrictMode(value)}
              trackColor={{ false: colors.disabled, true: colors.warning ?? colors.primary }}
              thumbColor="#fff"
              testID="sms-filter-strict-switch"
            />
          </TouchableOpacity>
          <View style={styles.strictStatusWrap}>
            <Text style={[styles.strictStatusText, { color: settings.strictMode ? colors.warning ?? "#D97706" : colors.textSecondary }]}>
              {settings.strictMode ? copy.strictModeAggressive : copy.strictModeBalanced}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.customKeywords}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>{copy.customKeywordsBody}</Text>

          <View style={styles.keywordInputContainer}>
            <TextInput
              style={[
                styles.keywordInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={copy.keywordPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={newKeyword}
              onChangeText={setNewKeyword}
              onSubmitEditing={() => void handleAddKeyword()}
              autoCapitalize="none"
              autoCorrect={false}
              testID="sms-filter-keyword-input"
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => void handleAddKeyword()}
              testID="sms-filter-keyword-add-btn"
            >
              <Text style={styles.addButtonText}>{copy.add}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.keywordHealthCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.keywordHealthTitle, { color: colors.text }]}>{copy.keywordHealthTitle}</Text>
            <Text style={[styles.keywordHealthBody, { color: colors.textSecondary }]}>
              {keywordHealthText}
            </Text>
          </View>

          {settings.customKeywords.length > 0 ? (
            <View style={styles.keywordList}>
              {settings.customKeywords.map((keyword, index) => (
                <View
                  key={`${keyword}-${index}`}
                  style={[
                    styles.keywordTag,
                    { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}33` },
                  ]}
                >
                  <Text style={[styles.keywordText, { color: colors.primary }]}>{keyword}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveKeyword(keyword)}
                    style={[styles.removeButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.removeButtonText}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.noCustomKeywords}</Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.autoDeleteTitle}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>{copy.autoDeleteBody}</Text>

          <View style={styles.autoDeleteOptions}>
            {AUTO_DELETE_OPTIONS.map((days, index) => {
              const selected = settings.autoDeleteDays === days;
              return (
                <TouchableOpacity
                  key={days ?? 0}
                  style={[
                    styles.autoDeleteOption,
                    {
                      backgroundColor: selected ? colors.primary : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => void handleAutoDeleteChange(days)}
                >
                  <Text
                    style={[
                      styles.autoDeleteOptionText,
                      { color: selected ? "#FFFFFF" : colors.textSecondary },
                    ]}
                  >
                    {autoDeleteOptionLabels[index]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.cleanupButton, { backgroundColor: colors.primary }]}
            onPress={() => void handleRunCleanupNow()}
            disabled={cleanupLoading}
          >
            <Text style={styles.cleanupButtonText}>
              {cleanupLoading ? copy.autoDeleteRunning : copy.autoDeleteNow}
            </Text>
          </TouchableOpacity>

          {lastCleanupDeleted !== null ? (
            <Text style={[styles.cleanupResultText, { color: colors.textSecondary }]}>
              {cleanupResultText}
            </Text>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.testTitle}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>{copy.testBody}</Text>
          <Text style={[styles.scenarioTitle, { color: colors.text }]}>{copy.testQuickScenarios}</Text>
          <View style={styles.scenarioRow}>
            {quickScenarios.map((scenario) => (
              <TouchableOpacity
                key={scenario.id}
                style={[styles.scenarioChip, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => handleApplyQuickScenario(scenario)}
              >
                <Text style={[styles.scenarioChipText, { color: colors.textSecondary }]}>{scenario.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.suiteButton, { backgroundColor: colors.warning ?? colors.primary }]}
            onPress={handleRunSuite}
          >
            <Text style={styles.suiteButtonText}>{copy.runSuite}</Text>
          </TouchableOpacity>

          {suiteResult ? (
            <View style={[styles.suiteCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.suiteTitle, { color: colors.text }]}>{copy.suiteTitle}</Text>
              <Text style={[styles.suiteSummary, { color: colors.textSecondary }]}>
                {suiteSummaryText}
              </Text>
              {suiteResult.rows.map((row) => (
                <View key={row.id} style={styles.suiteRow}>
                  <Text style={[styles.suiteRowText, { color: colors.textSecondary }]}>
                    {row.expectedSpam ? copy.suiteExpectedBlock : copy.suiteExpectedAllow}
                  </Text>
                  <Text style={[styles.suiteRowText, { color: row.actualSpam ? colors.warning ?? "#D97706" : colors.primary }]}>
                    {resultText(row.actualSpam)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <TextInput
            style={[
              styles.testInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={copy.testMessagePlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={testMessage}
            onChangeText={setTestMessage}
            multiline
            testID="sms-filter-test-message-input"
          />
          <TextInput
            style={[
              styles.testInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={copy.testSenderPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={testSender}
            onChangeText={setTestSender}
            testID="sms-filter-test-sender-input"
          />
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={() => void handleTestMessage()}
            testID="sms-filter-run-test-btn"
          >
            <Text style={styles.testButtonText}>{copy.runTest}</Text>
          </TouchableOpacity>

          {testResult ? (
            <View
              style={[styles.testResult, { backgroundColor: colors.background, borderColor: colors.border }]}
              testID="sms-filter-test-result"
            >
              <Text style={[styles.testResultTitle, { color: testResult.isSpam ? colors.warning ?? "#D97706" : colors.primary }]}>
                {resultText(testResult.isSpam)}
              </Text>
              <Text style={[styles.testResultText, { color: colors.textSecondary }]}>
                {copy.category}: {categoryLabel(testResult.category)}
              </Text>
              <Text style={[styles.testResultText, { color: colors.textSecondary }]}>
                {copy.confidence}: {testResult.confidence}
              </Text>
              {testResult.riskLevel ? (
                <Text style={[styles.testResultText, { color: colors.textSecondary }]}>
                  {copy.testRisk}: {copy.riskLabels[testResult.riskLevel]}
                </Text>
              ) : null}
              {testResult.recommendedAction ? (
                <Text style={[styles.testResultText, { color: colors.textSecondary }]}>
                  {copy.testAction}: {localizedRecommendedAction}
                </Text>
              ) : null}
              {testResult.matchedKeywords.length > 0 ? (
                <Text style={[styles.testResultText, { color: colors.textSecondary }]}>
                  {copy.testMatchedKeywords}: {testResult.matchedKeywords.slice(0, 6).join(", ")}
                </Text>
              ) : null}
              {localizedMatchedPatterns.length > 0 ? (
                <Text style={[styles.testResultText, { color: colors.textSecondary }]}>
                  {copy.testMatchedPatterns}: {localizedMatchedPatterns.slice(0, 4).join(", ")}
                </Text>
              ) : null}
              <Text style={[styles.testResultText, { color: colors.text }]}>{copy.reasons}:</Text>
              {localizedReasons.map((reason, index) => (
                <Text key={`${reason}-${index}`} style={[styles.testResultText, { color: colors.textSecondary }]}>
                  {`- ${reason}`}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.noteCard,
            {
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}44`,
            },
          ]}
        >
          <Text style={[styles.noteTitle, { color: colors.primary }]}>{copy.iosTitle}</Text>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>{copy.iosBody}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
  title: {
    fontSize: 30,
    fontFamily: Fonts.display,
    marginBottom: 8,
  },
  infoCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 20,
    marginBottom: Spacing.base,
  },
  sectionLead: {
    marginBottom: Spacing.base,
  },
  infoTitle: {
    fontSize: 19,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
    marginBottom: 8,
  },
  infoStats: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
  infoSignalTitle: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
    marginTop: 10,
    marginBottom: 8,
  },
  signalStack: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  signalChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  signalChipText: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
  },
  roleCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: Spacing.base,
  },
  roleTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  roleText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    fontFamily: Fonts.body,
  },
  roleButton: {
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  roleButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: Spacing.base,
    alignItems: "center",
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontFamily: Fonts.displayMedium,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  resetStatsBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  resetStatsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 18,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
    fontFamily: Fonts.body,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    marginBottom: 4,
    fontFamily: Fonts.bodySemiBold,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
  strictStatusWrap: {
    marginTop: 8,
  },
  strictStatusText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  keywordInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  keywordInput: {
    flex: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    fontFamily: Fonts.body,
  },
  addButton: {
    borderRadius: Radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  keywordHealthCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  keywordHealthTitle: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 2,
  },
  keywordHealthBody: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
  },
  keywordList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 8,
  },
  keywordTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  keywordText: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    marginRight: 6,
  },
  removeButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 13,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 8,
    fontFamily: Fonts.body,
  },
  autoDeleteOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  autoDeleteOption: {
    borderRadius: Radius.md,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1,
  },
  autoDeleteOptionText: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  cleanupButton: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  cleanupButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  cleanupResultText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  scenarioTitle: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  scenarioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  scenarioChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  scenarioChipText: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
  },
  suiteButton: {
    borderRadius: Radius.md,
    paddingVertical: 11,
    alignItems: "center",
    marginBottom: 10,
  },
  suiteButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  suiteCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  suiteTitle: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 2,
  },
  suiteSummary: {
    fontSize: 12,
    fontFamily: Fonts.body,
    marginBottom: 6,
  },
  suiteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  suiteRowText: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    flex: 1,
  },
  testInput: {
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    fontFamily: Fonts.body,
  },
  testButton: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  testResult: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
  },
  testResultTitle: {
    fontSize: 14,
    marginBottom: 6,
    fontFamily: Fonts.bodySemiBold,
  },
  testResultText: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: Fonts.body,
  },
  noteCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    marginTop: 6,
  },
  noteTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: Fonts.bodySemiBold,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
});
