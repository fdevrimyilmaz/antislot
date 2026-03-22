import {
  PremiumCodeActivation,
  PremiumFeatureList,
  PremiumPlanCards,
  PremiumRestoreButton,
  PremiumStatusCard,
  PremiumSystemStatus,
  type PlanId,
} from "@/components/premium";
import { ENABLE_PREMIUM_CODE_ACTIVATION, PREMIUM_FREE_FOR_NOW } from "@/constants/featureFlags";
import { Fonts, Radius } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePremium } from "@/hooks/usePremium";
import {
  attachIapLifecycle,
  detachIapLifecycle,
  endConnection,
  getIosReceipt,
  getIapOffers,
  purchaseLifetime,
  purchaseMonthly,
  purchaseYearly,
  restorePurchases as iapRestore,
  type IapOffer,
  type IapResult,
} from "@/services/iap";
import { activatePremium } from "@/services/premiumApi";
import { usePremiumStore } from "@/store/premiumStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "support@antislot.app";
const EMPTY_OFFERS: Record<PlanId, IapOffer | null> = {
  monthly: null,
  yearly: null,
  lifetime: null,
};
const isPremiumFree = PREMIUM_FREE_FOR_NOW;

const COPY = {
  tr: {
    heroTitle: "Premium ile guclu kalkan",
    heroBody: "Nuks riskini azaltmak icin daha derin analiz, canli destek ve hizli aksiyon paneli.",
    points: [
      "Anlik risk takibi",
      "Oncelikli canli destek",
      "Yuksek motivasyon protokolleri",
    ],
    impactTitle: "Premium kazanci",
    impact: [
      { title: "Risk Radari", body: "Tetikleyici dalgalanmalarini erken yakala." },
      { title: "Aksiyon Paneli", body: "Durtu aninda tek dokunusla savunma ac." },
      { title: "Canli Destek", body: "Zor anda daha hizli destek baglantisi kur." },
    ],
    purchaseStatus: "Satin alma durumu",
    checking: "Kontrol ediliyor...",
    trustTitle: "Guvenli satin alma",
    trustItems: [
      "Abonelik diledigin zaman iptal edilir.",
      "Ayni hesapta geri yukleme desteklenir.",
      "Sunucu dogrulamasi ile guvenli aktivasyon.",
    ],
    guaranteeTitle: "7 gun odak protokolu",
    guaranteeBody: "Premium acildiginda ilk hafta icin gunluk koruma gorevleri otomatik acilir.",
    iapDisabled: "Satin alma su an kapali.",
    storeNotReady: "Magaza urunleri henuz hazir degil.",
    purchaseTitle: "Satin alma",
    purchaseFailed: "Satin alma basarisiz oldu.",
    purchaseDisabled: "Satin alma su an devre disi.",
    storeUnavailable: "Magaza erisilemedi.",
    receiptMissing: "Odeme tamamlandi ama makbuz bulunamadi. Geri yukleme deneyin.",
    successTitle: "Basarili",
    premiumUnlocked: "Premium erisimi acildi.",
    actionFailed: "Islem basarisiz",
    genericError: "Bir hata olustu.",
    restoreTitle: "Geri yukleme",
    restoreFailedTitle: "Geri yukleme basarisiz",
    restoreServerActive: "Sunucudaki abonelik aktif olarak geri yuklendi.",
    restoreServerNone: "Sunucuda aktif abonelik bulunamadi.",
    restoreUnavailable: "Magaza ve sunucu dogrulamasi su an kullanilamiyor.",
    restoreNotFound: "Geri yuklenecek satin alim bulunamadi.",
    restoreSuccess: "Satin alimlar geri yuklendi.",
    restoreNoVerifiable: "Dogrulanabilir satin alim bulunamadi.",
    premiumActiveTitle: "Premium aktif",
    premiumActiveBody: "Erisim kodu dogrulandi.",
    invalidCodeTitle: "Gecersiz kod",
    invalidCodeBody: "Lutfen gecerli bir kod gir.",
    resetPremium: "Premium sifirla",
    helpTitle: "Yardim",
    helpBody: "Bize yaz",
    sendEmail: "E-posta gonder",
    featureTitleFree: "Acik ozellikler",
    featureTitlePaid: "Premium ozellikler",
    featureLabels: {
      blocker: "Kumar engelleyici",
      live_support: "Canli destek",
      advanced_stats: "Gelismis istatistikler",
      premium_sessions: "Premium seanslar",
      premium_insights: "Premium icgoruler",
      premium_ai_features: "Premium AI destek",
    },
    liveSupportTitle: "Canli destek",
    liveSupportBody: "Premium ile oncelikli destek kanalina baglan.",
    liveSupportAction: "Canli destegi ac",
    liveSupportSubject: "Premium Canli Destek",
    planCards: {
      plans: [
        { id: "monthly", label: "Aylik Premium", sublabel: "Esnek baslangic", fallbackPrice: "$8.99 / ay", valueNote: "Tum araclar acik", ctaLabel: "Ayligi baslat" },
        { id: "yearly", label: "Yillik Premium", sublabel: "En iyi deger", badge: "En iyi deger", fallbackPrice: "$59.99 / yil", fallbackOriginalPrice: "$107.88 / yil", valueNote: "12 ay planli koruma", ctaLabel: "Yilligi sec", highlight: true },
        { id: "lifetime", label: "Omur Boyu", sublabel: "Tek odeme", fallbackPrice: "$119.99 tek odeme", valueNote: "Kalici erisim", ctaLabel: "Omur boyu ac" },
      ] as const,
      activeLabel: "Premium aktif",
      comingSoonLabel: "Yakinda",
      comingSoonSubLabel: "Satin alma gecici olarak kapali",
      selectLabel: "Plani sec",
      activeOtherLabel: "Hesap aktif",
      yearlySavingsBadge: (percent: number) => `%${percent} tasarruf`,
      yearlyValueNote: (percent: number, monthly: string | null) => (monthly ? `%${percent} tasarruf, ortalama ${monthly}` : `%${percent} tasarruf`),
    },
    status: {
      statusLabel: "Durum",
      loadingBadge: "Kontrol",
      loadingValue: "Premium durumu yukleniyor...",
      freeBadge: "Ucretsiz",
      freeValue: "Tum ozellikler su an acik",
      freeHint: "Ucretli planlar daha sonra acilabilir.",
      inactiveBadge: "Kapali",
      inactiveValue: "Premium erisimi kapali",
      inactiveHint: "Koruma seviyesini yukselterek ac.",
      trialBadge: "Deneme",
      trialValue: "Premium deneme aktif",
      trialHint: (days: number) => `${days} gun deneme kaldi`,
      planLabels: { subscription_monthly: "Aylik", subscription_yearly: "Yillik", lifetime: "Omur boyu", code: "Kod", admin: "Admin", trial: "Deneme" },
      activeFallbackLabel: "Aktif",
      activeValue: (plan: string) => `${plan} Premium aktif`,
      activeHintLifetime: "Bu hesapta premium kalici aktif.",
      activeHintRenewalPrefix: "Yenileme",
      activeHintSubscription: "Abonelik aktif.",
    },
    codeActivation: { title: "Erisim kodu", subtitle: "Kampanya kodunu burada kullan.", inputPlaceholder: "Erisim kodu", actionLabel: "Kodu kullan", loadingLabel: "..." },
    restoreButton: { label: "Satin alimi geri yukle", loadingLabel: "Geri yukleniyor..." },
    system: { lastSyncPrefix: "Son senkron", noSyncLabel: "Henuz senkron yok", errorPrefix: "Hata", refreshLabel: "Yenile" },
  },
  en: {
    heroTitle: "Premium recovery shield",
    heroBody: "Reduce relapse risk with deeper insights, faster support, and instant action tools.",
    points: ["Live risk tracking", "Priority live support", "Structured motivation protocols"],
    impactTitle: "Premium outcomes",
    impact: [
      { title: "Risk Radar", body: "Detect trigger spikes early." },
      { title: "Action Panel", body: "Launch defense routines in one tap." },
      { title: "Live Support", body: "Reach help faster when pressure rises." },
    ],
    purchaseStatus: "Purchase status",
    checking: "Checking...",
    trustTitle: "Secure billing",
    trustItems: ["Subscriptions can be canceled anytime.", "Purchases can be restored on the same account.", "Server-side validation protects activation."],
    guaranteeTitle: "7-day focus protocol",
    guaranteeBody: "After activation, daily protection tasks unlock for your first week.",
    iapDisabled: "Purchases are currently disabled.",
    storeNotReady: "Store products are not ready yet.",
    purchaseTitle: "Purchase",
    purchaseFailed: "Purchase failed.",
    purchaseDisabled: "Purchases are disabled.",
    storeUnavailable: "Store is unavailable.",
    receiptMissing: "Payment completed but no receipt was found. Try restore.",
    successTitle: "Success",
    premiumUnlocked: "Premium access unlocked.",
    actionFailed: "Action failed",
    genericError: "An error occurred.",
    restoreTitle: "Restore",
    restoreFailedTitle: "Restore failed",
    restoreServerActive: "Server subscription status restored.",
    restoreServerNone: "No active subscription found on server.",
    restoreUnavailable: "Store and server verification unavailable.",
    restoreNotFound: "No purchases found.",
    restoreSuccess: "Purchases restored.",
    restoreNoVerifiable: "No verifiable purchase found.",
    premiumActiveTitle: "Premium active",
    premiumActiveBody: "Access code verified.",
    invalidCodeTitle: "Invalid code",
    invalidCodeBody: "Please enter a valid code.",
    resetPremium: "Reset premium",
    helpTitle: "Help",
    helpBody: "Contact us",
    sendEmail: "Send email",
    featureTitleFree: "Available features",
    featureTitlePaid: "Premium features",
    featureLabels: {
      blocker: "Gambling blocker",
      live_support: "Live support",
      advanced_stats: "Advanced stats",
      premium_sessions: "Premium sessions",
      premium_insights: "Premium insights",
      premium_ai_features: "Premium AI support",
    },
    liveSupportTitle: "Live support",
    liveSupportBody: "Unlock priority support channel with Premium.",
    liveSupportAction: "Open live support",
    liveSupportSubject: "Premium Live Support",
    planCards: {
      plans: [
        { id: "monthly", label: "Monthly Premium", sublabel: "Flexible start", fallbackPrice: "$8.99 / month", valueNote: "All tools unlocked", ctaLabel: "Start monthly" },
        { id: "yearly", label: "Yearly Premium", sublabel: "Best value", badge: "Best value", fallbackPrice: "$59.99 / year", fallbackOriginalPrice: "$107.88 / year", valueNote: "12 months structured protection", ctaLabel: "Choose yearly", highlight: true },
        { id: "lifetime", label: "Lifetime", sublabel: "One-time payment", fallbackPrice: "$119.99 one-time", valueNote: "Permanent access", ctaLabel: "Unlock lifetime" },
      ] as const,
      activeLabel: "Premium active",
      comingSoonLabel: "Coming soon",
      comingSoonSubLabel: "Purchases are temporarily unavailable",
      selectLabel: "Choose plan",
      activeOtherLabel: "Account active",
      yearlySavingsBadge: (percent: number) => `${percent}% savings`,
      yearlyValueNote: (percent: number, monthly: string | null) => (monthly ? `${percent}% savings, avg ${monthly}` : `${percent}% savings`),
    },
    status: {
      statusLabel: "Status",
      loadingBadge: "Check",
      loadingValue: "Loading premium status...",
      freeBadge: "Free",
      freeValue: "All features are currently available",
      freeHint: "Paid plans may be enabled later.",
      inactiveBadge: "Inactive",
      inactiveValue: "Premium is locked",
      inactiveHint: "Upgrade your protection level.",
      trialBadge: "Trial",
      trialValue: "Premium trial active",
      trialHint: (days: number) => `${days} days of trial left`,
      planLabels: { subscription_monthly: "Monthly", subscription_yearly: "Yearly", lifetime: "Lifetime", code: "Code", admin: "Admin", trial: "Trial" },
      activeFallbackLabel: "Active",
      activeValue: (plan: string) => `${plan} Premium active`,
      activeHintLifetime: "This account has permanent premium access.",
      activeHintRenewalPrefix: "Renews",
      activeHintSubscription: "Subscription active.",
    },
    codeActivation: { title: "Access code", subtitle: "Use campaign code here.", inputPlaceholder: "Access code", actionLabel: "Use code", loadingLabel: "..." },
    restoreButton: { label: "Restore purchases", loadingLabel: "Restoring..." },
    system: { lastSyncPrefix: "Last sync", noSyncLabel: "No sync yet", errorPrefix: "Error", refreshLabel: "Refresh" },
  },
} as const;

function resolvePlanId(source: string | null | undefined): PlanId | null {
  if (source === "subscription_monthly") return "monthly";
  if (source === "subscription_yearly") return "yearly";
  if (source === "lifetime") return "lifetime";
  return null;
}

function parseReceipt(purchase: unknown): string {
  if (!purchase || typeof purchase !== "object") return "";
  const item = purchase as Record<string, unknown>;
  if (typeof item.transactionReceipt === "string" && item.transactionReceipt.trim()) {
    return item.transactionReceipt.trim();
  }
  if (typeof item.purchaseToken === "string" && item.purchaseToken.trim()) {
    return item.purchaseToken.trim();
  }
  return "";
}

function extractReceipts(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.map((row) => parseReceipt(row)).filter((value) => value.length > 0);
}

function formatMicrosCurrency(micros: number, currency: string, locale: string): string {
  const amount = micros / 1_000_000;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default function PremiumScreen() {
  const router = useRouter();
  const canGoBack = typeof router.canGoBack === "function" ? router.canGoBack() : false;
  const { t, language, locale } = useLanguage();
  const { colors } = useTheme();
  const copy = COPY[language === "en" ? "en" : "tr"];
  const { isActive: isPremiumActive, hasFeature, lastSync, syncError, loading } = usePremium();

  const premiumState = usePremiumStore((s) => s.state);
  const hydrate = usePremiumStore((s) => s.hydrate);
  const syncWithServer = usePremiumStore((s) => s.syncWithServer);
  const clearPremium = usePremiumStore((s) => s.clearPremium);

  const [iapOffers, setIapOffers] = useState<Record<PlanId, IapOffer | null>>(EMPTY_OFFERS);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isPremiumFree) return;
    let active = true;
    attachIapLifecycle();

    const loadIap = async () => {
      const offers = await getIapOffers(true);
      if (!active) return;
      setIapOffers(offers.ok ? offers.offers : { ...EMPTY_OFFERS });
    };

    loadIap();

    return () => {
      active = false;
      detachIapLifecycle();
      endConnection().catch(() => {});
    };
  }, []);

  const activePlanId = resolvePlanId(premiumState.source);

  const pricingInsight = useMemo(() => {
    const monthly = iapOffers.monthly;
    const yearly = iapOffers.yearly;
    if (!monthly?.priceAmountMicros || !yearly?.priceAmountMicros || !monthly.currency || monthly.currency !== yearly.currency) {
      return { percent: null as number | null, monthlyAverage: null as string | null, original: null as string | null };
    }
    const monthlyAnnual = monthly.priceAmountMicros * 12;
    if (monthlyAnnual <= yearly.priceAmountMicros) {
      return { percent: null, monthlyAverage: null, original: null };
    }
    const percent = Math.round(((monthlyAnnual - yearly.priceAmountMicros) / monthlyAnnual) * 100);
    return {
      percent,
      monthlyAverage: formatMicrosCurrency(yearly.priceAmountMicros / 12, yearly.currency, locale),
      original: formatMicrosCurrency(monthlyAnnual, yearly.currency, locale),
    };
  }, [iapOffers.monthly, iapOffers.yearly, locale]);

  const planItems = useMemo(() => {
    return copy.planCards.plans.map((plan) => {
      const resolvedPlan = plan as {
        id: PlanId;
        label: string;
        sublabel?: string;
        fallbackPrice: string;
        fallbackOriginalPrice?: string;
        valueNote: string;
        ctaLabel?: string;
        badge?: string;
        highlight?: boolean;
      };
      const offer = iapOffers[resolvedPlan.id];
      const storeOfferReady = !!offer;
      let badge = resolvedPlan.badge;
      let valueNote = resolvedPlan.valueNote;
      let originalPriceLabel = resolvedPlan.fallbackOriginalPrice;
      let ctaLabel = resolvedPlan.ctaLabel;
      let disabled = !storeOfferReady;

      if (resolvedPlan.id === "yearly" && storeOfferReady && pricingInsight.percent && pricingInsight.percent > 0) {
        badge = copy.planCards.yearlySavingsBadge(pricingInsight.percent);
        valueNote = copy.planCards.yearlyValueNote(pricingInsight.percent, pricingInsight.monthlyAverage);
        if (pricingInsight.original) originalPriceLabel = pricingInsight.original;
      }

      if (!storeOfferReady) {
        badge = copy.planCards.comingSoonLabel;
        valueNote = copy.planCards.comingSoonSubLabel;
        ctaLabel = copy.planCards.comingSoonLabel;
        disabled = true;
      }

      return {
        id: resolvedPlan.id,
        label: resolvedPlan.label,
        sublabel: resolvedPlan.sublabel,
        badge,
        priceLabel: storeOfferReady ? (offer?.priceLabel ?? resolvedPlan.fallbackPrice) : undefined,
        originalPriceLabel,
        valueNote,
        ctaLabel,
        highlight: !!resolvedPlan.highlight,
        disabled,
        disabledLabel: copy.planCards.comingSoonSubLabel,
      };
    });
  }, [copy.planCards, iapOffers, pricingInsight]);

  const handleApplyCode = async (code: string) => {
    try {
      await usePremiumStore.getState().activateCode(code);
      Alert.alert(copy.premiumActiveTitle, copy.premiumActiveBody);
    } catch {
      Alert.alert(copy.invalidCodeTitle, copy.invalidCodeBody);
    }
  };

  const handlePurchase = async (planId: PlanId, iapFn: () => Promise<IapResult>) => {
    if (!iapOffers[planId]) {
      Alert.alert(copy.purchaseTitle, copy.storeNotReady);
      return;
    }

    try {
      const result = await iapFn();
      if (!result.ok) {
        const message = result.message || (result.code === "disabled" ? copy.purchaseDisabled : result.code === "not_ready" ? copy.storeNotReady : result.code === "store_unavailable" ? copy.storeUnavailable : copy.purchaseFailed);
        Alert.alert(copy.purchaseTitle, message);
        return;
      }
      const platform = Platform.OS === "android" ? "android" : "ios";
      const purchaseReceipts = extractReceipts(Array.isArray(result.data) ? result.data : [result.data]);
      let receipt = purchaseReceipts[0] ?? "";

      if (platform === "ios") {
        const iosReceipt = await getIosReceipt();
        if (iosReceipt.ok && typeof iosReceipt.data === "string" && iosReceipt.data.trim().length > 0) {
          receipt = iosReceipt.data.trim();
        }
      }

      if (!receipt) {
        Alert.alert(copy.purchaseTitle, copy.receiptMissing);
        return;
      }
      await activatePremium({ receipt, platform });
      await syncWithServer();
      Alert.alert(copy.successTitle, copy.premiumUnlocked);
    } catch (error: unknown) {
      Alert.alert(copy.actionFailed, error instanceof Error ? error.message : copy.genericError);
    }
  };
  const handleRestore = async () => {
    try {
      const result = await iapRestore();
      if (!result.ok) {
        if (result.code === "disabled" || result.code === "store_unavailable") {
          try {
            await usePremiumStore.getState().restorePurchases();
            await syncWithServer();
            const active = usePremiumStore.getState().state.isActive;
            Alert.alert(copy.restoreTitle, active ? copy.restoreServerActive : copy.restoreServerNone);
            return;
          } catch {
            Alert.alert(copy.restoreFailedTitle, result.message ?? copy.restoreUnavailable);
            return;
          }
        }
        Alert.alert(copy.restoreFailedTitle, result.message ?? copy.restoreNotFound);
        return;
      }

      const platform = Platform.OS === "android" ? "android" : "ios";
      const receiptSet = new Set<string>();
      for (const receipt of extractReceipts(result.data)) {
        if (receipt.trim()) receiptSet.add(receipt.trim());
      }
      if (platform === "ios") {
        const iosReceipt = await getIosReceipt();
        if (iosReceipt.ok && typeof iosReceipt.data === "string" && iosReceipt.data.trim().length > 0) {
          receiptSet.add(iosReceipt.data.trim());
        }
      }

      const receipts = Array.from(receiptSet);
      if (receipts.length > 0) {
        for (const receipt of receipts) {
          await activatePremium({ receipt, platform });
        }
        await syncWithServer();
        Alert.alert(copy.restoreTitle, copy.restoreSuccess);
        return;
      }

      try {
        await usePremiumStore.getState().restorePurchases();
        await syncWithServer();
        const active = usePremiumStore.getState().state.isActive;
        Alert.alert(copy.restoreTitle, active ? copy.restoreServerActive : copy.restoreNoVerifiable);
      } catch {
        Alert.alert(copy.restoreTitle, copy.restoreNoVerifiable);
      }
    } catch (error: unknown) {
      Alert.alert(copy.restoreFailedTitle, error instanceof Error ? error.message : copy.genericError);
    }
  };

  const liveSupportLocked = !(isPremiumActive || hasFeature("live_support"));

  return (
    <LinearGradient
      colors={[colors.backgroundGradient[0], colors.backgroundGradient[1], ...(colors.backgroundGradient.slice(2) || [])] as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container} testID="premium-screen">
        <ScrollView contentContainerStyle={styles.content}>
          {canGoBack ? (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} testID="premium-back">
              <Text style={[styles.backButtonText, { color: colors.text }]}>{t.back}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.heroCard, { borderColor: colors.border }]}> 
            <Text style={[styles.heroTitle, { color: colors.text }]}>{copy.heroTitle}</Text>
            <Text style={[styles.heroBody, { color: colors.textSecondary }]}>{copy.heroBody}</Text>
            {copy.points.map((item) => (
              <Text key={item} style={[styles.heroPoint, { color: colors.text }]}>+ {item}</Text>
            ))}
          </View>

          <PremiumStatusCard state={premiumState} loading={loading} freeMode={isPremiumFree} locale={locale} {...copy.status} cardColor={colors.card} borderColor={colors.border} textColor={colors.text} labelColor={colors.textSecondary} />

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{copy.impactTitle}</Text>
            {copy.impact.map((item) => (
              <View key={item.title} style={[styles.impactRow, { borderTopColor: colors.border }]}> 
                <Text style={[styles.impactTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.impactBody, { color: colors.textSecondary }]}>{item.body}</Text>
              </View>
            ))}
          </View>

          <PremiumFeatureList
            hasFeature={hasFeature}
            title={isPremiumFree ? copy.featureTitleFree : copy.featureTitlePaid}
            labels={copy.featureLabels}
            cardColor={colors.card}
            borderColor={colors.border}
            textColor={colors.text}
          />

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{copy.liveSupportTitle}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}> 
              {liveSupportLocked ? copy.liveSupportBody : copy.liveSupportBody}
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, liveSupportLocked && styles.disabledButton]}
              onPress={() => router.push("/community/room/kriz?direct=1" as Href)}
              disabled={liveSupportLocked}
            >
              <Text style={styles.primaryButtonText}>{copy.liveSupportAction}</Text>
            </TouchableOpacity>
          </View>

          {!isPremiumFree ? (
            <>
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>{copy.trustTitle}</Text>
                {copy.trustItems.map((item) => (
                  <Text key={item} style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 4 }]}>- {item}</Text>
                ))}
              </View>

              <PremiumPlanCards
                isPremiumActive={!!isPremiumActive}
                activePlanId={activePlanId}
                onMonthly={() => handlePurchase("monthly", purchaseMonthly)}
                onYearly={() => handlePurchase("yearly", purchaseYearly)}
                onLifetime={() => handlePurchase("lifetime", purchaseLifetime)}
                plans={planItems}
                activeLabel={copy.planCards.activeLabel}
                selectLabel={copy.planCards.selectLabel}
                activeOtherLabel={copy.planCards.activeOtherLabel}
              />

              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>{copy.guaranteeTitle}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 0 }]}>{copy.guaranteeBody}</Text>
              </View>

              <PremiumRestoreButton
                onRestore={handleRestore}
                label={copy.restoreButton.label}
                loadingLabel={copy.restoreButton.loadingLabel}
                cardColor={colors.card}
                borderColor={colors.border}
                textColor={colors.primary}
              />

              {isPremiumActive ? (
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={async () => clearPremium()}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.resetPremium}</Text>
                </TouchableOpacity>
              ) : null}

              {ENABLE_PREMIUM_CODE_ACTIVATION ? (
                <PremiumCodeActivation
                  onApply={handleApplyCode}
                  title={copy.codeActivation.title}
                  subtitle={copy.codeActivation.subtitle}
                  inputPlaceholder={copy.codeActivation.inputPlaceholder}
                  actionLabel={copy.codeActivation.actionLabel}
                  loadingLabel={copy.codeActivation.loadingLabel}
                  cardColor={colors.card}
                  borderColor={colors.border}
                  textColor={colors.text}
                  placeholderColor={colors.textSecondary}
                  buttonColor={colors.primary}
                />
              ) : null}
            </>
          ) : null}

          <PremiumSystemStatus
            lastSync={lastSync}
            syncError={syncError}
            onSync={syncWithServer}
            locale={locale}
            lastSyncPrefix={copy.system.lastSyncPrefix}
            noSyncLabel={copy.system.noSyncLabel}
            errorPrefix={copy.system.errorPrefix}
            refreshLabel={copy.system.refreshLabel}
            cardColor={colors.card}
            borderColor={colors.border}
            textColor={colors.text}
          />

          <View style={[styles.sectionCard, styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{copy.helpTitle}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{copy.helpBody}: {SUPPORT_EMAIL}</Text>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.sendEmail}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, alignItems: "center" },
  backButton: { alignSelf: "flex-start", marginBottom: 16 },
  backButtonText: { fontSize: 15, fontFamily: Fonts.bodyMedium },
  heroCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  heroTitle: { fontSize: 23, lineHeight: 30, fontFamily: Fonts.display, marginBottom: 8 },
  heroBody: { fontSize: 13, lineHeight: 18, fontFamily: Fonts.body, marginBottom: 10 },
  heroPoint: { fontSize: 12, lineHeight: 18, fontFamily: Fonts.bodyMedium, marginBottom: 4 },
  sectionCard: {
    width: "100%",
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.bodySemiBold, marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, lineHeight: 18, fontFamily: Fonts.body, marginBottom: 10 },
  impactRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 6 },
  impactTitle: { fontSize: 13, fontFamily: Fonts.bodySemiBold, marginBottom: 4 },
  impactBody: { fontSize: 12, lineHeight: 17, fontFamily: Fonts.body },
  primaryButton: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontFamily: Fonts.bodySemiBold },
  secondaryButton: {
    width: "100%",
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  secondaryButtonText: { fontFamily: Fonts.bodySemiBold },
  disabledButton: { opacity: 0.5 },
  contactCard: { marginBottom: 8 },
});
