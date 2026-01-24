import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { clearPremium, getPremiumState, setPremiumActive, startTrial, type PremiumState } from "@/store/premiumStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";

const ACCESS_CODES = ["ANTISLOT2026", "BETA2026"];
const SUPPORT_EMAIL = "support@antislot.app";
const GAMBLING_CARD_IMAGE =
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80";

const PREMIUM_BENEFITS = [
  "Premium farkındalık seansları",
  "Yapay ANTİ'de premium ipuçları",
  "Derinleştirilmiş destek planları",
  "Reklamsız, odaklı deneyim",
];

const STATUS_TONES = {
  active: { background: "#D1FADF", text: "#027A48" },
  trial: { background: "#FEF0C7", text: "#B54708" },
  inactive: { background: "#FEE4E2", text: "#B42318" },
  neutral: { background: "#F2F4F7", text: "#667085" },
} as const;

export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
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
        value: "Premium durumu yükleniyor...",
        hint: null,
        tone: "neutral",
      } as const;
    }
    if (!premiumState?.isActive) {
      return {
        badge: "Kapalı",
        value: "Premium erişimi kapalı",
        hint: "Premium ile kilitli seansları ve ek önerileri aç.",
        tone: "inactive",
      } as const;
    }
    if (premiumState.source === "trial" && remainingDays !== null) {
      return {
        badge: "Deneme",
        value: "Premium deneme aktif",
        hint: `${remainingDays} gün deneme kaldı`,
        tone: "trial",
      } as const;
    }
    return {
      badge: "Aktif",
      value: "Premium erişimi açık",
      hint: "Erişim kodu ile etkin.",
      tone: "active",
    } as const;
  }, [loading, premiumState, remainingDays]);

  const statusTone = STATUS_TONES[statusMeta.tone];
  const canApplyCode = code.trim().length > 0;
  const isPremiumActive = !!premiumState?.isActive;
  const gamblingLocked = !isPremiumActive;

  const handleLiveSupport = () => {
    const subject = encodeURIComponent("Premium Canlı Destek");
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
  };

  const handleSupportEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleStartTrial = async () => {
    const state = await startTrial(7);
    setPremiumState(state);
    Alert.alert("Deneme Başladı", "Premium denemeniz 7 gün boyunca aktif.");
  };

  const handleApplyCode = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    if (!ACCESS_CODES.includes(normalized)) {
      Alert.alert("Geçersiz Kod", "Lütfen geçerli bir erişim kodu girin.");
      return;
    }
    const state = await setPremiumActive("code");
    setPremiumState(state);
    setCode("");
    Alert.alert("Premium Aktif", "Erişim kodu doğrulandı.");
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
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>{t.back}</Text>
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumIcon}
            >
              <Text style={styles.crownIcon}>👑</Text>
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Premium</Text>
          
          <Text style={[styles.subtitle, { color: colors.text + "CC" }]}>
            Kişiselleştirilmiş destek ve ek seanslara erişin
          </Text>

          <View
            style={[
              styles.sectionCard,
              styles.statusCard,
              { backgroundColor: colors.card, borderColor: colors.text + "1A" },
            ]}
          >
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.text + "99" }]}>Durum</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusTone.background }]}>
                <Text style={[styles.statusBadgeText, { color: statusTone.text }]}>{statusMeta.badge}</Text>
              </View>
            </View>
            <Text style={[styles.statusValue, { color: colors.text }]}>{statusMeta.value}</Text>
            {statusMeta.hint ? (
              <Text style={[styles.statusHint, { color: colors.text + "80" }]}>{statusMeta.hint}</Text>
            ) : null}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.text + "1A" }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Premium ile açılanlar</Text>
            <View style={styles.featuresContainer}>
              {PREMIUM_BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.feature}>
                  <Text style={styles.featureIcon}>✨</Text>
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
                  colors={["rgba(0, 0, 0, 0.12)", "rgba(0, 0, 0, 0.4)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gamblingCardOverlay}
                >
                  <Text style={styles.gamblingCardTitle}>Kumar</Text>
                  <Text style={styles.gamblingCardSubtitle}>Dürtü yönetimi</Text>
                </LinearGradient>
                {gamblingLocked ? (
                  <View style={styles.gamblingLockOverlay}>
                    <Text style={styles.gamblingLockTitle}>Premium gerekli</Text>
                    <Text style={styles.gamblingLockSubtitle}>Premium ile açılır</Text>
                  </View>
                ) : null}
              </ImageBackground>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.text + "1A" }]}>
            <View style={styles.liveSupportHeader}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Canlı Destek</Text>
              <View style={[styles.liveSupportBadge, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.liveSupportBadgeText, { color: colors.primary }]}>Premium</Text>
              </View>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.text + "99" }]}>
              {isPremiumActive
                ? "Premium kullanıcılarına özel canlı destek hattına yaz."
                : "Premium alarak canlı destek ayrıcalığını aç."}
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
              <Text style={styles.liveSupportButtonText}>Canlı Sohbete Başla</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.premiumButton, isPremiumActive && styles.premiumButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleStartTrial}
            disabled={isPremiumActive}
          >
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumButtonGradient}
            >
              <Text style={styles.premiumButtonText}>
                {isPremiumActive ? "Premium Aktif" : "7 Gün Deneme Başlat"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          {isPremiumActive ? (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                styles.resetButton,
                { backgroundColor: colors.card, borderColor: colors.text + "1A" },
              ]}
              onPress={handleClear}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Premium Sıfırla</Text>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.sectionCard, styles.codeCard, { backgroundColor: colors.card, borderColor: colors.text + "1A" }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Erişim Kodu</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text + "99" }]}>
              Beta erişim kodunuz varsa girerek Premium&apos;u etkinleştirebilirsiniz.
            </Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[
                  styles.codeInput,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.text + "1A" },
                ]}
                placeholder="Erişim kodu"
                placeholderTextColor={colors.text + "80"}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { backgroundColor: colors.card, borderColor: colors.text + "1A" },
                  !canApplyCode && styles.disabledButton,
                ]}
                onPress={handleApplyCode}
                disabled={!canApplyCode}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Kodu Kullan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionCard, styles.contactCard, { backgroundColor: colors.card, borderColor: colors.text + "1A" }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Yardım</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text + "99" }]}>
              Soruların için bize yaz: support@antislot.app
            </Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.text + "1A" }]}
              onPress={handleSupportEmail}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>E-posta Gönder</Text>
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
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  iconContainer: {
    marginBottom: 24,
  },
  premiumIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  crownIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  sectionCard: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
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
    marginTop: 6,
    fontSize: 12,
  },
  featuresContainer: {
    width: "100%",
    marginTop: 10,
    gap: 14,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    lineHeight: 22,
  },
  gamblingCard: {
    width: "100%",
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
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
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gamblingCardSubtitle: {
    fontSize: 13,
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
  premiumButton: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  premiumButtonDisabled: {
    opacity: 0.75,
  },
  premiumButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  codeCard: {
    marginTop: 4,
  },
  contactCard: {
    marginBottom: 8,
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
