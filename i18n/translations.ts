export type Language = "tr" | "en";

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

  // Language
  languageSection: string;
  languageSectionHint: string;
  languageTurkish: string;
  languageEnglish: string;
}

export const translations: Record<Language, Translations> = {
  tr: {
    tagline: "KONTROLÜ GERİ ALMANIZ İÇİN",
    taglineToolbox: "ARAÇ KUTUNUZ",
    continue: "Devam Et",

    welcomeBack: "TEKRAR HOŞ GELDİNİZ",
    gambleFree: "Kumardan Uzak",
    days: "GÜN",

    therapy: "Terapi",
    therapySubtitle: "Seanslar",
    mindfulness: "Farkındalık",
    mindfulnessSubtitle: "Seanslar",
    sos: "SOS",
    sosSubtitle: "Acil yardım",
    progress: "İlerleme",
    progressSubtitle: "Şimdi incele",
    support: "Destek",
    supportSubtitle: "Yardım bir dokunuş uzakta",
    diary: "Günlük",
    diarySubtitle: "Özel günlüğünüz",
    smsFilter: "SMS Filtresi",
    smsFilterSubtitle: "Spam mesajları engelle",

    welcomeToAntislot: "ANTISLOT'A HOŞ GELDİNİZ",
    welcomeDescription: "Lütfen ilerleme takibi için hesabınızı tamamlayın.",
    next: "İleri",

    back: "Geri",
    generalBack: "Geri",
    createAccount: "HESABINIZI TAMAMLAYIN",
    username: "Kullanıcı Adı",
    age: "Yaşınız",
    gender: "Cinsiyet",
    ethnicity: "Etnik Köken",
    countryState: "Ülke/Şehir",
    howDidYouFindUs: "Bizi nasıl buldunuz?",
    confirmInfo: "Bilgileri Onayla",

    privacyDataTitle: "Gizlilik Verileri",
    privacyDataLocalStorage: "Yerel Saklama",
    privacyDataLocalStorageSubtitle: "Verileriniz cihazınızda saklanır.",
    privacyDataUrgeLogs: "Dürtü Kayıtları",
    privacyDataUrgeLogsDesc: "Dürtü günlüğü ve ilgili kayıtlar yerel tutulur.",
    privacyDataUrgePatterns: "Dürtü Örüntüleri",
    privacyDataUrgePatternsDesc: "Tetikleyici örüntüleri analiz için saklanır.",
    privacyDataOtherLocalData: "Diğer Yerel Veriler",
    privacyDataOtherLocalDataDesc: "Tema, dil ve uygulama tercihleri cihazınızda kalır.",
    privacyDataTelemetry: "Tanılama ve Telemetri",
    privacyDataTelemetrySubtitle: "Paylaşım tercihlerinizi buradan yönetin.",
    privacyDataDiagnosticsToggle: "Tanı Verilerini Paylaş",
    privacyDataDiagnosticsHint: "Anonim tanı verileri iyileştirme için kullanılır.",
    privacyDataCrashReporting: "Çökme Raporları",
    privacyDataCrashReportingHint: "Hataların daha hızlı çözülmesine yardım eder.",
    privacyDataPolicies: "Politikalar",
    privacyDataPoliciesSubtitle: "Gizlilik ve kullanım metinlerine ulaşın.",
    privacyDataPrivacyPolicy: "Gizlilik Politikası",
    privacyDataTerms: "Kullanım Şartları",
    privacyDataImportantInfo: "Önemli Bilgiler",
    privacyDataSecurity: "Güvenlik",
    privacyDataSecuritySubtitle: "Verileriniz güvenli altyapıda korunur.",

    home: "Ana Sayfa",
    explore: "Keşfet",
    premium: "Premium",
    ai: "AI",

    languageSection: "Uygulama Dili",
    languageSectionHint: "Dil tercihiniz cihazınızda saklanır.",
    languageTurkish: "Türkçe",
    languageEnglish: "İngilizce",
  },
  en: {
    tagline: "TO TAKE BACK CONTROL",
    taglineToolbox: "YOUR TOOLKIT",
    continue: "Continue",

    welcomeBack: "WELCOME BACK",
    gambleFree: "Gamble-Free",
    days: "DAYS",

    therapy: "Therapy",
    therapySubtitle: "Sessions",
    mindfulness: "Mindfulness",
    mindfulnessSubtitle: "Sessions",
    sos: "SOS",
    sosSubtitle: "Emergency help",
    progress: "Progress",
    progressSubtitle: "Check now",
    support: "Support",
    supportSubtitle: "Help one tap away",
    diary: "Diary",
    diarySubtitle: "Your private journal",
    smsFilter: "SMS Filter",
    smsFilterSubtitle: "Block spam messages",

    welcomeToAntislot: "WELCOME TO ANTISLOT",
    welcomeDescription: "Please complete your account for progress tracking.",
    next: "Next",

    back: "Back",
    generalBack: "Back",
    createAccount: "COMPLETE YOUR ACCOUNT",
    username: "Username",
    age: "Age",
    gender: "Gender",
    ethnicity: "Ethnicity",
    countryState: "Country/City",
    howDidYouFindUs: "How did you find us?",
    confirmInfo: "Confirm Info",

    privacyDataTitle: "Privacy Data",
    privacyDataLocalStorage: "Local Storage",
    privacyDataLocalStorageSubtitle: "Your data stays on your device.",
    privacyDataUrgeLogs: "Urge Logs",
    privacyDataUrgeLogsDesc: "Urge journal and related records are stored locally.",
    privacyDataUrgePatterns: "Urge Patterns",
    privacyDataUrgePatternsDesc: "Trigger patterns are stored for analysis.",
    privacyDataOtherLocalData: "Other Local Data",
    privacyDataOtherLocalDataDesc: "Theme, language and app preferences remain on your device.",
    privacyDataTelemetry: "Diagnostics & Telemetry",
    privacyDataTelemetrySubtitle: "Manage your sharing preferences here.",
    privacyDataDiagnosticsToggle: "Share Diagnostics",
    privacyDataDiagnosticsHint: "Anonymous diagnostics help us improve.",
    privacyDataCrashReporting: "Crash Reporting",
    privacyDataCrashReportingHint: "Helps fix errors faster.",
    privacyDataPolicies: "Policies",
    privacyDataPoliciesSubtitle: "Read our privacy and usage texts.",
    privacyDataPrivacyPolicy: "Privacy Policy",
    privacyDataTerms: "Terms of Use",
    privacyDataImportantInfo: "Important Info",
    privacyDataSecurity: "Security",
    privacyDataSecuritySubtitle: "Your data is protected on secure infrastructure.",

    home: "Home",
    explore: "Explore",
    premium: "Premium",
    ai: "AI",

    languageSection: "App Language",
    languageSectionHint: "Your language preference is saved on your device.",
    languageTurkish: "Turkish",
    languageEnglish: "English",
  },
};

const languageMeta: Record<Language, { fallbackLanguage: Language; locale: string }> = {
  tr: {
    fallbackLanguage: "tr",
    locale: "tr-TR",
  },
  en: {
    fallbackLanguage: "tr",
    locale: "en-US",
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
