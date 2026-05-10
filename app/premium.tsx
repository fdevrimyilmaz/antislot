import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ImageBackground,
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { type Theme } from "@/store/themeStore";
import {
  clearPremium,
  getPremiumState,
  setPremiumActive,
  startTrial,
  type PremiumState,
} from "@/store/premiumStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";

const ACCESS_CODES = ["ANTISLOT2026", "BETA2026"];
const SUPPORT_EMAIL = "support@antislot.app";
const GAMBLING_CARD_IMAGE =
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80";

const PREMIUM_BENEFITS = [
  "Premium farkindalik seanslari",
  "Yapay ANTI'de premium ipuclari",
  "Derinlestirilmis destek planlari",
  "Reklamsiz, odakli deneyim",
];

const BASE_CHART_VALUES = [20, 34, 47, 62, 78, 90];

const THEME_ICONS: Record<
  Theme,
  { hero: string; spark: string; support: string; code: string; chart: string; guard: string }
> = {
  white: {
    hero: "👑",
    spark: "✨",
    support: "🤝",
    code: "🔐",
    chart: "📈",
    guard: "🛡️",
  },
  "twitter-blue": {
    hero: "🚀",
    spark: "💠",
    support: "🛰️",
    code: "🔷",
    chart: "📊",
    guard: "🛡️",
  },
  black: {
    hero: "🖤",
    spark: "✦",
    support: "🤍",
    code: "🔒",
    chart: "📉",
    guard: "🧱",
  },
  sunset: {
    hero: "🌅",
    spark: "🔥",
    support: "🧡",
    code: "🪙",
    chart: "📈",
    guard: "🛡️",
  },
  forest: {
    hero: "🌿",
    spark: "🍃",
    support: "🤲",
    code: "🌲",
    chart: "📊",
    guard: "🛡️",
  },
  midnight: {
    hero: "🌌",
    spark: "💫",
    support: "🧠",
    code: "🔮",
    chart: "📈",
    guard: "🛡️",
  },
};

const STATUS_TONES = {
  active: { background: "#D1FADF", text: "#027A48" },
  trial: { background: "#FEF0C7", text: "#B54708" },
  inactive: { background: "#FEE4E2", text: "#B42318" },
  neutral: { background: "#F2F4F7", text: "#667085" },
} as const;

export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, colors } = useTheme();
  const icons = THEME_ICONS[theme];
  const { userAddictions } = useUserAddictionsStore();

  const [premiumState, setPremiumState] = useState<PremiumState | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const state = await getPremiumState();
      setPremiumState(state);
      setLoading(false);
    })();
  }, []);

  const remainingDays = useMemo(() => {
    if (!premiumState?.trialEndsAt) return null;
    const diffMs = premiumState.trialEndsAt - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [premiumState]);

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
        hint: "Premium ile kilitli seanslari ve ek onerileri ac.",
        tone: "inactive",
      } as const;
    }
    if (premiumState.source === "trial" && remainingDays !== null) {
      return {
        badge: "Deneme",
        value: "Premium deneme aktif",
        hint: `${remainingDays} gun deneme kaldi`,
        tone: "trial",
      } as const;
    }
    return {
      badge: "Aktif",
      value: "Premium erisimi acik",
      hint: "Erisim kodu ile etkin.",
      tone: "active",
    } as const;
  }, [loading, premiumState, remainingDays]);

  const isPremiumActive = !!premiumState?.isActive;
  const canApplyCode = code.trim().length > 0;
  const gamblingLocked = !isPremiumActive;
  const statusTone = STATUS_TONES[statusMeta.tone];

  const premiumScore = useMemo(() => {
    if (loading) return 15;
    if (!isPremiumActive) return 28;
    if (premiumState?.source === "trial") return 72;
    return 94;
  }, [loading, isPremiumActive, premiumState]);

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
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
  };

  const handleSupportEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleStartTrial = async () => {
    const state = await startTrial(7);
    setPremiumState(state);
    Alert.alert("Deneme Basladi", "Premium denemeniz 7 gun boyunca aktif.");
  };

  const handleApplyCode = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    if (!ACCESS_CODES.includes(normalized)) {
      Alert.alert("Gecersiz Kod", "Lutfen gecerli bir erisim kodu girin.");
      return;
    }
    const state = await setPremiumActive("code");
    setPremiumState(state);
    setCode("");
    Alert.alert("Premium Aktif", "Erisim kodu dogrulandi.");
  };

  const handleClear = async () => {
    const state = await clearPremium();
    setPremiumState(state);
  };

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
                Skor: {premiumScore}% · Acik ozellik: {isPremiumActive ? PREMIUM_BENEFITS.length : 0}/
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

          <TouchableOpacity
            style={[styles.premiumButton, isPremiumActive && styles.premiumButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleStartTrial}
            disabled={isPremiumActive}
          >
            <LinearGradient
              colors={[colors.warning, "#F59E0B", colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumButtonGradient}
            >
              <Text style={styles.premiumButtonText}>
                {isPremiumActive ? "Premium Aktif" : "7 Gun Deneme Baslat"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

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

          <View style={[styles.sectionCard, styles.codeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {icons.code} Erisim Kodu
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Beta erisim kodunuz varsa girerek premiumu etkinlestirebilirsiniz.
            </Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[
                  styles.codeInput,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder },
                ]}
                placeholder="Erisim kodu"
                placeholderTextColor={colors.textMuted}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  !canApplyCode && styles.disabledButton,
                ]}
                onPress={handleApplyCode}
                disabled={!canApplyCode}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Kodu Kullan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionCard, styles.contactCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
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
  premiumButton: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumButtonDisabled: {
    opacity: 0.75,
  },
  premiumButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  codeCard: {
    marginTop: 4,
  },
  contactCard: {
    marginBottom: 8,
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
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
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
  },
});
