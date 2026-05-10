export type Language = "tr";

export interface TranslationCoverageItem {
  language: Language;
  fallbackLanguage: Language;
  locale: string;
  localizedCoreKeys: number;
  totalCoreKeys: number;
  coreCoveragePercent: number;
}

export interface Translations {
  // Onboarding
  tagline: string;
  taglineToolbox: string;
  continue: string;

  // Home
  welcomeBack: string;
  gambleFree: string;
  days: string;

  // Cards
  therapy: string;
  therapySubtitle: string;
  mindfulness: string;
  mindfulnessSubtitle: string;
  sos: string;
  sosSubtitle: string;
  progress: string;
  progressSubtitle: string;
  support: string;
  supportSubtitle: string;
  diary: string;
  diarySubtitle: string;
  smsFilter: string;
  smsFilterSubtitle: string;

  // Welcome modal
  welcomeToAntislot: string;
  welcomeDescription: string;
  next: string;

  // Continue screen
  back: string;
  generalBack: string;
  createAccount: string;
  username: string;
  age: string;
  gender: string;
  ethnicity: string;
  countryState: string;
  howDidYouFindUs: string;
  confirmInfo: string;

  // Privacy data screen
  privacyDataTitle: string;
  privacyDataLocalStorage: string;
  privacyDataLocalStorageSubtitle: string;
  privacyDataUrgeLogs: string;
  privacyDataUrgeLogsDesc: string;
  privacyDataUrgePatterns: string;
  privacyDataUrgePatternsDesc: string;
  privacyDataOtherLocalData: string;
  privacyDataOtherLocalDataDesc: string;
  privacyDataTelemetry: string;
  privacyDataTelemetrySubtitle: string;
  privacyDataDiagnosticsToggle: string;
  privacyDataDiagnosticsHint: string;
  privacyDataCrashReporting: string;
  privacyDataCrashReportingHint: string;
  privacyDataPolicies: string;
  privacyDataPoliciesSubtitle: string;
  privacyDataPrivacyPolicy: string;
  privacyDataTerms: string;
  privacyDataImportantInfo: string;
  privacyDataSecurity: string;
  privacyDataSecuritySubtitle: string;

  // Tabs
  home: string;
  explore: string;
  premium: string;
  ai: string;
}

export const translations: Record<Language, Translations> = {
  tr: {
    // Onboarding
    tagline: "KONTROLU GERI ALMANIZ ICIN",
    taglineToolbox: "ARAC KUTUNUZ",
    continue: "Devam Et",

    // Home
    welcomeBack: "TEKRAR HOS GELDINIZ",
    gambleFree: "Kumardan Uzak",
    days: "GUN",

    // Cards
    therapy: "Terapi",
    therapySubtitle: "Seanslar",
    mindfulness: "Farkindalik",
    mindfulnessSubtitle: "Seanslar",
    sos: "SOS",
    sosSubtitle: "Acil yardim",
    progress: "Ilerleme",
    progressSubtitle: "Simdi incele",
    support: "Destek",
    supportSubtitle: "Yardim bir dokunus uzakta",
    diary: "Gunluk",
    diarySubtitle: "Ozel gunlugunuz",
    smsFilter: "SMS Filtresi",
    smsFilterSubtitle: "Spam Mesajlari Engelle",

    // Welcome modal
    welcomeToAntislot: "ANTISLOT'A HOS GELDINIZ",
    welcomeDescription: "Lutfen ilerleme takibi icin hesabinizi tamamlayin.",
    next: "Ileri",

    // Continue screen
    back: "Geri",
    generalBack: "Geri",
    createAccount: "HESABINIZI TAMAMLAYIN",
    username: "Kullanici Adi",
    age: "Yasiniz",
    gender: "Cinsiyet",
    ethnicity: "Etnik Koken",
    countryState: "Ulke/Sehir",
    howDidYouFindUs: "Bizi nasil buldunuz?",
    confirmInfo: "Bilgileri Onayla",

    // Privacy data screen
    privacyDataTitle: "Gizlilik Verileri",
    privacyDataLocalStorage: "Yerel Saklama",
    privacyDataLocalStorageSubtitle: "Verileriniz cihazinizda saklanir.",
    privacyDataUrgeLogs: "Durtu Kayitlari",
    privacyDataUrgeLogsDesc: "Durtu gunlugu ve ilgili kayitlar yerel tutulur.",
    privacyDataUrgePatterns: "Durtu Oruntuleri",
    privacyDataUrgePatternsDesc: "Tetikleyici oruntuleri analiz icin saklanir.",
    privacyDataOtherLocalData: "Diger Yerel Veriler",
    privacyDataOtherLocalDataDesc: "Tema, dil ve uygulama tercihleri cihazinizda kalir.",
    privacyDataTelemetry: "Tanimlama ve Telemetri",
    privacyDataTelemetrySubtitle: "Paylasim tercihlerinizi buradan yonetin.",
    privacyDataDiagnosticsToggle: "Tani Verilerini Paylas",
    privacyDataDiagnosticsHint: "Anonim tani verileri iyilestirme icin kullanilir.",
    privacyDataCrashReporting: "Cokme Raporlari",
    privacyDataCrashReportingHint: "Hatalarin daha hizli cozulmesine yardim eder.",
    privacyDataPolicies: "Politikalar",
    privacyDataPoliciesSubtitle: "Gizlilik ve kullanim metinlerine ulasin.",
    privacyDataPrivacyPolicy: "Gizlilik Politikasi",
    privacyDataTerms: "Kullanim Sartlari",
    privacyDataImportantInfo: "Onemli Bilgiler",
    privacyDataSecurity: "Guvenlik",
    privacyDataSecuritySubtitle: "Verileriniz guvenli altyapida korunur.",

    // Tabs
    home: "Ana Sayfa",
    explore: "Kesfet",
    premium: "Premium",
    ai: "AI",
  },
};

const languageMeta: Record<Language, { fallbackLanguage: Language; locale: string }> = {
  tr: {
    fallbackLanguage: "tr",
    locale: "tr-TR",
  },
};

const coreKeys = Object.keys(translations.tr) as (keyof Translations)[];

export function getTranslationCoverageReport(): TranslationCoverageItem[] {
  return (Object.keys(translations) as Language[]).map((language) => {
    const localized = translations[language];
    const localizedCoreKeys = coreKeys.filter((key) => {
      const value = localized[key];
      return typeof value === "string" && value.trim().length > 0;
    }).length;

    const totalCoreKeys = coreKeys.length;
    const coreCoveragePercent =
      totalCoreKeys === 0 ? 100 : Number(((localizedCoreKeys / totalCoreKeys) * 100).toFixed(2));

    return {
      language,
      fallbackLanguage: languageMeta[language].fallbackLanguage,
      locale: languageMeta[language].locale,
      localizedCoreKeys,
      totalCoreKeys,
      coreCoveragePercent,
    };
  });
}
