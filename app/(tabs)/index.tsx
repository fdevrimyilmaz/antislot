import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { isOnboardingDone, hasWelcomeBeenShown, setWelcomeShown } from "@/store/onboardingFlag";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProgressStore } from "@/store/progressStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";

// Home screen renders core navigation cards.

const IMAGE_SOURCES = {
  hero: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80",
  therapy: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
  mindfulness: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
  sos: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=80",
  progress: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
  support: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
  diary: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
  facts: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { t } = useLanguage();
  const { theme, setTheme, colors } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const { hydrated } = useUserAddictionsStore();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const progressHydrated = useProgressStore((state) => state.hydrated);

  const heroMeta = useMemo(() => {
    const days = Number.isFinite(gamblingFreeDays) ? gamblingFreeDays : 0;
    const date = new Date();
    if (days > 0) {
      date.setDate(date.getDate() - days);
    }
    return {
      value: days,
      label: t.days,
      subLabel: t.gambleFree,
      date,
    };
  }, [gamblingFreeDays, t.days, t.gambleFree]);

  useEffect(() => {
    (async () => {
      const v = await isOnboardingDone();
      setDone(v);
      setLoading(false);
      // İlk kez onboarding tamamlandıysa welcome modal göster
      if (v) {
        const shown = await hasWelcomeBeenShown();
        if (!shown) {
          setShowWelcome(true);
        }
      }
    })();
  }, []);

  const homePalette = {
    background: "#F4F9FF",
    title: "#111827",
    subtitle: "#7D8790",
  };

  const monthLabels = ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"];
  const calendarDate = heroMeta.date ?? new Date();
  const calendarMonth = monthLabels[calendarDate.getMonth()] ?? monthLabels[0];
  const calendarDay = calendarDate.getDate();

  const cards = useMemo(
    () => [
      {
        key: "therapy",
        title: t.therapy,
        subtitle: t.therapySubtitle,
        route: "/therapy",
        image: IMAGE_SOURCES.therapy,
      },
      {
        key: "mindfulness",
        title: t.mindfulness,
        subtitle: t.mindfulnessSubtitle,
        route: "/mindfulness",
        image: IMAGE_SOURCES.mindfulness,
      },
      {
        key: "sos",
        title: t.sos,
        subtitle: t.sosSubtitle,
        route: "/sos",
        image: IMAGE_SOURCES.sos,
      },
      {
        key: "progress",
        title: t.progress,
        subtitle: t.progressSubtitle,
        route: "/progress",
        image: IMAGE_SOURCES.progress,
      },
      {
        key: "support",
        title: t.support,
        route: "/support",
        image: IMAGE_SOURCES.support,
      },
      {
        key: "facts",
        title: "Gerçekler",
        subtitle: "Online kumarın gerçek yüzü",
        route: "/facts",
        image: IMAGE_SOURCES.facts,
      },
      {
        key: "diary",
        title: t.diary,
        route: "/diary",
        image: IMAGE_SOURCES.diary,
      },
    ],
    [
      t.diary,
      t.mindfulness,
      t.mindfulnessSubtitle,
      t.progress,
      t.progressSubtitle,
      t.sos,
      t.sosSubtitle,
      t.support,
      t.therapy,
      t.therapySubtitle,
    ]
  );

  if (loading || !hydrated || !progressHydrated) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // Onboarding bitmediyse: eski Devam ekranı
  if (!done) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.logoWrapper}>
            <LinearGradient
              colors={["#FFB366", "#FF9933"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoOuter}
            >
              <LinearGradient
                colors={["#1D4C72", "#2A5F8F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoInner}
              >
                <Text style={styles.logoBrain}>🧠</Text>
              </LinearGradient>
            </LinearGradient>
          </View>

        <View style={styles.appNameRow}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.appNameIcon}
            resizeMode="contain"
            accessibilityLabel="Antislot icon"
          />
          <Text style={[styles.appName, { color: colors.text }]}>ANTISLOT</Text>
        </View>

        <Text style={[styles.tagline, { color: colors.text }]}>
          {t.tagline} <Text style={styles.taglineHighlight}>{t.taglineToolbox}</Text>
        </Text>

        <View style={styles.settingsContainer}>
          {/* Theme Picker */}
          <View style={styles.themeContainer}>
            <TouchableOpacity
              style={[styles.themeBox, { backgroundColor: colors.card, borderColor: colors.text + "20" }]}
              onPress={() => {
                setShowThemePicker(!showThemePicker);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.themeText, { color: colors.text }]}>
                {theme === "twitter-blue" ? "🔵 Twitter Mavisi" : theme === "black" ? "⚫ Siyah" : "⚪ Beyaz"} ▾
              </Text>
            </TouchableOpacity>
            
            {showThemePicker && (
              <View style={[styles.themeDropdown, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    theme === "twitter-blue" && { backgroundColor: "#1DA1F220" },
                  ]}
                  onPress={() => {
                    setTheme("twitter-blue");
                    setShowThemePicker(false);
                  }}
                >
                  <Text style={[styles.themeOptionText, { color: colors.text }, theme === "twitter-blue" && { color: "#1DA1F2", fontWeight: "600" }]}>
                    🔵 Twitter Mavisi
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    theme === "black" && { backgroundColor: "#00000020" },
                  ]}
                  onPress={() => {
                    setTheme("black");
                    setShowThemePicker(false);
                  }}
                >
                  <Text style={[styles.themeOptionText, { color: colors.text }, theme === "black" && { color: "#000000", fontWeight: "600" }]}>
                    ⚫ Siyah
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    theme === "white" && { backgroundColor: colors.primary + "20" },
                  ]}
                  onPress={() => {
                    setTheme("white");
                    setShowThemePicker(false);
                  }}
                >
                  <Text style={[styles.themeOptionText, { color: colors.text }, theme === "white" && { color: colors.primary, fontWeight: "600" }]}>
                    ⚪ Beyaz
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push("/continue")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#1D4C72", "#2A5F8F", "#3B75B8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>{t.continue}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Onboarding bittiyse: gerçek ana menü (ızgara)
  return (
    <LinearGradient
      colors={[homePalette.background, homePalette.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.homeContainer}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: homePalette.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <LinearGradient
            colors={["#0F172A", "#1D4C72", "#2A5F8F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.homeTitleBadge}
          >
            <View style={styles.homeTitleRow}>
              <Image
                source={require("../../assets/images/icon.png")}
                style={styles.homeTitleIcon}
                resizeMode="contain"
                accessibilityLabel="Antislot icon"
              />
              <Text style={styles.homeTitleText}>
                ANTİ-<Text style={styles.homeTitleAccent}>SLOT</Text>
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.gambleFreeCard}>
          <ImageBackground
            source={{ uri: IMAGE_SOURCES.hero }}
            style={styles.gambleFreeImage}
            imageStyle={styles.gambleFreeImageRadius}
            resizeMode="cover"
            blurRadius={1}
          >
            <View style={styles.imageTintHero} />
            <LinearGradient
              colors={["rgba(0, 0, 0, 0.18)", "rgba(0, 0, 0, 0.32)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gambleFreeOverlay}
            >
              <View style={styles.gambleFreeLeft}>
                <Text style={styles.gambleFreeNumber}>{heroMeta.value}</Text>
                <Text style={styles.gambleFreeLabel}>{heroMeta.label}</Text>
                <Text style={styles.gambleFreeSubLabel}>{heroMeta.subLabel}</Text>
              </View>
              <View style={styles.gambleFreeRight}>
                <View style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <Text style={styles.calendarHeaderText}>{calendarMonth}</Text>
                  </View>
                  <View style={styles.calendarBody}>
                    <Text style={styles.calendarBodyText}>{calendarDay}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.grid}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.key}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(card.route)}
            >
              <ImageBackground
                source={{ uri: card.image }}
                style={styles.cardImage}
                imageStyle={styles.cardImageRadius}
                resizeMode="cover"
                blurRadius={2}
              >
                <View style={styles.imageTint} />
                <LinearGradient
                  colors={["rgba(0, 0, 0, 0.12)", "rgba(0, 0, 0, 0.35)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.cardOverlay}
                >
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  {card.subtitle ? (
                    <Text style={styles.cardSub} numberOfLines={2}>
                      {card.subtitle}
                    </Text>
                  ) : null}
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      </SafeAreaView>

      {/* Hoş Geldiniz Modali */}
      <Modal
        visible={showWelcome}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWelcome(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.98)", "#FFFFFF"]}
            style={styles.modalContent}
          >
            <LinearGradient
              colors={["#FFF3E0", "#FFE0B2", "#FFCC80"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalIcon}
            >
              <Text style={styles.modalIconEmoji}>🎉</Text>
            </LinearGradient>

            <Text style={styles.modalTitle}>{t.welcomeToAntislot}</Text>
            <Text style={styles.modalDescription}>
              {t.welcomeDescription}
            </Text>

            <TouchableOpacity
              onPress={async () => {
                await setWelcomeShown();
                setShowWelcome(false);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#1D4C72", "#2A5F8F", "#3B75B8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalNextBtn}
              >
                <Text style={styles.modalNextText}>{t.next}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F9FF",
  },

  // Onboarding açılış ekranı (eski)
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoWrapper: { 
    marginBottom: 32,
    shadowColor: "#FFB366",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF9933",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logoInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1D4C72",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  logoBrain: { 
    fontSize: 64,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  appNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  appNameIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 4,
    color: "#1D4C72",
    textShadowColor: "rgba(29, 76, 114, 0.2)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#1D4C72",
    textAlign: "center",
    marginBottom: 40,
    fontWeight: "600",
    lineHeight: 24,
  },
  taglineHighlight: { 
    color: "#FF6B6B", 
    fontWeight: "900",
    fontSize: 18,
  },
  settingsContainer: {
    width: "100%",
    marginBottom: 16,
  },
  themeContainer: {
    width: "100%",
    position: "relative",
    zIndex: 9,
  },
  themeBox: {
    width: "100%",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1.5,
  },
  themeText: {
    fontSize: 14,
    textAlign: "center",
  },
  themeDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderRadius: 16,
    marginTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
    borderWidth: 1,
  },
  themeOption: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  themeOptionText: {
    fontSize: 15,
  },

  button: {
    width: "100%",
    borderRadius: 28,
    marginTop: 12,
    overflow: "hidden",
    shadowColor: "#1D4C72",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { 
    color: "white", 
    fontSize: 20, 
    fontWeight: "700",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Gerçek Ana Sayfa (ızgara)
  homeContainer: {
    flex: 1,
    backgroundColor: "#F4F9FF",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110, // Sekme çubuğu için alt boşluk (iOS'ta üst üste binmeyi önler)
    opacity: 1, // Tam opak - iOS'ta soluk görünmesin
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  homeTitleBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  homeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeTitleIcon: {
    width: 34,
    height: 34,
    marginRight: 10,
  },
  homeTitleText: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  homeTitleAccent: {
    color: "#FFB366",
    textShadowColor: "rgba(255, 179, 102, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    opacity: 1, // Izgara tam opak
  },

  card: {
    width: "48%",
    height: 145,
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: "#FFFFFF",
  },
  cardImage: {
    flex: 1,
  },
  cardImageRadius: {
    borderRadius: 20,
  },
  cardOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  imageTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  imageTintHero: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "white",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardSub: { 
    fontSize: 12, 
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    maxWidth: "90%",
  },
  gambleFreeCard: {
    borderRadius: 22,
    marginBottom: 22,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },
  gambleFreeImage: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    height: 135,
  },
  gambleFreeImageRadius: {
    borderRadius: 22,
  },
  gambleFreeOverlay: {
    flex: 1,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gambleFreeLeft: {
    flex: 1,
    justifyContent: "center",
  },
  gambleFreeNumber: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  gambleFreeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  gambleFreeSubLabel: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.9,
    fontWeight: "600",
  },
  gambleFreeRight: {
    alignItems: "flex-end",
  },
  calendarCard: {
    width: 58,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  calendarHeader: {
    width: "100%",
    backgroundColor: "#E05858",
    paddingVertical: 3,
    alignItems: "center",
  },
  calendarHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  calendarBody: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 7,
  },
  calendarBodyText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2B2B2B",
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 32,
    padding: 40,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  modalIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#FFB366",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconEmoji: {
    fontSize: 60,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1D4C72",
    marginBottom: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  modalNextBtn: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    shadowColor: "#1D4C72",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalNextText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
