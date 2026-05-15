import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  PremiumPlanCard,
  type PremiumPlanId,
} from "@/components/ui/premium-plan-card";
import {
  clearPremium,
  getPremiumState,
  setPremiumActive,
  type PremiumState,
} from "@/store/premiumStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";
import { activatePremium, redeemAccessCode } from "@/services/premiumApi";
import { addBreadcrumb, reportError } from "@/services/monitoring";
import { haptics } from "@/services/haptics";
import {
  endIap,
  fetchSubscriptions,
  finishPurchase,
  getActivePurchases,
  IapUserCancelledError,
  isIapSupported,
  PLAN_BY_SKU,
  purchaseSubscription,
  SUBSCRIPTION_SKUS,
  type SubscriptionInfo,
} from "@/services/iap";
import {
  ENABLE_IAP,
  ENABLE_PREMIUM_CODE_ACTIVATION,
} from "@/constants/featureFlags";

const SUPPORT_EMAIL = "support@antislot.app";
const EXTRA = (Constants.expoConfig?.extra ?? {}) as {
  privacyPolicyUrl?: string;
  termsUrl?: string;
};
const PRIVACY_URL = EXTRA.privacyPolicyUrl ?? "https://antislot-legal.vercel.app/privacy";
const TERMS_URL = EXTRA.termsUrl ?? "https://antislot-legal.vercel.app/terms";
const MANAGE_SUBS_URL = "https://apps.apple.com/account/subscriptions";

type PremiumFeature = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
};

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    icon: "fitness",
    title: "Beyin Hijyeni — 7 günlük program",
    description: "Dopamin döngüsünü onaran somut adımlar; yürüyüş, soğuk duş, derin nefes, ekran orucu.",
  },
  {
    icon: "git-network",
    title: "Tetikleyici Haritası",
    description: "Saat, mekân, duygu ve dürtü nedenini birlikte haritalar; sana özel baş etme önerileri.",
  },
  {
    icon: "sparkles",
    title: "Tüm farkındalık seansları",
    description: "Şefkat, uyku öncesi sakinleşme ve premium seanslara tam erişim.",
  },
  {
    icon: "chatbubbles",
    title: "Premium AI koçluk",
    description: "Daha uzun ve daha derin baş etme stratejileri; senin verine göre kişisel ipuçları.",
  },
  {
    icon: "headset",
    title: "Öncelikli destek",
    description: "Premium kullanıcılara özel hızlı yanıt destek hattı.",
  },
  {
    icon: "ban",
    title: "Reklamsız, odaklı deneyim",
    description: "Hiç reklam yok; tek odak iyileşmen.",
  },
];

type PlanOption = {
  id: PremiumPlanId;
  title: string;
  subtitle: string;
  priceLabel: string;
  priceHint?: string;
  saveLabel?: string;
  best?: boolean;
};

const PLAN_META: Record<
  PremiumPlanId,
  { title: string; subtitle: string; saveLabel?: string; best?: boolean; monthsForHint: number }
> = {
  monthly: {
    title: "Aylık Premium",
    subtitle: "Esnek başlangıç",
    monthsForHint: 1,
  },
  quarterly: {
    title: "3 Aylık Premium",
    subtitle: "90 gün odaklı paket",
    saveLabel: "−15%",
    monthsForHint: 3,
  },
  semiannual: {
    title: "6 Aylık Premium",
    subtitle: "Yarı yıllık koruma",
    saveLabel: "−30%",
    monthsForHint: 6,
  },
  annual: {
    title: "Yıllık Premium",
    subtitle: "En iyi değer",
    saveLabel: "−50%",
    best: true,
    monthsForHint: 12,
  },
};

const FALLBACK_PRICES: Record<PremiumPlanId, { priceLabel: string; priceHint?: string }> = {
  monthly: { priceLabel: "₺149,99", priceHint: "/ ay" },
  quarterly: { priceLabel: "₺382,49", priceHint: "₺127,49 / ay" },
  semiannual: { priceLabel: "₺629,99", priceHint: "₺105,00 / ay" },
  annual: { priceLabel: "₺899,99", priceHint: "₺75,00 / ay" },
};

const PLAN_ORDER: PremiumPlanId[] = ["monthly", "quarterly", "semiannual", "annual"];

function formatMonthlyHint(displayPrice: string, months: number, currency?: string): string | undefined {
  if (months <= 1) return "/ ay";
  const match = displayPrice.match(/([0-9][0-9.,\s]*[0-9])/);
  if (!match) return undefined;
  const numericRaw = match[1].replace(/\s/g, "");
  const parsed = parseFloat(
    numericRaw.replace(/\./g, "").replace(/,/g, ".")
  );
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  const monthly = parsed / months;
  const formatted = monthly.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === "TRY" || displayPrice.includes("₺") ? "₺" : "";
  return `${symbol}${formatted} / ay`;
}

function buildPlans(subscriptions: SubscriptionInfo[]): PlanOption[] {
  const bySku = new Map<string, SubscriptionInfo>();
  for (const info of subscriptions) bySku.set(info.sku, info);

  return PLAN_ORDER.map<PlanOption>((planId) => {
    const meta = PLAN_META[planId];
    const sku = SUBSCRIPTION_SKUS[planId];
    const info = bySku.get(sku);

    if (info?.displayPrice) {
      return {
        id: planId,
        title: meta.title,
        subtitle: meta.subtitle,
        priceLabel: info.displayPrice,
        priceHint: formatMonthlyHint(info.displayPrice, meta.monthsForHint, info.currency),
        saveLabel: meta.saveLabel,
        best: meta.best,
      };
    }

    const fallback = FALLBACK_PRICES[planId];
    return {
      id: planId,
      title: meta.title,
      subtitle: meta.subtitle,
      priceLabel: fallback.priceLabel,
      priceHint: fallback.priceHint,
      saveLabel: meta.saveLabel,
      best: meta.best,
    };
  });
}

const AUTO_RENEW_DISCLOSURE =
  "Abonelik otomatik yenilenir. Yenileme tutarı, mevcut dönemin bitiminden 24 saat önce Apple ID hesabınızdan tahsil edilir. Otomatik yenilemeyi durdurmak için mevcut dönem bitiminden en az 24 saat önce iptal etmeniz gerekir. Aboneliği Apple ID ayarlarından dilediğin zaman yönetebilir veya iptal edebilirsin.";

const TRUST_POINTS = [
  "Aynı Apple ID ile geri yükleme desteklenir.",
  "Sunucu doğrulaması ile güvenli aktivasyon.",
];

function formatActiveDuration(activatedAt: number | null): string | null {
  if (!activatedAt) return null;
  const diffMs = Date.now() - activatedAt;
  if (diffMs < 0) return null;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Bugün etkinleştirildi";
  if (days === 1) return "1 gündür aktif";
  return `${days} gündür aktif`;
}

export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { userAddictions } = useUserAddictionsStore();
  const toast = useToast();

  const [premiumState, setPremiumState] = useState<PremiumState | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlanId>("annual");
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
  const [pricesLoading, setPricesLoading] = useState<boolean>(
    ENABLE_IAP && isIapSupported()
  );
  const [purchasingSku, setPurchasingSku] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const purchasingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const state = await getPremiumState();
        setPremiumState(state);
      } catch (error) {
        reportError(error, { scope: "premium.load" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let active = true;
    if (!ENABLE_IAP || !isIapSupported()) {
      setPricesLoading(false);
      return () => {
        active = false;
      };
    }
    (async () => {
      try {
        const products = await fetchSubscriptions();
        if (!active) return;
        setSubscriptions(products);
      } catch (error) {
        reportError(error, { scope: "premium.fetchSubscriptions", level: "warning" });
      } finally {
        if (active) setPricesLoading(false);
      }
    })();
    return () => {
      active = false;
      endIap();
    };
  }, []);

  const plans = useMemo(() => buildPlans(subscriptions), [subscriptions]);
  const iapAllowed = ENABLE_IAP && isIapSupported();
  const purchaseEnabled = iapAllowed && subscriptions.length > 0;

  const statusMeta = useMemo<{
    badge: string;
    value: string;
    hint: string | null;
    tone: StatusTone;
  }>(() => {
    if (loading) {
      return {
        badge: "Kontrol",
        value: "Premium durumu yükleniyor...",
        hint: null,
        tone: "neutral",
      };
    }
    if (!premiumState?.isActive) {
      return {
        badge: "Kapalı",
        value: "Premium erişimi kapalı",
        hint: "Premium ile tüm seansları, AI ipuçlarını ve gelecek araçlarını aç.",
        tone: "inactive",
      };
    }
    return {
      badge: "Aktif",
      value: "Premium erişimi açık",
      hint: "Erişim kodu ile etkin.",
      tone: "active",
    };
  }, [loading, premiumState]);

  const isPremiumActive = !!premiumState?.isActive;
  const canApplyCode = code.trim().length > 0;
  const activeDurationLabel = isPremiumActive
    ? formatActiveDuration(premiumState?.activatedAt ?? null)
    : null;

  const handleApplyCode = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized || redeeming) return;

    setRedeeming(true);
    addBreadcrumb("premium.redeem", "submit");
    try {
      const result = await redeemAccessCode(normalized);
      if (!result.ok) {
        if (result.error === "REDEEM_NOT_CONFIGURED") {
          reportError(new Error("REDEEM_NOT_CONFIGURED"), {
            scope: "premium.redeem",
            level: "warning",
          });
          haptics.warning();
          toast.warning(
            "Erişim kodu doğrulaması şu anda yapılandırılmamış. Lütfen daha sonra tekrar deneyin.",
            "Hizmet Kullanılamıyor"
          );
        } else if (result.error === "NETWORK_ERROR") {
          reportError(new Error("NETWORK_ERROR"), {
            scope: "premium.redeem",
            level: "warning",
          });
          haptics.warning();
          toast.warning(
            "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
            "Bağlantı Hatası"
          );
        } else {
          haptics.error();
          toast.error("Lütfen geçerli bir erişim kodu girin.", "Geçersiz Kod");
        }
        return;
      }
      const state = await setPremiumActive("code");
      setPremiumState(state);
      setCode("");
      haptics.success();
      toast.success("Erişim kodu doğrulandı.", "Premium Aktif");
    } catch (error) {
      reportError(error, { scope: "premium.redeem" });
      haptics.error();
      toast.error(
        "İşlem tamamlanamadı. Lütfen biraz sonra tekrar deneyin.",
        "Hata"
      );
    } finally {
      setRedeeming(false);
    }
  };

  const handleClear = async () => {
    haptics.warning();
    try {
      const state = await clearPremium();
      setPremiumState(state);
      addBreadcrumb("premium.clear", "cleared");
    } catch (error) {
      reportError(error, { scope: "premium.clear" });
    }
  };

  const handleLiveSupport = () => {
    haptics.tapLight();
    const subject = encodeURIComponent("Premium Canlı Destek");
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
  };

  const handleSupportEmail = () => {
    haptics.tapLight();
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleSelectPlan = useCallback(
    async (planId: PremiumPlanId) => {
      haptics.selection();
      setSelectedPlan(planId);

      if (purchasingRef.current) return;

      if (!iapAllowed) {
        toast.info(
          "Satın alma bu cihazda desteklenmiyor.",
          "Mağaza Bağlantısı Yok"
        );
        return;
      }

      if (!purchaseEnabled) {
        toast.warning(
          "Mağaza ürünleri henüz yüklenmedi. Birkaç saniye sonra tekrar dene.",
          "Mağaza Hazır Değil"
        );
        return;
      }

      const sku = SUBSCRIPTION_SKUS[planId];
      purchasingRef.current = true;
      setPurchasingSku(sku);
      addBreadcrumb("premium.purchase", "start", { sku });

      try {
        const purchase = await purchaseSubscription(sku);
        const receipt = purchase.purchaseToken ?? "";

        if (receipt) {
          try {
            await activatePremium({
              receipt,
              productId: purchase.productId ?? sku,
              platform: "ios",
            });
            addBreadcrumb("premium.serverActivate", "success", { sku });
          } catch (serverError) {
            reportError(serverError, {
              scope: "premium.serverActivate",
              level: "warning",
            });
            addBreadcrumb("premium.serverActivate", "failed", { sku });
          }
        }

        await finishPurchase(purchase);
        const state = await setPremiumActive("iap");
        setPremiumState(state);
        addBreadcrumb("premium.purchase", "success", { sku });
        haptics.success();
        toast.success("Premium aboneliğin aktif edildi.", "Teşekkürler");
      } catch (error) {
        if (error instanceof IapUserCancelledError) {
          addBreadcrumb("premium.purchase", "cancelled", { sku });
          return;
        }
        reportError(error, { scope: "premium.purchase", level: "warning" });
        haptics.error();
        toast.error(
          "Satın alma tamamlanamadı. Lütfen tekrar dene.",
          "Satın Alma Hatası"
        );
      } finally {
        purchasingRef.current = false;
        setPurchasingSku(null);
      }
    },
    [iapAllowed, purchaseEnabled, toast]
  );

  const handleRestore = useCallback(async () => {
    if (restoring) return;
    haptics.tapLight();

    if (!iapAllowed) {
      toast.info(
        "Satın alma geri yükleme bu cihazda desteklenmiyor.",
        "Geri Yükleme"
      );
      return;
    }

    setRestoring(true);
    addBreadcrumb("premium.restore", "start");
    try {
      const purchases = await getActivePurchases();
      const active = purchases.find((p) => PLAN_BY_SKU[p.productId]);
      if (!active) {
        toast.info(
          "Bu Apple ID için aktif premium aboneliği bulunamadı.",
          "Geri Yükleme"
        );
        return;
      }
      const receipt = active.purchaseToken ?? "";
      if (receipt) {
        try {
          await activatePremium({
            receipt,
            productId: active.productId,
            platform: "ios",
          });
        } catch (serverError) {
          reportError(serverError, {
            scope: "premium.serverRestore",
            level: "warning",
          });
        }
      }
      const state = await setPremiumActive("iap");
      setPremiumState(state);
      haptics.success();
      toast.success("Premium erişimin geri yüklendi.", "Geri Yüklendi");
    } catch (error) {
      reportError(error, { scope: "premium.restore", level: "warning" });
      haptics.error();
      toast.error(
        "Geri yükleme başarısız oldu. Lütfen tekrar dene.",
        "Geri Yükleme Hatası"
      );
    } finally {
      setRestoring(false);
    }
  }, [iapAllowed, restoring, toast]);

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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t.back}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.text}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={[styles.backButtonText, { color: colors.text }]}>{t.back}</Text>
            </TouchableOpacity>
            <View
              style={[styles.headerChip, { backgroundColor: colors.primary + "1A" }]}
              accessible
              accessibilityLabel="Premium bölümü"
            >
              <Ionicons name="diamond" size={14} color={colors.primary} />
              <Text style={[styles.headerChipText, { color: colors.primary }]}>Premium</Text>
            </View>
          </View>

          {/* Premium hero */}
          <LinearGradient
            colors={["#1A2A4A", "#2A3F66", "#3F578E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecorRing} pointerEvents="none" />
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={["#FFD074", "#F59E0B"]}
                style={styles.heroIconBubble}
              >
                <Ionicons name="diamond" size={26} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Premium Kontrol Merkezi
            </Text>
            <Text style={styles.heroSubtitle}>
              Tüm seansları, AI ipuçlarını, gelişmiş istatistikleri ve gelecek araçlarını aç.
            </Text>
            {activeDurationLabel ? (
              <View style={styles.heroBadgeRow}>
                <Ionicons name="checkmark-circle" size={14} color="#A7F3D0" />
                <Text style={styles.heroBadgeText}>{activeDurationLabel}</Text>
              </View>
            ) : null}
          </LinearGradient>

          {/* Status card */}
          {loading ? (
            <Card
              style={styles.cardSpacing}
              accessible
              accessibilityLabel="Premium durumu yükleniyor"
              accessibilityState={{ busy: true }}
            >
              <View style={styles.statusRow}>
                <Skeleton width={56} height={12} />
                <Skeleton width={64} height={20} radius={999} />
              </View>
              <Skeleton width="70%" height={22} style={styles.statusValueSkeleton} />
              <Skeleton width="55%" height={12} style={styles.statusHintSkeleton} />
            </Card>
          ) : (
            <Card
              style={styles.cardSpacing}
              accessible
              accessibilityLabel={`Durum: ${statusMeta.badge}. ${statusMeta.value}${
                statusMeta.hint ? `. ${statusMeta.hint}` : ""
              }`}
            >
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Durum</Text>
                <StatusBadge label={statusMeta.badge} tone={statusMeta.tone} />
              </View>
              <Text style={[styles.statusValue, { color: colors.text }]}>{statusMeta.value}</Text>
              {statusMeta.hint ? (
                <Text style={[styles.statusHint, { color: colors.textMuted }]}>
                  {statusMeta.hint}
                </Text>
              ) : null}
            </Card>
          )}

          {/* Premium Features */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Premium ile açılanlar"
              icon="sparkles"
              meta={`${PREMIUM_FEATURES.length} özellik`}
            />
            <View style={styles.featureList}>
              {PREMIUM_FEATURES.map((feature) => (
                <View key={feature.title} style={styles.featureRow}>
                  <View
                    style={[
                      styles.featureIconWrap,
                      { backgroundColor: `${colors.primary}14` },
                    ]}
                  >
                    <Ionicons name={feature.icon} size={16} color={colors.primary} />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.featureDescription, { color: colors.textMuted }]}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Plan selection */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Bir plan seç"
              icon="pricetags"
              subtitle={
                purchaseEnabled
                  ? "Tüm planlar dilediğin zaman iptal edilebilir."
                  : pricesLoading
                  ? "Mağaza fiyatları yükleniyor..."
                  : "Mağaza fiyatlarına ulaşılamadı. Yaklaşık fiyatlar gösteriliyor."
              }
            />
            <View style={styles.planList}>
              {plans.map((plan) => (
                <PremiumPlanCard
                  key={plan.id}
                  id={plan.id}
                  title={plan.title}
                  subtitle={plan.subtitle}
                  best={plan.best}
                  selected={selectedPlan === plan.id}
                  priceLabel={plan.priceLabel}
                  priceHint={plan.priceHint}
                  saveLabel={plan.saveLabel}
                  available
                  onPress={() => handleSelectPlan(plan.id)}
                />
              ))}
            </View>

            <Button
              title={
                purchasingSku
                  ? "İşleniyor..."
                  : `Satın Al — ${
                      plans.find((p) => p.id === selectedPlan)?.title ?? "Premium"
                    }`
              }
              onPress={() => handleSelectPlan(selectedPlan)}
              variant="gradient"
              fullWidth
              leftIcon="diamond"
              loading={Boolean(purchasingSku)}
              disabled={Boolean(purchasingSku) || isPremiumActive}
              style={styles.purchaseButton}
            />
            <Button
              title="Satın Almaları Geri Yükle"
              onPress={handleRestore}
              variant="secondary"
              fullWidth
              leftIcon="refresh"
              loading={restoring}
              disabled={restoring}
              style={styles.restoreButton}
            />

            <View style={[styles.trustBox, { backgroundColor: `${colors.primary}0B` }]}>
              <View style={styles.trustHeader}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                <Text style={[styles.trustHeaderText, { color: colors.text }]}>
                  Güvenli satın alma
                </Text>
              </View>
              {TRUST_POINTS.map((point) => (
                <View key={point} style={styles.trustRow}>
                  <View style={[styles.trustDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.trustText, { color: colors.textMuted }]}>{point}</Text>
                </View>
              ))}
              <Text
                style={[
                  styles.trustText,
                  styles.autoRenewText,
                  { color: colors.textMuted },
                ]}
              >
                {AUTO_RENEW_DISCLOSURE}
              </Text>
              <View style={styles.legalLinkRow}>
                <TouchableOpacity
                  onPress={() => {
                    haptics.tapLight();
                    Linking.openURL(TERMS_URL);
                  }}
                  accessibilityRole="link"
                >
                  <Text style={[styles.legalLink, { color: colors.primary }]}>
                    Kullanım Koşulları
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.legalSeparator, { color: colors.textMuted }]}>·</Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.tapLight();
                    Linking.openURL(PRIVACY_URL);
                  }}
                  accessibilityRole="link"
                >
                  <Text style={[styles.legalLink, { color: colors.primary }]}>
                    Gizlilik Politikası
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.legalSeparator, { color: colors.textMuted }]}>·</Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.tapLight();
                    Linking.openURL(MANAGE_SUBS_URL);
                  }}
                  accessibilityRole="link"
                >
                  <Text style={[styles.legalLink, { color: colors.primary }]}>
                    Aboneliği Yönet
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Access code */}
          {ENABLE_PREMIUM_CODE_ACTIVATION ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Erişim Kodu"
                icon="key"
                subtitle="Beta erişim kodunuz varsa girerek premium'u etkinleştirebilirsiniz."
              />
              <View style={styles.codeRow}>
                <TextInput
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  placeholder="Erişim kodu"
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  accessibilityLabel="Erişim kodu girişi"
                />
                <Button
                  title="Kodu Kullan"
                  onPress={handleApplyCode}
                  disabled={!canApplyCode || redeeming}
                  loading={redeeming}
                  variant="secondary"
                />
              </View>
            </Card>
          ) : null}

          {/* Live support */}
          <Card style={styles.cardSpacing}>
            <View style={styles.liveSupportHeader}>
              <SectionHeader title="Canlı Destek" icon="chatbubbles" />
              <View
                style={[styles.liveSupportBadge, { backgroundColor: colors.primary + "18" }]}
              >
                <Text style={[styles.liveSupportBadgeText, { color: colors.primary }]}>
                  Premium
                </Text>
              </View>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {isPremiumActive
                ? "Premium kullanıcılarına özel canlı destek hattı."
                : "Premium alarak canlı destek ayrıcalığını aç."}
            </Text>
            <Button
              title="Canlı Sohbete Başla"
              onPress={handleLiveSupport}
              disabled={!isPremiumActive}
              variant="primary"
              fullWidth
              leftIcon="chatbubble-ellipses"
            />
          </Card>

          {/* Gambling card (premium-locked block content if owned) */}
          {userAddictions.gambling ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Kumar Dürtü Yönetimi"
                icon="shield"
                subtitle="DNS düzeyi engelleme, izin listesi ve test araçları."
              />
              <Button
                title={isPremiumActive ? "Yönet" : "Premium ile aç"}
                onPress={() => {
                  haptics.tapLight();
                  router.push("/blocker");
                }}
                variant={isPremiumActive ? "primary" : "gradient"}
                leftIcon={isPremiumActive ? "settings" : "lock-closed"}
                fullWidth
              />
            </Card>
          ) : null}

          {/* Reset (only if active) */}
          {isPremiumActive ? (
            <Button
              title="Premium Sıfırla"
              onPress={handleClear}
              variant="secondary"
              fullWidth
              leftIcon="refresh"
              style={styles.resetButton}
            />
          ) : null}

          {/* Help */}
          <Card style={[styles.cardSpacing, styles.contactCard]}>
            <SectionHeader
              title="Yardım"
              icon="help-circle"
              subtitle={`Sorularınız için bize yazın: ${SUPPORT_EMAIL}`}
            />
            <Button
              title="E-posta Gönder"
              onPress={handleSupportEmail}
              variant="secondary"
              fullWidth
              leftIcon="mail"
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backButtonText: { fontSize: 17, fontWeight: "600" },
  headerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerChipText: { fontSize: 12, fontWeight: "700" },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroDecorRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    right: -60,
    top: -50,
  },
  heroIconWrap: {
    marginBottom: 12,
  },
  heroIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(167, 243, 208, 0.18)",
    alignSelf: "flex-start",
  },
  heroBadgeText: {
    color: "#A7F3D0",
    fontSize: 12,
    fontWeight: "700",
  },

  cardSpacing: { marginBottom: 14 },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusLabel: { fontSize: 13 },
  statusValue: { fontSize: 20, fontWeight: "800" },
  statusHint: { marginTop: 4, fontSize: 12 },
  statusValueSkeleton: { marginTop: 4 },
  statusHintSkeleton: { marginTop: 8 },

  featureList: { gap: 12, marginTop: 4 },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextWrap: { flex: 1, minWidth: 0 },
  featureTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  featureDescription: { fontSize: 12, lineHeight: 17 },

  planList: { gap: 10 },
  trustBox: {
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    gap: 6,
  },
  trustHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  trustHeaderText: { fontSize: 13, fontWeight: "800" },
  trustRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  trustDot: { width: 4, height: 4, borderRadius: 2, marginTop: 7 },
  trustText: { fontSize: 12, lineHeight: 18, flex: 1 },
  autoRenewText: {
    marginTop: 10,
    flex: 0,
  },
  legalLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  legalSeparator: {
    fontSize: 12,
  },

  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  codeInput: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },

  liveSupportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
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

  resetButton: {
    marginTop: 4,
    marginBottom: 12,
  },
  purchaseButton: {
    marginTop: 16,
  },
  restoreButton: {
    marginTop: 10,
  },
  contactCard: { marginBottom: 8 },
});
