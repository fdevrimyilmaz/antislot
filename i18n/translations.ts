import { FULL_TRANSLATION_OVERRIDES } from "./translations.full-overrides.generated";

export type Language = "tr" | "en";
export type SupportedLanguage =
  | Language
  | "de"
  | "fr"
  | "hi"
  | "lv"
  | "zh"
  | "tl"
  | "sq"
  | "sr"
  | "fi"
  | "sv"
  | "it"
  | "is"
  | "ja"
  | "ko"
  | "es"
  | "pt"
  | "ms"
  | "km"
  | "th";

export type SupportedLanguageOption = {
  code: SupportedLanguage;
  nativeName: string;
  englishName: string;
};

export interface Translations {
  // Onboarding Ekranı
  tagline: string;
  taglineToolbox: string;
  continue: string;
  
  // Ana Sayfa Ekranı
  welcomeBack: string;
  gambleFree: string;
  days: string;
  homeStartTitle: string;
  homeStartSubtitle: string;
  homeSmsTitle: string;
  homeSmsSubtitle: string;
  homeFactsTitle: string;
  homeFactsSubtitle: string;
  factsScreenTitle: string;
  factsScreenSubtitle: string;
  factsScreenDescription: string;
  
  // Kartlar
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
  chat: string;
  diary: string;
  diarySubtitle: string;
  smsFilter: string;
  smsFilterSubtitle: string;
  
  // Hoş Geldiniz Modali
  welcomeToAntislot: string;
  welcomeDescription: string;
  next: string;
  
  // Devam Ekranı
  back: string;
  generalBack: string;
  generalContinue: string;
  createAccount: string;
  username: string;
  age: string;
  gender: string;
  ethnicity: string;
  countryState: string;
  howDidYouFindUs: string;
  confirmInfo: string;
  continueMissingInfoTitle: string;
  continueMissingInfoBody: string;
  continueInvalidAgeTitle: string;
  continueInvalidAgeBody: string;
  continueSaveErrorTitle: string;
  continueSaveErrorBody: string;
  continuePolicyTitle: string;
  continuePolicyBody: string;
  continuePolicyPrivacy: string;
  continuePolicyTerms: string;
  continuePolicyLimitations: string;
  continueSaving: string;
  
  // Sekmeler
  home: string;
  explore: string;
  premium: string;
  ai: string;
  
  // Urge Intervention Flow
  urgeSupport: string;
  urgeSupportSubtitle: string;
  urgeDetectTitle: string;
  urgeDetectCta: string;
  urgeDetectSubtitle: string;
  urgeIntensity: string;
  urgeIntensitySubtitle: string;
  urgeTrigger: string;
  urgeTriggerSubtitle: string;
  urgeContext: string;
  urgeContextSubtitle: string;
  urgeContinue: string;
  urgeBack: string;
  urgeInterveneTitle: string;
  urgeInterveneSubtitle: string;
  urgeSuggested: string;
  urgeAllInterventions: string;
  urgeSkip: string;
  urgeCrisisTitle: string;
  urgeCrisisSubtitle: string;
  urgeCrisisImmediate: string;
  urgeCrisisContinue: string;
  urgeCrisisSOS: string;
  urgeCrisisChoiceTitle: string;
  urgeCrisisChoiceSubtitle: string;
  urgeCrisisChoicePrimary: string;
  urgeCrisisChoicePrimaryDesc: string;
  urgeCrisisChoiceSecondary: string;
  urgeCrisisChoiceSecondaryDesc: string;
  urgeBreathingTitle: string;
  urgeBreathingSubtitle: string;
  urgeBreathingStart: string;
  urgeBreathingInhale: string;
  urgeBreathingHold: string;
  urgeBreathingExhale: string;
  urgeGroundingTitle: string;
  urgeGroundingSubtitle: string;
  urgeGroundingNext: string;
  urgeGroundingComplete: string;
  urgeDelayPause: string;
  urgeDelayResume: string;
  urgeDelayStart: string;
  urgeCompleteTitle: string;
  urgeCompleteSubtitle: string;
  urgeCompleteEffectiveness: string;
  urgeCompleteEffectivenessSubtitle: string;
  urgeCompleteNote: string;
  urgeCompleteNoteSubtitle: string;
  urgeCompleteButton: string;
  urgeCompleteThankYou: string;
  urgeCompleteThankYouSubtitle: string;
  urgeCompleteDone: string;
  urgeIntensityLabels: Record<number, string>;
  urgeTriggerLabels: Record<string, string>;
  urgeInterventionLabels: Record<string, string>;
  urgeEffectivenessLabels: Record<string, string>;
  sosQuickAccess: string;
  
  // Disclaimer
  disclaimerTitle: string;
  disclaimerSubtitle: string;
  disclaimerSupportTool: string;
  disclaimerNotMedical: string;
  disclaimerNotTherapy: string;
  disclaimerCrisisInfo: string;
  disclaimerCrisisAction: string;
  disclaimerUnderstand: string;
  disclaimerViewDetails: string;
  
  // Storage Notice
  storageNoticeMessage: string;
  storageNoticeLink: string;
  
  // Support Sessions (Therapy screen)
  supportSessionsTitle: string;
  supportSessionsFocusLabel: string;
  supportSessionsStructuredPlan: string;
  supportSessionsProgress: string;
  supportSessionsSessionsCompleted: string;
  supportSessionsRecommendedToday: string;
  supportSessionsStruggling: string;
  supportSessionsYourSessions: string;
  supportSessionsContinue: string;
  supportSessionsCurrentSession: string;
  supportSessionsStep: string;
  supportSessionsCompleted: string;
  supportSessionsInProgress: string;
  supportSessionsNew: string;
  supportSessionsRestart: string;
  supportSessionsStart: string;
  supportSessionsRoadmap: string;
  supportSessionsRoadmapSubtitle: string;
  supportSessionsRoadmapItem1: string;
  supportSessionsRoadmapItem2: string;
  supportSessionsRoadmapItem3: string;
  supportSessionsRoadmapItem4: string;
  supportSessionsStartNow: string;
  
  // Privacy & Data Screen
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
  
  // Diagnostics Screen
  diagnosticsTitle: string;
  diagnosticsLoading: string;
  diagnosticsAppInfo: string;
  diagnosticsVersion: string;
  diagnosticsSmsFilterStatus: string;
  diagnosticsFilterEnabled: string;
  diagnosticsStrictMode: string;
  diagnosticsDefaultKeywords: string;
  diagnosticsCustomKeywords: string;
  diagnosticsLastUpdates: string;
  diagnosticsBlocklist: string;
  diagnosticsPatterns: string;
  diagnosticsMessageStats: string;
  diagnosticsBlocked: string;
  diagnosticsAllowed: string;
  diagnosticsCommunityGuard: string;
  diagnosticsGuardBlocked: string;
  diagnosticsGuardRateLimited: string;
  diagnosticsGuardDuplicate: string;
  diagnosticsStorageStatus: string;
  diagnosticsLastBackend: string;
  diagnosticsFallbackMode: string;
  diagnosticsActive: string;
  diagnosticsPassive: string;
  diagnosticsLastErrorTime: string;
  diagnosticsLastErrorCode: string;
  diagnosticsResetCounters: string;
  diagnosticsNever: string;
  diagnosticsInvalid: string;

  // Money Protection Mode
  moneyProtectionTitle: string;
  moneyProtectionSubtitle: string;
  moneyProtectionCardTitle: string;
  moneyProtectionCardSubtitle: string;
  moneyProtectionCardAway: string;
  moneyProtectionAlone: string;
  moneyProtectionEmotionalDistress: string;
  moneyProtectionEscapeNeed: string;
  moneyProtectionEmotionalVoid: string;
  moneyProtectionBankHidden: string;
  moneyProtectionPaymentsDisabled: string;
  moneyProtectionPrimaryCta: string;
  moneyProtectionSecondaryCta: string;
  moneyProtectionLastChecked: string;

  // Progress Screen / Journey
  progressJourneyTitle: string;
  progressJourneySubtitle: string;
  progressStatusLabel: string;
  progressStabilityLabel: string;
  progressGamblingFree: string;
  progressDays7: string;
  progressLast7DaysTitle: string;
  progressUrges7d: string;
  progressManagedUrges7d: string;
  progressRiskTime: string;
  progressMostHelpful: string;
  progressNoDataValue: string;
  progressNoDataHint: string;
  progressTrophiesTitle: string;
  progressCtaTitle: string;
  progressCtaSubtitle: string;
  progressCtaUrge: string;
  progressCtaDiary: string;
  progressStatusSteady: string;
  progressStatusStabilizing: string;
  progressStatusTough: string;
  progressMotivation1: string;
  progressMotivation2: string;
  progressMotivation3: string;
  progressMotivation4: string;
  progressMotivation5: string;

  // Progress Achievements
  progressAchievementsFractionLabel: string;
  achievementNewStartTitle: string;
  achievementNewStartDescription: string;
  achievementFirstResistanceTitle: string;
  achievementFirstResistanceDescription: string;
  achievementFirstWeekTitle: string;
  achievementFirstWeekDescription: string;
  achievementToughNightTitle: string;
  achievementToughNightDescription: string;
  achievementCameBackTitle: string;
  achievementCameBackDescription: string;
  achievementRoutineTitle: string;
  achievementRoutineDescription: string;
  achievementSupportTitle: string;
  achievementSupportDescription: string;
  achievementMoneySafeTitle: string;
  achievementMoneySafeDescription: string;

  // Keşfet (Explore) hub + modüller
  exploreTitle: string;
  exploreSubtitle: string;
  exploreSectionInternal: string;
  exploreSectionExternal: string;
  exploreModules: {
    futureSimulator: { title: string; subtitle: string };
    invisibleCost: { title: string; subtitle: string };
    brainMap: { title: string; subtitle: string };
    identityMode: { title: string; subtitle: string };
    lossCounter: { title: string; subtitle: string };
    urgeMasks: { title: string; subtitle: string };
    realityFeed: { title: string; subtitle: string };
    alternativeLife: { title: string; subtitle: string };
  };
}

export const translations: Record<Language, Translations> = {
  tr: {
    // Onboarding Ekranı
    tagline: "KONTROLÜ GERİ ALMANIZ İÇİN",
    taglineToolbox: "ARAÇ KUTUNUZ",
    continue: "Devam Et",
    
    // Ana Sayfa Ekranı
    welcomeBack: "TEKRAR HOŞ GELDİNİZ",
    gambleFree: "Kumardan Uzak",
    days: "GÜN",
    homeStartTitle: "Bugün yeni bir başlangıç", 
    homeStartSubtitle: "İlk adımı attın. 10 dakika bile çok değerli.",
    homeSmsTitle: "SMS Engelleme",
    homeSmsSubtitle: "İstenmeyen ve dolandırıcılık mesajlarını filtrele",
    homeFactsTitle: "Gerçekler",
    homeFactsSubtitle: "Online kumarın gerçek yüzü",
    factsScreenTitle: "GERÇEKLER",
    factsScreenSubtitle: "Online kumarın gerçek yüzü.",
    factsScreenDescription: "Kumar mitlerini bozmak için kısa ve net gerçekler.",
    
    // Kartlar
    therapy: "Destek Seansları",
    therapySubtitle: "Yönlendirmeli seanslar",
    mindfulness: "Farkındalık",
    mindfulnessSubtitle: "Seanslar",
    sos: "SOS",
    sosSubtitle: "Acil yardım",
    progress: "İlerleme",
    progressSubtitle: "Şimdi incele",
    support: "Destek",
    supportSubtitle: "Yardım bir dokunuş uzakta",
    chat: "Sohbet",
    diary: "Günlük",
    diarySubtitle: "Özel Günlüğünüz",
    smsFilter: "SMS Filtresi",
    smsFilterSubtitle: "Spam Mesajları Engelle",
    
    // Hoş Geldiniz Modali
    welcomeToAntislot: "ANTISLOT'A HOŞ GELDİNİZ",
    welcomeDescription: "Lütfen ilerleme takibi için hesabınızı tamamlayın.",
    next: "İleri",
    
    // Devam Ekranı
    back: "Geri",
    generalBack: "Geri",
    generalContinue: "Devam Et",
    createAccount: "HESABINIZI TAMAMLAYIN",
    username: "Kullanıcı Adı",
    age: "Yaşınız",
    gender: "Cinsiyet",
    ethnicity: "Etnik Köken",
    countryState: "Ülke/Şehir",
    howDidYouFindUs: "Bizi nasıl buldunuz?",
    confirmInfo: "Bilgileri Onayla",
    continueMissingInfoTitle: "Eksik Bilgi",
    continueMissingInfoBody: "Lütfen bir kullanıcı adı girin.",
    continueInvalidAgeTitle: "Geçersiz Yaş",
    continueInvalidAgeBody: "Lütfen geçerli bir yaş girin.",
    continueSaveErrorTitle: "Hata",
    continueSaveErrorBody: "Profil kaydedilemedi.",
    continuePolicyTitle: "Gizlilik ve Bilgilendirme",
    continuePolicyBody:
      "Devam etmeden önce Gizlilik Politikası, Kullanım Şartları ve Sınırlamaları inceleyebilirsin.",
    continuePolicyPrivacy: "Gizlilik",
    continuePolicyTerms: "Şartlar",
    continuePolicyLimitations: "Sınırlamalar",
    continueSaving: "Kaydediliyor...",
    
    // Sekmeler
    home: "Ana Sayfa",
    explore: "Keşfet",
    premium: "Premium",
    ai: "AI",
    
    // Urge Intervention Flow
    urgeSupport: "Dürtü Desteği",
    urgeSupportSubtitle: "Yönlendirmeli müdahalelerle dürtüleri yönetin",
    urgeDetectTitle: "Şu anda nasıl hissediyorsunuz?",
    urgeDetectCta: "Devam Et",
    urgeDetectSubtitle: "Yaşadığınızı fark etmek için bir dakika ayırın. Doğru veya yanlış cevap yoktur.",
    urgeIntensity: "Yoğunluk (1-10)",
    urgeIntensitySubtitle: "Bu his şu anda ne kadar güçlü?",
    urgeTrigger: "Buna ne sebep olmuş olabilir? (İsteğe bağlı)",
    urgeTriggerSubtitle: "Tetikleyicileri anlamak yardımcı olabilir, ancak emin değilseniz sorun değil.",
    urgeContext: "Ek bağlam (İsteğe bağlı)",
    urgeContextSubtitle: "Not etmek istediğiniz başka bir şey var mı? Bu sadece sizin için.",
    urgeContinue: "Devam Et",
    urgeBack: "Geri",
    urgeInterveneTitle: "Şu anda ne yardımcı olur?",
    urgeInterveneSubtitle: "Size uygun gelen bir müdahale seçin. Birden fazlasını deneyebilirsiniz.",
    urgeSuggested: "Sizin için önerilen",
    urgeAllInterventions: "Tüm müdahaleler",
    urgeSkip: "Tamamlamaya geç",
    urgeCrisisTitle: "Yalnız değilsiniz",
    urgeCrisisSubtitle: "Destek şu anda mevcut. Yardım için ulaşabilir veya müdahalelere devam edebilirsiniz.",
    urgeCrisisImmediate: "Acil Destek",
    urgeCrisisContinue: "Müdahalelere devam et",
    urgeCrisisSOS: "SOS Kaynaklarını Aç",
    urgeCrisisChoiceTitle: "Destek mevcut",
    urgeCrisisChoiceSubtitle: "Kriz kaynaklarına erişebilir veya müdahalelere devam edebilirsiniz. Her iki seçenek de mevcut.",
    urgeCrisisChoicePrimary: "SOS / Kriz Kaynaklarını Aç",
    urgeCrisisChoicePrimaryDesc: "Acil iletişimler, yardım hatları ve destek kaynaklarına erişin",
    urgeCrisisChoiceSecondary: "Müdahalelere Devam Et",
    urgeCrisisChoiceSecondaryDesc: "Nefes, topraklama ve diğer destek araçlarıyla devam edin",
    urgeBreathingTitle: "Nefes Egzersizi",
    urgeBreathingSubtitle: "4-4-6 nefes alma sinir sisteminizi düzenlemeye yardımcı olabilir. Bu yaklaşık 60 saniye sürecek.",
    urgeBreathingStart: "Başla",
    urgeBreathingInhale: "Nefes al",
    urgeBreathingHold: "Tut",
    urgeBreathingExhale: "Nefes ver",
    urgeGroundingTitle: "Topraklama Egzersizi",
    urgeGroundingSubtitle: "Şu anki ana bağlanmanıza yardımcı olacak somatik bir teknik.",
    urgeGroundingNext: "İleri",
    urgeGroundingComplete: "Tamamla",
    urgeDelayPause: "Duraklat",
    urgeDelayResume: "Devam Et",
    urgeDelayStart: "Başla",
    urgeCompleteTitle: "Şu anda nasıl hissediyorsunuz?",
    urgeCompleteSubtitle: "Mevcut yoğunluk seviyenizi değerlendirin (1-10).",
    urgeCompleteEffectiveness: "Müdahaleler ne kadar yardımcı oldu?",
    urgeCompleteEffectivenessSubtitle: "Geri bildiriminiz sizin için en iyi neyin işe yaradığını belirlemeye yardımcı olur.",
    urgeCompleteNote: "İsteğe bağlı not",
    urgeCompleteNoteSubtitle: "Bu deneyim hakkında hatırlamak istediğiniz bir şey var mı?",
    urgeCompleteButton: "Tamamla",
    urgeCompleteThankYou: "Teşekkürler",
    urgeCompleteThankYouSubtitle: "Deneyiminiz kaydedildi. Bu, sizin için neyin işe yaradığını öğrenmenize yardımcı olur.",
    urgeCompleteDone: "Bitti",
    urgeIntensityLabels: {
      1: "Çok hafif",
      2: "Hafif",
      3: "Fark edilir",
      4: "Orta",
      5: "Orta-güçlü",
      6: "Güçlü",
      7: "Çok güçlü",
      8: "Yoğun",
      9: "Çok yoğun",
      10: "Aşırı",
    },
    urgeTriggerLabels: {
      emotional: "Duygusal",
      environmental: "Çevresel",
      cognitive: "Düşünceler",
      physical: "Fiziksel",
      social: "Sosyal",
      financial: "Finansal",
      unknown: "Emin değilim",
    },
    urgeInterventionLabels: {
      breathing: "Nefes",
      grounding: "Topraklama",
      reframing: "Yeniden Çerçeveleme",
      redirection: "Yönlendirme",
      delay: "Gecikme",
      support: "Destek",
      sos: "SOS",
    },
    urgeEffectivenessLabels: {
      very_helpful: "Çok yardımcı",
      helpful: "Yardımcı",
      neutral: "Nötr",
      not_helpful: "Yardımcı değil",
    },
    sosQuickAccess: "SOS",
    
    // Disclaimer
    disclaimerTitle: "Önemli Bilgilendirme",
    disclaimerSubtitle: "Lütfen bu bilgileri okuyun",
    disclaimerSupportTool: "Bu bir destek aracıdır, tıbbi bakım değildir.",
    disclaimerNotMedical: "Antislot profesyonel tıbbi veya psikolojik hizmet yerine geçmez. Bu uygulama, kendi kendine yönetim için destekleyici araçlar sunar.",
    disclaimerNotTherapy: "Bu uygulama terapi veya tedavi değildir. Profesyonel yardıma ihtiyacınız varsa, lütfen bir sağlık uzmanına danışın.",
    disclaimerCrisisInfo: "Acil bir durumdaysanız veya kendinize veya başkalarına zarar verme riski varsa:",
    disclaimerCrisisAction: "Lütfen yerel acil yardım numaranızı (112) arayın veya en yakın acil servise gidin.",
    disclaimerUnderstand: "Anladım",
    disclaimerViewDetails: "Detayları Görüntüle",
    storageNoticeMessage: "Veri depolama geçici olarak sınırlı. Uygulama normal çalışmaya devam ediyor.",
    storageNoticeLink: "Detaylar",
    
    // Support Sessions (Therapy screen)
    supportSessionsTitle: "Destek Seansları",
    supportSessionsFocusLabel: "Kumar odağı",
    supportSessionsStructuredPlan: "Yapılandırılmış Destek Planı",
    supportSessionsProgress: "İlerlemen",
    supportSessionsSessionsCompleted: "seans tamamlandı",
    supportSessionsRecommendedToday: "Bugün önerilen:",
    supportSessionsStruggling: "Zorlandım 😔 (SOS)",
    supportSessionsYourSessions: "Seanslarınız",
    supportSessionsContinue: "Devam Et",
    supportSessionsCurrentSession: "Geçerli Seans",
    supportSessionsStep: "Adım",
    supportSessionsCompleted: "Tamamlandı",
    supportSessionsInProgress: "Devam ediyor",
    supportSessionsNew: "Yeni",
    supportSessionsRestart: "Yeniden Başlat",
    supportSessionsStart: "Başla",
    supportSessionsRoadmap: "Destek Yol Haritası",
    supportSessionsRoadmapSubtitle: "Kısa, rehberli seanslar.",
    supportSessionsRoadmapItem1: "BDT Temelleri ile başlayın",
    supportSessionsRoadmapItem2: "Dürtü Sörfü'nü her gün uygulayın",
    supportSessionsRoadmapItem3: "Nüks Önleme planınızı oluşturun",
    supportSessionsRoadmapItem4: "Değerleri Yeniden Hatırlama'yı haftalık gözden geçirin",
    supportSessionsStartNow: "Şimdi Başla",
    
    // Privacy & Data Screen
    privacyDataTitle: "Gizlilik ve Veri",
    privacyDataLocalStorage: "Yerel Depolama",
    privacyDataLocalStorageSubtitle: "Aşağıdaki veriler yalnızca cihazınızda saklanır ve hiçbir sunucuya gönderilmez:",
    privacyDataUrgeLogs: "Dürtü Kayıtları (Urge Logs)",
    privacyDataUrgeLogsDesc: "Dürtü anlarınızın kayıtları, yoğunluk seviyeleri, tetikleyiciler ve kullandığınız müdahale yöntemleri.",
    privacyDataUrgePatterns: "Dürtü Kalıpları (Urge Patterns)",
    privacyDataUrgePatternsDesc: "Uygulama tarafından analiz edilen dürtü kalıpları ve etkili müdahale önerileri.",
    privacyDataOtherLocalData: "Diğer Yerel Veriler",
    privacyDataOtherLocalDataDesc: "İlerleme kayıtları, destek oturumları, günlük notları, SMS filtre ayarları ve blok listeleri.",
    privacyDataTelemetry: "Telemetri ve Çökme Raporlama",
    privacyDataTelemetrySubtitle: "Uygulama performansını iyileştirmek için isteğe bağlı veri paylaşımı. Her iki seçenek de varsayılan olarak kapalıdır.",
    privacyDataDiagnosticsToggle: "Anonim Tanılama Verileri Paylaş",
    privacyDataDiagnosticsHint: "Anonim teknik veriler (hata türleri, depolama durumu) paylaşılır. Kişisel bilgi içermez.",
    privacyDataCrashReporting: "Çökme Raporlama",
    privacyDataCrashReportingHint: "Uygulama çökmelerinde otomatik rapor gönderilir. Kişisel bilgi içermez.",
    privacyDataPolicies: "Politikalar ve Belgeler",
    privacyDataPoliciesSubtitle: "Gizlilik politikası, kullanım şartları ve önemli bilgilendirmeler.",
    privacyDataPrivacyPolicy: "Gizlilik Politikası",
    privacyDataTerms: "Kullanım Şartları",
    privacyDataImportantInfo: "Önemli Bilgilendirme",
    privacyDataSecurity: "Veri Güvenliği",
    privacyDataSecuritySubtitle: "Hassas verileriniz (dürtü kayıtları, ilerleme verileri) cihazınızın güvenli depolama alanında şifrelenmiş olarak saklanır.",
    
    // Diagnostics Screen
    diagnosticsTitle: "Tanılamalar",
    diagnosticsLoading: "Yükleniyor...",
    diagnosticsAppInfo: "Uygulama Bilgileri",
    diagnosticsVersion: "Sürüm",
    diagnosticsSmsFilterStatus: "SMS Filtre Durumu",
    diagnosticsFilterEnabled: "Filtre Etkin",
    diagnosticsStrictMode: "Sıkı Mod",
    diagnosticsDefaultKeywords: "Varsayılan Anahtar Kelimeler",
    diagnosticsCustomKeywords: "Özel Anahtar Kelimeler",
    diagnosticsLastUpdates: "Son Güncellemeler",
    diagnosticsBlocklist: "Engel Listesi",
    diagnosticsPatterns: "Kalıplar",
    diagnosticsMessageStats: "Mesaj İstatistikleri",
    diagnosticsBlocked: "Engellendi",
    diagnosticsAllowed: "İzin Verildi",
    diagnosticsCommunityGuard: "Topluluk Güvenlik Korumaları",
    diagnosticsGuardBlocked: "İçerik Engeli",
    diagnosticsGuardRateLimited: "Hız Limiti",
    diagnosticsGuardDuplicate: "Yinelenen Mesaj",
    diagnosticsStorageStatus: "Depolama Durumu",
    diagnosticsLastBackend: "Son Kullanılan Backend",
    diagnosticsFallbackMode: "Fallback Modu",
    diagnosticsActive: "Aktif",
    diagnosticsPassive: "Pasif",
    diagnosticsLastErrorTime: "Son Hata Zamanı",
    diagnosticsLastErrorCode: "Son Hata Kodu",
    diagnosticsResetCounters: "Sayaçları Sıfırla",
    diagnosticsNever: "Hiç",
    diagnosticsInvalid: "Geçersiz",

    // Money Protection Mode
    moneyProtectionTitle: "Para Koruma Modu",
    moneyProtectionSubtitle:
      "Bugün paranı korumaya yardımcı olacak basit bir kendi kendine kontrol listesi. Hiçbir şey engellenmez; sadece kendine nazikçe hatırlatmalar.",
    moneyProtectionCardTitle: "Para Koruma",
    moneyProtectionCardSubtitle: "Bugün param güvende mi?",
    moneyProtectionCardAway: "Mobil bankacılıkta para var",
    moneyProtectionAlone: "Yalnız'ım",
    moneyProtectionEmotionalDistress: "Stres, kaygı, depresyon, yalnızlık, değersizlik hissi",
    moneyProtectionEscapeNeed: "Günlük hayattaki sorunlardan kaçış ihtiyacı",
    moneyProtectionEmotionalVoid: "Can sıkıntısı, öfke veya duygusal boşluk",
    moneyProtectionBankHidden: "Banka uygulaması gizli (göz önünde değil)",
    moneyProtectionPaymentsDisabled: "Ödeme kapalı (temassız / hızlı ödeme vb.)",
    moneyProtectionPrimaryCta: "Bugün param güvende 🔒",
    moneyProtectionSecondaryCta: "Şu an riskliyim",
    moneyProtectionLastChecked: "Son kontrol: {{date}}",

    // Progress Screen
    progressJourneyTitle: "Gelişimim",
    progressJourneySubtitle: "Küçük adımlar birikir. Bugün nerede olduğunu görelim.",
    progressStatusLabel: "Durum",
    progressStabilityLabel: "İstikrar",
    progressGamblingFree: "Kumarsız gün",
    progressDays7: "7",
    progressLast7DaysTitle: "Son 7 gün",
    progressUrges7d: "Dürtüler (7 gün)",
    progressManagedUrges7d: "Yönetilen dürtüler",
    progressRiskTime: "En zor zaman",
    progressMostHelpful: "En işe yarayan",
    progressNoDataValue: "—",
    progressNoDataHint: "Henüz yeterli veri yok.",
    progressTrophiesTitle: "Kupalar",
    progressCtaTitle: "Bugün için küçük bir adım",
    progressCtaSubtitle:
      "İstersen bir dürtü akışı başlatabilir veya günlüğe kısa bir not ekleyebilirsin.",
    progressCtaUrge: "Dürtü desteği",
    progressCtaDiary: "Günlüğe yaz",
    progressStatusSteady: "Daha dengeli",
    progressStatusStabilizing: "Dengeye geliyor",
    progressStatusTough: "Zor bir dönem",
    progressMotivation1: "Zor anlar geçici. Kontrol yavaş yavaş geri gelir.",
    progressMotivation2: "Bugün küçük bir adım bile fark yaratır.",
    progressMotivation3: "Mükemmel olmak değil, devam etmek önemli.",
    progressMotivation4: "Zorlandığında destek istemek güçtür.",
    progressMotivation5: "Kendine nazik davranmak da bir ilerlemedir.",

    // Progress Achievements
    progressAchievementsFractionLabel: "{{unlocked}} / {{total}}",
    achievementNewStartTitle: "Yeni bir başlangıç",
    achievementNewStartDescription: "İlk kez bu yolculuğa dair bir adım kaydettiniz.",
    achievementFirstResistanceTitle: "İlk direnç",
    achievementFirstResistanceDescription: "Bir yöntemi deneyerek bir dürtüyle çalıştınız.",
    achievementFirstWeekTitle: "İlk hafta",
    achievementFirstWeekDescription: "Yaklaşık bir hafta boyunca sürece alan açtınız.",
    achievementToughNightTitle: "Zor geceyi geçtin",
    achievementToughNightDescription: "Gece saatlerinde zor bir anı fark edip bir yöntem denediniz.",
    achievementCameBackTitle: "Geri döndün",
    achievementCameBackDescription: "Aradan zaman geçtikten sonra yeniden buraya geldiniz.",
    achievementRoutineTitle: "Düzen kuruyorsun",
    achievementRoutineDescription: "En az 10 günlük kayıt veya kontrol oluşturdunuz.",
    achievementSupportTitle: "Destek aldın",
    achievementSupportDescription: "Destekleyici bir aracı veya kaynağı en az bir kez kullandınız.",
    achievementMoneySafeTitle: "Para güvende",
    achievementMoneySafeDescription: "Para koruma kontrolünü en az bir kez tamamladınız.",

    // Keşfet (Explore)
    exploreTitle: "Keşfet",
    exploreSubtitle: "Modülleri keşfet, etkileşim kur.",
    exploreSectionInternal: "İç keşif",
    exploreSectionExternal: "Dış keşif",
    exploreModules: {
      futureSimulator: { title: "Gelecek Simülasyonu", subtitle: "Devam edersen / bugün durursan projeksiyonları." },
      invisibleCost: { title: "Görünmeyen Bedel", subtitle: "Zaman, odak, fırsat, ilişki, öz güven." },
      brainMap: { title: "Beyin Hacklenme Haritası", subtitle: "Sistemler beyni nasıl etkiler." },
      identityMode: { title: "Kimlik Modu", subtitle: "Bu kararı hangi sen veriyor?" },
      lossCounter: { title: "Kayıp Sayacı", subtitle: "Para dışı kayıplar, yaşam odaklı görünüm." },
      urgeMasks: { title: "Dürtü Maskeleri", subtitle: "Dürtünün ardındaki duygular." },
      realityFeed: { title: "Gerçekler", subtitle: "Haberler, hikayeler, yasal değişiklikler." },
      alternativeLife: { title: "Alternatif Hayat", subtitle: "Bu parayla neler yapılabilir." },
    },
  },
  en: {
    // Onboarding Screen
    tagline: "YOUR TOOLBOX TO",
    taglineToolbox: "TAKE BACK CONTROL",
    continue: "Continue",
    
    // Home Screen
    welcomeBack: "WELCOME BACK",
    gambleFree: "Gambling Free",
    days: "DAYS",
    homeStartTitle: "A fresh start today",
    homeStartSubtitle: "Even 10 minutes matters.",
    homeSmsTitle: "SMS Shield",
    homeSmsSubtitle: "Filter spam and scam messages",
    homeFactsTitle: "Reality Check",
    homeFactsSubtitle: "The real face of online gambling",
    factsScreenTitle: "REALITY FACTS",
    factsScreenSubtitle: "The real face of online gambling.",
    factsScreenDescription: "Evidence-based short facts to break gambling myths.",
    
    // Cards
    therapy: "Support Sessions",
    therapySubtitle: "Guided sessions",
    mindfulness: "Mindfulness",
    mindfulnessSubtitle: "Sessions",
    sos: "SOS",
    sosSubtitle: "Emergency help",
    progress: "Progress",
    progressSubtitle: "Review now",
    support: "Support",
    supportSubtitle: "Help is a touch away",
    chat: "Chat",
    diary: "Diary",
    diarySubtitle: "Your Personal Journal",
    smsFilter: "SMS Filter",
    smsFilterSubtitle: "Block Spam Messages",
    
    // Welcome Modal
    welcomeToAntislot: "WELCOME TO ANTISLOT",
    welcomeDescription: "Please complete your account for progress tracking.",
    next: "Next",
    
    // Continue Screen
    back: "Back",
    generalBack: "Back",
    generalContinue: "Continue",
    createAccount: "COMPLETE YOUR ACCOUNT",
    username: "Username",
    age: "Your Age",
    gender: "Gender",
    ethnicity: "Ethnicity",
    countryState: "Country/City",
    howDidYouFindUs: "How did you find us?",
    confirmInfo: "Confirm Info",
    continueMissingInfoTitle: "Missing Information",
    continueMissingInfoBody: "Please enter a username.",
    continueInvalidAgeTitle: "Invalid Age",
    continueInvalidAgeBody: "Please enter a valid age.",
    continueSaveErrorTitle: "Error",
    continueSaveErrorBody: "Profile could not be saved.",
    continuePolicyTitle: "Privacy and Information",
    continuePolicyBody:
      "Before continuing, you can review the Privacy Policy, Terms of Use, and Limitations.",
    continuePolicyPrivacy: "Privacy",
    continuePolicyTerms: "Terms",
    continuePolicyLimitations: "Limitations",
    continueSaving: "Saving...",
    
    // Tabs
    home: "Home",
    explore: "Explore",
    premium: "Premium",
    ai: "AI",
    
    // Urge Intervention Flow
    urgeSupport: "Urge Support",
    urgeSupportSubtitle: "Manage urges with guided interventions",
    urgeDetectTitle: "How are you feeling right now?",
    urgeDetectCta: "Continue",
    urgeDetectSubtitle: "Take a moment to notice what you're experiencing. There's no right or wrong answer.",
    urgeIntensity: "Intensity (1-10)",
    urgeIntensitySubtitle: "How strong is this feeling right now?",
    urgeTrigger: "What might have triggered this? (Optional)",
    urgeTriggerSubtitle: "Understanding triggers can help, but it's okay if you're not sure.",
    urgeContext: "Additional context (Optional)",
    urgeContextSubtitle: "Anything else you'd like to note? This is just for you.",
    urgeContinue: "Continue",
    urgeBack: "Back",
    urgeInterveneTitle: "What would help right now?",
    urgeInterveneSubtitle: "Choose an intervention that feels right for you. You can try more than one.",
    urgeSuggested: "Suggested for you",
    urgeAllInterventions: "All interventions",
    urgeSkip: "Skip to completion",
    urgeCrisisTitle: "You're not alone",
    urgeCrisisSubtitle: "Support is available right now. You can reach out for help or continue with interventions.",
    urgeCrisisImmediate: "Immediate Support",
    urgeCrisisContinue: "Continue with interventions",
    urgeCrisisSOS: "Open SOS Resources",
    urgeCrisisChoiceTitle: "Support is available",
    urgeCrisisChoiceSubtitle: "You can access crisis resources or continue with interventions. Both options are available.",
    urgeCrisisChoicePrimary: "Open SOS / Crisis Resources",
    urgeCrisisChoicePrimaryDesc: "Access emergency contacts, helplines, and support resources",
    urgeCrisisChoiceSecondary: "Continue with Interventions",
    urgeCrisisChoiceSecondaryDesc: "Proceed with breathing, grounding, and other support tools",
    urgeBreathingTitle: "Breathing Exercise",
    urgeBreathingSubtitle: "4-4-6 breathing can help regulate your nervous system. This will take about 60 seconds.",
    urgeBreathingStart: "Start",
    urgeBreathingInhale: "Breathe in",
    urgeBreathingHold: "Hold",
    urgeBreathingExhale: "Breathe out",
    urgeGroundingTitle: "Grounding Exercise",
    urgeGroundingSubtitle: "A somatic technique to help anchor you in the present moment.",
    urgeGroundingNext: "Next",
    urgeGroundingComplete: "Complete",
    urgeDelayPause: "Pause",
    urgeDelayResume: "Resume",
    urgeDelayStart: "Start",
    urgeCompleteTitle: "How are you feeling now?",
    urgeCompleteSubtitle: "Rate your current intensity level (1-10).",
    urgeCompleteEffectiveness: "How helpful were the interventions?",
    urgeCompleteEffectivenessSubtitle: "Your feedback helps identify what works best for you.",
    urgeCompleteNote: "Optional note",
    urgeCompleteNoteSubtitle: "Anything you'd like to remember about this experience?",
    urgeCompleteButton: "Complete",
    urgeCompleteThankYou: "Thank you",
    urgeCompleteThankYouSubtitle: "Your experience has been logged. This helps you learn what works for you.",
    urgeCompleteDone: "Done",
    urgeIntensityLabels: {
      1: "Very mild",
      2: "Mild",
      3: "Noticeable",
      4: "Moderate",
      5: "Moderate-strong",
      6: "Strong",
      7: "Very strong",
      8: "Intense",
      9: "Very intense",
      10: "Extreme",
    },
    urgeTriggerLabels: {
      emotional: "Emotional",
      environmental: "Environmental",
      cognitive: "Thoughts",
      physical: "Physical",
      social: "Social",
      financial: "Financial",
      unknown: "Not sure",
    },
    urgeInterventionLabels: {
      breathing: "Breathing",
      grounding: "Grounding",
      reframing: "Reframing",
      redirection: "Redirect",
      delay: "Delay",
      support: "Support",
      sos: "SOS",
    },
    urgeEffectivenessLabels: {
      very_helpful: "Very helpful",
      helpful: "Helpful",
      neutral: "Neutral",
      not_helpful: "Not helpful",
    },
    sosQuickAccess: "SOS",
    
    // Disclaimer
    disclaimerTitle: "Important Information",
    disclaimerSubtitle: "Please read this information",
    disclaimerSupportTool: "This is a support tool, not medical care.",
    disclaimerNotMedical: "Antislot does not replace professional medical or psychological services. This app provides supportive tools for self-management.",
    disclaimerNotTherapy: "This app is not therapy or treatment. If you need professional help, please consult a healthcare provider.",
    disclaimerCrisisInfo: "If you are in crisis or at risk of harming yourself or others:",
    disclaimerCrisisAction: "Please call your local emergency number (911, 112, etc.) or go to your nearest emergency room.",
    disclaimerUnderstand: "I Understand",
    disclaimerViewDetails: "View Details",
    storageNoticeMessage: "Data storage is temporarily limited. The app continues to function normally.",
    storageNoticeLink: "Details",
    
    // Support Sessions (Therapy screen)
    supportSessionsTitle: "Support Sessions",
    supportSessionsFocusLabel: "Gambling focus",
    supportSessionsStructuredPlan: "Structured Support Plan",
    supportSessionsProgress: "Your Progress",
    supportSessionsSessionsCompleted: "sessions completed",
    supportSessionsRecommendedToday: "Recommended today:",
    supportSessionsStruggling: "I'm Struggling 😔 (SOS)",
    supportSessionsYourSessions: "Your Sessions",
    supportSessionsContinue: "Continue",
    supportSessionsCurrentSession: "Current Session",
    supportSessionsStep: "Step",
    supportSessionsCompleted: "Completed",
    supportSessionsInProgress: "In Progress",
    supportSessionsNew: "New",
    supportSessionsRestart: "Restart",
    supportSessionsStart: "Start",
    supportSessionsRoadmap: "Support Roadmap",
    supportSessionsRoadmapSubtitle: "Short, guided sessions.",
    supportSessionsRoadmapItem1: "Start with CBT Foundations",
    supportSessionsRoadmapItem2: "Practice Urge Surfing daily",
    supportSessionsRoadmapItem3: "Create your Relapse Prevention plan",
    supportSessionsRoadmapItem4: "Review Values Reset weekly",
    supportSessionsStartNow: "Start Now",
    
    // Privacy & Data Screen
    privacyDataTitle: "Privacy & Data",
    privacyDataLocalStorage: "Local Storage",
    privacyDataLocalStorageSubtitle: "The following data is stored only on your device and is never sent to any server:",
    privacyDataUrgeLogs: "Urge Logs",
    privacyDataUrgeLogsDesc: "Records of your urge moments, intensity levels, triggers, and intervention methods you used.",
    privacyDataUrgePatterns: "Urge Patterns",
    privacyDataUrgePatternsDesc: "Urge patterns analyzed by the app and effective intervention suggestions.",
    privacyDataOtherLocalData: "Other Local Data",
    privacyDataOtherLocalDataDesc: "Progress records, support sessions, diary entries, SMS filter settings, and block lists.",
    privacyDataTelemetry: "Telemetry & Crash Reporting",
    privacyDataTelemetrySubtitle: "Optional data sharing to improve app performance. Both options are disabled by default.",
    privacyDataDiagnosticsToggle: "Share Anonymous Diagnostics",
    privacyDataDiagnosticsHint: "Anonymous technical data (error types, storage status) is shared. Contains no personal information.",
    privacyDataCrashReporting: "Crash Reporting",
    privacyDataCrashReportingHint: "Automatic reports are sent on app crashes. Contains no personal information.",
    privacyDataPolicies: "Policies & Documents",
    privacyDataPoliciesSubtitle: "Privacy policy, terms of use, and important information.",
    privacyDataPrivacyPolicy: "Privacy Policy",
    privacyDataTerms: "Terms of Use",
    privacyDataImportantInfo: "Important Information",
    privacyDataSecurity: "Data Security",
    privacyDataSecuritySubtitle: "Your sensitive data (urge logs, progress data) is stored encrypted in your device's secure storage area.",
    
    // Diagnostics Screen
    diagnosticsTitle: "Diagnostics",
    diagnosticsLoading: "Loading...",
    diagnosticsAppInfo: "App Information",
    diagnosticsVersion: "Version",
    diagnosticsSmsFilterStatus: "SMS Filter Status",
    diagnosticsFilterEnabled: "Filter Enabled",
    diagnosticsStrictMode: "Strict Mode",
    diagnosticsDefaultKeywords: "Default Keywords",
    diagnosticsCustomKeywords: "Custom Keywords",
    diagnosticsLastUpdates: "Last Updates",
    diagnosticsBlocklist: "Blocklist",
    diagnosticsPatterns: "Patterns",
    diagnosticsMessageStats: "Message Statistics",
    diagnosticsBlocked: "Blocked",
    diagnosticsAllowed: "Allowed",
    diagnosticsCommunityGuard: "Community Guard Events",
    diagnosticsGuardBlocked: "Safety Block",
    diagnosticsGuardRateLimited: "Rate Limited",
    diagnosticsGuardDuplicate: "Duplicate Block",
    diagnosticsStorageStatus: "Storage Status",
    diagnosticsLastBackend: "Last Used Backend",
    diagnosticsFallbackMode: "Fallback Mode",
    diagnosticsActive: "Active",
    diagnosticsPassive: "Passive",
    diagnosticsLastErrorTime: "Last Error Time",
    diagnosticsLastErrorCode: "Last Error Code",
    diagnosticsResetCounters: "Reset Counters",
    diagnosticsNever: "Never",
    diagnosticsInvalid: "Invalid",

    // Money Protection Mode
    moneyProtectionTitle: "Money Protection Mode",
    moneyProtectionSubtitle:
      "A simple self-check list to help you reduce access to money when you want to lower gambling risk. Nothing is blocked or controlled for you.",
    moneyProtectionCardTitle: "Money Protection",
    moneyProtectionCardSubtitle: "Is my money safe today?",
    moneyProtectionCardAway: "Card is not with me",
    moneyProtectionAlone: "I am alone",
    moneyProtectionEmotionalDistress: "Stress, anxiety, depression, loneliness, feelings of worthlessness",
    moneyProtectionEscapeNeed: "Need to escape daily-life problems",
    moneyProtectionEmotionalVoid: "Boredom, anger, or emotional emptiness",
    moneyProtectionBankHidden: "Bank app is tucked away (not on the first screen)",
    moneyProtectionPaymentsDisabled: "Fast payments turned off (contactless / quick pay etc.)",
    moneyProtectionPrimaryCta: "My money feels safe today 🔒",
    moneyProtectionSecondaryCta: "I feel at risk right now",
    moneyProtectionLastChecked: "Last check: {{date}}",

    // Progress Screen
    progressJourneyTitle: "My Journey",
    progressJourneySubtitle: "Small steps add up. Let’s see where you are today.",
    progressStatusLabel: "Status",
    progressStabilityLabel: "Stability",
    progressGamblingFree: "Gambling-free days",
    progressDays7: "7",
    progressLast7DaysTitle: "Last 7 days",
    progressUrges7d: "Urges (7d)",
    progressManagedUrges7d: "Managed urges",
    progressRiskTime: "Hardest time",
    progressMostHelpful: "Most helpful",
    progressNoDataValue: "—",
    progressNoDataHint: "Not enough data yet.",
    progressTrophiesTitle: "Milestones",
    progressCtaTitle: "A small step today",
    progressCtaSubtitle: "You can start an urge flow or add a short diary note.",
    progressCtaUrge: "Urge support",
    progressCtaDiary: "Write in diary",
    progressStatusSteady: "Steadier",
    progressStatusStabilizing: "Stabilizing",
    progressStatusTough: "Tough phase",
    progressMotivation1: "Hard moments are temporary. Control can return step by step.",
    progressMotivation2: "Even a small step today can help.",
    progressMotivation3: "It’s not about perfection — it’s about continuing.",
    progressMotivation4: "Asking for support is strength.",
    progressMotivation5: "Being kind to yourself is progress too.",

    // Progress Achievements
    progressAchievementsFractionLabel: "{{unlocked}} / {{total}}",
    achievementNewStartTitle: "A new beginning",
    achievementNewStartDescription: "You logged your first step in this journey.",
    achievementFirstResistanceTitle: "First resistance",
    achievementFirstResistanceDescription: "You tried a tool to work with an urge.",
    achievementFirstWeekTitle: "First week",
    achievementFirstWeekDescription: "You held space for this process for about a week.",
    achievementToughNightTitle: "You got through a tough night",
    achievementToughNightDescription: "You noticed a difficult night-time moment and tried a tool.",
    achievementCameBackTitle: "You came back",
    achievementCameBackDescription: "After some time away, you chose to return here.",
    achievementRoutineTitle: "Building a rhythm",
    achievementRoutineDescription: "You created at least 10 diary entries or check-ins.",
    achievementSupportTitle: "You reached for support",
    achievementSupportDescription: "You used a supportive tool or resource at least once.",
    achievementMoneySafeTitle: "Money check-in",
    achievementMoneySafeDescription: "You completed at least one money protection check-in.",

    // Explore (Keşfet)
    exploreTitle: "Explore",
    exploreSubtitle: "Discover modules, interact.",
    exploreSectionInternal: "Internal exploration",
    exploreSectionExternal: "External discovery",
    exploreModules: {
      futureSimulator: { title: "Future Simulator", subtitle: "If you continue vs if you stop today." },
      invisibleCost: { title: "Invisible Cost", subtitle: "Time, focus, opportunities, relationships, self-trust." },
      brainMap: { title: "Brain Manipulation Map", subtitle: "How systems affect the brain." },
      identityMode: { title: "Identity Mode", subtitle: "Which version of you makes this decision?" },
      lossCounter: { title: "Loss Counter", subtitle: "Non-financial losses, life-based view." },
      urgeMasks: { title: "Urge Masks", subtitle: "Emotions behind the urge." },
      realityFeed: { title: "Reality Feed", subtitle: "News, stories, legal changes." },
      alternativeLife: { title: "Alternative Life", subtitle: "What you could do with that money." },
    },
  }
};

const FALLBACK_LANGUAGE_BY_SUPPORTED: Record<SupportedLanguage, Language> = {
  tr: "tr",
  en: "en",
  de: "en",
  fr: "en",
  hi: "en",
  lv: "en",
  zh: "en",
  tl: "en",
  sq: "en",
  sr: "en",
  fi: "en",
  sv: "en",
  it: "en",
  is: "en",
  ja: "en",
  ko: "en",
  es: "en",
  pt: "en",
  ms: "en",
  km: "en",
  th: "en",
};

const LOCALE_BY_SUPPORTED: Record<SupportedLanguage, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  hi: "hi-IN",
  lv: "lv-LV",
  zh: "zh-CN",
  tl: "fil-PH",
  sq: "sq-AL",
  sr: "sr-RS",
  fi: "fi-FI",
  sv: "sv-SE",
  it: "it-IT",
  is: "is-IS",
  ja: "ja-JP",
  ko: "ko-KR",
  es: "es-ES",
  pt: "pt-PT",
  ms: "ms-MY",
  km: "km-KH",
  th: "th-TH",
};

export const SUPPORTED_LANGUAGE_OPTIONS: SupportedLanguageOption[] = [
  { code: "tr", nativeName: "Turkce", englishName: "Turkish" },
  { code: "en", nativeName: "English", englishName: "English" },
  { code: "de", nativeName: "Deutsch", englishName: "German" },
  { code: "fr", nativeName: "Francais", englishName: "French" },
  { code: "hi", nativeName: "Hindi", englishName: "Hindi" },
  { code: "lv", nativeName: "Latviesu", englishName: "Latvian" },
  { code: "zh", nativeName: "Mandarin Chinese", englishName: "Chinese (Mandarin)" },
  { code: "tl", nativeName: "Filipino (Tagalog)", englishName: "Filipino (Tagalog)" },
  { code: "sq", nativeName: "Shqip", englishName: "Albanian" },
  { code: "sr", nativeName: "Srpski", englishName: "Serbian" },
  { code: "fi", nativeName: "Suomi", englishName: "Finnish" },
  { code: "sv", nativeName: "Svenska", englishName: "Swedish" },
  { code: "it", nativeName: "Italiano", englishName: "Italian" },
  { code: "is", nativeName: "Islenska", englishName: "Icelandic" },
  { code: "ja", nativeName: "Nihongo", englishName: "Japanese" },
  { code: "ko", nativeName: "Hangugeo", englishName: "Korean" },
  { code: "es", nativeName: "Espanol", englishName: "Spanish" },
  { code: "pt", nativeName: "Portugues", englishName: "Portuguese" },
  { code: "ms", nativeName: "Bahasa Melayu", englishName: "Malay" },
  { code: "km", nativeName: "Khmer", englishName: "Khmer (Cambodian)" },
  { code: "th", nativeName: "Thai", englishName: "Thai" },
];

export function normalizeSupportedLanguage(value: string | null | undefined): SupportedLanguage {
  if (!value) return "tr";
  const normalized = value.trim().toLowerCase();
  if (normalized in FALLBACK_LANGUAGE_BY_SUPPORTED) {
    return normalized as SupportedLanguage;
  }
  return "tr";
}

export function resolveUiLanguage(language: SupportedLanguage): Language {
  return FALLBACK_LANGUAGE_BY_SUPPORTED[language] ?? "tr";
}

export function getLocaleForLanguage(language: SupportedLanguage): string {
  return LOCALE_BY_SUPPORTED[language] ?? "en-US";
}

const CORE_OVERRIDE_KEYS = [
  "continue",
  "back",
  "generalBack",
  "generalContinue",
  "home",
  "explore",
  "premium",
  "ai",
  "support",
  "sos",
  "progress",
  "diary",
  "chat",
  "smsFilter",
  "therapy",
  "mindfulness",
  "days",
  "gambleFree",
  "welcomeBack",
] as const satisfies ReadonlyArray<keyof Translations>;

type CoreOverrideKey = (typeof CORE_OVERRIDE_KEYS)[number];
type CoreTranslationOverrides = Pick<Translations, CoreOverrideKey>;
type ExtendedLanguage = Exclude<SupportedLanguage, Language>;

const CORE_TRANSLATION_OVERRIDES: Record<ExtendedLanguage, CoreTranslationOverrides> = {
  de: {
    continue: "Weiter",
    back: "Zuruck",
    generalBack: "Zuruck",
    generalContinue: "Weiter",
    home: "Start",
    explore: "Entdecken",
    premium: "Premium",
    ai: "KI",
    support: "Hilfe",
    sos: "SOS",
    progress: "Fortschritt",
    diary: "Tagebuch",
    chat: "Sohbet",
    smsFilter: "SMS-Filter",
    therapy: "Unterstuetzungssitzungen",
    mindfulness: "Achtsamkeit",
    days: "TAGE",
    gambleFree: "Spielfrei",
    welcomeBack: "WILLKOMMEN ZURUCK",
  },
  fr: {
    continue: "Continuer",
    back: "Retour",
    generalBack: "Retour",
    generalContinue: "Continuer",
    home: "Accueil",
    explore: "Explorer",
    premium: "Premium",
    ai: "IA",
    support: "Support",
    sos: "SOS",
    progress: "Progres",
    diary: "Journal",
    chat: "Discussion",
    smsFilter: "Filtre SMS",
    therapy: "Sessions de soutien",
    mindfulness: "Pleine conscience",
    days: "JOURS",
    gambleFree: "Sans jeu",
    welcomeBack: "BON RETOUR",
  },
  hi: {
    continue: "Jari rakhen",
    back: "Vapas",
    generalBack: "Vapas",
    generalContinue: "Jari rakhen",
    home: "Home",
    explore: "Explore",
    premium: "Premium",
    ai: "AI",
    support: "Sahayata",
    sos: "SOS",
    progress: "Pragati",
    diary: "Diary",
    chat: "Chat",
    smsFilter: "SMS Filter",
    therapy: "Support Sessions",
    mindfulness: "Mindfulness",
    days: "DIN",
    gambleFree: "Jua-mukt",
    welcomeBack: "WAPAS SWAGAT HAI",
  },
  lv: {
    continue: "Turpinat",
    back: "Atpakal",
    generalBack: "Atpakal",
    generalContinue: "Turpinat",
    home: "Sakums",
    explore: "Izpetit",
    premium: "Premium",
    ai: "AI",
    support: "Atbalsts",
    sos: "SOS",
    progress: "Progress",
    diary: "Dienasgramata",
    chat: "Chat",
    smsFilter: "SMS Filtrs",
    therapy: "Atbalsta sesijas",
    mindfulness: "Apzinatiba",
    days: "DIENAS",
    gambleFree: "Bez azartspelu",
    welcomeBack: "LAIPNI LUDZAM ATPAKAL",
  },
  zh: {
    continue: "Jixu",
    back: "Fan hui",
    generalBack: "Fan hui",
    generalContinue: "Jixu",
    home: "Shouye",
    explore: "Tansuo",
    premium: "Premium",
    ai: "AI",
    support: "Zhichi",
    sos: "SOS",
    progress: "Jindu",
    diary: "Riji",
    chat: "Liaotian",
    smsFilter: "SMS Guolv",
    therapy: "Zhichi Kecheng",
    mindfulness: "Zhuanyi",
    days: "TIAN",
    gambleFree: "Wudu",
    welcomeBack: "HUANYING HUILAI",
  },
  tl: {
    continue: "Magpatuloy",
    back: "Bumalik",
    generalBack: "Bumalik",
    generalContinue: "Magpatuloy",
    home: "Home",
    explore: "Galugarin",
    premium: "Premium",
    ai: "AI",
    support: "Suporta",
    sos: "SOS",
    progress: "Progreso",
    diary: "Talaarawan",
    chat: "Chat",
    smsFilter: "SMS Filter",
    therapy: "Support Sessions",
    mindfulness: "Mindfulness",
    days: "ARAW",
    gambleFree: "Walang sugal",
    welcomeBack: "MALIGAYANG PAGBABALIK",
  },
  sq: {
    continue: "Vazhdo",
    back: "Kthehu",
    generalBack: "Kthehu",
    generalContinue: "Vazhdo",
    home: "Kreu",
    explore: "Eksploro",
    premium: "Premium",
    ai: "AI",
    support: "Mbeshteje",
    sos: "SOS",
    progress: "Progres",
    diary: "Ditari",
    chat: "Chat",
    smsFilter: "SMS Filter",
    therapy: "Seanca mbeshtetjeje",
    mindfulness: "Vetedije",
    days: "DITE",
    gambleFree: "Pa bixhoz",
    welcomeBack: "MIRE SE U KTHYET",
  },
  sr: {
    continue: "Nastavi",
    back: "Nazad",
    generalBack: "Nazad",
    generalContinue: "Nastavi",
    home: "Pocetna",
    explore: "Istrazi",
    premium: "Premium",
    ai: "AI",
    support: "Podrska",
    sos: "SOS",
    progress: "Napredak",
    diary: "Dnevnik",
    chat: "Chat",
    smsFilter: "SMS Filter",
    therapy: "Sesije podrske",
    mindfulness: "Svesnost",
    days: "DANA",
    gambleFree: "Bez kockanja",
    welcomeBack: "DOBRODOSLI NAZAD",
  },
  fi: {
    continue: "Jatka",
    back: "Takaisin",
    generalBack: "Takaisin",
    generalContinue: "Jatka",
    home: "Koti",
    explore: "Tutki",
    premium: "Premium",
    ai: "AI",
    support: "Tuki",
    sos: "SOS",
    progress: "Edistyminen",
    diary: "Paivakirja",
    chat: "Chat",
    smsFilter: "SMS-suodatin",
    therapy: "Tukisessiot",
    mindfulness: "Tietoinen laasnaolo",
    days: "PAIVAA",
    gambleFree: "Ilman rahapeleja",
    welcomeBack: "TERVETULOA TAKAISIN",
  },
  sv: {
    continue: "Fortsatt",
    back: "Tillbaka",
    generalBack: "Tillbaka",
    generalContinue: "Fortsatt",
    home: "Hem",
    explore: "Utforska",
    premium: "Premium",
    ai: "AI",
    support: "Stod",
    sos: "SOS",
    progress: "Framsteg",
    diary: "Dagbok",
    chat: "Chat",
    smsFilter: "SMS-filter",
    therapy: "Stodsamtal",
    mindfulness: "Mindfulness",
    days: "DAGAR",
    gambleFree: "Spelfri",
    welcomeBack: "VALKOMMEN TILLBAKA",
  },
  it: {
    continue: "Continua",
    back: "Indietro",
    generalBack: "Indietro",
    generalContinue: "Continua",
    home: "Home",
    explore: "Esplora",
    premium: "Premium",
    ai: "IA",
    support: "Supporto",
    sos: "SOS",
    progress: "Progresso",
    diary: "Diario",
    chat: "Chat",
    smsFilter: "Filtro SMS",
    therapy: "Sessioni di supporto",
    mindfulness: "Consapevolezza",
    days: "GIORNI",
    gambleFree: "Senza gioco",
    welcomeBack: "BENTORNATO",
  },
  is: {
    continue: "Halda afram",
    back: "Til baka",
    generalBack: "Til baka",
    generalContinue: "Halda afram",
    home: "Heim",
    explore: "Skoða",
    premium: "Premium",
    ai: "AI",
    support: "Stuðningur",
    sos: "SOS",
    progress: "Framfor",
    diary: "Dagbok",
    chat: "Spjall",
    smsFilter: "SMS-sia",
    therapy: "Stuðningslotur",
    mindfulness: "Nundvitund",
    days: "DAGAR",
    gambleFree: "Án spilunar",
    welcomeBack: "VELKOMIN AFTUR",
  },
  ja: {
    continue: "Tsuzukeru",
    back: "Modoru",
    generalBack: "Modoru",
    generalContinue: "Tsuzukeru",
    home: "Home",
    explore: "Explore",
    premium: "Premium",
    ai: "AI",
    support: "Support",
    sos: "SOS",
    progress: "Progress",
    diary: "Diary",
    chat: "Chat",
    smsFilter: "SMS Filter",
    therapy: "Support Sessions",
    mindfulness: "Mindfulness",
    days: "DAYS",
    gambleFree: "Gamble Free",
    welcomeBack: "WELCOME BACK",
  },
  ko: {
    continue: "Gyesok",
    back: "Doraga",
    generalBack: "Doraga",
    generalContinue: "Gyesok",
    home: "Home",
    explore: "Explore",
    premium: "Premium",
    ai: "AI",
    support: "Support",
    sos: "SOS",
    progress: "Progress",
    diary: "Diary",
    chat: "Chat",
    smsFilter: "SMS Filter",
    therapy: "Support Sessions",
    mindfulness: "Mindfulness",
    days: "DAYS",
    gambleFree: "Gamble Free",
    welcomeBack: "WELCOME BACK",
  },
  es: {
    continue: "Continuar",
    back: "Atras",
    generalBack: "Atras",
    generalContinue: "Continuar",
    home: "Inicio",
    explore: "Explorar",
    premium: "Premium",
    ai: "IA",
    support: "Soporte",
    sos: "SOS",
    progress: "Progreso",
    diary: "Diario",
    chat: "Chat",
    smsFilter: "Filtro SMS",
    therapy: "Sesiones de apoyo",
    mindfulness: "Atencion plena",
    days: "DIAS",
    gambleFree: "Sin apuestas",
    welcomeBack: "BIENVENIDO DE NUEVO",
  },
  pt: {
    continue: "Continuar",
    back: "Voltar",
    generalBack: "Voltar",
    generalContinue: "Continuar",
    home: "Inicio",
    explore: "Explorar",
    premium: "Premium",
    ai: "IA",
    support: "Suporte",
    sos: "SOS",
    progress: "Progresso",
    diary: "Diario",
    chat: "Chat",
    smsFilter: "Filtro SMS",
    therapy: "Sessoes de apoio",
    mindfulness: "Atencao plena",
    days: "DIAS",
    gambleFree: "Sem apostas",
    welcomeBack: "BEM-VINDO DE VOLTA",
  },
  ms: {
    continue: "Teruskan",
    back: "Kembali",
    generalBack: "Kembali",
    generalContinue: "Teruskan",
    home: "Laman Utama",
    explore: "Teroka",
    premium: "Premium",
    ai: "AI",
    support: "Sokongan",
    sos: "SOS",
    progress: "Kemajuan",
    diary: "Diari",
    chat: "Chat",
    smsFilter: "Penapis SMS",
    therapy: "Sesi sokongan",
    mindfulness: "Kesedaran",
    days: "HARI",
    gambleFree: "Bebas judi",
    welcomeBack: "SELAMAT KEMBALI",
  },
  km: {
    continue: "Continue",
    back: "Back",
    generalBack: "Back",
    generalContinue: "Continue",
    home: "Home",
    explore: "Explore",
    premium: "Premium",
    ai: "AI",
    support: "Support",
    sos: "SOS",
    progress: "Progress",
    diary: "Diary",
    chat: "Chat",
    smsFilter: "SMS Filter",
    therapy: "Support Sessions",
    mindfulness: "Mindfulness",
    days: "DAYS",
    gambleFree: "Gamble Free",
    welcomeBack: "WELCOME BACK",
  },
  th: {
    continue: "Continue",
    back: "Back",
    generalBack: "Back",
    generalContinue: "Continue",
    home: "Home",
    explore: "Explore",
    premium: "Premium",
    ai: "AI",
    support: "Support",
    sos: "SOS",
    progress: "Progress",
    diary: "Diary",
    chat: "Chat",
    smsFilter: "SMS Filter",
    therapy: "Support Sessions",
    mindfulness: "Mindfulness",
    days: "DAYS",
    gambleFree: "Gamble Free",
    welcomeBack: "WELCOME BACK",
  },
};

export function getTranslationsForLanguage(language: SupportedLanguage): Translations {
  if (language === "tr" || language === "en") {
    return translations[language];
  }

  const fullOverride = FULL_TRANSLATION_OVERRIDES[language];
  if (fullOverride) {
    return fullOverride;
  }

  const fallbackLanguage = resolveUiLanguage(language);
  const base = translations[fallbackLanguage];
  const overrides = CORE_TRANSLATION_OVERRIDES[language];
  return {
    ...base,
    ...overrides,
  };
}

export type TranslationCoverageReportItem = {
  language: SupportedLanguage;
  fallbackLanguage: Language;
  locale: string;
  localizedCoreKeys: number;
  totalCoreKeys: number;
  coreCoveragePercent: number;
};

export function getTranslationCoverageReport(): TranslationCoverageReportItem[] {
  const countLocalizedKeys = (value: unknown): number => {
    if (typeof value === "string") return 1;
    if (!value || typeof value !== "object") return 0;
    return Object.values(value).reduce((sum, item) => sum + countLocalizedKeys(item), 0);
  };

  const totalLeafKeys = countLocalizedKeys(translations.en);

  return SUPPORTED_LANGUAGE_OPTIONS.map(({ code }) => {
    const fallbackLanguage = resolveUiLanguage(code);
    const locale = getLocaleForLanguage(code);

    const localizedSource =
      code === "tr"
        ? translations.tr
        : code === "en"
          ? translations.en
          : FULL_TRANSLATION_OVERRIDES[code] ?? CORE_TRANSLATION_OVERRIDES[code];

    const localizedCoreKeys = countLocalizedKeys(localizedSource);
    const cappedLocalizedCoreKeys = Math.min(localizedCoreKeys, totalLeafKeys);

    const coreCoveragePercent = Math.round((cappedLocalizedCoreKeys / totalLeafKeys) * 10000) / 100;

    return {
      language: code,
      fallbackLanguage,
      locale,
      localizedCoreKeys: cappedLocalizedCoreKeys,
      totalCoreKeys: totalLeafKeys,
      coreCoveragePercent,
    };
  });
}
