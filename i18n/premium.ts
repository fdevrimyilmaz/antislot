import type { Language } from "@/i18n/translations";

export type PremiumPlanId = "monthly" | "quarterly" | "semiannual" | "annual";

export type PremiumIcon =
  | "fitness"
  | "git-network"
  | "sparkles"
  | "chatbubbles"
  | "headset"
  | "ban";

export type PremiumFeature = {
  icon: PremiumIcon;
  title: string;
  description: string;
};

export type PlanMeta = {
  title: string;
  subtitle: string;
  saveLabel?: string;
  best?: boolean;
  monthsForHint: number;
};

export type FallbackPrice = {
  priceLabel: string;
  priceHint?: string;
};

export type ToastMessage = { title: string; message: string };

export type PremiumLocale = {
  features: PremiumFeature[];
  plans: Record<PremiumPlanId, PlanMeta>;
  fallbackPrices: Record<PremiumPlanId, FallbackPrice>;
  perMonthSuffix: string;
  trustPoints: string[];
  autoRenewDisclosure: string;

  // Hero / status / sections
  headerChipAccessibility: string;
  heroTitle: string;
  heroSubtitle: string;
  loadingAccessibility: string;
  statusLabel: string;
  statusA11yPrefix: string;
  featuresTitle: string;
  featuresMetaSuffix: string;
  plansTitle: string;
  plansReadySubtitle: string;
  plansLoadingSubtitle: string;
  plansFallbackSubtitle: string;
  processingLabel: string;
  buyLabel: string;
  restorePurchasesLabel: string;
  securePurchaseTitle: string;
  termsLabel: string;
  privacyLabel: string;
  manageSubLabel: string;

  accessCodeTitle: string;
  accessCodeSubtitle: string;
  accessCodePlaceholder: string;
  accessCodeInputA11y: string;
  applyCodeLabel: string;

  liveSupportTitle: string;
  liveSupportActiveSubtitle: string;
  liveSupportInactiveSubtitle: string;
  liveSupportAction: string;

  gamblingTitle: string;
  gamblingSubtitle: string;
  gamblingManage: string;
  gamblingUnlock: string;
  resetPremium: string;

  helpTitle: string;
  helpSubtitlePrefix: string;
  helpEmailAction: string;

  // Status badge text
  statusChecking: string;
  statusCheckingValue: string;
  statusOff: string;
  statusOffValue: string;
  statusOffHint: string;
  statusActive: string;
  statusActiveValue: string;
  statusActiveHint: string;

  // Duration
  durationToday: string;
  durationOneDay: string;
  // Returns label for N days (N >= 2)
  durationDays: (n: number) => string;

  // Toasts
  toastRedeemNotConfigured: ToastMessage;
  toastRedeemNetwork: ToastMessage;
  toastRedeemInvalid: ToastMessage;
  toastRedeemSuccess: ToastMessage;
  toastRedeemError: ToastMessage;
  toastPurchaseUnsupported: ToastMessage;
  toastPurchaseNotReady: ToastMessage;
  toastPurchaseSuccess: ToastMessage;
  toastPurchaseErrorTitle: string;
  toastPurchaseErrorMessage: (code: string) => string;
  toastRestoreUnsupported: ToastMessage;
  toastRestoreNotFound: ToastMessage;
  toastRestoreSuccess: ToastMessage;
  toastRestoreError: ToastMessage;

  liveSupportEmailSubject: string;
};

const FALLBACK_TRY: Record<PremiumPlanId, FallbackPrice> = {
  monthly: { priceLabel: "TRY 149,99", priceHint: "/ ay" },
  quarterly: { priceLabel: "TRY 382,49", priceHint: "TRY 127,49 / ay" },
  semiannual: { priceLabel: "TRY 629,99", priceHint: "TRY 105,00 / ay" },
  annual: { priceLabel: "TRY 899,99", priceHint: "TRY 75,00 / ay" },
};

const FALLBACK_GENERIC: (perMonth: string) => Record<PremiumPlanId, FallbackPrice> = (
  perMonth
) => ({
  monthly: { priceLabel: "TRY 149.99", priceHint: `/ ${perMonth}` },
  quarterly: { priceLabel: "TRY 382.49", priceHint: `TRY 127.49 / ${perMonth}` },
  semiannual: { priceLabel: "TRY 629.99", priceHint: `TRY 105.00 / ${perMonth}` },
  annual: { priceLabel: "TRY 899.99", priceHint: `TRY 75.00 / ${perMonth}` },
});

export const PREMIUM_LOCALES: Record<Language, PremiumLocale> = {
  tr: {
    features: [
      { icon: "fitness", title: "Beyin Hijyeni - 7 gunluk program", description: "Dopamin dongusunu onaran somut adimlar: yuruyus, soguk dus, derin nefes, ekran orucu." },
      { icon: "git-network", title: "Tetikleyici Haritasi", description: "Saat, mekan, duygu ve durtu nedenini birlikte haritalar; sana ozel bas etme onerileri." },
      { icon: "sparkles", title: "Tum farkindalik seanslari", description: "Sefkat, uyku oncesi sakinlesme ve premium seanslara tam erisim." },
      { icon: "chatbubbles", title: "Premium AI koclugu", description: "Daha uzun ve daha derin bas etme stratejileri; verine gore kisisel ipuclari." },
      { icon: "headset", title: "Oncelikli destek", description: "Premium kullanicilara ozel hizli yanit destek hatti." },
      { icon: "ban", title: "Reklamsiz, odakli deneyim", description: "Hic reklam yok; tek odak iyilesmen." },
    ],
    plans: {
      monthly: { title: "Aylik Premium", subtitle: "Esnek baslangic", monthsForHint: 1 },
      quarterly: { title: "3 Aylik Premium", subtitle: "90 gun odakli paket", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "6 Aylik Premium", subtitle: "Yari yillik koruma", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Yillik Premium", subtitle: "En iyi deger", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_TRY,
    perMonthSuffix: "/ ay",
    trustPoints: [
      "Ayni Apple ID ile geri yukleme desteklenir.",
      "Sunucu dogrulamasi ile guvenli aktivasyon.",
    ],
    autoRenewDisclosure:
      "Abonelik otomatik yenilenir. Yenileme tutari, mevcut donemin bitiminden 24 saat once Apple ID hesabinizdan tahsil edilir. Otomatik yenilemeyi durdurmak icin mevcut donem bitiminden en az 24 saat once iptal etmeniz gerekir. Aboneligi Apple ID ayarlarindan dilediginiz zaman yonetebilir veya iptal edebilirsiniz.",

    headerChipAccessibility: "Premium bolumu",
    heroTitle: "Premium Kontrol Merkezi",
    heroSubtitle: "Tum seanslari, AI ipuclarini, gelismis istatistikleri ve gelecek araclarini ac.",
    loadingAccessibility: "Premium durumu yukleniyor",
    statusLabel: "Durum",
    statusA11yPrefix: "Durum",
    featuresTitle: "Premium ile acilanlar",
    featuresMetaSuffix: "ozellik",
    plansTitle: "Bir plan sec",
    plansReadySubtitle: "Tum planlar diledigin zaman iptal edilebilir.",
    plansLoadingSubtitle: "Magaza fiyatlari yukleniyor...",
    plansFallbackSubtitle: "Magaza fiyatlarina ulasilamadi. Yaklasik fiyatlar gosteriliyor.",
    processingLabel: "Isleniyor...",
    buyLabel: "Satin Al",
    restorePurchasesLabel: "Satin Almalari Geri Yukle",
    securePurchaseTitle: "Guvenli satin alma",
    termsLabel: "Kullanim Kosullari",
    privacyLabel: "Gizlilik Politikasi",
    manageSubLabel: "Aboneligi Yonet",

    accessCodeTitle: "Erisim Kodu",
    accessCodeSubtitle: "Beta erisim kodunuz varsa girerek premium'u etkinlestirebilirsiniz.",
    accessCodePlaceholder: "Erisim kodu",
    accessCodeInputA11y: "Erisim kodu girisi",
    applyCodeLabel: "Kodu Kullan",

    liveSupportTitle: "Canli Destek",
    liveSupportActiveSubtitle: "Premium kullanicilarina ozel canli destek hatti.",
    liveSupportInactiveSubtitle: "Premium alarak canli destek ayricaligini ac.",
    liveSupportAction: "Canli Sohbete Basla",

    gamblingTitle: "Kumar Durtu Yonetimi",
    gamblingSubtitle: "DNS duzeyi engelleme, izin listesi ve test araclari.",
    gamblingManage: "Yonet",
    gamblingUnlock: "Premium ile ac",
    resetPremium: "Premium Sifirla",

    helpTitle: "Yardim",
    helpSubtitlePrefix: "Sorulariniz icin bize yazin",
    helpEmailAction: "E-posta Gonder",

    statusChecking: "Kontrol",
    statusCheckingValue: "Premium durumu yukleniyor...",
    statusOff: "Kapali",
    statusOffValue: "Premium erisimi kapali",
    statusOffHint: "Premium ile tum seanslari, AI ipuclarini ve gelecek araclarini ac.",
    statusActive: "Aktif",
    statusActiveValue: "Premium erisimi acik",
    statusActiveHint: "Erisim kodu veya abonelik ile etkin.",

    durationToday: "Bugun etkinlestirildi",
    durationOneDay: "1 gundur aktif",
    durationDays: (n) => `${n} gundur aktif`,

    toastRedeemNotConfigured: { title: "Hizmet Kullanilamiyor", message: "Erisim kodu dogrulamasi su anda yapilandirilmamis. Lutfen daha sonra tekrar deneyin." },
    toastRedeemNetwork: { title: "Baglanti Hatasi", message: "Sunucuya ulasilamadi. Internet baglantinizi kontrol edip tekrar deneyin." },
    toastRedeemInvalid: { title: "Gecersiz Kod", message: "Lutfen gecerli bir erisim kodu girin." },
    toastRedeemSuccess: { title: "Premium Aktif", message: "Erisim kodu dogrulandi." },
    toastRedeemError: { title: "Hata", message: "Islem tamamlanamadi. Lutfen biraz sonra tekrar deneyin." },
    toastPurchaseUnsupported: { title: "Magaza Baglantisi Yok", message: "Satin alma bu cihazda desteklenmiyor." },
    toastPurchaseNotReady: { title: "Magaza Hazir Degil", message: "Magaza urunleri henuz yuklenmedi. Birkac saniye sonra tekrar dene." },
    toastPurchaseSuccess: { title: "Tesekkurler", message: "Premium aboneligin aktif edildi." },
    toastPurchaseErrorTitle: "Satin Alma Hatasi",
    toastPurchaseErrorMessage: (code) => `Satin alma tamamlanamadi (${code}). Lutfen tekrar dene.`,
    toastRestoreUnsupported: { title: "Geri Yukleme", message: "Satin alma geri yukleme bu cihazda desteklenmiyor." },
    toastRestoreNotFound: { title: "Geri Yukleme", message: "Bu Apple ID icin aktif premium aboneligi bulunamadi." },
    toastRestoreSuccess: { title: "Geri Yuklendi", message: "Premium erisimin geri yuklendi." },
    toastRestoreError: { title: "Geri Yukleme Hatasi", message: "Geri yukleme basarisiz oldu. Lutfen tekrar dene." },

    liveSupportEmailSubject: "Premium Canli Destek",
  },

  en: {
    features: [
      { icon: "fitness", title: "Brain Hygiene - 7-day reset", description: "Concrete dopamine-reset steps: walking, cold shower, deep breathing, screen fast." },
      { icon: "git-network", title: "Trigger Map", description: "Maps your time, place, mood, and urge causes with personalized coping ideas." },
      { icon: "sparkles", title: "All mindfulness sessions", description: "Full access to compassion, bedtime calming, and premium session library." },
      { icon: "chatbubbles", title: "Premium AI coaching", description: "Longer, deeper coping strategies with tailored guidance from your patterns." },
      { icon: "headset", title: "Priority support", description: "Faster support lane dedicated to premium users." },
      { icon: "ban", title: "Ad-free focused experience", description: "No ads, just focus on your recovery." },
    ],
    plans: {
      monthly: { title: "Monthly Premium", subtitle: "Flexible start", monthsForHint: 1 },
      quarterly: { title: "3 Months Premium", subtitle: "90-day focused plan", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "6 Months Premium", subtitle: "Half-year protection", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Yearly Premium", subtitle: "Best value", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("month"),
    perMonthSuffix: "/ month",
    trustPoints: [
      "Restore is supported with the same Apple ID.",
      "Secure activation with server-side verification.",
    ],
    autoRenewDisclosure:
      "Subscription renews automatically. Renewal is charged to your Apple ID within 24 hours before the current period ends. To stop auto-renewal, cancel at least 24 hours before the period ends. You can manage or cancel anytime in your Apple ID settings.",

    headerChipAccessibility: "Premium section",
    heroTitle: "Premium Control Center",
    heroSubtitle: "Unlock all sessions, AI guidance, advanced stats, and upcoming tools.",
    loadingAccessibility: "Loading premium status",
    statusLabel: "Status",
    statusA11yPrefix: "Status",
    featuresTitle: "What premium unlocks",
    featuresMetaSuffix: "features",
    plansTitle: "Choose a plan",
    plansReadySubtitle: "All plans can be canceled anytime.",
    plansLoadingSubtitle: "Loading store prices...",
    plansFallbackSubtitle: "Store prices are unavailable. Showing estimated prices.",
    processingLabel: "Processing...",
    buyLabel: "Buy",
    restorePurchasesLabel: "Restore Purchases",
    securePurchaseTitle: "Secure purchase",
    termsLabel: "Terms of Use",
    privacyLabel: "Privacy Policy",
    manageSubLabel: "Manage Subscription",

    accessCodeTitle: "Access Code",
    accessCodeSubtitle: "If you have a beta access code, enter it to activate premium.",
    accessCodePlaceholder: "Access code",
    accessCodeInputA11y: "Access code input",
    applyCodeLabel: "Use Code",

    liveSupportTitle: "Live Support",
    liveSupportActiveSubtitle: "Dedicated live support line for premium users.",
    liveSupportInactiveSubtitle: "Upgrade to premium to unlock live support.",
    liveSupportAction: "Start Live Chat",

    gamblingTitle: "Gambling Urge Management",
    gamblingSubtitle: "DNS-level blocking, allowlist, and testing tools.",
    gamblingManage: "Manage",
    gamblingUnlock: "Unlock with Premium",
    resetPremium: "Reset Premium",

    helpTitle: "Help",
    helpSubtitlePrefix: "Write to us for questions",
    helpEmailAction: "Send Email",

    statusChecking: "Check",
    statusCheckingValue: "Loading premium status...",
    statusOff: "Off",
    statusOffValue: "Premium access is off",
    statusOffHint: "Unlock all sessions, AI guidance, and upcoming tools with premium.",
    statusActive: "Active",
    statusActiveValue: "Premium access is on",
    statusActiveHint: "Enabled via access code or subscription.",

    durationToday: "Activated today",
    durationOneDay: "Active for 1 day",
    durationDays: (n) => `Active for ${n} days`,

    toastRedeemNotConfigured: { title: "Service Unavailable", message: "Access code verification is not configured right now. Please try again later." },
    toastRedeemNetwork: { title: "Connection Error", message: "Could not reach the server. Check your connection and try again." },
    toastRedeemInvalid: { title: "Invalid Code", message: "Please enter a valid access code." },
    toastRedeemSuccess: { title: "Premium Active", message: "Access code verified." },
    toastRedeemError: { title: "Error", message: "The operation could not be completed. Please try again shortly." },
    toastPurchaseUnsupported: { title: "Store Unavailable", message: "Purchases are not supported on this device." },
    toastPurchaseNotReady: { title: "Store Not Ready", message: "Store products have not loaded yet. Try again in a few seconds." },
    toastPurchaseSuccess: { title: "Thank you", message: "Your premium subscription is now active." },
    toastPurchaseErrorTitle: "Purchase Error",
    toastPurchaseErrorMessage: (code) => `Purchase could not be completed (${code}). Please try again.`,
    toastRestoreUnsupported: { title: "Restore", message: "Purchase restore is not supported on this device." },
    toastRestoreNotFound: { title: "Restore", message: "No active premium subscription was found for this Apple ID." },
    toastRestoreSuccess: { title: "Restored", message: "Your premium access has been restored." },
    toastRestoreError: { title: "Restore Error", message: "Restore failed. Please try again." },

    liveSupportEmailSubject: "Premium Live Support",
  },

  de: {
    features: [
      { icon: "fitness", title: "Gehirnhygiene - 7-Tage-Reset", description: "Konkrete Dopamin-Reset-Schritte: Gehen, kalte Dusche, tiefes Atmen, Bildschirmpause." },
      { icon: "git-network", title: "Auslöser-Karte", description: "Bildet Zeit, Ort, Stimmung und Verlangensursachen mit persönlichen Bewältigungsideen ab." },
      { icon: "sparkles", title: "Alle Achtsamkeitssitzungen", description: "Voller Zugriff auf Mitgefühl, Einschlafhilfe und Premium-Sitzungsbibliothek." },
      { icon: "chatbubbles", title: "Premium-KI-Coaching", description: "Längere, tiefere Bewältigungsstrategien mit maßgeschneiderter Beratung." },
      { icon: "headset", title: "Vorrangiger Support", description: "Schnellere Support-Schiene für Premium-Nutzer." },
      { icon: "ban", title: "Werbefreies, fokussiertes Erlebnis", description: "Keine Werbung, nur Fokus auf deine Genesung." },
    ],
    plans: {
      monthly: { title: "Monats-Premium", subtitle: "Flexibler Start", monthsForHint: 1 },
      quarterly: { title: "3-Monats-Premium", subtitle: "90-Tage-Fokusplan", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "6-Monats-Premium", subtitle: "Halbjahres-Schutz", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Jahres-Premium", subtitle: "Bester Wert", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("Mon."),
    perMonthSuffix: "/ Mon.",
    trustPoints: [
      "Wiederherstellung mit derselben Apple-ID unterstützt.",
      "Sichere Aktivierung mit serverseitiger Prüfung.",
    ],
    autoRenewDisclosure:
      "Das Abonnement verlängert sich automatisch. Die Verlängerung wird innerhalb von 24 Stunden vor Ende des aktuellen Zeitraums von deiner Apple-ID abgebucht. Um die automatische Verlängerung zu stoppen, kündige mindestens 24 Stunden vor Ende des Zeitraums. Du kannst das Abo jederzeit in deinen Apple-ID-Einstellungen verwalten oder kündigen.",

    headerChipAccessibility: "Premium-Bereich",
    heroTitle: "Premium-Steuerzentrale",
    heroSubtitle: "Schalte alle Sitzungen, KI-Tipps, erweiterte Statistiken und kommende Tools frei.",
    loadingAccessibility: "Premium-Status wird geladen",
    statusLabel: "Status",
    statusA11yPrefix: "Status",
    featuresTitle: "Was Premium freischaltet",
    featuresMetaSuffix: "Funktionen",
    plansTitle: "Wähle einen Plan",
    plansReadySubtitle: "Alle Pläne können jederzeit gekündigt werden.",
    plansLoadingSubtitle: "Store-Preise werden geladen...",
    plansFallbackSubtitle: "Store-Preise nicht verfügbar. Schätzpreise angezeigt.",
    processingLabel: "Wird verarbeitet...",
    buyLabel: "Kaufen",
    restorePurchasesLabel: "Käufe wiederherstellen",
    securePurchaseTitle: "Sicherer Kauf",
    termsLabel: "Nutzungsbedingungen",
    privacyLabel: "Datenschutzerklärung",
    manageSubLabel: "Abo verwalten",

    accessCodeTitle: "Zugangscode",
    accessCodeSubtitle: "Wenn du einen Beta-Zugangscode hast, gib ihn ein, um Premium zu aktivieren.",
    accessCodePlaceholder: "Zugangscode",
    accessCodeInputA11y: "Zugangscode-Eingabe",
    applyCodeLabel: "Code einlösen",

    liveSupportTitle: "Live-Support",
    liveSupportActiveSubtitle: "Dedizierte Live-Support-Linie für Premium-Nutzer.",
    liveSupportInactiveSubtitle: "Upgrade auf Premium, um Live-Support freizuschalten.",
    liveSupportAction: "Live-Chat starten",

    gamblingTitle: "Spielsucht-Drang-Verwaltung",
    gamblingSubtitle: "DNS-Sperrung, Erlaubnisliste und Test-Tools.",
    gamblingManage: "Verwalten",
    gamblingUnlock: "Mit Premium freischalten",
    resetPremium: "Premium zurücksetzen",

    helpTitle: "Hilfe",
    helpSubtitlePrefix: "Schreib uns bei Fragen",
    helpEmailAction: "E-Mail senden",

    statusChecking: "Prüfung",
    statusCheckingValue: "Premium-Status wird geladen...",
    statusOff: "Aus",
    statusOffValue: "Premium-Zugang ist aus",
    statusOffHint: "Schalte mit Premium alle Sitzungen, KI-Tipps und kommende Tools frei.",
    statusActive: "Aktiv",
    statusActiveValue: "Premium-Zugang ist an",
    statusActiveHint: "Aktiviert per Zugangscode oder Abo.",

    durationToday: "Heute aktiviert",
    durationOneDay: "1 Tag aktiv",
    durationDays: (n) => `${n} Tage aktiv`,

    toastRedeemNotConfigured: { title: "Dienst nicht verfügbar", message: "Zugangscode-Prüfung ist derzeit nicht konfiguriert. Bitte versuche es später erneut." },
    toastRedeemNetwork: { title: "Verbindungsfehler", message: "Server nicht erreichbar. Prüfe deine Verbindung und versuche es erneut." },
    toastRedeemInvalid: { title: "Ungültiger Code", message: "Bitte gib einen gültigen Zugangscode ein." },
    toastRedeemSuccess: { title: "Premium aktiv", message: "Zugangscode bestätigt." },
    toastRedeemError: { title: "Fehler", message: "Vorgang konnte nicht abgeschlossen werden. Bitte versuche es gleich erneut." },
    toastPurchaseUnsupported: { title: "Store nicht verfügbar", message: "Käufe werden auf diesem Gerät nicht unterstützt." },
    toastPurchaseNotReady: { title: "Store nicht bereit", message: "Store-Produkte wurden noch nicht geladen. Versuche es in ein paar Sekunden erneut." },
    toastPurchaseSuccess: { title: "Danke", message: "Dein Premium-Abo ist jetzt aktiv." },
    toastPurchaseErrorTitle: "Kauf-Fehler",
    toastPurchaseErrorMessage: (code) => `Kauf konnte nicht abgeschlossen werden (${code}). Bitte versuche es erneut.`,
    toastRestoreUnsupported: { title: "Wiederherstellen", message: "Wiederherstellen wird auf diesem Gerät nicht unterstützt." },
    toastRestoreNotFound: { title: "Wiederherstellen", message: "Kein aktives Premium-Abo für diese Apple-ID gefunden." },
    toastRestoreSuccess: { title: "Wiederhergestellt", message: "Dein Premium-Zugang wurde wiederhergestellt." },
    toastRestoreError: { title: "Wiederherstellungs-Fehler", message: "Wiederherstellung fehlgeschlagen. Bitte versuche es erneut." },

    liveSupportEmailSubject: "Premium Live-Support",
  },

  fr: {
    features: [
      { icon: "fitness", title: "Hygiène cérébrale - réinitialisation 7 jours", description: "Étapes concrètes de remise à zéro de la dopamine : marche, douche froide, respiration, jeûne d'écran." },
      { icon: "git-network", title: "Carte des déclencheurs", description: "Cartographie heure, lieu, humeur et causes d'envie avec idées d'adaptation personnalisées." },
      { icon: "sparkles", title: "Toutes les séances de pleine conscience", description: "Accès complet à compassion, calme avant le coucher et bibliothèque premium." },
      { icon: "chatbubbles", title: "Coaching IA premium", description: "Stratégies d'adaptation plus longues et profondes, adaptées à tes schémas." },
      { icon: "headset", title: "Support prioritaire", description: "Voie de support plus rapide réservée aux utilisateurs premium." },
      { icon: "ban", title: "Expérience sans pub", description: "Aucune publicité, juste le focus sur ta guérison." },
    ],
    plans: {
      monthly: { title: "Premium Mensuel", subtitle: "Démarrage flexible", monthsForHint: 1 },
      quarterly: { title: "Premium 3 Mois", subtitle: "Plan 90 jours focalisé", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "Premium 6 Mois", subtitle: "Protection semestrielle", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Premium Annuel", subtitle: "Meilleure valeur", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("mois"),
    perMonthSuffix: "/ mois",
    trustPoints: [
      "Restauration prise en charge avec le même Apple ID.",
      "Activation sécurisée avec vérification côté serveur.",
    ],
    autoRenewDisclosure:
      "L'abonnement se renouvelle automatiquement. Le renouvellement est facturé à ton Apple ID dans les 24 heures précédant la fin de la période en cours. Pour arrêter le renouvellement automatique, annule au moins 24 heures avant la fin de la période. Tu peux gérer ou annuler à tout moment dans les paramètres de ton Apple ID.",

    headerChipAccessibility: "Section premium",
    heroTitle: "Centre de Contrôle Premium",
    heroSubtitle: "Débloque toutes les séances, conseils IA, statistiques avancées et outils à venir.",
    loadingAccessibility: "Chargement du statut premium",
    statusLabel: "Statut",
    statusA11yPrefix: "Statut",
    featuresTitle: "Ce que premium débloque",
    featuresMetaSuffix: "fonctionnalités",
    plansTitle: "Choisis un plan",
    plansReadySubtitle: "Tous les plans peuvent être annulés à tout moment.",
    plansLoadingSubtitle: "Chargement des prix du store...",
    plansFallbackSubtitle: "Prix du store indisponibles. Prix estimés affichés.",
    processingLabel: "Traitement...",
    buyLabel: "Acheter",
    restorePurchasesLabel: "Restaurer les achats",
    securePurchaseTitle: "Achat sécurisé",
    termsLabel: "Conditions d'utilisation",
    privacyLabel: "Politique de confidentialité",
    manageSubLabel: "Gérer l'abonnement",

    accessCodeTitle: "Code d'accès",
    accessCodeSubtitle: "Si tu as un code d'accès bêta, saisis-le pour activer premium.",
    accessCodePlaceholder: "Code d'accès",
    accessCodeInputA11y: "Saisie du code d'accès",
    applyCodeLabel: "Utiliser le code",

    liveSupportTitle: "Support en Direct",
    liveSupportActiveSubtitle: "Ligne de support en direct dédiée aux utilisateurs premium.",
    liveSupportInactiveSubtitle: "Passe à premium pour débloquer le support en direct.",
    liveSupportAction: "Démarrer le chat",

    gamblingTitle: "Gestion des envies de jeu",
    gamblingSubtitle: "Blocage au niveau DNS, liste autorisée et outils de test.",
    gamblingManage: "Gérer",
    gamblingUnlock: "Débloquer avec Premium",
    resetPremium: "Réinitialiser Premium",

    helpTitle: "Aide",
    helpSubtitlePrefix: "Écris-nous pour toute question",
    helpEmailAction: "Envoyer un e-mail",

    statusChecking: "Vérif.",
    statusCheckingValue: "Chargement du statut premium...",
    statusOff: "Désactivé",
    statusOffValue: "L'accès premium est désactivé",
    statusOffHint: "Débloque toutes les séances, conseils IA et outils à venir avec premium.",
    statusActive: "Actif",
    statusActiveValue: "L'accès premium est activé",
    statusActiveHint: "Activé via code d'accès ou abonnement.",

    durationToday: "Activé aujourd'hui",
    durationOneDay: "Actif depuis 1 jour",
    durationDays: (n) => `Actif depuis ${n} jours`,

    toastRedeemNotConfigured: { title: "Service indisponible", message: "La vérification des codes d'accès n'est pas configurée. Réessaie plus tard." },
    toastRedeemNetwork: { title: "Erreur de connexion", message: "Impossible de joindre le serveur. Vérifie ta connexion et réessaie." },
    toastRedeemInvalid: { title: "Code invalide", message: "Saisis un code d'accès valide." },
    toastRedeemSuccess: { title: "Premium actif", message: "Code d'accès vérifié." },
    toastRedeemError: { title: "Erreur", message: "L'opération n'a pas pu aboutir. Réessaie sous peu." },
    toastPurchaseUnsupported: { title: "Store indisponible", message: "Les achats ne sont pas pris en charge sur cet appareil." },
    toastPurchaseNotReady: { title: "Store non prêt", message: "Les produits du store ne sont pas encore chargés. Réessaie dans quelques secondes." },
    toastPurchaseSuccess: { title: "Merci", message: "Ton abonnement premium est désormais actif." },
    toastPurchaseErrorTitle: "Erreur d'achat",
    toastPurchaseErrorMessage: (code) => `L'achat n'a pas pu aboutir (${code}). Réessaie.`,
    toastRestoreUnsupported: { title: "Restauration", message: "La restauration n'est pas prise en charge sur cet appareil." },
    toastRestoreNotFound: { title: "Restauration", message: "Aucun abonnement premium actif trouvé pour cet Apple ID." },
    toastRestoreSuccess: { title: "Restauré", message: "Ton accès premium a été restauré." },
    toastRestoreError: { title: "Erreur de restauration", message: "La restauration a échoué. Réessaie." },

    liveSupportEmailSubject: "Support en Direct Premium",
  },

  es: {
    features: [
      { icon: "fitness", title: "Higiene cerebral - reinicio 7 días", description: "Pasos concretos para reiniciar la dopamina: caminar, ducha fría, respiración, ayuno de pantalla." },
      { icon: "git-network", title: "Mapa de desencadenantes", description: "Mapea hora, lugar, ánimo y causas del impulso con ideas de afrontamiento personalizadas." },
      { icon: "sparkles", title: "Todas las sesiones de mindfulness", description: "Acceso completo a compasión, calma antes de dormir y biblioteca premium." },
      { icon: "chatbubbles", title: "Coaching IA premium", description: "Estrategias de afrontamiento más largas y profundas según tus patrones." },
      { icon: "headset", title: "Soporte prioritario", description: "Vía de soporte más rápida para usuarios premium." },
      { icon: "ban", title: "Experiencia sin anuncios", description: "Sin anuncios, solo enfoque en tu recuperación." },
    ],
    plans: {
      monthly: { title: "Premium Mensual", subtitle: "Inicio flexible", monthsForHint: 1 },
      quarterly: { title: "Premium 3 meses", subtitle: "Plan enfocado de 90 días", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "Premium 6 meses", subtitle: "Protección semestral", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Premium Anual", subtitle: "Mejor valor", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("mes"),
    perMonthSuffix: "/ mes",
    trustPoints: [
      "Restauración compatible con el mismo Apple ID.",
      "Activación segura con verificación del servidor.",
    ],
    autoRenewDisclosure:
      "La suscripción se renueva automáticamente. La renovación se cobra a tu Apple ID en las 24 horas previas al final del período actual. Para detener la renovación automática, cancela al menos 24 horas antes del fin del período. Puedes gestionar o cancelar en cualquier momento desde los ajustes de tu Apple ID.",

    headerChipAccessibility: "Sección premium",
    heroTitle: "Centro de Control Premium",
    heroSubtitle: "Desbloquea todas las sesiones, consejos IA, estadísticas avanzadas y herramientas futuras.",
    loadingAccessibility: "Cargando estado premium",
    statusLabel: "Estado",
    statusA11yPrefix: "Estado",
    featuresTitle: "Lo que desbloquea premium",
    featuresMetaSuffix: "funciones",
    plansTitle: "Elige un plan",
    plansReadySubtitle: "Todos los planes se pueden cancelar en cualquier momento.",
    plansLoadingSubtitle: "Cargando precios de la tienda...",
    plansFallbackSubtitle: "Precios de la tienda no disponibles. Mostrando precios estimados.",
    processingLabel: "Procesando...",
    buyLabel: "Comprar",
    restorePurchasesLabel: "Restaurar compras",
    securePurchaseTitle: "Compra segura",
    termsLabel: "Términos de uso",
    privacyLabel: "Política de privacidad",
    manageSubLabel: "Gestionar suscripción",

    accessCodeTitle: "Código de acceso",
    accessCodeSubtitle: "Si tienes un código de acceso beta, introdúcelo para activar premium.",
    accessCodePlaceholder: "Código de acceso",
    accessCodeInputA11y: "Entrada de código de acceso",
    applyCodeLabel: "Usar código",

    liveSupportTitle: "Soporte en Vivo",
    liveSupportActiveSubtitle: "Línea de soporte en vivo dedicada a usuarios premium.",
    liveSupportInactiveSubtitle: "Actualiza a premium para desbloquear el soporte en vivo.",
    liveSupportAction: "Iniciar chat en vivo",

    gamblingTitle: "Gestión de impulsos de juego",
    gamblingSubtitle: "Bloqueo a nivel DNS, lista permitida y herramientas de prueba.",
    gamblingManage: "Gestionar",
    gamblingUnlock: "Desbloquear con Premium",
    resetPremium: "Restablecer Premium",

    helpTitle: "Ayuda",
    helpSubtitlePrefix: "Escríbenos para cualquier pregunta",
    helpEmailAction: "Enviar correo",

    statusChecking: "Verif.",
    statusCheckingValue: "Cargando estado premium...",
    statusOff: "Desactivado",
    statusOffValue: "Acceso premium desactivado",
    statusOffHint: "Desbloquea todas las sesiones, consejos IA y herramientas futuras con premium.",
    statusActive: "Activo",
    statusActiveValue: "Acceso premium activo",
    statusActiveHint: "Habilitado mediante código de acceso o suscripción.",

    durationToday: "Activado hoy",
    durationOneDay: "Activo desde hace 1 día",
    durationDays: (n) => `Activo desde hace ${n} días`,

    toastRedeemNotConfigured: { title: "Servicio no disponible", message: "La verificación de códigos no está configurada. Inténtalo más tarde." },
    toastRedeemNetwork: { title: "Error de conexión", message: "No se pudo contactar al servidor. Comprueba tu conexión e inténtalo de nuevo." },
    toastRedeemInvalid: { title: "Código no válido", message: "Introduce un código de acceso válido." },
    toastRedeemSuccess: { title: "Premium activo", message: "Código de acceso verificado." },
    toastRedeemError: { title: "Error", message: "No se pudo completar la operación. Inténtalo en breve." },
    toastPurchaseUnsupported: { title: "Tienda no disponible", message: "Las compras no son compatibles con este dispositivo." },
    toastPurchaseNotReady: { title: "Tienda no lista", message: "Los productos no se han cargado. Vuelve a intentarlo en unos segundos." },
    toastPurchaseSuccess: { title: "Gracias", message: "Tu suscripción premium está activa." },
    toastPurchaseErrorTitle: "Error de compra",
    toastPurchaseErrorMessage: (code) => `No se pudo completar la compra (${code}). Inténtalo de nuevo.`,
    toastRestoreUnsupported: { title: "Restaurar", message: "Restaurar compras no es compatible con este dispositivo." },
    toastRestoreNotFound: { title: "Restaurar", message: "No se encontró ninguna suscripción premium activa para este Apple ID." },
    toastRestoreSuccess: { title: "Restaurado", message: "Tu acceso premium ha sido restaurado." },
    toastRestoreError: { title: "Error al restaurar", message: "Error al restaurar. Inténtalo de nuevo." },

    liveSupportEmailSubject: "Soporte en Vivo Premium",
  },

  it: {
    features: [
      { icon: "fitness", title: "Igiene cerebrale - reset di 7 giorni", description: "Passi concreti per resettare la dopamina: camminata, doccia fredda, respirazione, digiuno da schermo." },
      { icon: "git-network", title: "Mappa dei trigger", description: "Mappa ora, luogo, umore e cause dell'impulso con idee personalizzate." },
      { icon: "sparkles", title: "Tutte le sessioni di mindfulness", description: "Accesso completo a compassione, calma serale e libreria premium." },
      { icon: "chatbubbles", title: "Coaching IA premium", description: "Strategie più lunghe e profonde personalizzate sui tuoi pattern." },
      { icon: "headset", title: "Supporto prioritario", description: "Corsia di supporto più veloce per utenti premium." },
      { icon: "ban", title: "Esperienza senza pubblicità", description: "Nessuna pubblicità, solo focus sul tuo recupero." },
    ],
    plans: {
      monthly: { title: "Premium Mensile", subtitle: "Inizio flessibile", monthsForHint: 1 },
      quarterly: { title: "Premium 3 mesi", subtitle: "Piano focalizzato di 90 giorni", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "Premium 6 mesi", subtitle: "Protezione semestrale", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Premium Annuale", subtitle: "Miglior valore", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("mese"),
    perMonthSuffix: "/ mese",
    trustPoints: [
      "Ripristino supportato con lo stesso Apple ID.",
      "Attivazione sicura con verifica lato server.",
    ],
    autoRenewDisclosure:
      "L'abbonamento si rinnova automaticamente. Il rinnovo viene addebitato sul tuo Apple ID entro 24 ore prima della fine del periodo corrente. Per fermare il rinnovo automatico, annulla almeno 24 ore prima della fine del periodo. Puoi gestire o annullare in qualsiasi momento dalle impostazioni del tuo Apple ID.",

    headerChipAccessibility: "Sezione premium",
    heroTitle: "Centro di Controllo Premium",
    heroSubtitle: "Sblocca tutte le sessioni, suggerimenti IA, statistiche avanzate e strumenti futuri.",
    loadingAccessibility: "Caricamento stato premium",
    statusLabel: "Stato",
    statusA11yPrefix: "Stato",
    featuresTitle: "Cosa sblocca premium",
    featuresMetaSuffix: "funzioni",
    plansTitle: "Scegli un piano",
    plansReadySubtitle: "Tutti i piani possono essere annullati in qualsiasi momento.",
    plansLoadingSubtitle: "Caricamento prezzi negozio...",
    plansFallbackSubtitle: "Prezzi del negozio non disponibili. Prezzi stimati mostrati.",
    processingLabel: "Elaborazione...",
    buyLabel: "Acquista",
    restorePurchasesLabel: "Ripristina acquisti",
    securePurchaseTitle: "Acquisto sicuro",
    termsLabel: "Termini di utilizzo",
    privacyLabel: "Informativa sulla privacy",
    manageSubLabel: "Gestisci abbonamento",

    accessCodeTitle: "Codice di accesso",
    accessCodeSubtitle: "Se hai un codice di accesso beta, inseriscilo per attivare premium.",
    accessCodePlaceholder: "Codice di accesso",
    accessCodeInputA11y: "Inserimento codice di accesso",
    applyCodeLabel: "Usa codice",

    liveSupportTitle: "Supporto Live",
    liveSupportActiveSubtitle: "Linea di supporto live dedicata agli utenti premium.",
    liveSupportInactiveSubtitle: "Passa a premium per sbloccare il supporto live.",
    liveSupportAction: "Avvia chat live",

    gamblingTitle: "Gestione impulsi di gioco",
    gamblingSubtitle: "Blocco a livello DNS, lista consentita e strumenti di test.",
    gamblingManage: "Gestisci",
    gamblingUnlock: "Sblocca con Premium",
    resetPremium: "Reimposta Premium",

    helpTitle: "Aiuto",
    helpSubtitlePrefix: "Scrivici per domande",
    helpEmailAction: "Invia email",

    statusChecking: "Verifica",
    statusCheckingValue: "Caricamento stato premium...",
    statusOff: "Disattivato",
    statusOffValue: "Accesso premium disattivato",
    statusOffHint: "Sblocca tutte le sessioni, suggerimenti IA e strumenti futuri con premium.",
    statusActive: "Attivo",
    statusActiveValue: "Accesso premium attivo",
    statusActiveHint: "Abilitato tramite codice di accesso o abbonamento.",

    durationToday: "Attivato oggi",
    durationOneDay: "Attivo da 1 giorno",
    durationDays: (n) => `Attivo da ${n} giorni`,

    toastRedeemNotConfigured: { title: "Servizio non disponibile", message: "La verifica del codice non è configurata. Riprova più tardi." },
    toastRedeemNetwork: { title: "Errore di connessione", message: "Impossibile raggiungere il server. Controlla la connessione e riprova." },
    toastRedeemInvalid: { title: "Codice non valido", message: "Inserisci un codice di accesso valido." },
    toastRedeemSuccess: { title: "Premium attivo", message: "Codice di accesso verificato." },
    toastRedeemError: { title: "Errore", message: "Operazione non completata. Riprova a breve." },
    toastPurchaseUnsupported: { title: "Negozio non disponibile", message: "Gli acquisti non sono supportati su questo dispositivo." },
    toastPurchaseNotReady: { title: "Negozio non pronto", message: "I prodotti non sono ancora caricati. Riprova tra qualche secondo." },
    toastPurchaseSuccess: { title: "Grazie", message: "Il tuo abbonamento premium è attivo." },
    toastPurchaseErrorTitle: "Errore acquisto",
    toastPurchaseErrorMessage: (code) => `Acquisto non completato (${code}). Riprova.`,
    toastRestoreUnsupported: { title: "Ripristina", message: "Ripristino acquisti non supportato su questo dispositivo." },
    toastRestoreNotFound: { title: "Ripristina", message: "Nessun abbonamento premium attivo trovato per questo Apple ID." },
    toastRestoreSuccess: { title: "Ripristinato", message: "Il tuo accesso premium è stato ripristinato." },
    toastRestoreError: { title: "Errore ripristino", message: "Ripristino fallito. Riprova." },

    liveSupportEmailSubject: "Supporto Live Premium",
  },

  pt: {
    features: [
      { icon: "fitness", title: "Higiene cerebral - reset de 7 dias", description: "Passos concretos para resetar a dopamina: caminhada, duche frio, respiração, jejum de ecrã." },
      { icon: "git-network", title: "Mapa de gatilhos", description: "Mapeia hora, local, humor e causas do impulso com ideias personalizadas." },
      { icon: "sparkles", title: "Todas as sessões de mindfulness", description: "Acesso total a compaixão, acalmar antes de dormir e biblioteca premium." },
      { icon: "chatbubbles", title: "Coaching IA premium", description: "Estratégias mais longas e profundas, adaptadas aos teus padrões." },
      { icon: "headset", title: "Suporte prioritário", description: "Linha de suporte mais rápida para utilizadores premium." },
      { icon: "ban", title: "Experiência sem anúncios", description: "Sem anúncios, só foco na tua recuperação." },
    ],
    plans: {
      monthly: { title: "Premium Mensal", subtitle: "Início flexível", monthsForHint: 1 },
      quarterly: { title: "Premium 3 Meses", subtitle: "Plano focado de 90 dias", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "Premium 6 Meses", subtitle: "Proteção semestral", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Premium Anual", subtitle: "Melhor valor", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("mês"),
    perMonthSuffix: "/ mês",
    trustPoints: [
      "Restauro suportado com o mesmo Apple ID.",
      "Ativação segura com verificação do servidor.",
    ],
    autoRenewDisclosure:
      "A subscrição renova-se automaticamente. A renovação é cobrada ao teu Apple ID nas 24 horas antes do fim do período atual. Para parar a renovação automática, cancela pelo menos 24 horas antes do fim do período. Podes gerir ou cancelar a qualquer momento nas definições do teu Apple ID.",

    headerChipAccessibility: "Secção premium",
    heroTitle: "Centro de Controlo Premium",
    heroSubtitle: "Desbloqueia todas as sessões, dicas IA, estatísticas avançadas e ferramentas futuras.",
    loadingAccessibility: "A carregar estado premium",
    statusLabel: "Estado",
    statusA11yPrefix: "Estado",
    featuresTitle: "O que o premium desbloqueia",
    featuresMetaSuffix: "funcionalidades",
    plansTitle: "Escolhe um plano",
    plansReadySubtitle: "Todos os planos podem ser cancelados a qualquer momento.",
    plansLoadingSubtitle: "A carregar preços da loja...",
    plansFallbackSubtitle: "Preços da loja indisponíveis. A mostrar preços estimados.",
    processingLabel: "A processar...",
    buyLabel: "Comprar",
    restorePurchasesLabel: "Restaurar compras",
    securePurchaseTitle: "Compra segura",
    termsLabel: "Termos de utilização",
    privacyLabel: "Política de privacidade",
    manageSubLabel: "Gerir subscrição",

    accessCodeTitle: "Código de acesso",
    accessCodeSubtitle: "Se tens um código de acesso beta, introduz para ativar premium.",
    accessCodePlaceholder: "Código de acesso",
    accessCodeInputA11y: "Entrada de código de acesso",
    applyCodeLabel: "Usar código",

    liveSupportTitle: "Suporte ao Vivo",
    liveSupportActiveSubtitle: "Linha de suporte ao vivo dedicada a utilizadores premium.",
    liveSupportInactiveSubtitle: "Passa a premium para desbloquear o suporte ao vivo.",
    liveSupportAction: "Iniciar chat ao vivo",

    gamblingTitle: "Gestão de impulsos de jogo",
    gamblingSubtitle: "Bloqueio ao nível DNS, lista permitida e ferramentas de teste.",
    gamblingManage: "Gerir",
    gamblingUnlock: "Desbloquear com Premium",
    resetPremium: "Repor Premium",

    helpTitle: "Ajuda",
    helpSubtitlePrefix: "Escreve-nos para perguntas",
    helpEmailAction: "Enviar e-mail",

    statusChecking: "Verif.",
    statusCheckingValue: "A carregar estado premium...",
    statusOff: "Desativado",
    statusOffValue: "Acesso premium desativado",
    statusOffHint: "Desbloqueia todas as sessões, dicas IA e ferramentas futuras com premium.",
    statusActive: "Ativo",
    statusActiveValue: "Acesso premium ativo",
    statusActiveHint: "Ativado por código de acesso ou subscrição.",

    durationToday: "Ativado hoje",
    durationOneDay: "Ativo há 1 dia",
    durationDays: (n) => `Ativo há ${n} dias`,

    toastRedeemNotConfigured: { title: "Serviço indisponível", message: "Verificação de códigos não configurada. Tenta mais tarde." },
    toastRedeemNetwork: { title: "Erro de ligação", message: "Não foi possível alcançar o servidor. Verifica a ligação e tenta de novo." },
    toastRedeemInvalid: { title: "Código inválido", message: "Introduz um código de acesso válido." },
    toastRedeemSuccess: { title: "Premium ativo", message: "Código de acesso verificado." },
    toastRedeemError: { title: "Erro", message: "Operação não concluída. Tenta novamente em breve." },
    toastPurchaseUnsupported: { title: "Loja indisponível", message: "Compras não suportadas neste dispositivo." },
    toastPurchaseNotReady: { title: "Loja não pronta", message: "Produtos da loja ainda não carregaram. Tenta dentro de alguns segundos." },
    toastPurchaseSuccess: { title: "Obrigado", message: "A tua subscrição premium está ativa." },
    toastPurchaseErrorTitle: "Erro na compra",
    toastPurchaseErrorMessage: (code) => `Compra não concluída (${code}). Tenta novamente.`,
    toastRestoreUnsupported: { title: "Restaurar", message: "Restauro não suportado neste dispositivo." },
    toastRestoreNotFound: { title: "Restaurar", message: "Não foi encontrada subscrição premium ativa para este Apple ID." },
    toastRestoreSuccess: { title: "Restaurado", message: "O teu acesso premium foi restaurado." },
    toastRestoreError: { title: "Erro de restauro", message: "Falha ao restaurar. Tenta novamente." },

    liveSupportEmailSubject: "Suporte ao Vivo Premium",
  },

  ar: {
    features: [
      { icon: "fitness", title: "نظافة الدماغ - برنامج 7 أيام", description: "خطوات ملموسة لإعادة ضبط الدوبامين: المشي، الدوش البارد، التنفس العميق، صيام الشاشة." },
      { icon: "git-network", title: "خريطة المحفزات", description: "ترسم الوقت والمكان والمزاج وأسباب الرغبة مع أفكار تأقلم مخصصة." },
      { icon: "sparkles", title: "كل جلسات اليقظة", description: "وصول كامل إلى التعاطف، التهدئة قبل النوم ومكتبة بريميوم." },
      { icon: "chatbubbles", title: "تدريب ذكاء اصطناعي بريميوم", description: "استراتيجيات تأقلم أطول وأعمق، مخصصة لأنماطك." },
      { icon: "headset", title: "دعم ذو أولوية", description: "مسار دعم أسرع مخصص لمستخدمي بريميوم." },
      { icon: "ban", title: "تجربة بدون إعلانات", description: "بدون إعلانات، فقط تركيز على تعافيك." },
    ],
    plans: {
      monthly: { title: "بريميوم شهري", subtitle: "بداية مرنة", monthsForHint: 1 },
      quarterly: { title: "بريميوم 3 أشهر", subtitle: "خطة مركزة 90 يومًا", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "بريميوم 6 أشهر", subtitle: "حماية نصف سنوية", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "بريميوم سنوي", subtitle: "أفضل قيمة", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("شهر"),
    perMonthSuffix: "/ شهر",
    trustPoints: [
      "الاستعادة مدعومة بنفس Apple ID.",
      "تفعيل آمن مع تحقق من الخادم.",
    ],
    autoRenewDisclosure:
      "يتجدد الاشتراك تلقائيًا. يتم تحصيل التجديد من حساب Apple ID خلال 24 ساعة قبل نهاية الفترة الحالية. لإيقاف التجديد التلقائي، قم بالإلغاء قبل 24 ساعة على الأقل من نهاية الفترة. يمكنك الإدارة أو الإلغاء في أي وقت من إعدادات Apple ID.",

    headerChipAccessibility: "قسم بريميوم",
    heroTitle: "مركز تحكم بريميوم",
    heroSubtitle: "افتح جميع الجلسات والإرشادات الذكية والإحصائيات المتقدمة والأدوات القادمة.",
    loadingAccessibility: "جارٍ تحميل حالة بريميوم",
    statusLabel: "الحالة",
    statusA11yPrefix: "الحالة",
    featuresTitle: "ما يفتحه بريميوم",
    featuresMetaSuffix: "ميزات",
    plansTitle: "اختر خطة",
    plansReadySubtitle: "يمكن إلغاء جميع الخطط في أي وقت.",
    plansLoadingSubtitle: "جارٍ تحميل أسعار المتجر...",
    plansFallbackSubtitle: "أسعار المتجر غير متوفرة. يتم عرض أسعار تقديرية.",
    processingLabel: "جارٍ المعالجة...",
    buyLabel: "شراء",
    restorePurchasesLabel: "استعادة المشتريات",
    securePurchaseTitle: "شراء آمن",
    termsLabel: "شروط الاستخدام",
    privacyLabel: "سياسة الخصوصية",
    manageSubLabel: "إدارة الاشتراك",

    accessCodeTitle: "رمز الوصول",
    accessCodeSubtitle: "إذا كان لديك رمز وصول تجريبي، أدخله لتفعيل بريميوم.",
    accessCodePlaceholder: "رمز الوصول",
    accessCodeInputA11y: "إدخال رمز الوصول",
    applyCodeLabel: "استخدم الرمز",

    liveSupportTitle: "الدعم المباشر",
    liveSupportActiveSubtitle: "خط دعم مباشر مخصص لمستخدمي بريميوم.",
    liveSupportInactiveSubtitle: "ترقية إلى بريميوم لفتح الدعم المباشر.",
    liveSupportAction: "بدء الدردشة المباشرة",

    gamblingTitle: "إدارة الرغبة في القمار",
    gamblingSubtitle: "حظر على مستوى DNS، قائمة سماح وأدوات اختبار.",
    gamblingManage: "إدارة",
    gamblingUnlock: "افتح ببريميوم",
    resetPremium: "إعادة تعيين بريميوم",

    helpTitle: "المساعدة",
    helpSubtitlePrefix: "اكتب إلينا للأسئلة",
    helpEmailAction: "إرسال بريد إلكتروني",

    statusChecking: "فحص",
    statusCheckingValue: "جارٍ تحميل حالة بريميوم...",
    statusOff: "موقوف",
    statusOffValue: "وصول بريميوم موقوف",
    statusOffHint: "افتح جميع الجلسات والإرشادات الذكية والأدوات القادمة ببريميوم.",
    statusActive: "نشط",
    statusActiveValue: "وصول بريميوم نشط",
    statusActiveHint: "مفعل برمز الوصول أو الاشتراك.",

    durationToday: "تم التفعيل اليوم",
    durationOneDay: "نشط منذ يوم",
    durationDays: (n) => `نشط منذ ${n} يومًا`,

    toastRedeemNotConfigured: { title: "الخدمة غير متوفرة", message: "التحقق من رموز الوصول غير مهيأ. حاول لاحقًا." },
    toastRedeemNetwork: { title: "خطأ في الاتصال", message: "تعذر الوصول إلى الخادم. تحقق من اتصالك وحاول مرة أخرى." },
    toastRedeemInvalid: { title: "رمز غير صالح", message: "أدخل رمز وصول صالح." },
    toastRedeemSuccess: { title: "بريميوم مفعل", message: "تم التحقق من رمز الوصول." },
    toastRedeemError: { title: "خطأ", message: "تعذر إكمال العملية. حاول مرة أخرى قريبًا." },
    toastPurchaseUnsupported: { title: "المتجر غير متوفر", message: "المشتريات غير مدعومة على هذا الجهاز." },
    toastPurchaseNotReady: { title: "المتجر غير جاهز", message: "لم يتم تحميل منتجات المتجر بعد. حاول بعد ثوانٍ." },
    toastPurchaseSuccess: { title: "شكرًا", message: "اشتراكك في بريميوم نشط الآن." },
    toastPurchaseErrorTitle: "خطأ في الشراء",
    toastPurchaseErrorMessage: (code) => `تعذر إكمال الشراء (${code}). حاول مرة أخرى.`,
    toastRestoreUnsupported: { title: "استعادة", message: "الاستعادة غير مدعومة على هذا الجهاز." },
    toastRestoreNotFound: { title: "استعادة", message: "لم يتم العثور على اشتراك بريميوم نشط لـ Apple ID هذا." },
    toastRestoreSuccess: { title: "تمت الاستعادة", message: "تم استعادة وصول بريميوم." },
    toastRestoreError: { title: "خطأ في الاستعادة", message: "فشلت الاستعادة. حاول مرة أخرى." },

    liveSupportEmailSubject: "دعم بريميوم المباشر",
  },

  ru: {
    features: [
      { icon: "fitness", title: "Гигиена мозга - 7-дневная программа", description: "Конкретные шаги перезагрузки дофамина: ходьба, холодный душ, дыхание, цифровой пост." },
      { icon: "git-network", title: "Карта триггеров", description: "Сопоставляет время, место, настроение и причины желания с персональными идеями." },
      { icon: "sparkles", title: "Все сессии осознанности", description: "Полный доступ к состраданию, успокоению перед сном и премиум-библиотеке." },
      { icon: "chatbubbles", title: "Премиум ИИ-коучинг", description: "Более длинные и глубокие стратегии, адаптированные под твои паттерны." },
      { icon: "headset", title: "Приоритетная поддержка", description: "Более быстрая линия поддержки для премиум-пользователей." },
      { icon: "ban", title: "Без рекламы", description: "Никакой рекламы, только фокус на твоё восстановление." },
    ],
    plans: {
      monthly: { title: "Премиум Месяц", subtitle: "Гибкий старт", monthsForHint: 1 },
      quarterly: { title: "Премиум 3 месяца", subtitle: "90-дневный сфокусированный план", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "Премиум 6 месяцев", subtitle: "Полугодовая защита", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Премиум Год", subtitle: "Лучшее предложение", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("мес."),
    perMonthSuffix: "/ мес.",
    trustPoints: [
      "Восстановление поддерживается с тем же Apple ID.",
      "Безопасная активация с серверной проверкой.",
    ],
    autoRenewDisclosure:
      "Подписка продлевается автоматически. Продление списывается с твоего Apple ID в течение 24 часов до окончания текущего периода. Чтобы остановить автопродление, отмени минимум за 24 часа до окончания периода. Управлять или отменять можно в любой момент в настройках Apple ID.",

    headerChipAccessibility: "Раздел премиум",
    heroTitle: "Центр Управления Премиум",
    heroSubtitle: "Открой все сессии, ИИ-советы, расширенную статистику и будущие инструменты.",
    loadingAccessibility: "Загрузка статуса премиум",
    statusLabel: "Статус",
    statusA11yPrefix: "Статус",
    featuresTitle: "Что открывает премиум",
    featuresMetaSuffix: "функций",
    plansTitle: "Выбери план",
    plansReadySubtitle: "Все планы можно отменить в любой момент.",
    plansLoadingSubtitle: "Загрузка цен магазина...",
    plansFallbackSubtitle: "Цены магазина недоступны. Показаны примерные цены.",
    processingLabel: "Обработка...",
    buyLabel: "Купить",
    restorePurchasesLabel: "Восстановить покупки",
    securePurchaseTitle: "Безопасная покупка",
    termsLabel: "Условия использования",
    privacyLabel: "Политика конфиденциальности",
    manageSubLabel: "Управление подпиской",

    accessCodeTitle: "Код доступа",
    accessCodeSubtitle: "Если у тебя есть бета-код, введи его, чтобы активировать премиум.",
    accessCodePlaceholder: "Код доступа",
    accessCodeInputA11y: "Ввод кода доступа",
    applyCodeLabel: "Применить код",

    liveSupportTitle: "Поддержка в реальном времени",
    liveSupportActiveSubtitle: "Выделенная линия поддержки для премиум-пользователей.",
    liveSupportInactiveSubtitle: "Подключи премиум, чтобы открыть поддержку в реальном времени.",
    liveSupportAction: "Начать чат",

    gamblingTitle: "Управление желанием игры",
    gamblingSubtitle: "Блокировка на уровне DNS, белый список и тестовые инструменты.",
    gamblingManage: "Управлять",
    gamblingUnlock: "Открыть с премиум",
    resetPremium: "Сбросить премиум",

    helpTitle: "Помощь",
    helpSubtitlePrefix: "Напиши нам по любым вопросам",
    helpEmailAction: "Отправить письмо",

    statusChecking: "Проверка",
    statusCheckingValue: "Загрузка статуса премиум...",
    statusOff: "Выкл.",
    statusOffValue: "Премиум-доступ отключён",
    statusOffHint: "Открой все сессии, ИИ-советы и будущие инструменты с премиум.",
    statusActive: "Активен",
    statusActiveValue: "Премиум-доступ включён",
    statusActiveHint: "Активирован кодом доступа или подпиской.",

    durationToday: "Активирован сегодня",
    durationOneDay: "Активен 1 день",
    durationDays: (n) => `Активен ${n} дн.`,

    toastRedeemNotConfigured: { title: "Сервис недоступен", message: "Проверка кодов не настроена. Попробуй позже." },
    toastRedeemNetwork: { title: "Ошибка соединения", message: "Не удалось связаться с сервером. Проверь соединение и попробуй снова." },
    toastRedeemInvalid: { title: "Неверный код", message: "Введи действительный код доступа." },
    toastRedeemSuccess: { title: "Премиум активен", message: "Код доступа подтверждён." },
    toastRedeemError: { title: "Ошибка", message: "Операция не завершена. Попробуй снова через момент." },
    toastPurchaseUnsupported: { title: "Магазин недоступен", message: "Покупки не поддерживаются на этом устройстве." },
    toastPurchaseNotReady: { title: "Магазин не готов", message: "Товары магазина ещё не загружены. Попробуй через пару секунд." },
    toastPurchaseSuccess: { title: "Спасибо", message: "Твоя премиум-подписка активна." },
    toastPurchaseErrorTitle: "Ошибка покупки",
    toastPurchaseErrorMessage: (code) => `Покупка не завершена (${code}). Попробуй снова.`,
    toastRestoreUnsupported: { title: "Восстановить", message: "Восстановление не поддерживается на этом устройстве." },
    toastRestoreNotFound: { title: "Восстановить", message: "Активная премиум-подписка для этого Apple ID не найдена." },
    toastRestoreSuccess: { title: "Восстановлено", message: "Твой премиум-доступ восстановлен." },
    toastRestoreError: { title: "Ошибка восстановления", message: "Восстановление не удалось. Попробуй снова." },

    liveSupportEmailSubject: "Премиум поддержка",
  },

  fil: {
    features: [
      { icon: "fitness", title: "Brain Hygiene - 7-araw na reset", description: "Konkretong hakbang sa dopamine reset: paglalakad, malamig na shower, malalim na paghinga, screen fast." },
      { icon: "git-network", title: "Trigger Map", description: "Nag-mamapa ng oras, lugar, mood at sanhi ng pagnanasa na may personal na ideya sa pag-coping." },
      { icon: "sparkles", title: "Lahat ng mindfulness sessions", description: "Buong access sa compassion, bedtime calming at premium library." },
      { icon: "chatbubbles", title: "Premium AI coaching", description: "Mas mahaba at malalim na coping strategies ayon sa iyong patterns." },
      { icon: "headset", title: "Priority support", description: "Mas mabilis na support lane para sa premium users." },
      { icon: "ban", title: "Walang ad, focused experience", description: "Walang ad, focus lang sa iyong paggaling." },
    ],
    plans: {
      monthly: { title: "Buwanang Premium", subtitle: "Flexible na simula", monthsForHint: 1 },
      quarterly: { title: "3-Buwang Premium", subtitle: "90-araw na focused plan", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "6-Buwang Premium", subtitle: "Half-year na proteksyon", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Taunang Premium", subtitle: "Best value", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("buwan"),
    perMonthSuffix: "/ buwan",
    trustPoints: [
      "Restore na suportado sa parehong Apple ID.",
      "Secure activation na may server verification.",
    ],
    autoRenewDisclosure:
      "Awtomatikong ire-renew ang subscription. Ang renewal ay sisingilin sa iyong Apple ID sa loob ng 24 oras bago matapos ang kasalukuyang period. Para itigil ang auto-renewal, kanselahin nang hindi bababa sa 24 oras bago matapos ang period. Maaari mong i-manage o i-cancel anumang oras sa Apple ID settings.",

    headerChipAccessibility: "Premium section",
    heroTitle: "Premium Control Center",
    heroSubtitle: "I-unlock ang lahat ng sessions, AI guidance, advanced stats at mga susunod na tools.",
    loadingAccessibility: "Naglo-load ng premium status",
    statusLabel: "Status",
    statusA11yPrefix: "Status",
    featuresTitle: "Anong inaalok ng premium",
    featuresMetaSuffix: "features",
    plansTitle: "Pumili ng plan",
    plansReadySubtitle: "Lahat ng plans ay maaaring kanselahin anumang oras.",
    plansLoadingSubtitle: "Naglo-load ng store prices...",
    plansFallbackSubtitle: "Hindi available ang store prices. Nagpapakita ng estimated prices.",
    processingLabel: "Pinoproseso...",
    buyLabel: "Bumili",
    restorePurchasesLabel: "I-restore ang mga pagbili",
    securePurchaseTitle: "Secure na pagbili",
    termsLabel: "Mga Tuntunin ng Paggamit",
    privacyLabel: "Patakaran sa Privacy",
    manageSubLabel: "I-manage ang subscription",

    accessCodeTitle: "Access code",
    accessCodeSubtitle: "Kung may beta access code ka, ilagay para i-activate ang premium.",
    accessCodePlaceholder: "Access code",
    accessCodeInputA11y: "Access code input",
    applyCodeLabel: "Gamitin ang code",

    liveSupportTitle: "Live Support",
    liveSupportActiveSubtitle: "Dedicated live support line para sa premium users.",
    liveSupportInactiveSubtitle: "Mag-upgrade sa premium para i-unlock ang live support.",
    liveSupportAction: "Simulan ang chat",

    gamblingTitle: "Pamamahala ng Pagnanasa sa Sugal",
    gamblingSubtitle: "DNS-level blocking, allowlist at testing tools.",
    gamblingManage: "I-manage",
    gamblingUnlock: "I-unlock gamit ang Premium",
    resetPremium: "I-reset ang Premium",

    helpTitle: "Tulong",
    helpSubtitlePrefix: "Sumulat sa amin para sa mga tanong",
    helpEmailAction: "Magpadala ng email",

    statusChecking: "Tingnan",
    statusCheckingValue: "Naglo-load ng premium status...",
    statusOff: "Off",
    statusOffValue: "Naka-off ang premium access",
    statusOffHint: "I-unlock ang lahat ng sessions, AI guidance at susunod na tools gamit ang premium.",
    statusActive: "Aktibo",
    statusActiveValue: "Naka-on ang premium access",
    statusActiveHint: "Pinagana sa pamamagitan ng access code o subscription.",

    durationToday: "Na-activate ngayon",
    durationOneDay: "Aktibo nang 1 araw",
    durationDays: (n) => `Aktibo nang ${n} araw`,

    toastRedeemNotConfigured: { title: "Hindi available ang serbisyo", message: "Hindi naka-configure ang access code verification. Subukan muli mamaya." },
    toastRedeemNetwork: { title: "Connection Error", message: "Hindi maabot ang server. Tingnan ang iyong connection at subukan muli." },
    toastRedeemInvalid: { title: "Invalid Code", message: "Maglagay ng valid na access code." },
    toastRedeemSuccess: { title: "Premium Aktibo", message: "Na-verify ang access code." },
    toastRedeemError: { title: "Error", message: "Hindi nakumpleto ang operation. Subukan muli sa ilang sandali." },
    toastPurchaseUnsupported: { title: "Store Hindi Available", message: "Hindi suportado ang mga pagbili sa device na ito." },
    toastPurchaseNotReady: { title: "Store Hindi Handa", message: "Hindi pa naload ang store products. Subukan muli sa ilang segundo." },
    toastPurchaseSuccess: { title: "Salamat", message: "Aktibo na ang iyong premium subscription." },
    toastPurchaseErrorTitle: "Purchase Error",
    toastPurchaseErrorMessage: (code) => `Hindi nakumpleto ang pagbili (${code}). Subukan muli.`,
    toastRestoreUnsupported: { title: "Restore", message: "Hindi suportado ang restore sa device na ito." },
    toastRestoreNotFound: { title: "Restore", message: "Walang aktibong premium subscription para sa Apple ID na ito." },
    toastRestoreSuccess: { title: "Na-restore", message: "Naibalik ang iyong premium access." },
    toastRestoreError: { title: "Restore Error", message: "Nabigo ang restore. Subukan muli." },

    liveSupportEmailSubject: "Premium Live Support",
  },

  sv: {
    features: [
      { icon: "fitness", title: "Hjärnhygien - 7-dagars reset", description: "Konkreta steg för dopamin-reset: promenad, kall dusch, djupandning, skärmpaus." },
      { icon: "git-network", title: "Triggerkarta", description: "Kartlägger tid, plats, humör och orsaker till begäret med personliga copingidéer." },
      { icon: "sparkles", title: "Alla mindfulness-sessioner", description: "Full tillgång till medkänsla, kvällslugn och premiumbibliotek." },
      { icon: "chatbubbles", title: "Premium AI-coachning", description: "Längre och djupare copingstrategier anpassade efter dina mönster." },
      { icon: "headset", title: "Prioriterad support", description: "Snabbare supportkanal för premiumanvändare." },
      { icon: "ban", title: "Reklamfri upplevelse", description: "Inga annonser, bara fokus på din återhämtning." },
    ],
    plans: {
      monthly: { title: "Månads-Premium", subtitle: "Flexibel start", monthsForHint: 1 },
      quarterly: { title: "3-månaders Premium", subtitle: "90-dagars fokuserad plan", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "6-månaders Premium", subtitle: "Halvårsskydd", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Års-Premium", subtitle: "Bästa värdet", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("mån."),
    perMonthSuffix: "/ mån.",
    trustPoints: [
      "Återställning stöds med samma Apple-ID.",
      "Säker aktivering med serververifiering.",
    ],
    autoRenewDisclosure:
      "Abonnemanget förnyas automatiskt. Förnyelsen dras från ditt Apple-ID inom 24 timmar före nuvarande periods slut. För att stoppa automatisk förnyelse, avbryt minst 24 timmar före periodens slut. Du kan hantera eller avbryta när som helst i Apple-ID-inställningarna.",

    headerChipAccessibility: "Premium-sektion",
    heroTitle: "Premium-kontrollcenter",
    heroSubtitle: "Lås upp alla sessioner, AI-tips, avancerad statistik och kommande verktyg.",
    loadingAccessibility: "Laddar premium-status",
    statusLabel: "Status",
    statusA11yPrefix: "Status",
    featuresTitle: "Vad premium låser upp",
    featuresMetaSuffix: "funktioner",
    plansTitle: "Välj en plan",
    plansReadySubtitle: "Alla planer kan avbrytas när som helst.",
    plansLoadingSubtitle: "Laddar butikspriser...",
    plansFallbackSubtitle: "Butikspriser otillgängliga. Visar uppskattade priser.",
    processingLabel: "Bearbetar...",
    buyLabel: "Köp",
    restorePurchasesLabel: "Återställ köp",
    securePurchaseTitle: "Säkert köp",
    termsLabel: "Användarvillkor",
    privacyLabel: "Sekretesspolicy",
    manageSubLabel: "Hantera abonnemang",

    accessCodeTitle: "Åtkomstkod",
    accessCodeSubtitle: "Om du har en beta-åtkomstkod, ange den för att aktivera premium.",
    accessCodePlaceholder: "Åtkomstkod",
    accessCodeInputA11y: "Inmatning av åtkomstkod",
    applyCodeLabel: "Använd kod",

    liveSupportTitle: "Live-support",
    liveSupportActiveSubtitle: "Dedikerad live-supportlinje för premiumanvändare.",
    liveSupportInactiveSubtitle: "Uppgradera till premium för att låsa upp live-support.",
    liveSupportAction: "Starta livechatt",

    gamblingTitle: "Hantering av spelbegär",
    gamblingSubtitle: "Blockering på DNS-nivå, tillåtelse-lista och testverktyg.",
    gamblingManage: "Hantera",
    gamblingUnlock: "Lås upp med Premium",
    resetPremium: "Återställ Premium",

    helpTitle: "Hjälp",
    helpSubtitlePrefix: "Skriv till oss vid frågor",
    helpEmailAction: "Skicka e-post",

    statusChecking: "Kollar",
    statusCheckingValue: "Laddar premium-status...",
    statusOff: "Av",
    statusOffValue: "Premium-åtkomst är av",
    statusOffHint: "Lås upp alla sessioner, AI-tips och kommande verktyg med premium.",
    statusActive: "Aktiv",
    statusActiveValue: "Premium-åtkomst är på",
    statusActiveHint: "Aktiverad via åtkomstkod eller abonnemang.",

    durationToday: "Aktiverad idag",
    durationOneDay: "Aktiv i 1 dag",
    durationDays: (n) => `Aktiv i ${n} dagar`,

    toastRedeemNotConfigured: { title: "Tjänst otillgänglig", message: "Verifiering av åtkomstkoder är inte konfigurerad. Försök igen senare." },
    toastRedeemNetwork: { title: "Anslutningsfel", message: "Kunde inte nå servern. Kontrollera anslutningen och försök igen." },
    toastRedeemInvalid: { title: "Ogiltig kod", message: "Ange en giltig åtkomstkod." },
    toastRedeemSuccess: { title: "Premium aktiv", message: "Åtkomstkod verifierad." },
    toastRedeemError: { title: "Fel", message: "Åtgärden kunde inte slutföras. Försök igen snart." },
    toastPurchaseUnsupported: { title: "Butik otillgänglig", message: "Köp stöds inte på den här enheten." },
    toastPurchaseNotReady: { title: "Butik inte redo", message: "Butiksprodukter har inte laddats än. Försök igen om några sekunder." },
    toastPurchaseSuccess: { title: "Tack", message: "Ditt premium-abonnemang är nu aktivt." },
    toastPurchaseErrorTitle: "Köpfel",
    toastPurchaseErrorMessage: (code) => `Köpet kunde inte slutföras (${code}). Försök igen.`,
    toastRestoreUnsupported: { title: "Återställ", message: "Återställning stöds inte på den här enheten." },
    toastRestoreNotFound: { title: "Återställ", message: "Inget aktivt premium-abonnemang hittades för detta Apple-ID." },
    toastRestoreSuccess: { title: "Återställt", message: "Din premium-åtkomst har återställts." },
    toastRestoreError: { title: "Återställningsfel", message: "Återställning misslyckades. Försök igen." },

    liveSupportEmailSubject: "Premium Live-support",
  },

  fi: {
    features: [
      { icon: "fitness", title: "Aivohygienia - 7 päivän ohjelma", description: "Konkreettiset askeleet dopamiinin nollaukseen: kävely, kylmä suihku, syvähengitys, näyttöpaasto." },
      { icon: "git-network", title: "Laukaisijakartta", description: "Kartoittaa ajan, paikan, mielialan ja halun syyt henkilökohtaisin selviytymisideoin." },
      { icon: "sparkles", title: "Kaikki tietoisuusistunnot", description: "Täysi pääsy myötätuntoon, nukahtamisrauhoitukseen ja premium-kirjastoon." },
      { icon: "chatbubbles", title: "Premium AI-valmennus", description: "Pidempiä ja syvempiä selviytymisstrategioita räätälöitynä sinulle." },
      { icon: "headset", title: "Priorisoitu tuki", description: "Nopeampi tukikaista premium-käyttäjille." },
      { icon: "ban", title: "Mainokseton kokemus", description: "Ei mainoksia, vain keskittyminen toipumiseesi." },
    ],
    plans: {
      monthly: { title: "Kuukausi-Premium", subtitle: "Joustava aloitus", monthsForHint: 1 },
      quarterly: { title: "3 kk Premium", subtitle: "90 päivän keskittynyt suunnitelma", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "6 kk Premium", subtitle: "Puolivuotinen suoja", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Vuosi-Premium", subtitle: "Paras arvo", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("kk"),
    perMonthSuffix: "/ kk",
    trustPoints: [
      "Palautus tuettu samalla Apple ID:llä.",
      "Turvallinen aktivointi palvelinvarmennuksella.",
    ],
    autoRenewDisclosure:
      "Tilaus uusiutuu automaattisesti. Uusinta veloitetaan Apple ID:ltäsi 24 tunnin sisällä ennen nykyisen jakson päättymistä. Pysäyttääksesi automaattisen uusinnan, peruuta vähintään 24 tuntia ennen jakson päättymistä. Voit hallita tai peruuttaa milloin tahansa Apple ID -asetuksista.",

    headerChipAccessibility: "Premium-osio",
    heroTitle: "Premium-ohjauskeskus",
    heroSubtitle: "Avaa kaikki istunnot, AI-vinkit, edistynyt tilasto ja tulevat työkalut.",
    loadingAccessibility: "Ladataan premium-tilaa",
    statusLabel: "Tila",
    statusA11yPrefix: "Tila",
    featuresTitle: "Mitä premium avaa",
    featuresMetaSuffix: "ominaisuutta",
    plansTitle: "Valitse suunnitelma",
    plansReadySubtitle: "Kaikki suunnitelmat voi peruuttaa milloin tahansa.",
    plansLoadingSubtitle: "Ladataan kauppahintoja...",
    plansFallbackSubtitle: "Kauppahinnat ei saatavilla. Näytetään arvioidut hinnat.",
    processingLabel: "Käsitellään...",
    buyLabel: "Osta",
    restorePurchasesLabel: "Palauta ostot",
    securePurchaseTitle: "Turvallinen osto",
    termsLabel: "Käyttöehdot",
    privacyLabel: "Tietosuojakäytäntö",
    manageSubLabel: "Hallinnoi tilausta",

    accessCodeTitle: "Pääsykoodi",
    accessCodeSubtitle: "Jos sinulla on beta-pääsykoodi, syötä se aktivoidaksesi premiumin.",
    accessCodePlaceholder: "Pääsykoodi",
    accessCodeInputA11y: "Pääsykoodin syöttö",
    applyCodeLabel: "Käytä koodia",

    liveSupportTitle: "Live-tuki",
    liveSupportActiveSubtitle: "Oma live-tukilinja premium-käyttäjille.",
    liveSupportInactiveSubtitle: "Päivitä premiumiin avataksesi live-tuen.",
    liveSupportAction: "Aloita live-chat",

    gamblingTitle: "Pelihalun hallinta",
    gamblingSubtitle: "DNS-tason esto, salliluettelo ja testityökalut.",
    gamblingManage: "Hallinnoi",
    gamblingUnlock: "Avaa Premiumilla",
    resetPremium: "Nollaa Premium",

    helpTitle: "Apua",
    helpSubtitlePrefix: "Kirjoita meille kysymyksissä",
    helpEmailAction: "Lähetä sähköposti",

    statusChecking: "Tarkist.",
    statusCheckingValue: "Ladataan premium-tilaa...",
    statusOff: "Pois",
    statusOffValue: "Premium-käyttö pois päältä",
    statusOffHint: "Avaa kaikki istunnot, AI-vinkit ja tulevat työkalut premiumilla.",
    statusActive: "Aktiivinen",
    statusActiveValue: "Premium-käyttö päällä",
    statusActiveHint: "Aktivoitu pääsykoodilla tai tilauksella.",

    durationToday: "Aktivoitu tänään",
    durationOneDay: "Aktiivinen 1 päivän",
    durationDays: (n) => `Aktiivinen ${n} päivää`,

    toastRedeemNotConfigured: { title: "Palvelu ei käytettävissä", message: "Pääsykoodin tarkistus ei ole määritetty. Yritä myöhemmin uudelleen." },
    toastRedeemNetwork: { title: "Yhteysvirhe", message: "Palvelinta ei tavoitettu. Tarkista yhteytesi ja yritä uudelleen." },
    toastRedeemInvalid: { title: "Virheellinen koodi", message: "Syötä kelvollinen pääsykoodi." },
    toastRedeemSuccess: { title: "Premium aktiivinen", message: "Pääsykoodi vahvistettu." },
    toastRedeemError: { title: "Virhe", message: "Toimintoa ei voitu suorittaa. Yritä pian uudelleen." },
    toastPurchaseUnsupported: { title: "Kauppa ei käytettävissä", message: "Ostoja ei tueta tällä laitteella." },
    toastPurchaseNotReady: { title: "Kauppa ei valmis", message: "Kauppatuotteita ei ole vielä ladattu. Yritä muutaman sekunnin kuluttua uudelleen." },
    toastPurchaseSuccess: { title: "Kiitos", message: "Premium-tilauksesi on aktiivinen." },
    toastPurchaseErrorTitle: "Ostovirhe",
    toastPurchaseErrorMessage: (code) => `Ostoa ei voitu suorittaa (${code}). Yritä uudelleen.`,
    toastRestoreUnsupported: { title: "Palauta", message: "Palautus ei tuettu tällä laitteella." },
    toastRestoreNotFound: { title: "Palauta", message: "Aktiivista premium-tilausta ei löytynyt tälle Apple ID:lle." },
    toastRestoreSuccess: { title: "Palautettu", message: "Premium-käyttösi on palautettu." },
    toastRestoreError: { title: "Palautusvirhe", message: "Palautus epäonnistui. Yritä uudelleen." },

    liveSupportEmailSubject: "Premium Live-tuki",
  },

  nl: {
    features: [
      { icon: "fitness", title: "Breinhygiëne - 7-daags reset", description: "Concrete dopamine-reset stappen: wandelen, koude douche, diep ademen, schermvasten." },
      { icon: "git-network", title: "Triggerkaart", description: "Kaart tijd, plaats, stemming en oorzaken van drang met persoonlijke copingideeën." },
      { icon: "sparkles", title: "Alle mindfulnesssessies", description: "Volledige toegang tot compassie, slaapkalmering en premium bibliotheek." },
      { icon: "chatbubbles", title: "Premium AI-coaching", description: "Langere en diepere copingstrategieën, afgestemd op jouw patronen." },
      { icon: "headset", title: "Voorrang support", description: "Snellere supportlijn voor premium-gebruikers." },
      { icon: "ban", title: "Advertentievrije ervaring", description: "Geen advertenties, alleen focus op je herstel." },
    ],
    plans: {
      monthly: { title: "Maand-Premium", subtitle: "Flexibele start", monthsForHint: 1 },
      quarterly: { title: "3-Maands Premium", subtitle: "90 dagen gericht plan", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "6-Maands Premium", subtitle: "Halfjaarlijkse bescherming", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Jaar-Premium", subtitle: "Beste waarde", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("mnd"),
    perMonthSuffix: "/ mnd",
    trustPoints: [
      "Herstel ondersteund met hetzelfde Apple-ID.",
      "Veilige activering met serververificatie.",
    ],
    autoRenewDisclosure:
      "Abonnement verlengt automatisch. Verlenging wordt binnen 24 uur voor het einde van de huidige periode in rekening gebracht op je Apple-ID. Om automatische verlenging te stoppen, annuleer minstens 24 uur voor het einde van de periode. Je kunt op elk moment beheren of annuleren in je Apple-ID-instellingen.",

    headerChipAccessibility: "Premium-sectie",
    heroTitle: "Premium Controlecentrum",
    heroSubtitle: "Ontgrendel alle sessies, AI-tips, geavanceerde statistieken en toekomstige tools.",
    loadingAccessibility: "Premium-status laden",
    statusLabel: "Status",
    statusA11yPrefix: "Status",
    featuresTitle: "Wat premium ontgrendelt",
    featuresMetaSuffix: "functies",
    plansTitle: "Kies een plan",
    plansReadySubtitle: "Alle plannen kunnen op elk moment worden geannuleerd.",
    plansLoadingSubtitle: "Winkelprijzen laden...",
    plansFallbackSubtitle: "Winkelprijzen niet beschikbaar. Geschatte prijzen weergegeven.",
    processingLabel: "Verwerken...",
    buyLabel: "Kopen",
    restorePurchasesLabel: "Aankopen herstellen",
    securePurchaseTitle: "Veilige aankoop",
    termsLabel: "Gebruiksvoorwaarden",
    privacyLabel: "Privacybeleid",
    manageSubLabel: "Abonnement beheren",

    accessCodeTitle: "Toegangscode",
    accessCodeSubtitle: "Als je een beta-toegangscode hebt, voer deze in om premium te activeren.",
    accessCodePlaceholder: "Toegangscode",
    accessCodeInputA11y: "Toegangscode invoer",
    applyCodeLabel: "Code gebruiken",

    liveSupportTitle: "Live Support",
    liveSupportActiveSubtitle: "Toegewijde live-supportlijn voor premium-gebruikers.",
    liveSupportInactiveSubtitle: "Upgrade naar premium om live support te ontgrendelen.",
    liveSupportAction: "Live chat starten",

    gamblingTitle: "Beheer van gokdrang",
    gamblingSubtitle: "Blokkering op DNS-niveau, toegestane lijst en testtools.",
    gamblingManage: "Beheren",
    gamblingUnlock: "Ontgrendel met Premium",
    resetPremium: "Premium resetten",

    helpTitle: "Hulp",
    helpSubtitlePrefix: "Schrijf ons bij vragen",
    helpEmailAction: "E-mail sturen",

    statusChecking: "Check",
    statusCheckingValue: "Premium-status laden...",
    statusOff: "Uit",
    statusOffValue: "Premium-toegang is uit",
    statusOffHint: "Ontgrendel alle sessies, AI-tips en toekomstige tools met premium.",
    statusActive: "Actief",
    statusActiveValue: "Premium-toegang is aan",
    statusActiveHint: "Geactiveerd via toegangscode of abonnement.",

    durationToday: "Vandaag geactiveerd",
    durationOneDay: "1 dag actief",
    durationDays: (n) => `${n} dagen actief`,

    toastRedeemNotConfigured: { title: "Service niet beschikbaar", message: "Verificatie van toegangscodes is niet geconfigureerd. Probeer het later opnieuw." },
    toastRedeemNetwork: { title: "Verbindingsfout", message: "Kon server niet bereiken. Controleer je verbinding en probeer opnieuw." },
    toastRedeemInvalid: { title: "Ongeldige code", message: "Voer een geldige toegangscode in." },
    toastRedeemSuccess: { title: "Premium actief", message: "Toegangscode geverifieerd." },
    toastRedeemError: { title: "Fout", message: "Bewerking kon niet worden voltooid. Probeer het zo opnieuw." },
    toastPurchaseUnsupported: { title: "Winkel niet beschikbaar", message: "Aankopen worden niet ondersteund op dit apparaat." },
    toastPurchaseNotReady: { title: "Winkel niet klaar", message: "Winkelproducten zijn nog niet geladen. Probeer over een paar seconden opnieuw." },
    toastPurchaseSuccess: { title: "Bedankt", message: "Je premium-abonnement is nu actief." },
    toastPurchaseErrorTitle: "Aankoopfout",
    toastPurchaseErrorMessage: (code) => `Aankoop kon niet worden voltooid (${code}). Probeer opnieuw.`,
    toastRestoreUnsupported: { title: "Herstellen", message: "Herstellen niet ondersteund op dit apparaat." },
    toastRestoreNotFound: { title: "Herstellen", message: "Geen actief premium-abonnement gevonden voor deze Apple-ID." },
    toastRestoreSuccess: { title: "Hersteld", message: "Je premium-toegang is hersteld." },
    toastRestoreError: { title: "Herstelfout", message: "Herstellen mislukt. Probeer opnieuw." },

    liveSupportEmailSubject: "Premium Live Support",
  },

  ja: {
    features: [
      { icon: "fitness", title: "脳ケア - 7日間リセット", description: "ドーパミンをリセットする具体的なステップ：散歩、冷水シャワー、深呼吸、画面断食。" },
      { icon: "git-network", title: "トリガーマップ", description: "時間、場所、気分、衝動の原因をマッピングし、個別の対処アイデアを提案。" },
      { icon: "sparkles", title: "すべてのマインドフルネスセッション", description: "慈悲、就寝前の落ち着き、プレミアムセッションへの完全アクセス。" },
      { icon: "chatbubbles", title: "プレミアムAIコーチング", description: "あなたのパターンに合わせた、より長く深い対処戦略。" },
      { icon: "headset", title: "優先サポート", description: "プレミアムユーザー専用の高速サポートライン。" },
      { icon: "ban", title: "広告なしの集中体験", description: "広告なし。あなたの回復だけに集中。" },
    ],
    plans: {
      monthly: { title: "月額プレミアム", subtitle: "柔軟なスタート", monthsForHint: 1 },
      quarterly: { title: "3ヶ月プレミアム", subtitle: "90日集中プラン", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "6ヶ月プレミアム", subtitle: "半年保護", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "年間プレミアム", subtitle: "最高の価値", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("月"),
    perMonthSuffix: "/ 月",
    trustPoints: [
      "同じApple IDで復元できます。",
      "サーバー認証で安全に有効化。",
    ],
    autoRenewDisclosure:
      "サブスクリプションは自動更新されます。更新は現在の期間終了の24時間前までにApple IDに請求されます。自動更新を停止するには、期間終了の少なくとも24時間前にキャンセルしてください。Apple ID設定からいつでも管理またはキャンセルできます。",

    headerChipAccessibility: "プレミアムセクション",
    heroTitle: "プレミアムコントロールセンター",
    heroSubtitle: "すべてのセッション、AIガイダンス、詳細な統計、今後のツールをアンロック。",
    loadingAccessibility: "プレミアムステータスを読み込み中",
    statusLabel: "ステータス",
    statusA11yPrefix: "ステータス",
    featuresTitle: "プレミアムで開放されるもの",
    featuresMetaSuffix: "機能",
    plansTitle: "プランを選択",
    plansReadySubtitle: "すべてのプランはいつでもキャンセル可能。",
    plansLoadingSubtitle: "ストア価格を読み込み中...",
    plansFallbackSubtitle: "ストア価格を取得できません。推定価格を表示。",
    processingLabel: "処理中...",
    buyLabel: "購入",
    restorePurchasesLabel: "購入を復元",
    securePurchaseTitle: "安全な購入",
    termsLabel: "利用規約",
    privacyLabel: "プライバシーポリシー",
    manageSubLabel: "サブスクリプション管理",

    accessCodeTitle: "アクセスコード",
    accessCodeSubtitle: "ベータアクセスコードがあれば入力してプレミアムを有効化。",
    accessCodePlaceholder: "アクセスコード",
    accessCodeInputA11y: "アクセスコード入力",
    applyCodeLabel: "コード使用",

    liveSupportTitle: "ライブサポート",
    liveSupportActiveSubtitle: "プレミアムユーザー専用のライブサポート。",
    liveSupportInactiveSubtitle: "プレミアムにアップグレードしてライブサポートをアンロック。",
    liveSupportAction: "ライブチャット開始",

    gamblingTitle: "ギャンブル衝動管理",
    gamblingSubtitle: "DNSレベルブロック、許可リスト、テストツール。",
    gamblingManage: "管理",
    gamblingUnlock: "プレミアムで開放",
    resetPremium: "プレミアムをリセット",

    helpTitle: "ヘルプ",
    helpSubtitlePrefix: "ご質問はメールでどうぞ",
    helpEmailAction: "メール送信",

    statusChecking: "確認",
    statusCheckingValue: "プレミアムステータスを読み込み中...",
    statusOff: "オフ",
    statusOffValue: "プレミアムアクセスはオフ",
    statusOffHint: "プレミアムですべてのセッション、AIガイダンス、今後のツールをアンロック。",
    statusActive: "アクティブ",
    statusActiveValue: "プレミアムアクセスはオン",
    statusActiveHint: "アクセスコードまたはサブスクリプションで有効。",

    durationToday: "今日有効化",
    durationOneDay: "1日間アクティブ",
    durationDays: (n) => `${n}日間アクティブ`,

    toastRedeemNotConfigured: { title: "サービス利用不可", message: "アクセスコード認証は設定されていません。後ほど再試行してください。" },
    toastRedeemNetwork: { title: "接続エラー", message: "サーバーに到達できませんでした。接続を確認して再試行してください。" },
    toastRedeemInvalid: { title: "無効なコード", message: "有効なアクセスコードを入力してください。" },
    toastRedeemSuccess: { title: "プレミアム有効", message: "アクセスコードが確認されました。" },
    toastRedeemError: { title: "エラー", message: "操作を完了できませんでした。すぐに再試行してください。" },
    toastPurchaseUnsupported: { title: "ストア利用不可", message: "このデバイスでは購入はサポートされていません。" },
    toastPurchaseNotReady: { title: "ストア未準備", message: "ストア商品がまだ読み込まれていません。数秒後に再試行してください。" },
    toastPurchaseSuccess: { title: "ありがとうございます", message: "プレミアムサブスクリプションが有効になりました。" },
    toastPurchaseErrorTitle: "購入エラー",
    toastPurchaseErrorMessage: (code) => `購入を完了できませんでした (${code})。再試行してください。`,
    toastRestoreUnsupported: { title: "復元", message: "このデバイスでは復元はサポートされていません。" },
    toastRestoreNotFound: { title: "復元", message: "このApple IDでアクティブなプレミアムサブスクリプションは見つかりませんでした。" },
    toastRestoreSuccess: { title: "復元完了", message: "プレミアムアクセスが復元されました。" },
    toastRestoreError: { title: "復元エラー", message: "復元に失敗しました。再試行してください。" },

    liveSupportEmailSubject: "プレミアムライブサポート",
  },

  id: {
    features: [
      { icon: "fitness", title: "Higiene Otak - reset 7 hari", description: "Langkah konkret reset dopamin: jalan kaki, mandi dingin, napas dalam, puasa layar." },
      { icon: "git-network", title: "Peta Pemicu", description: "Memetakan waktu, tempat, suasana hati, dan penyebab dorongan dengan ide coping personal." },
      { icon: "sparkles", title: "Semua sesi mindfulness", description: "Akses penuh ke welas asih, penenangan tidur, dan pustaka premium." },
      { icon: "chatbubbles", title: "Coaching AI premium", description: "Strategi coping yang lebih panjang dan dalam sesuai polamu." },
      { icon: "headset", title: "Dukungan prioritas", description: "Jalur dukungan lebih cepat untuk pengguna premium." },
      { icon: "ban", title: "Pengalaman tanpa iklan", description: "Tanpa iklan, fokus pada pemulihanmu saja." },
    ],
    plans: {
      monthly: { title: "Premium Bulanan", subtitle: "Mulai fleksibel", monthsForHint: 1 },
      quarterly: { title: "Premium 3 Bulan", subtitle: "Paket fokus 90 hari", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "Premium 6 Bulan", subtitle: "Proteksi setengah tahun", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Premium Tahunan", subtitle: "Nilai terbaik", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("bln"),
    perMonthSuffix: "/ bln",
    trustPoints: [
      "Pemulihan didukung dengan Apple ID yang sama.",
      "Aktivasi aman dengan verifikasi server.",
    ],
    autoRenewDisclosure:
      "Langganan diperpanjang otomatis. Perpanjangan ditagihkan ke Apple ID kamu dalam 24 jam sebelum akhir periode berjalan. Untuk menghentikan perpanjangan otomatis, batalkan minimal 24 jam sebelum periode berakhir. Kamu bisa mengelola atau membatalkan kapan saja di pengaturan Apple ID.",

    headerChipAccessibility: "Bagian premium",
    heroTitle: "Pusat Kontrol Premium",
    heroSubtitle: "Buka semua sesi, panduan AI, statistik lanjutan, dan alat mendatang.",
    loadingAccessibility: "Memuat status premium",
    statusLabel: "Status",
    statusA11yPrefix: "Status",
    featuresTitle: "Yang dibuka premium",
    featuresMetaSuffix: "fitur",
    plansTitle: "Pilih paket",
    plansReadySubtitle: "Semua paket bisa dibatalkan kapan saja.",
    plansLoadingSubtitle: "Memuat harga toko...",
    plansFallbackSubtitle: "Harga toko tidak tersedia. Menampilkan estimasi.",
    processingLabel: "Memproses...",
    buyLabel: "Beli",
    restorePurchasesLabel: "Pulihkan Pembelian",
    securePurchaseTitle: "Pembelian aman",
    termsLabel: "Syarat Penggunaan",
    privacyLabel: "Kebijakan Privasi",
    manageSubLabel: "Kelola Langganan",

    accessCodeTitle: "Kode Akses",
    accessCodeSubtitle: "Jika punya kode akses beta, masukkan untuk mengaktifkan premium.",
    accessCodePlaceholder: "Kode akses",
    accessCodeInputA11y: "Input kode akses",
    applyCodeLabel: "Gunakan Kode",

    liveSupportTitle: "Dukungan Langsung",
    liveSupportActiveSubtitle: "Jalur dukungan langsung khusus pengguna premium.",
    liveSupportInactiveSubtitle: "Upgrade ke premium untuk membuka dukungan langsung.",
    liveSupportAction: "Mulai chat",

    gamblingTitle: "Manajemen Dorongan Judi",
    gamblingSubtitle: "Pemblokiran level DNS, daftar izin, dan alat tes.",
    gamblingManage: "Kelola",
    gamblingUnlock: "Buka dengan Premium",
    resetPremium: "Reset Premium",

    helpTitle: "Bantuan",
    helpSubtitlePrefix: "Tulis ke kami untuk pertanyaan",
    helpEmailAction: "Kirim Email",

    statusChecking: "Cek",
    statusCheckingValue: "Memuat status premium...",
    statusOff: "Mati",
    statusOffValue: "Akses premium mati",
    statusOffHint: "Buka semua sesi, panduan AI, dan alat mendatang dengan premium.",
    statusActive: "Aktif",
    statusActiveValue: "Akses premium aktif",
    statusActiveHint: "Diaktifkan melalui kode akses atau langganan.",

    durationToday: "Diaktifkan hari ini",
    durationOneDay: "Aktif 1 hari",
    durationDays: (n) => `Aktif ${n} hari`,

    toastRedeemNotConfigured: { title: "Layanan tidak tersedia", message: "Verifikasi kode akses tidak dikonfigurasi. Coba lagi nanti." },
    toastRedeemNetwork: { title: "Kesalahan Koneksi", message: "Tidak bisa menghubungi server. Periksa koneksimu dan coba lagi." },
    toastRedeemInvalid: { title: "Kode Tidak Valid", message: "Masukkan kode akses yang valid." },
    toastRedeemSuccess: { title: "Premium Aktif", message: "Kode akses terverifikasi." },
    toastRedeemError: { title: "Kesalahan", message: "Operasi tidak selesai. Coba lagi sebentar." },
    toastPurchaseUnsupported: { title: "Toko Tidak Tersedia", message: "Pembelian tidak didukung di perangkat ini." },
    toastPurchaseNotReady: { title: "Toko Belum Siap", message: "Produk toko belum dimuat. Coba lagi dalam beberapa detik." },
    toastPurchaseSuccess: { title: "Terima kasih", message: "Langganan premium kamu aktif." },
    toastPurchaseErrorTitle: "Kesalahan Pembelian",
    toastPurchaseErrorMessage: (code) => `Pembelian tidak selesai (${code}). Coba lagi.`,
    toastRestoreUnsupported: { title: "Pulihkan", message: "Pemulihan tidak didukung di perangkat ini." },
    toastRestoreNotFound: { title: "Pulihkan", message: "Tidak ditemukan langganan premium aktif untuk Apple ID ini." },
    toastRestoreSuccess: { title: "Dipulihkan", message: "Akses premium kamu dipulihkan." },
    toastRestoreError: { title: "Kesalahan Pemulihan", message: "Pemulihan gagal. Coba lagi." },

    liveSupportEmailSubject: "Dukungan Langsung Premium",
  },

  th: {
    features: [
      { icon: "fitness", title: "สุขอนามัยสมอง - โปรแกรม 7 วัน", description: "ขั้นตอนรีเซ็ตโดพามีน: เดิน อาบน้ำเย็น หายใจลึก หยุดดูจอ" },
      { icon: "git-network", title: "แผนที่ตัวกระตุ้น", description: "แมปเวลา สถานที่ อารมณ์ และสาเหตุของความอยาก พร้อมไอเดียรับมือเฉพาะตัว" },
      { icon: "sparkles", title: "เซสชันสติทั้งหมด", description: "เข้าถึงความเมตตา ผ่อนคลายก่อนนอน และคลังพรีเมียมเต็มรูปแบบ" },
      { icon: "chatbubbles", title: "โค้ช AI พรีเมียม", description: "กลยุทธ์รับมือที่ยาวและลึกขึ้น ตามรูปแบบของคุณ" },
      { icon: "headset", title: "การสนับสนุนสำคัญก่อน", description: "ช่องสนับสนุนที่เร็วกว่าสำหรับผู้ใช้พรีเมียม" },
      { icon: "ban", title: "ประสบการณ์ปลอดโฆษณา", description: "ไม่มีโฆษณา มีแค่การฟื้นตัวของคุณ" },
    ],
    plans: {
      monthly: { title: "พรีเมียมรายเดือน", subtitle: "เริ่มต้นยืดหยุ่น", monthsForHint: 1 },
      quarterly: { title: "พรีเมียม 3 เดือน", subtitle: "แผน 90 วันที่เน้น", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "พรีเมียม 6 เดือน", subtitle: "ปกป้องครึ่งปี", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "พรีเมียมรายปี", subtitle: "คุ้มที่สุด", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("เดือน"),
    perMonthSuffix: "/ เดือน",
    trustPoints: [
      "รองรับการกู้คืนด้วย Apple ID เดียวกัน",
      "เปิดใช้งานปลอดภัยพร้อมการตรวจสอบจากเซิร์ฟเวอร์",
    ],
    autoRenewDisclosure:
      "การสมัครจะต่ออายุอัตโนมัติ การต่ออายุจะถูกเรียกเก็บจาก Apple ID ของคุณภายใน 24 ชั่วโมงก่อนสิ้นสุดรอบปัจจุบัน หากต้องการหยุดการต่ออายุอัตโนมัติ ให้ยกเลิกอย่างน้อย 24 ชั่วโมงก่อนสิ้นสุดรอบ คุณสามารถจัดการหรือยกเลิกได้ทุกเมื่อในการตั้งค่า Apple ID",

    headerChipAccessibility: "ส่วนพรีเมียม",
    heroTitle: "ศูนย์ควบคุมพรีเมียม",
    heroSubtitle: "ปลดล็อกเซสชันทั้งหมด คำแนะนำ AI สถิติขั้นสูง และเครื่องมือที่จะมา",
    loadingAccessibility: "กำลังโหลดสถานะพรีเมียม",
    statusLabel: "สถานะ",
    statusA11yPrefix: "สถานะ",
    featuresTitle: "พรีเมียมปลดล็อกอะไร",
    featuresMetaSuffix: "ฟีเจอร์",
    plansTitle: "เลือกแผน",
    plansReadySubtitle: "ทุกแผนสามารถยกเลิกได้ทุกเมื่อ",
    plansLoadingSubtitle: "กำลังโหลดราคาในสโตร์...",
    plansFallbackSubtitle: "ไม่สามารถโหลดราคาในสโตร์ได้ แสดงราคาประมาณการ",
    processingLabel: "กำลังประมวลผล...",
    buyLabel: "ซื้อ",
    restorePurchasesLabel: "กู้คืนการซื้อ",
    securePurchaseTitle: "การซื้อที่ปลอดภัย",
    termsLabel: "ข้อกำหนดการใช้งาน",
    privacyLabel: "นโยบายความเป็นส่วนตัว",
    manageSubLabel: "จัดการการสมัคร",

    accessCodeTitle: "รหัสเข้าใช้",
    accessCodeSubtitle: "หากคุณมีรหัสเบต้า ใส่เพื่อเปิดใช้พรีเมียม",
    accessCodePlaceholder: "รหัสเข้าใช้",
    accessCodeInputA11y: "ช่องกรอกรหัสเข้าใช้",
    applyCodeLabel: "ใช้รหัส",

    liveSupportTitle: "สนับสนุนสด",
    liveSupportActiveSubtitle: "สายสนับสนุนสดเฉพาะผู้ใช้พรีเมียม",
    liveSupportInactiveSubtitle: "อัปเกรดเป็นพรีเมียมเพื่อปลดล็อกการสนับสนุนสด",
    liveSupportAction: "เริ่มแชทสด",

    gamblingTitle: "จัดการความอยากเล่นพนัน",
    gamblingSubtitle: "บล็อกระดับ DNS, รายการอนุญาต และเครื่องมือทดสอบ",
    gamblingManage: "จัดการ",
    gamblingUnlock: "ปลดล็อกด้วยพรีเมียม",
    resetPremium: "รีเซ็ตพรีเมียม",

    helpTitle: "ช่วยเหลือ",
    helpSubtitlePrefix: "เขียนถึงเราเพื่อคำถาม",
    helpEmailAction: "ส่งอีเมล",

    statusChecking: "ตรวจ",
    statusCheckingValue: "กำลังโหลดสถานะพรีเมียม...",
    statusOff: "ปิด",
    statusOffValue: "การเข้าถึงพรีเมียมปิดอยู่",
    statusOffHint: "ปลดล็อกเซสชันทั้งหมด คำแนะนำ AI และเครื่องมือที่จะมาด้วยพรีเมียม",
    statusActive: "เปิดอยู่",
    statusActiveValue: "การเข้าถึงพรีเมียมเปิดอยู่",
    statusActiveHint: "เปิดใช้งานด้วยรหัสเข้าใช้หรือการสมัคร",

    durationToday: "เปิดใช้งานวันนี้",
    durationOneDay: "ใช้งานมา 1 วัน",
    durationDays: (n) => `ใช้งานมา ${n} วัน`,

    toastRedeemNotConfigured: { title: "บริการไม่พร้อมใช้งาน", message: "การตรวจรหัสเข้าใช้ยังไม่ได้กำหนดค่า โปรดลองอีกครั้งภายหลัง" },
    toastRedeemNetwork: { title: "ข้อผิดพลาดการเชื่อมต่อ", message: "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ ตรวจสอบการเชื่อมต่อและลองอีกครั้ง" },
    toastRedeemInvalid: { title: "รหัสไม่ถูกต้อง", message: "กรุณาใส่รหัสเข้าใช้ที่ถูกต้อง" },
    toastRedeemSuccess: { title: "พรีเมียมเปิดใช้งาน", message: "ตรวจรหัสเข้าใช้แล้ว" },
    toastRedeemError: { title: "ข้อผิดพลาด", message: "ไม่สามารถดำเนินการได้ โปรดลองอีกครั้งในไม่ช้า" },
    toastPurchaseUnsupported: { title: "สโตร์ไม่พร้อมใช้งาน", message: "อุปกรณ์นี้ไม่รองรับการซื้อ" },
    toastPurchaseNotReady: { title: "สโตร์ยังไม่พร้อม", message: "สินค้าในสโตร์ยังไม่ได้โหลด ลองอีกครั้งในไม่กี่วินาที" },
    toastPurchaseSuccess: { title: "ขอบคุณ", message: "การสมัครพรีเมียมของคุณเปิดใช้งานแล้ว" },
    toastPurchaseErrorTitle: "ข้อผิดพลาดการซื้อ",
    toastPurchaseErrorMessage: (code) => `ไม่สามารถซื้อให้เสร็จได้ (${code}) โปรดลองอีกครั้ง`,
    toastRestoreUnsupported: { title: "กู้คืน", message: "อุปกรณ์นี้ไม่รองรับการกู้คืน" },
    toastRestoreNotFound: { title: "กู้คืน", message: "ไม่พบการสมัครพรีเมียมที่ใช้งานอยู่สำหรับ Apple ID นี้" },
    toastRestoreSuccess: { title: "กู้คืนแล้ว", message: "การเข้าถึงพรีเมียมของคุณถูกกู้คืน" },
    toastRestoreError: { title: "ข้อผิดพลาดการกู้คืน", message: "การกู้คืนล้มเหลว โปรดลองอีกครั้ง" },

    liveSupportEmailSubject: "สนับสนุนสดพรีเมียม",
  },

  hi: {
    features: [
      { icon: "fitness", title: "मस्तिष्क स्वच्छता - 7-दिन रीसेट", description: "डोपामिन रीसेट के ठोस कदम: चलना, ठंडा शॉवर, गहरी सांस, स्क्रीन उपवास।" },
      { icon: "git-network", title: "ट्रिगर मानचित्र", description: "समय, स्थान, मनोदशा और इच्छा के कारणों को व्यक्तिगत समाधान विचारों के साथ मैप करता है।" },
      { icon: "sparkles", title: "सभी सजगता सत्र", description: "करुणा, सोने से पहले शांति और प्रीमियम सत्र पुस्तकालय तक पूर्ण पहुँच।" },
      { icon: "chatbubbles", title: "प्रीमियम AI कोचिंग", description: "आपके पैटर्न के अनुरूप लंबी और गहरी मुकाबला रणनीतियाँ।" },
      { icon: "headset", title: "प्राथमिकता समर्थन", description: "प्रीमियम उपयोगकर्ताओं के लिए तेज़ समर्थन लाइन।" },
      { icon: "ban", title: "विज्ञापन-मुक्त अनुभव", description: "कोई विज्ञापन नहीं, सिर्फ आपकी रिकवरी पर ध्यान।" },
    ],
    plans: {
      monthly: { title: "मासिक प्रीमियम", subtitle: "लचीली शुरुआत", monthsForHint: 1 },
      quarterly: { title: "3-माह प्रीमियम", subtitle: "90-दिवसीय केंद्रित योजना", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "6-माह प्रीमियम", subtitle: "अर्ध-वार्षिक सुरक्षा", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "वार्षिक प्रीमियम", subtitle: "सर्वोत्तम मूल्य", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("माह"),
    perMonthSuffix: "/ माह",
    trustPoints: [
      "उसी Apple ID के साथ पुनर्स्थापना समर्थित।",
      "सर्वर सत्यापन के साथ सुरक्षित सक्रियण।",
    ],
    autoRenewDisclosure:
      "सदस्यता स्वचालित रूप से नवीनीकृत होती है। नवीनीकरण वर्तमान अवधि समाप्त होने से 24 घंटे पहले आपकी Apple ID पर शुल्क लिया जाता है। स्वचालित नवीनीकरण रोकने के लिए, अवधि समाप्ति से कम से कम 24 घंटे पहले रद्द करें। आप कभी भी Apple ID सेटिंग्स में प्रबंधित या रद्द कर सकते हैं।",

    headerChipAccessibility: "प्रीमियम अनुभाग",
    heroTitle: "प्रीमियम नियंत्रण केंद्र",
    heroSubtitle: "सभी सत्र, AI मार्गदर्शन, उन्नत आँकड़े और आगामी उपकरण अनलॉक करें।",
    loadingAccessibility: "प्रीमियम स्थिति लोड हो रही",
    statusLabel: "स्थिति",
    statusA11yPrefix: "स्थिति",
    featuresTitle: "प्रीमियम क्या अनलॉक करता है",
    featuresMetaSuffix: "विशेषताएँ",
    plansTitle: "योजना चुनें",
    plansReadySubtitle: "सभी योजनाएँ कभी भी रद्द की जा सकती हैं।",
    plansLoadingSubtitle: "स्टोर मूल्य लोड हो रहे...",
    plansFallbackSubtitle: "स्टोर मूल्य अनुपलब्ध। अनुमानित मूल्य दिखाए जा रहे।",
    processingLabel: "प्रसंस्करण...",
    buyLabel: "खरीदें",
    restorePurchasesLabel: "खरीद पुनर्स्थापित करें",
    securePurchaseTitle: "सुरक्षित खरीद",
    termsLabel: "उपयोग की शर्तें",
    privacyLabel: "गोपनीयता नीति",
    manageSubLabel: "सदस्यता प्रबंधन",

    accessCodeTitle: "पहुँच कोड",
    accessCodeSubtitle: "यदि बीटा पहुँच कोड है, तो प्रीमियम सक्रिय करने के लिए दर्ज करें।",
    accessCodePlaceholder: "पहुँच कोड",
    accessCodeInputA11y: "पहुँच कोड इनपुट",
    applyCodeLabel: "कोड उपयोग करें",

    liveSupportTitle: "लाइव समर्थन",
    liveSupportActiveSubtitle: "प्रीमियम उपयोगकर्ताओं के लिए समर्पित लाइव समर्थन।",
    liveSupportInactiveSubtitle: "लाइव समर्थन अनलॉक करने के लिए प्रीमियम पर अपग्रेड करें।",
    liveSupportAction: "लाइव चैट शुरू करें",

    gamblingTitle: "जुआ इच्छा प्रबंधन",
    gamblingSubtitle: "DNS-स्तर अवरोधन, अनुमति सूची और परीक्षण उपकरण।",
    gamblingManage: "प्रबंधन",
    gamblingUnlock: "प्रीमियम से अनलॉक",
    resetPremium: "प्रीमियम रीसेट",

    helpTitle: "सहायता",
    helpSubtitlePrefix: "प्रश्नों के लिए हमें लिखें",
    helpEmailAction: "ईमेल भेजें",

    statusChecking: "जाँच",
    statusCheckingValue: "प्रीमियम स्थिति लोड हो रही...",
    statusOff: "बंद",
    statusOffValue: "प्रीमियम पहुँच बंद",
    statusOffHint: "प्रीमियम के साथ सभी सत्र, AI मार्गदर्शन और आगामी उपकरण अनलॉक करें।",
    statusActive: "सक्रिय",
    statusActiveValue: "प्रीमियम पहुँच चालू",
    statusActiveHint: "पहुँच कोड या सदस्यता द्वारा सक्षम।",

    durationToday: "आज सक्रिय",
    durationOneDay: "1 दिन से सक्रिय",
    durationDays: (n) => `${n} दिनों से सक्रिय`,

    toastRedeemNotConfigured: { title: "सेवा अनुपलब्ध", message: "पहुँच कोड सत्यापन कॉन्फ़िगर नहीं है। बाद में पुनः प्रयास करें।" },
    toastRedeemNetwork: { title: "कनेक्शन त्रुटि", message: "सर्वर तक नहीं पहुँच पाए। अपना कनेक्शन जाँचें और पुनः प्रयास करें।" },
    toastRedeemInvalid: { title: "अमान्य कोड", message: "एक मान्य पहुँच कोड दर्ज करें।" },
    toastRedeemSuccess: { title: "प्रीमियम सक्रिय", message: "पहुँच कोड सत्यापित।" },
    toastRedeemError: { title: "त्रुटि", message: "ऑपरेशन पूरा नहीं हुआ। शीघ्र पुनः प्रयास करें।" },
    toastPurchaseUnsupported: { title: "स्टोर अनुपलब्ध", message: "इस डिवाइस पर खरीदारी समर्थित नहीं।" },
    toastPurchaseNotReady: { title: "स्टोर तैयार नहीं", message: "स्टोर उत्पाद अभी लोड नहीं हुए। कुछ सेकंड में पुनः प्रयास करें।" },
    toastPurchaseSuccess: { title: "धन्यवाद", message: "आपकी प्रीमियम सदस्यता अब सक्रिय है।" },
    toastPurchaseErrorTitle: "खरीद त्रुटि",
    toastPurchaseErrorMessage: (code) => `खरीद पूरी नहीं हुई (${code})। पुनः प्रयास करें।`,
    toastRestoreUnsupported: { title: "पुनर्स्थापित", message: "इस डिवाइस पर पुनर्स्थापना समर्थित नहीं।" },
    toastRestoreNotFound: { title: "पुनर्स्थापित", message: "इस Apple ID के लिए कोई सक्रिय प्रीमियम सदस्यता नहीं मिली।" },
    toastRestoreSuccess: { title: "पुनर्स्थापित", message: "आपकी प्रीमियम पहुँच पुनर्स्थापित।" },
    toastRestoreError: { title: "पुनर्स्थापना त्रुटि", message: "पुनर्स्थापना विफल। पुनः प्रयास करें।" },

    liveSupportEmailSubject: "प्रीमियम लाइव समर्थन",
  },

  km: {
    features: [
      { icon: "fitness", title: "អនាម័យខួរក្បាល - កម្មវិធី 7 ថ្ងៃ", description: "ជំហានជាក់ស្តែងដើម្បីសម្រេចបន្ថយដូប៉ាមីន៖ ដើរ ងូតទឹកត្រជាក់ ដកដង្ហើមជ្រៅ និងសម្រាកអេក្រង់។" },
      { icon: "git-network", title: "ផែនទីបណ្តាលឱ្យ", description: "ផែនទីពេលវេលា ទីកន្លែង អារម្មណ៍ និងមូលហេតុនៃការចង់ ជាមួយគំនិតដោះស្រាយផ្ទាល់ខ្លួន។" },
      { icon: "sparkles", title: "សម័យដឹងខ្លួនទាំងអស់", description: "ការចូលប្រើពេញលេញដល់ការអាណិត ការសម្រាកមុនដេក និងបណ្ណាល័យព្រីមៀម។" },
      { icon: "chatbubbles", title: "ការបង្វឹក AI ព្រីមៀម", description: "យុទ្ធសាស្ត្រដោះស្រាយវែងជាង និងជ្រៅជាង សមនឹងគំរូរបស់អ្នក។" },
      { icon: "headset", title: "ការគាំទ្រអាទិភាព", description: "ខ្សែគាំទ្រលឿនជាងសម្រាប់អ្នកប្រើព្រីមៀម។" },
      { icon: "ban", title: "បទពិសោធន៍គ្មានពាណិជ្ជកម្ម", description: "គ្មានពាណិជ្ជកម្ម គ្រាន់តែផ្តោតលើការងើបឡើងវិញរបស់អ្នក។" },
    ],
    plans: {
      monthly: { title: "ព្រីមៀមប្រចាំខែ", subtitle: "ការចាប់ផ្តើមដែលអាចបត់បែន", monthsForHint: 1 },
      quarterly: { title: "ព្រីមៀម 3 ខែ", subtitle: "ផែនការផ្តោត 90 ថ្ងៃ", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "ព្រីមៀម 6 ខែ", subtitle: "ការការពារពាក់កណ្តាលឆ្នាំ", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "ព្រីមៀមប្រចាំឆ្នាំ", subtitle: "តម្លៃល្អបំផុត", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("ខែ"),
    perMonthSuffix: "/ ខែ",
    trustPoints: [
      "ការស្តារឡើងវិញត្រូវបានគាំទ្រជាមួយ Apple ID ដូចគ្នា។",
      "ការធ្វើឱ្យសកម្មសុវត្ថិភាពជាមួយការផ្ទៀងផ្ទាត់ម៉ាស៊ីនមេ។",
    ],
    autoRenewDisclosure:
      "ការជាវនេះនឹងបន្តដោយស្វ័យប្រវត្តិ។ ការបន្តត្រូវបានគិតថ្លៃលើ Apple ID របស់អ្នកក្នុងរយៈពេល 24 ម៉ោងមុនការបញ្ចប់រយៈពេលបច្ចុប្បន្ន។ ដើម្បីបញ្ឈប់ការបន្តដោយស្វ័យប្រវត្តិ សូមលុបយ៉ាងហោចណាស់ 24 ម៉ោងមុនរយៈពេលបញ្ចប់។ អ្នកអាចគ្រប់គ្រងឬលុបនៅពេលណាក៏បានពីការកំណត់ Apple ID។",

    headerChipAccessibility: "ផ្នែកព្រីមៀម",
    heroTitle: "មជ្ឈមណ្ឌលគ្រប់គ្រងព្រីមៀម",
    heroSubtitle: "ដោះសោសម័យទាំងអស់ ការណែនាំ AI ស្ថិតិកម្រិតខ្ពស់ និងឧបករណ៍នាពេលអនាគត។",
    loadingAccessibility: "កំពុងផ្ទុកស្ថានភាពព្រីមៀម",
    statusLabel: "ស្ថានភាព",
    statusA11yPrefix: "ស្ថានភាព",
    featuresTitle: "អ្វីដែលព្រីមៀមដោះសោ",
    featuresMetaSuffix: "មុខងារ",
    plansTitle: "ជ្រើសរើសផែនការ",
    plansReadySubtitle: "ផែនការទាំងអស់អាចលុបនៅពេលណាក៏បាន។",
    plansLoadingSubtitle: "កំពុងផ្ទុកតម្លៃហាង...",
    plansFallbackSubtitle: "តម្លៃហាងមិនមាន។ បង្ហាញតម្លៃប៉ាន់ស្មាន។",
    processingLabel: "កំពុងដំណើរការ...",
    buyLabel: "ទិញ",
    restorePurchasesLabel: "ស្តារការទិញ",
    securePurchaseTitle: "ការទិញសុវត្ថិភាព",
    termsLabel: "លក្ខខណ្ឌប្រើប្រាស់",
    privacyLabel: "គោលការណ៍ឯកជនភាព",
    manageSubLabel: "គ្រប់គ្រងការជាវ",

    accessCodeTitle: "កូដចូលប្រើ",
    accessCodeSubtitle: "បើអ្នកមានកូដចូលប្រើបេតា សូមបញ្ចូលដើម្បីដំណើរការព្រីមៀម។",
    accessCodePlaceholder: "កូដចូលប្រើ",
    accessCodeInputA11y: "ការបញ្ចូលកូដចូលប្រើ",
    applyCodeLabel: "ប្រើកូដ",

    liveSupportTitle: "ការគាំទ្រផ្ទាល់",
    liveSupportActiveSubtitle: "ខ្សែគាំទ្រផ្ទាល់ឧទ្ទិសសម្រាប់អ្នកប្រើព្រីមៀម។",
    liveSupportInactiveSubtitle: "ឈានទៅព្រីមៀមដើម្បីដោះសោការគាំទ្រផ្ទាល់។",
    liveSupportAction: "ចាប់ផ្តើមជជែកផ្ទាល់",

    gamblingTitle: "ការគ្រប់គ្រងការចង់ល្បែង",
    gamblingSubtitle: "ការទប់ស្កាត់កម្រិត DNS បញ្ជីអនុញ្ញាត និងឧបករណ៍សាកល្បង។",
    gamblingManage: "គ្រប់គ្រង",
    gamblingUnlock: "ដោះសោជាមួយព្រីមៀម",
    resetPremium: "កំណត់ព្រីមៀមឡើងវិញ",

    helpTitle: "ជំនួយ",
    helpSubtitlePrefix: "សរសេរមកយើងសម្រាប់សំណួរ",
    helpEmailAction: "ផ្ញើអ៊ីមែល",

    statusChecking: "ពិនិត្យ",
    statusCheckingValue: "កំពុងផ្ទុកស្ថានភាពព្រីមៀម...",
    statusOff: "បិទ",
    statusOffValue: "ការចូលប្រើព្រីមៀមត្រូវបានបិទ",
    statusOffHint: "ដោះសោសម័យទាំងអស់ ការណែនាំ AI និងឧបករណ៍នាពេលអនាគតជាមួយព្រីមៀម។",
    statusActive: "សកម្ម",
    statusActiveValue: "ការចូលប្រើព្រីមៀមត្រូវបានបើក",
    statusActiveHint: "បានដំណើរការតាមរយៈកូដចូលប្រើឬការជាវ។",

    durationToday: "បានដំណើរការថ្ងៃនេះ",
    durationOneDay: "សកម្ម 1 ថ្ងៃ",
    durationDays: (n) => `សកម្ម ${n} ថ្ងៃ`,

    toastRedeemNotConfigured: { title: "សេវាមិនមាន", message: "ការផ្ទៀងផ្ទាត់កូដចូលប្រើមិនត្រូវបានកំណត់រចនាសម្ព័ន្ធ។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។" },
    toastRedeemNetwork: { title: "កំហុសការតភ្ជាប់", message: "មិនអាចទាក់ទងម៉ាស៊ីនមេបាន។ ពិនិត្យការតភ្ជាប់ហើយព្យាយាមម្តងទៀត។" },
    toastRedeemInvalid: { title: "កូដមិនត្រឹមត្រូវ", message: "សូមបញ្ចូលកូដចូលប្រើដែលត្រឹមត្រូវ។" },
    toastRedeemSuccess: { title: "ព្រីមៀមសកម្ម", message: "កូដចូលប្រើត្រូវបានផ្ទៀងផ្ទាត់។" },
    toastRedeemError: { title: "កំហុស", message: "ប្រតិបត្តិការមិនបានបញ្ចប់។ សូមព្យាយាមម្តងទៀតក្នុងពេលឆាប់ៗ។" },
    toastPurchaseUnsupported: { title: "ហាងមិនមាន", message: "ការទិញមិនត្រូវបានគាំទ្រនៅលើឧបករណ៍នេះទេ។" },
    toastPurchaseNotReady: { title: "ហាងមិនទាន់ត្រៀម", message: "ផលិតផលហាងមិនទាន់ផ្ទុក។ ព្យាយាមម្តងទៀតក្នុងវិនាទីពីរបី។" },
    toastPurchaseSuccess: { title: "អរគុណ", message: "ការជាវព្រីមៀមរបស់អ្នកសកម្មហើយ។" },
    toastPurchaseErrorTitle: "កំហុសការទិញ",
    toastPurchaseErrorMessage: (code) => `ការទិញមិនបានបញ្ចប់ (${code})។ សូមព្យាយាមម្តងទៀត។`,
    toastRestoreUnsupported: { title: "ស្តារ", message: "ការស្តារមិនត្រូវបានគាំទ្រនៅលើឧបករណ៍នេះទេ។" },
    toastRestoreNotFound: { title: "ស្តារ", message: "មិនមានការជាវព្រីមៀមសកម្មសម្រាប់ Apple ID នេះទេ។" },
    toastRestoreSuccess: { title: "បានស្តារ", message: "ការចូលប្រើព្រីមៀមរបស់អ្នកត្រូវបានស្តារ។" },
    toastRestoreError: { title: "កំហុសការស្តារ", message: "ការស្តារបរាជ័យ។ សូមព្យាយាមម្តងទៀត។" },

    liveSupportEmailSubject: "ការគាំទ្រផ្ទាល់ព្រីមៀម",
  },

  el: {
    features: [
      { icon: "fitness", title: "Υγιεινή Εγκεφάλου - 7-ήμερο reset", description: "Συγκεκριμένα βήματα reset ντοπαμίνης: περπάτημα, κρύο ντους, βαθιά αναπνοή, νηστεία οθόνης." },
      { icon: "git-network", title: "Χάρτης Εναυσμάτων", description: "Χαρτογραφεί χρόνο, τόπο, διάθεση και αιτίες παρόρμησης με προσωπικές ιδέες αντιμετώπισης." },
      { icon: "sparkles", title: "Όλες οι συνεδρίες επίγνωσης", description: "Πλήρης πρόσβαση σε συμπόνια, ηρεμία πριν τον ύπνο και premium βιβλιοθήκη." },
      { icon: "chatbubbles", title: "Premium AI coaching", description: "Μεγαλύτερες και βαθύτερες στρατηγικές αντιμετώπισης, προσαρμοσμένες σε εσένα." },
      { icon: "headset", title: "Προτεραιότητα στην υποστήριξη", description: "Ταχύτερη γραμμή υποστήριξης για premium χρήστες." },
      { icon: "ban", title: "Εμπειρία χωρίς διαφημίσεις", description: "Καμία διαφήμιση, μόνο επικέντρωση στην ανάρρωσή σου." },
    ],
    plans: {
      monthly: { title: "Μηνιαίο Premium", subtitle: "Ευέλικτη αρχή", monthsForHint: 1 },
      quarterly: { title: "Premium 3 μηνών", subtitle: "Πλάνο 90 ημερών", saveLabel: "-15%", monthsForHint: 3 },
      semiannual: { title: "Premium 6 μηνών", subtitle: "Εξαμηνιαία προστασία", saveLabel: "-30%", monthsForHint: 6 },
      annual: { title: "Ετήσιο Premium", subtitle: "Καλύτερη αξία", saveLabel: "-50%", best: true, monthsForHint: 12 },
    },
    fallbackPrices: FALLBACK_GENERIC("μήνα"),
    perMonthSuffix: "/ μήνα",
    trustPoints: [
      "Η επαναφορά υποστηρίζεται με το ίδιο Apple ID.",
      "Ασφαλής ενεργοποίηση με επαλήθευση διακομιστή.",
    ],
    autoRenewDisclosure:
      "Η συνδρομή ανανεώνεται αυτόματα. Η ανανέωση χρεώνεται στο Apple ID σου εντός 24 ωρών πριν το τέλος της τρέχουσας περιόδου. Για να σταματήσεις την αυτόματη ανανέωση, ακύρωσε τουλάχιστον 24 ώρες πριν το τέλος της περιόδου. Μπορείς να διαχειριστείς ή να ακυρώσεις ανά πάσα στιγμή στις ρυθμίσεις Apple ID.",

    headerChipAccessibility: "Ενότητα premium",
    heroTitle: "Κέντρο Ελέγχου Premium",
    heroSubtitle: "Ξεκλείδωσε όλες τις συνεδρίες, καθοδήγηση AI, προηγμένα στατιστικά και επερχόμενα εργαλεία.",
    loadingAccessibility: "Φόρτωση κατάστασης premium",
    statusLabel: "Κατάσταση",
    statusA11yPrefix: "Κατάσταση",
    featuresTitle: "Τι ξεκλειδώνει το premium",
    featuresMetaSuffix: "λειτουργίες",
    plansTitle: "Επίλεξε πλάνο",
    plansReadySubtitle: "Όλα τα πλάνα μπορούν να ακυρωθούν ανά πάσα στιγμή.",
    plansLoadingSubtitle: "Φόρτωση τιμών καταστήματος...",
    plansFallbackSubtitle: "Οι τιμές του καταστήματος δεν είναι διαθέσιμες. Εμφανίζονται εκτιμώμενες τιμές.",
    processingLabel: "Επεξεργασία...",
    buyLabel: "Αγορά",
    restorePurchasesLabel: "Επαναφορά αγορών",
    securePurchaseTitle: "Ασφαλής αγορά",
    termsLabel: "Όροι χρήσης",
    privacyLabel: "Πολιτική απορρήτου",
    manageSubLabel: "Διαχείριση συνδρομής",

    accessCodeTitle: "Κωδικός πρόσβασης",
    accessCodeSubtitle: "Αν έχεις beta κωδικό πρόσβασης, εισήγαγέ τον για ενεργοποίηση premium.",
    accessCodePlaceholder: "Κωδικός πρόσβασης",
    accessCodeInputA11y: "Εισαγωγή κωδικού πρόσβασης",
    applyCodeLabel: "Χρήση κωδικού",

    liveSupportTitle: "Ζωντανή Υποστήριξη",
    liveSupportActiveSubtitle: "Αποκλειστική γραμμή ζωντανής υποστήριξης για premium χρήστες.",
    liveSupportInactiveSubtitle: "Αναβάθμισε σε premium για να ξεκλειδώσεις ζωντανή υποστήριξη.",
    liveSupportAction: "Έναρξη συνομιλίας",

    gamblingTitle: "Διαχείριση παρόρμησης τζόγου",
    gamblingSubtitle: "Φραγή σε επίπεδο DNS, λίστα αποδεκτών και εργαλεία δοκιμής.",
    gamblingManage: "Διαχείριση",
    gamblingUnlock: "Ξεκλείδωμα με Premium",
    resetPremium: "Επαναφορά Premium",

    helpTitle: "Βοήθεια",
    helpSubtitlePrefix: "Γράψε μας για ερωτήσεις",
    helpEmailAction: "Αποστολή email",

    statusChecking: "Έλεγχ.",
    statusCheckingValue: "Φόρτωση κατάστασης premium...",
    statusOff: "Ανενεργό",
    statusOffValue: "Πρόσβαση premium ανενεργή",
    statusOffHint: "Ξεκλείδωσε όλες τις συνεδρίες, καθοδήγηση AI και επερχόμενα εργαλεία με premium.",
    statusActive: "Ενεργό",
    statusActiveValue: "Πρόσβαση premium ενεργή",
    statusActiveHint: "Ενεργοποιήθηκε μέσω κωδικού ή συνδρομής.",

    durationToday: "Ενεργοποιήθηκε σήμερα",
    durationOneDay: "Ενεργό για 1 ημέρα",
    durationDays: (n) => `Ενεργό για ${n} ημέρες`,

    toastRedeemNotConfigured: { title: "Υπηρεσία μη διαθέσιμη", message: "Η επαλήθευση κωδικών δεν είναι ρυθμισμένη. Δοκίμασε αργότερα." },
    toastRedeemNetwork: { title: "Σφάλμα σύνδεσης", message: "Δεν ήταν δυνατή η επικοινωνία με τον διακομιστή. Έλεγξε τη σύνδεση και δοκίμασε ξανά." },
    toastRedeemInvalid: { title: "Μη έγκυρος κωδικός", message: "Εισήγαγε έναν έγκυρο κωδικό πρόσβασης." },
    toastRedeemSuccess: { title: "Premium ενεργό", message: "Ο κωδικός πρόσβασης επαληθεύτηκε." },
    toastRedeemError: { title: "Σφάλμα", message: "Η ενέργεια δεν ολοκληρώθηκε. Δοκίμασε σύντομα ξανά." },
    toastPurchaseUnsupported: { title: "Κατάστημα μη διαθέσιμο", message: "Οι αγορές δεν υποστηρίζονται σε αυτή τη συσκευή." },
    toastPurchaseNotReady: { title: "Κατάστημα μη έτοιμο", message: "Τα προϊόντα του καταστήματος δεν έχουν φορτωθεί ακόμα. Δοκίμασε σε λίγα δευτερόλεπτα." },
    toastPurchaseSuccess: { title: "Ευχαριστούμε", message: "Η συνδρομή premium είναι ενεργή." },
    toastPurchaseErrorTitle: "Σφάλμα αγοράς",
    toastPurchaseErrorMessage: (code) => `Η αγορά δεν ολοκληρώθηκε (${code}). Δοκίμασε ξανά.`,
    toastRestoreUnsupported: { title: "Επαναφορά", message: "Η επαναφορά δεν υποστηρίζεται σε αυτή τη συσκευή." },
    toastRestoreNotFound: { title: "Επαναφορά", message: "Δεν βρέθηκε ενεργή συνδρομή premium για αυτό το Apple ID." },
    toastRestoreSuccess: { title: "Επαναφέρθηκε", message: "Η πρόσβαση premium επαναφέρθηκε." },
    toastRestoreError: { title: "Σφάλμα επαναφοράς", message: "Η επαναφορά απέτυχε. Δοκίμασε ξανά." },

    liveSupportEmailSubject: "Premium Ζωντανή Υποστήριξη",
  },
};

export function getPremiumLocale(language: Language): PremiumLocale {
  return PREMIUM_LOCALES[language] ?? PREMIUM_LOCALES.en;
}
