import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ImageBackground,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type ProductSubscription,
  type Purchase,
  type PurchaseError,
} from "react-native-iap";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { type Theme } from "@/store/themeStore";
import {
  clearPremium,
  getPremiumState,
  setPremiumActive,
  type PremiumState,
} from "@/store/premiumStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";

const SUPPORT_EMAIL = "support@antislot.app";
const GAMBLING_CARD_IMAGE =
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80";

const PREMIUM_BENEFITS = [
  "Premium farkindalik seanslari",
  "Yapay ANTI'de premium ipuclari",
  "Derinlestirilmis destek planlari",
  "Reklamsiz, odakli deneyim",
];

type PlanId = "monthly" | "quarterly" | "semiannual" | "annual";

type SubscriptionPlan = {
  id: PlanId;
  title: string;
  subtitle: string;
};

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    title: "Aylik Premium",
    subtitle: "Esnek baslangic",
  },
  {
    id: "quarterly",
    title: "3 Aylik Premium",
    subtitle: "90 gun odakli paket",
  },
  {
    id: "semiannual",
    title: "6 Aylik Premium",
    subtitle: "Yari yillik koruma",
  },
  {
    id: "annual",
    title: "Yillik Premium",
    subtitle: "En iyi deger",
  },
];

const IOS_MONTHLY_SKU = (process.env.EXPO_PUBLIC_IAP_IOS_MONTHLY_SKU || "").trim();
const IOS_QUARTERLY_SKU = (process.env.EXPO_PUBLIC_IAP_IOS_QUARTERLY_SKU || "").trim();
const IOS_SEMIANNUAL_SKU = (process.env.EXPO_PUBLIC_IAP_IOS_SEMIANNUAL_SKU || "").trim();
const IOS_ANNUAL_SKU = (process.env.EXPO_PUBLIC_IAP_IOS_ANNUAL_SKU || "").trim();

const IOS_SKU_ENV_KEYS: Record<PlanId, string> = {
  monthly: "EXPO_PUBLIC_IAP_IOS_MONTHLY_SKU",
  quarterly: "EXPO_PUBLIC_IAP_IOS_QUARTERLY_SKU",
  semiannual: "EXPO_PUBLIC_IAP_IOS_SEMIANNUAL_SKU",
  annual: "EXPO_PUBLIC_IAP_IOS_ANNUAL_SKU",
};

const IOS_PLAN_SKUS: Record<PlanId, string | null> = {
  monthly: IOS_MONTHLY_SKU || null,
  quarterly: IOS_QUARTERLY_SKU || null,
  semiannual: IOS_SEMIANNUAL_SKU || null,
  annual: IOS_ANNUAL_SKU || null,
};

const CONFIGURED_IOS_SKUS = Array.from(
  new Set(Object.values(IOS_PLAN_SKUS).filter((sku): sku is string => Boolean(sku)))
);

const ENABLE_IAP_FLAG = (process.env.EXPO_PUBLIC_ENABLE_IAP || "false").trim().toLowerCase();
const IS_IAP_ENABLED = ENABLE_IAP_FLAG === "true" || ENABLE_IAP_FLAG === "1" || ENABLE_IAP_FLAG === "yes";

const BASE_CHART_VALUES = [20, 34, 47, 62, 78, 90];

const THEME_ICONS: Record<
  Theme,
  { hero: string; spark: string; support: string; chart: string; guard: string }
> = {
  white: {
    hero: "💎",
    spark: "✨",
    support: "🛟",
    chart: "📈",
    guard: "🛡️",
  },
  "twitter-blue": {
    hero: "💎",
    spark: "✨",
    support: "🛟",
    chart: "📈",
    guard: "🛡️",
  },
  black: {
    hero: "💎",
    spark: "✨",
    support: "🛟",
    chart: "📈",
    guard: "🛡️",
  },
  sunset: {
    hero: "💎",
    spark: "✨",
    support: "🛟",
    chart: "📈",
    guard: "🛡️",
  },
  forest: {
    hero: "💎",
    spark: "✨",
    support: "🛟",
    chart: "📈",
    guard: "🛡️",
  },
  midnight: {
    hero: "💎",
    spark: "✨",
    support: "🛟",
    chart: "📈",
    guard: "🛡️",
  },
};

const STATUS_TONES = {
  active: { background: "#D1FADF", text: "#027A48" },
  inactive: { background: "#FEE4E2", text: "#B42318" },
  neutral: { background: "#F2F4F7", text: "#667085" },
} as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Beklenmeyen bir hata olustu.";
}

function pickLatestKnownPurchase(purchases: Purchase[], knownSkus: Set<string>): Purchase | null {
  const known = purchases
    .filter((purchase) => knownSkus.has(purchase.productId))
    .sort((a, b) => (b.transactionDate || 0) - (a.transactionDate || 0));

  return known[0] || null;
}

function getPlanPriceLabel(product?: ProductSubscription): string {
  if (!product) return "Fiyat bekleniyor";
  if (product.displayPrice) return product.displayPrice;
  if (typeof product.price === "number" && product.currency) return `${product.price} ${product.currency}`;
  return "Fiyat hazir";
}

export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, colors } = useTheme();
  const icons = THEME_ICONS[theme];
  const { userAddictions } = useUserAddictionsStore();

  const [premiumState, setPremiumState] = useState<PremiumState | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeReady, setStoreReady] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<PlanId | null>(null);
  const [storeProducts, setStoreProducts] = useState<Record<string, ProductSubscription>>({});

  const isIosIapFlow = Platform.OS === "ios" && IS_IAP_ENABLED;
  const configuredSkuSet = useMemo(() => new Set(CONFIGURED_IOS_SKUS), []);

  const missingSkuEnvKeys = useMemo(
    () => SUBSCRIPTION_PLANS.filter((plan) => !IOS_PLAN_SKUS[plan.id]).map((plan) => IOS_SKU_ENV_KEYS[plan.id]),
    []
  );

  useEffect(() => {
    (async () => {
      const state = await getPremiumState();
      setPremiumState(state);
      setLoading(false);
    })();
  }, []);

  const refreshStoreProducts = useCallback(async () => {
    if (CONFIGURED_IOS_SKUS.length === 0) {
      setStoreProducts({});
      return;
    }

    const products =
      (await fetchProducts({
        type: "subs",
        skus: CONFIGURED_IOS_SKUS,
      })) || [];

    const next: Record<string, ProductSubscription> = {};

    for (const product of products) {
      if (product.type !== "subs") continue;
      next[product.id] = product;
    }

    setStoreProducts(next);
  }, []);

  const syncPremiumFromAvailablePurchases = useCallback(
    async (silent: boolean): Promise<boolean> => {
      try {
        const purchases = await getAvailablePurchases({
          onlyIncludeActiveItemsIOS: true,
        });

        const latest = pickLatestKnownPurchase(purchases, configuredSkuSet);
        if (!latest) {
          if (!silent) {
            Alert.alert(
              "Aktif Abonelik Bulunamadi",
              "Bu Apple hesabi icin aktif premium abonelik bulunamadi."
            );
          }
          return false;
        }

        const state = await setPremiumActive("iap");
        setPremiumState(state);

        if (!silent) {
          Alert.alert("Premium Geri Yuklendi", "Apple aboneliginiz tekrar etkinlestirildi.");
        }

        return true;
      } catch (error) {
        if (!silent) {
          Alert.alert("Geri Yukleme Hatasi", getErrorMessage(error));
        }
        return false;
      }
    },
    [configuredSkuSet]
  );

  const handlePurchaseUpdate = useCallback(
    async (purchase: Purchase) => {
      if (!configuredSkuSet.has(purchase.productId)) {
        return;
      }

      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch (error) {
        console.warn("finishTransaction failed:", error);
      }

      const state = await setPremiumActive("iap");
      setPremiumState(state);
      setPendingPlanId(null);

      Alert.alert("Premium Aktif", "Apple odemeniz onaylandi. Premium ozellikler acildi.");
    },
    [configuredSkuSet]
  );

  const handlePurchaseError = useCallback((error: PurchaseError) => {
    setPendingPlanId(null);
    Alert.alert("Satin Alma Basarisiz", error.message || "Satin alma tamamlanamadi.");
  }, []);

  useEffect(() => {
    if (!isIosIapFlow) {
      return;
    }

    let mounted = true;

    const purchaseUpdateSub = purchaseUpdatedListener((purchase) => {
      if (!mounted) return;
      void handlePurchaseUpdate(purchase);
    });

    const purchaseErrorSub = purchaseErrorListener((error) => {
      if (!mounted) return;
      handlePurchaseError(error);
    });

    (async () => {
      if (CONFIGURED_IOS_SKUS.length === 0) {
        setStoreError("IAP SKU ayarlari eksik. Ortam degiskenlerini doldurun.");
        return;
      }

      setStoreLoading(true);
      setStoreError(null);

      try {
        const connected = await initConnection();
        if (!mounted) return;

        if (!connected) {
          setStoreReady(false);
          setStoreError("App Store baglantisi kurulamadi. Tekrar deneyin.");
          return;
        }

        setStoreReady(true);
        await refreshStoreProducts();
        await syncPremiumFromAvailablePurchases(true);
      } catch (error) {
        if (!mounted) return;
        setStoreReady(false);
        setStoreError(getErrorMessage(error));
      } finally {
        if (mounted) {
          setStoreLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      purchaseUpdateSub.remove();
      purchaseErrorSub.remove();
      void endConnection();
    };
  }, [handlePurchaseError, handlePurchaseUpdate, isIosIapFlow, refreshStoreProducts, syncPremiumFromAvailablePurchases]);

  const statusMeta = useMemo(() => {
    if (loading) {
      return {
        badge: "Kontrol",
        value: "Premium durumu yukleniyor...",
        hint: null,
        tone: "neutral",
      } as const;
    }

    if (!premiumState?.isActive) {
      return {
        badge: "Kapali",
        value: "Premium erisimi kapali",
        hint: "Apple aboneligi ile premium moduller acilir.",
        tone: "inactive",
      } as const;
    }

    return {
      badge: "Aktif",
      value: "Premium erisimi acik",
      hint: premiumState.source === "iap" ? "Apple aboneligi dogrulandi." : "Premium etkin durumda.",
      tone: "active",
    } as const;
  }, [loading, premiumState]);

  const isPremiumActive = !!premiumState?.isActive;
  const gamblingLocked = !isPremiumActive;
  const statusTone = STATUS_TONES[statusMeta.tone];
  const isStoreBusy = storeLoading || restoring || pendingPlanId !== null;

  const premiumScore = useMemo(() => {
    if (loading) return 15;
    if (!isPremiumActive) return 28;
    return 94;
  }, [loading, isPremiumActive]);

  const growthSeries = useMemo(
    () =>
      BASE_CHART_VALUES.map((base, index) => {
        const dynamic = Math.min(100, Math.max(8, Math.round(base * (premiumScore / 88))));
        return {
          key: `bar-${index}`,
          label: `W${index + 1}`,
          value: dynamic,
        };
      }),
    [premiumScore]
  );

  const handleLiveSupport = () => {
    const subject = encodeURIComponent("Premium Canli Destek");
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
  };

  const handleSupportEmail = () => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleClear = async () => {
    const state = await clearPremium();
    setPremiumState(state);
  };

  const handlePurchasePlan = useCallback(
    async (planId: PlanId) => {
      if (!isIosIapFlow) {
        Alert.alert("Satin Alma Kapali", "Apple satin alma yalnizca iOS uzerinde aktif olur.");
        return;
      }

      if (!storeReady) {
        Alert.alert("Magaza Hazir Degil", "App Store baglantisi hazir degil. Lutfen tekrar deneyin.");
        return;
      }

      const sku = IOS_PLAN_SKUS[planId];
      if (!sku) {
        Alert.alert("Eksik SKU", `${IOS_SKU_ENV_KEYS[planId]} ortam degiskenini doldurun.`);
        return;
      }

      const product = storeProducts[sku];
      if (!product) {
        Alert.alert("Paket Hazir Degil", "Bu paket App Store'dan cekilemedi. Urun kimligini kontrol edin.");
        return;
      }

      try {
        setPendingPlanId(planId);
        await requestPurchase({
          type: "subs",
          request: {
            apple: { sku: product.id },
          },
        });
      } catch (error) {
        setPendingPlanId(null);
        Alert.alert("Satin Alma Basarisiz", getErrorMessage(error));
      }
    },
    [isIosIapFlow, storeProducts, storeReady]
  );

  const handleRestore = useCallback(async () => {
    if (!isIosIapFlow) {
      Alert.alert("Geri Yukleme Kapali", "Apple geri yukleme yalnizca iOS cihazlarda calisir.");
      return;
    }

    setRestoring(true);

    try {
      await restorePurchases();
      await syncPremiumFromAvailablePurchases(false);
    } catch (error) {
      Alert.alert("Geri Yukleme Hatasi", getErrorMessage(error));
    } finally {
      setRestoring(false);
    }
  }, [isIosIapFlow, syncPremiumFromAvailablePurchases]);

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <ThemeTexture primary={colors.primary} secondary={colors.secondary} accent={colors.accent} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={[styles.backButtonText, { color: colors.text }]}>{t.back}</Text>
            </TouchableOpacity>
            <View style={[styles.headerChip, { backgroundColor: colors.primary + "1A" }]}>
              <Text style={[styles.headerChipText, { color: colors.primary }]}>
                {icons.guard} Premium
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={colors.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIconWrap}>
              <Text style={styles.heroIcon}>{icons.hero}</Text>
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Premium Kontrol Merkezi</Text>
              <Text style={styles.heroSubtitle}>
                Skor: {premiumScore}% - Acik ozellik: {isPremiumActive ? PREMIUM_BENEFITS.length : 0}/
                {PREMIUM_BENEFITS.length}
              </Text>
            </View>
          </LinearGradient>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {icons.chart} Premium Buyume Grafigi
              </Text>
              <Text style={[styles.sectionMeta, { color: colors.primary }]}>{premiumScore}%</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Erisim durumuna gore premium kullanim gucunuzun haftalik dagilimi.
            </Text>
            <View style={styles.chartRow}>
              {growthSeries.map((bar) => (
                <View key={bar.key} style={styles.chartCol}>
                  <View style={[styles.chartTrack, { backgroundColor: colors.cardBorder }]}>
                    <LinearGradient
                      colors={[colors.primary, colors.accent]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.chartFill, { height: `${bar.value}%` }]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{bar.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.sectionCard,
              styles.statusCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Durum</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusTone.background }]}>
                <Text style={[styles.statusBadgeText, { color: statusTone.text }]}>{statusMeta.badge}</Text>
              </View>
            </View>
            <Text style={[styles.statusValue, { color: colors.text }]}>{statusMeta.value}</Text>
            {statusMeta.hint ? (
              <Text style={[styles.statusHint, { color: colors.textMuted }]}>{statusMeta.hint}</Text>
            ) : null}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {icons.spark} Premium ile acilanlar
            </Text>
            <View style={styles.featuresContainer}>
              {PREMIUM_BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.feature}>
                  <Text style={styles.featureIcon}>{icons.spark}</Text>
                  <Text style={[styles.featureText, { color: colors.text }]}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          {userAddictions.gambling ? (
            <TouchableOpacity
              style={[styles.gamblingCard, gamblingLocked && styles.gamblingCardLocked]}
              activeOpacity={0.85}
              onPress={() => router.push("/blocker")}
              disabled={gamblingLocked}
            >
              <ImageBackground
                source={{ uri: GAMBLING_CARD_IMAGE }}
                style={styles.gamblingCardImage}
                imageStyle={styles.gamblingCardImageRadius}
                resizeMode="cover"
                blurRadius={2}
              >
                <View style={styles.gamblingImageTint} />
                <LinearGradient
                  colors={["rgba(0, 0, 0, 0.12)", "rgba(0, 0, 0, 0.42)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gamblingCardOverlay}
                >
                  <Text style={styles.gamblingCardTitle}>Kumar</Text>
                  <Text style={styles.gamblingCardSubtitle}>Durtu yonetimi</Text>
                </LinearGradient>
                {gamblingLocked ? (
                  <View style={styles.gamblingLockOverlay}>
                    <Text style={styles.gamblingLockTitle}>Premium gerekli</Text>
                    <Text style={styles.gamblingLockSubtitle}>Premium ile acilir</Text>
                  </View>
                ) : null}
              </ImageBackground>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.liveSupportHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {icons.support} Canli Destek
              </Text>
              <View style={[styles.liveSupportBadge, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.liveSupportBadgeText, { color: colors.primary }]}>Premium</Text>
              </View>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {isPremiumActive
                ? "Premium kullanicilarina ozel canli destek hatti."
                : "Premium alarak canli destek ayricaligini ac."}
            </Text>
            <TouchableOpacity
              style={[
                styles.liveSupportButton,
                { backgroundColor: colors.primary },
                !isPremiumActive && styles.disabledButton,
              ]}
              onPress={handleLiveSupport}
              disabled={!isPremiumActive}
            >
              <Text style={styles.liveSupportButtonText}>Canli Sohbete Basla</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Magaza Paketleri</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Premium erisimi App Store aboneligi ile acilir. Kodla acma kapatildi.
            </Text>

            {!IS_IAP_ENABLED ? (
              <Text style={[styles.storeWarningText, { color: colors.textMuted }]}>
                IAP kapali. EXPO_PUBLIC_ENABLE_IAP=true yaparak App Store satin alma akisini ac.
              </Text>
            ) : null}

            {IS_IAP_ENABLED && Platform.OS !== "ios" ? (
              <Text style={[styles.storeWarningText, { color: colors.textMuted }]}>
                Apple satin alma sadece iOS buildlerinde calisir.
              </Text>
            ) : null}

            {missingSkuEnvKeys.length > 0 ? (
              <Text style={[styles.storeWarningText, { color: colors.textMuted }]}>
                Eksik IAP SKU ayarlari: {missingSkuEnvKeys.join(", ")}
              </Text>
            ) : null}

            {storeError ? (
              <Text style={[styles.storeWarningText, { color: "#B42318" }]}>Store hatasi: {storeError}</Text>
            ) : null}

            {SUBSCRIPTION_PLANS.map((plan) => {
              const sku = IOS_PLAN_SKUS[plan.id];
              const product = sku ? storeProducts[sku] : undefined;
              const planBusy = pendingPlanId === plan.id;
              const canPurchase = isIosIapFlow && !!product && !isStoreBusy;

              return (
                <View
                  key={plan.id}
                  style={[styles.planCard, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.planHeader}>
                    <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
                    <View style={[styles.planBadge, { backgroundColor: colors.cardBorder }]}>
                      <Text style={[styles.planBadgeText, { color: colors.textMuted }]}>
                        {product ? "App Store" : sku ? "Bekleniyor" : "SKU eksik"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.planSubtitle, { color: colors.textMuted }]}>{plan.subtitle}</Text>

                  <View style={styles.planActionRow}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>{getPlanPriceLabel(product)}</Text>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { backgroundColor: colors.primary },
                        !canPurchase && styles.disabledButton,
                      ]}
                      disabled={!canPurchase}
                      onPress={() => {
                        void handlePurchasePlan(plan.id);
                      }}
                    >
                      <Text style={styles.primaryButtonText}>{planBusy ? "Isleniyor..." : "Apple ile Satin Al"}</Text>
                    </TouchableOpacity>
                  </View>

                  {!sku ? (
                    <Text style={[styles.planHint, { color: colors.textMuted }]}>
                      Eksik degisken: {IOS_SKU_ENV_KEYS[plan.id]}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            <View style={styles.storeActionRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  isStoreBusy && styles.disabledButton,
                ]}
                disabled={isStoreBusy || !isIosIapFlow}
                onPress={() => {
                  void handleRestore();
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                  {restoring ? "Geri yukleniyor..." : "Aboneligi Geri Yukle"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  isStoreBusy && styles.disabledButton,
                ]}
                disabled={isStoreBusy || !isIosIapFlow}
                onPress={() => {
                  void refreshStoreProducts();
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Paketleri Yenile</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.focusProtocolCard, { borderColor: colors.cardBorder }]}>
              <Text style={[styles.focusProtocolTitle, { color: colors.primary }]}>Odak protokolu</Text>
              <Text style={[styles.focusProtocolText, { color: colors.textMuted }]}>
                Premium acildiginda moduller aninda aktif olur ve gorevler otomatik kullanima hazir hale gelir.
              </Text>
            </View>
          </View>

          {isPremiumActive ? (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                styles.resetButton,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
              onPress={handleClear}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Premium Sifirla</Text>
            </TouchableOpacity>
          ) : null}

          <View
            style={[
              styles.sectionCard,
              styles.contactCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Yardim</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Sorularin icin bize yaz: support@antislot.app
            </Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={handleSupportEmail}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>E-posta Gonder</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 22,
    paddingBottom: 40,
    alignItems: "center",
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  heroCard: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroIcon: {
    fontSize: 34,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#FFFFFF",
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    width: "100%",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
  },
  chartTrack: {
    height: 92,
    width: "100%",
    borderRadius: 10,
    padding: 4,
    justifyContent: "flex-end",
  },
  chartFill: {
    width: "100%",
    borderRadius: 8,
    minHeight: 10,
  },
  chartLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
  },
  statusCard: {
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusLabel: {
    fontSize: 13,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statusHint: {
    marginTop: 2,
    fontSize: 12,
  },
  featuresContainer: {
    width: "100%",
    marginTop: 8,
    gap: 12,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  featureText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    lineHeight: 21,
  },
  gamblingCard: {
    width: "100%",
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  gamblingCardLocked: {
    opacity: 0.9,
  },
  gamblingCardImage: {
    flex: 1,
  },
  gamblingCardImageRadius: {
    borderRadius: 20,
  },
  gamblingImageTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  gamblingCardOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  gamblingCardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  gamblingCardSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  gamblingLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  gamblingLockTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  gamblingLockSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  liveSupportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  liveSupportBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveSupportBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  liveSupportButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  liveSupportButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  storeWarningText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  planCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  planBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  planSubtitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 8,
  },
  planActionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  planHint: {
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    minWidth: 148,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  storeActionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  focusProtocolCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 2,
  },
  focusProtocolTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  focusProtocolText: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactCard: {
    marginBottom: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
  },
  secondaryButtonText: {
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  resetButton: {
    marginTop: 10,
    marginBottom: 12,
    width: "100%",
  },
});
