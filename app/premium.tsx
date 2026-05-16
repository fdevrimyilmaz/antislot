import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Platform,
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
  addPromotedProductListener,
  fetchSubscriptions,
  finishPurchase,
  getActivePurchases,
  IapPurchaseFailedError,
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
import {
  getPremiumLocale,
  type PremiumLocale,
  type PlanMeta,
  type FallbackPrice,
} from "@/i18n/premium";

const SUPPORT_EMAIL = "support@antislot.app";
const EXTRA = (Constants.expoConfig?.extra ?? {}) as {
  privacyPolicyUrl?: string;
  termsUrl?: string;
};
const PRIVACY_URL = EXTRA.privacyPolicyUrl ?? "https://antislot-legal.vercel.app/privacy";
const TERMS_URL = EXTRA.termsUrl ?? "https://antislot-legal.vercel.app/terms";
const MANAGE_SUBS_URL = "https://apps.apple.com/account/subscriptions";

type PlanOption = {
  id: PremiumPlanId;
  title: string;
  subtitle: string;
  priceLabel: string;
  priceHint?: string;
  saveLabel?: string;
  best?: boolean;
};

const PLAN_ORDER: PremiumPlanId[] = ["monthly", "quarterly", "semiannual", "annual"];

function parsePriceAmount(displayPrice: string): number | null {
  const match = displayPrice.match(/([0-9][0-9.,\s]*[0-9]|[0-9])/);
  if (!match) return null;
  const raw = match[1].replace(/\s/g, "");
  const lastDot = raw.lastIndexOf(".");
  const lastComma = raw.lastIndexOf(",");
  const lastSep = Math.max(lastDot, lastComma);
  let parsed: number;
  if (lastSep === -1) {
    parsed = parseFloat(raw);
  } else {
    const trailing = raw.length - lastSep - 1;
    if (trailing >= 1 && trailing <= 2) {
      const intPart = raw.substring(0, lastSep).replace(/[.,]/g, "");
      const fracPart = raw.substring(lastSep + 1);
      parsed = parseFloat(`${intPart}.${fracPart}`);
    } else {
      parsed = parseFloat(raw.replace(/[.,]/g, ""));
    }
  }
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMonthlyHint(
  displayPrice: string,
  months: number,
  perMonthSuffix: string,
  currency?: string
): string | undefined {
  if (months <= 1) return perMonthSuffix;
  const parsed = parsePriceAmount(displayPrice);
  if (parsed == null || parsed <= 0) return undefined;
  const monthly = parsed / months;

  if (currency) {
    try {
      const locale = currency === "TRY" ? "tr-TR" : undefined;
      const formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${formatter.format(monthly)} ${perMonthSuffix}`;
    } catch {
      // fall through to symbol-based fallback
    }
  }

  const symbolMatch = displayPrice.match(/^([^\d\s.,]+)|([^\d\s.,]+)$/);
  const symbol = symbolMatch ? (symbolMatch[1] ?? symbolMatch[2] ?? "").trim() : "";
  const formatted = monthly.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted} ${perMonthSuffix}`;
}

function buildPlans(
  subscriptions: SubscriptionInfo[],
  planMeta: Record<PremiumPlanId, PlanMeta>,
  fallbackPrices: Record<PremiumPlanId, FallbackPrice>,
  perMonthSuffix: string
): PlanOption[] {
  const bySku = new Map<string, SubscriptionInfo>();
  for (const info of subscriptions) bySku.set(info.sku, info);

  return PLAN_ORDER.map<PlanOption>((planId) => {
    const meta = planMeta[planId];
    const sku = SUBSCRIPTION_SKUS[planId];
    const info = bySku.get(sku);

    if (info?.displayPrice) {
      return {
        id: planId,
        title: meta.title,
        subtitle: meta.subtitle,
        priceLabel: info.displayPrice,
        priceHint: formatMonthlyHint(
          info.displayPrice,
          meta.monthsForHint,
          perMonthSuffix,
          info.currency
        ),
        saveLabel: meta.saveLabel,
        best: meta.best,
      };
    }

    const fallback = fallbackPrices[planId];
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

function formatActiveDuration(
  activatedAt: number | null,
  L: PremiumLocale
): string | null {
  if (!activatedAt) return null;
  const diffMs = Date.now() - activatedAt;
  if (diffMs < 0) return null;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return L.durationToday;
  if (days === 1) return L.durationOneDay;
  return L.durationDays(days);
}

export default function PremiumScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const { userAddictions } = useUserAddictionsStore();
  const toast = useToast();
  const L = useMemo(() => getPremiumLocale(language), [language]);

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
    };
  }, []);

  const plans = useMemo(
    () => buildPlans(subscriptions, L.plans, L.fallbackPrices, L.perMonthSuffix),
    [subscriptions, L]
  );
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
        badge: L.statusChecking,
        value: L.statusCheckingValue,
        hint: null,
        tone: "neutral",
      };
    }
    if (!premiumState?.isActive) {
      return {
        badge: L.statusOff,
        value: L.statusOffValue,
        hint: L.statusOffHint,
        tone: "inactive",
      };
    }
    return {
      badge: L.statusActive,
      value: L.statusActiveValue,
      hint: L.statusActiveHint,
      tone: "active",
    };
  }, [L, loading, premiumState]);

  const isPremiumActive = !!premiumState?.isActive;
  const canApplyCode = code.trim().length > 0;
  const activeDurationLabel = isPremiumActive
    ? formatActiveDuration(premiumState?.activatedAt ?? null, L)
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
          toast.warning(L.toastRedeemNotConfigured.message, L.toastRedeemNotConfigured.title);
        } else if (result.error === "NETWORK_ERROR") {
          reportError(new Error("NETWORK_ERROR"), {
            scope: "premium.redeem",
            level: "warning",
          });
          haptics.warning();
          toast.warning(L.toastRedeemNetwork.message, L.toastRedeemNetwork.title);
        } else {
          haptics.error();
          toast.error(L.toastRedeemInvalid.message, L.toastRedeemInvalid.title);
        }
        return;
      }
      const state = await setPremiumActive("code");
      setPremiumState(state);
      setCode("");
      haptics.success();
      toast.success(L.toastRedeemSuccess.message, L.toastRedeemSuccess.title);
    } catch (error) {
      reportError(error, { scope: "premium.redeem" });
      haptics.error();
      toast.error(L.toastRedeemError.message, L.toastRedeemError.title);
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
    const subject = encodeURIComponent(L.liveSupportEmailSubject);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
  };

  const handleSupportEmail = () => {
    haptics.tapLight();
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handlePurchase = useCallback(
    async (planId: PremiumPlanId) => {
      if (purchasingRef.current) return;

      if (!iapAllowed) {
        toast.info(L.toastPurchaseUnsupported.message, L.toastPurchaseUnsupported.title);
        return;
      }

      if (!purchaseEnabled) {
        toast.warning(L.toastPurchaseNotReady.message, L.toastPurchaseNotReady.title);
        return;
      }

      const sku = SUBSCRIPTION_SKUS[planId];
      purchasingRef.current = true;
      setPurchasingSku(sku);
      addBreadcrumb("premium.purchase", "start", { sku });

      try {
        const purchase = await purchaseSubscription(sku);
        const receipt = purchase.purchaseToken ?? "";
        const platform = Platform.OS === "android" ? "android" : "ios";

        if (receipt) {
          try {
            await activatePremium({
              receipt,
              productId: purchase.productId ?? sku,
              platform,
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
        toast.success(L.toastPurchaseSuccess.message, L.toastPurchaseSuccess.title);
      } catch (error) {
        if (error instanceof IapUserCancelledError) {
          addBreadcrumb("premium.purchase", "cancelled", { sku });
          return;
        }
        reportError(error, { scope: "premium.purchase", level: "warning" });
        haptics.error();
        const errorCode =
          error instanceof IapPurchaseFailedError ? error.code : "unknown";
        toast.error(
          L.toastPurchaseErrorMessage(errorCode),
          L.toastPurchaseErrorTitle
        );
      } finally {
        purchasingRef.current = false;
        setPurchasingSku(null);
      }
    },
    [iapAllowed, L, purchaseEnabled, toast]
  );

  const handleSelectPlan = useCallback((planId: PremiumPlanId) => {
    haptics.selection();
    setSelectedPlan(planId);
  }, []);

  const handlePurchaseSelectedPlan = useCallback(() => {
    void handlePurchase(selectedPlan);
  }, [handlePurchase, selectedPlan]);

  useEffect(() => {
    if (!iapAllowed) return;

    let active = true;
    const sub = addPromotedProductListener((event) => {
      if (!active || event.type !== "subs") return;
      const planId = PLAN_BY_SKU[event.sku];
      if (!planId) return;

      setSelectedPlan(planId);
      addBreadcrumb("premium.promoted", "received", {
        sku: event.sku,
        planId,
      });
      void handlePurchase(planId);
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, [handlePurchase, iapAllowed]);

  const handleRestore = useCallback(async () => {
    if (restoring) return;
    haptics.tapLight();

    if (!iapAllowed) {
      toast.info(L.toastRestoreUnsupported.message, L.toastRestoreUnsupported.title);
      return;
    }

    setRestoring(true);
    addBreadcrumb("premium.restore", "start");
    try {
      const purchases = await getActivePurchases();
      const active = purchases.find((p) => PLAN_BY_SKU[p.productId]);
      if (!active) {
        toast.info(L.toastRestoreNotFound.message, L.toastRestoreNotFound.title);
        return;
      }
      const receipt = active.purchaseToken ?? "";
      if (receipt) {
        try {
          const platform = Platform.OS === "android" ? "android" : "ios";
          await activatePremium({
            receipt,
            productId: active.productId,
            platform,
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
      toast.success(L.toastRestoreSuccess.message, L.toastRestoreSuccess.title);
    } catch (error) {
      reportError(error, { scope: "premium.restore", level: "warning" });
      haptics.error();
      toast.error(L.toastRestoreError.message, L.toastRestoreError.title);
    } finally {
      setRestoring(false);
    }
  }, [iapAllowed, L, restoring, toast]);

  const selectedPlanTitle =
    plans.find((p) => p.id === selectedPlan)?.title ?? "Premium";

  const statusA11y = `${L.statusA11yPrefix}: ${statusMeta.badge}. ${statusMeta.value}${
    statusMeta.hint ? `. ${statusMeta.hint}` : ""
  }`;

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
              accessibilityLabel={L.headerChipAccessibility}
            >
              <Ionicons name="diamond" size={14} color={colors.primary} />
              <Text style={[styles.headerChipText, { color: colors.primary }]}>
                Premium
              </Text>
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
              {L.heroTitle}
            </Text>
            <Text style={styles.heroSubtitle}>{L.heroSubtitle}</Text>
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
              accessibilityLabel={L.loadingAccessibility}
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
              accessibilityLabel={statusA11y}
            >
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textMuted }]}>
                  {L.statusLabel}
                </Text>
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
              title={L.featuresTitle}
              icon="sparkles"
              meta={`${L.features.length} ${L.featuresMetaSuffix}`}
            />
            <View style={styles.featureList}>
              {L.features.map((feature) => (
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
              title={L.plansTitle}
              icon="pricetags"
              subtitle={
                purchaseEnabled
                  ? L.plansReadySubtitle
                  : pricesLoading
                  ? L.plansLoadingSubtitle
                  : L.plansFallbackSubtitle
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
                  ? L.processingLabel
                  : `${L.buyLabel} - ${selectedPlanTitle}`
              }
              onPress={handlePurchaseSelectedPlan}
              variant="gradient"
              fullWidth
              leftIcon="diamond"
              loading={Boolean(purchasingSku)}
              disabled={Boolean(purchasingSku) || isPremiumActive}
              style={styles.purchaseButton}
            />
            <Button
              title={L.restorePurchasesLabel}
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
                <Text style={[styles.trustHeaderText, { color: colors.text }]}>{L.securePurchaseTitle}</Text>
              </View>
              {L.trustPoints.map((point) => (
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
                {L.autoRenewDisclosure}
              </Text>
              <View style={styles.legalLinkRow}>
                <TouchableOpacity
                  onPress={() => {
                    haptics.tapLight();
                    Linking.openURL(TERMS_URL);
                  }}
                  accessibilityRole="link"
                >
                  <Text style={[styles.legalLink, { color: colors.primary }]}>{L.termsLabel}</Text>
                </TouchableOpacity>
                <Text style={[styles.legalSeparator, { color: colors.textMuted }]}>·</Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.tapLight();
                    Linking.openURL(PRIVACY_URL);
                  }}
                  accessibilityRole="link"
                >
                  <Text style={[styles.legalLink, { color: colors.primary }]}>{L.privacyLabel}</Text>
                </TouchableOpacity>
                <Text style={[styles.legalSeparator, { color: colors.textMuted }]}>·</Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.tapLight();
                    Linking.openURL(MANAGE_SUBS_URL);
                  }}
                  accessibilityRole="link"
                >
                  <Text style={[styles.legalLink, { color: colors.primary }]}>{L.manageSubLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Access code */}
          {ENABLE_PREMIUM_CODE_ACTIVATION ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title={L.accessCodeTitle}
                icon="key"
                subtitle={L.accessCodeSubtitle}
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
                  placeholder={L.accessCodePlaceholder}
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  accessibilityLabel={L.accessCodeInputA11y}
                />
                <Button
                  title={L.applyCodeLabel}
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
              <SectionHeader title={L.liveSupportTitle} icon="chatbubbles" />
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
                ? L.liveSupportActiveSubtitle
                : L.liveSupportInactiveSubtitle}
            </Text>
            <Button
              title={L.liveSupportAction}
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
                title={L.gamblingTitle}
                icon="shield"
                subtitle={L.gamblingSubtitle}
              />
              <Button
                title={isPremiumActive ? L.gamblingManage : L.gamblingUnlock}
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
              title={L.resetPremium}
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
              title={L.helpTitle}
              icon="help-circle"
              subtitle={`${L.helpSubtitlePrefix}: ${SUPPORT_EMAIL}`}
            />
            <Button
              title={L.helpEmailAction}
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
