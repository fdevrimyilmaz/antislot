import { SOSQuickAccess } from "@/components/sos-quick-access";
import { AntiSlotEmblem } from "@/components/ui/anti-slot-emblem";
import { ENABLE_SMS_ROLE } from "@/constants/featureFlags";
import { Fonts, Radius } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAutoTranslatedValue, useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import { SUPPORTED_LANGUAGE_OPTIONS, type SupportedLanguage } from "@/i18n/translations";
import { hasWelcomeBeenShown, isOnboardingDone, setWelcomeShown } from "@/store/onboardingFlag";
import { useProgressStore } from "@/store/progressStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Home screen renders core navigation cards.

type CardVisual = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  gradient: [string, string, ...string[]];
  accent: string;
};

const CARD_VISUALS: Record<string, CardVisual> = {
  urge: { icon: "pulse-outline", gradient: ["#7A1D1D", "#B33A1B"], accent: "#F97316" },
  "money-protection": { icon: "shield-checkmark-outline", gradient: ["#0B5B67", "#117C8B"], accent: "#2DD4BF" },
  therapy: { icon: "medkit-outline", gradient: ["#0E3E6E", "#2C5F9B"], accent: "#60A5FA" },
  mindfulness: { icon: "leaf-outline", gradient: ["#0D6B55", "#0D8A6E"], accent: "#34D399" },
  progress: { icon: "stats-chart-outline", gradient: ["#17407A", "#2763B8"], accent: "#93C5FD" },
  "sms-filter": { icon: "mail-unread-outline", gradient: ["#505E75", "#69778F"], accent: "#CBD5E1" },
  facts: { icon: "eye-outline", gradient: ["#6E4918", "#A8711F"], accent: "#FBBF24" },
  diary: { icon: "book-outline", gradient: ["#30435A", "#4A6788"], accent: "#A5B4FC" },
};

const DEFAULT_CARD_VISUAL: CardVisual = {
  icon: "grid-outline",
  gradient: ["#334155", "#475569"],
  accent: "#CBD5E1",
};

const HOME_LANGUAGE_COPY = {
  tr: {
    title: "Uygulama Dili",
    subtitle: "Istedigin dili sec. Yeni dillerde temel metinler cevrildi; kalan bolumler Ingilizce fallback kullanir.",
    active: "Secili",
  },
  en: {
    title: "App Language",
    subtitle: "Choose your language. Core labels are localized; remaining text currently falls back to English.",
    active: "Selected",
  },
} as const;

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const { t, language, selectedLanguage, setLanguage } = useLanguage();
  const { theme, setTheme, colors } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const { hydrated } = useUserAddictionsStore();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const progressHydrated = useProgressStore((state) => state.hydrated);
  const heroAnim = useRef(new Animated.Value(0)).current;
  const gridAnim = useRef(new Animated.Value(0)).current;
  const isEnglish = language === "en";
  const languageCopy = useLocalizedCopy(HOME_LANGUAGE_COPY);
  const selectedLanguageOption = useMemo(
    () => SUPPORTED_LANGUAGE_OPTIONS.find((option) => option.code === selectedLanguage),
    [selectedLanguage]
  );

  const uiCopyBase = useMemo(
    () => ({
      monthLabels: isEnglish
        ? ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
        : ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"],
      smsTitle: t.homeSmsTitle,
      smsSubtitle: t.homeSmsSubtitle,
      factsTitle: t.homeFactsTitle,
      factsSubtitle: t.homeFactsSubtitle,
      themeTwitterBlue: isEnglish ? "Twitter Blue" : "Twitter Mavisi",
      themeBlack: isEnglish ? "Black" : "Siyah",
      themeWhite: isEnglish ? "White" : "Beyaz",
    }),
    [isEnglish, t.homeFactsSubtitle, t.homeFactsTitle, t.homeSmsSubtitle, t.homeSmsTitle]
  );
  const uiCopy = useAutoTranslatedValue(uiCopyBase);

  const heroMeta = useMemo(() => {
  const days = Number.isFinite(gamblingFreeDays)
    ? gamblingFreeDays
    : 0;

  const date = new Date();
  if (days > 0) {
    date.setDate(date.getDate() - days);
  }

  const label =
    days <= 0 ? t.homeStartTitle : t.days;

  const subLabel =
    days <= 0 ? t.homeStartSubtitle : t.gambleFree;

  return {
    value: days,
    label,
    subLabel,
    date,
  };
}, [
  gamblingFreeDays,
  t.days,
  t.gambleFree,
  t.homeStartTitle,
  t.homeStartSubtitle,
]);

  const handleLanguageChange = (nextLanguage: SupportedLanguage) => {
    if (nextLanguage === selectedLanguage) {
      setShowLanguageOptions(false);
      return;
    }
    void setLanguage(nextLanguage);
    setShowLanguageOptions(false);
  };

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

  useEffect(() => {
    if (loading || !done) return;
    heroAnim.setValue(0);
    gridAnim.setValue(0);
    Animated.parallel([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(gridAnim, {
        toValue: 1,
        duration: 520,
        delay: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [done, gridAnim, heroAnim, loading]);

  const homePalette = {
    background: colors.background,
    title: colors.text,
    subtitle: colors.textSecondary,
    border: colors.border,
    card: colors.card,
    primary: colors.primary,
  };

  const calendarDate = heroMeta.date ?? new Date();
  const calendarMonth = uiCopy.monthLabels[calendarDate.getMonth()] ?? uiCopy.monthLabels[0];
  const calendarDay = calendarDate.getDate();

  const cards = useMemo<{ key: string; title: string; subtitle?: string; route: Href; visual: CardVisual }[]>(
    () => {
      const resolveVisual = (key: string): CardVisual => CARD_VISUALS[key] ?? DEFAULT_CARD_VISUAL;

      const items: { key: string; title: string; subtitle?: string; route: Href; visual: CardVisual }[] = [
        {
          key: "urge",
          title: t.urgeSupport,
          subtitle: t.urgeSupportSubtitle,
          route: "/urge/detect",
          visual: resolveVisual("urge"),
        },
        {
          key: "money-protection",
          title: t.moneyProtectionCardTitle,
          subtitle: t.moneyProtectionCardSubtitle,
          route: "/money-protection",
          visual: resolveVisual("money-protection"),
        },
        {
          key: "therapy",
          title: t.therapy,
          subtitle: t.therapySubtitle,
          route: "/therapy",
          visual: resolveVisual("therapy"),
        },
        {
          key: "mindfulness",
          title: t.mindfulness,
          subtitle: t.mindfulnessSubtitle,
          route: "/mindfulness",
          visual: resolveVisual("mindfulness"),
        },
        {
          key: "progress",
          title: t.progress,
          subtitle: t.progressSubtitle,
          route: "/progress",
          visual: resolveVisual("progress"),
        },
      ];

      if (ENABLE_SMS_ROLE) {
        items.push({
          key: "sms-filter",
          title: uiCopy.smsTitle,
          subtitle: uiCopy.smsSubtitle,
          route: "/sms-filter",
          visual: resolveVisual("sms-filter"),
        });
      }

      items.push(
        {
          key: "facts",
          title: uiCopy.factsTitle,
          subtitle: uiCopy.factsSubtitle,
          route: "/facts",
          visual: resolveVisual("facts"),
        },
        {
          key: "diary",
          title: t.diary,
          route: "/diary",
          visual: resolveVisual("diary"),
        }
      );

      return items;
    },
    [
      t.diary,
      t.mindfulness,
      t.mindfulnessSubtitle,
      t.progress,
      t.progressSubtitle,
      t.therapy,
      t.therapySubtitle,
      t.urgeSupport,
      t.urgeSupportSubtitle,
      t.moneyProtectionCardTitle,
      t.moneyProtectionCardSubtitle,
      uiCopy.factsSubtitle,
      uiCopy.factsTitle,
      uiCopy.smsSubtitle,
      uiCopy.smsTitle,
    ]
  );

  const heroStyle = {
    opacity: heroAnim,
    transform: [
      {
        translateY: heroAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  const gridStyle = {
    opacity: gridAnim,
    transform: [
      {
        translateY: gridAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

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
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container} testID="welcome-screen">
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
          <AntiSlotEmblem size={32} style={styles.appNameIcon} accessibilityLabel="Antislot emblem" />
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
                {theme === "twitter-blue"
                  ? `🔵 ${uiCopy.themeTwitterBlue}`
                  : theme === "black"
                    ? `⚫ ${uiCopy.themeBlack}`
                    : `⚪ ${uiCopy.themeWhite}`}{" "}
                ▾
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
                    🔵 {uiCopy.themeTwitterBlue}
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
                    ⚫ {uiCopy.themeBlack}
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
                    ⚪ {uiCopy.themeWhite}
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
            testID="onboarding-continue"
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
      colors={colors.backgroundGradient as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.homeContainer, { backgroundColor: homePalette.background }]}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: homePalette.background }]} testID="home-screen">
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.homeTitleBadge}
          >
            <View style={styles.homeTitleRow}>
              <AntiSlotEmblem size={36} style={styles.homeTitleIcon} accessibilityLabel="Antislot emblem" />
              <Text style={styles.homeTitleText}>
                ANTİ-<Text style={styles.homeTitleAccent}>SLOT</Text>
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={[styles.languageSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.languageTrigger, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => setShowLanguageOptions((prev) => !prev)}
            activeOpacity={0.9}
          >
            <View style={styles.languageTriggerLeft}>
              <View style={[styles.languageTriggerIconWrap, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="language-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.languageTriggerTextWrap}>
                <Text style={[styles.languageSectionTitle, { color: colors.text }]}>{languageCopy.title}</Text>
                <Text style={[styles.languageCurrentValue, { color: colors.textSecondary }]}>
                  {selectedLanguageOption?.nativeName ?? selectedLanguage}
                </Text>
              </View>
            </View>
            <Ionicons
              name={showLanguageOptions ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showLanguageOptions ? (
            <View style={[styles.languageDropdown, { borderColor: colors.border, backgroundColor: colors.background }]}>
              {SUPPORTED_LANGUAGE_OPTIONS.map((option, index) => {
                const isActive = selectedLanguage === option.code;
                const isLast = index === SUPPORTED_LANGUAGE_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={option.code}
                    style={[
                      styles.languageOptionRow,
                      {
                        borderColor: colors.border,
                        borderBottomWidth: isLast ? 0 : 1,
                        backgroundColor: isActive ? `${colors.primary}12` : "transparent",
                      },
                    ]}
                    onPress={() => handleLanguageChange(option.code)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.languageOptionLabelWrap}>
                      <Text style={[styles.languageNative, { color: colors.text }]}>{option.nativeName}</Text>
                      <Text style={[styles.languageEnglish, { color: colors.textSecondary }]}>{option.englishName}</Text>
                    </View>
                    {isActive ? (
                      <View style={[styles.languageActivePill, { backgroundColor: `${colors.primary}1A` }]}>
                        <Text style={[styles.languageActiveText, { color: colors.primary }]}>{languageCopy.active}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>

        <Animated.View style={[styles.gambleFreeCard, heroStyle]}>
          <LinearGradient
            colors={["#0F2E57", "#1D4C72", "#2D6EA2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gambleFreeImage}
          >
            <View style={styles.heroGlowTop} />
            <View style={styles.heroGlowBottom} />
            <View style={styles.heroRing} />
            <LinearGradient
              colors={["rgba(0, 0, 0, 0.18)", "rgba(0, 0, 0, 0.32)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gambleFreeOverlay}
            >
              <View style={styles.gambleFreeLeft}>
                <View style={styles.heroSignalRow}>
                  <Ionicons name="sparkles-outline" size={13} color="rgba(226, 232, 240, 0.92)" />
                  <View style={styles.heroSignalDot} />
                </View>
                <Text style={styles.gambleFreeNumber}>{heroMeta.value}</Text>
                <Text style={styles.gambleFreeLabel}>{heroMeta.label}</Text>
                <Text style={styles.gambleFreeSubLabel}>{heroMeta.subLabel}</Text>
              </View>
              <View style={styles.gambleFreeRight}>
                <View style={styles.heroStatusBadge}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#F8FAFC" />
                </View>
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
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.grid, gridStyle]}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.key}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(card.route)}
              testID={`home-card-${card.key}`}
            >
              <LinearGradient
                colors={card.visual.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={[styles.cardAccentStrip, { backgroundColor: card.visual.accent }]} />
                <View style={styles.cardGlowLarge} />
                <View style={styles.cardGlowSmall} />

                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardIconBadge}>
                    <Ionicons name={card.visual.icon} size={20} color="#F8FAFC" />
                  </View>
                  <View style={[styles.cardArrowBadge, { borderColor: `${card.visual.accent}70` }]}>
                    <Ionicons name="arrow-forward" size={14} color="#F8FAFC" />
                  </View>
                </View>

                <Ionicons name={card.visual.icon} size={70} color={`${card.visual.accent}44`} style={styles.cardWatermarkIcon} />

                <View style={styles.cardTextBlock}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  {card.subtitle ? (
                    <Text style={styles.cardSub} numberOfLines={3}>
                      {card.subtitle}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.cardBottomAccent, { backgroundColor: card.visual.accent }]} />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
      <SOSQuickAccess variant="floating" />
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
            colors={["#FEF3C7", "#FDE68A", "#FCD34D"]}
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
    backgroundColor: "#F8FAFC",
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
    marginRight: 10,
  },
  appName: {
    fontSize: 32,
    fontFamily: Fonts.display,
    letterSpacing: 3,
    color: "#0F5B7A",
  },
  tagline: {
    fontSize: 15,
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 40,
    fontFamily: Fonts.bodyMedium,
    lineHeight: 24,
  },
  taglineHighlight: { 
    color: "#D97706", 
    fontFamily: Fonts.display,
    fontSize: 17,
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
    borderRadius: Radius.lg,
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
    fontFamily: Fonts.bodyMedium,
    textAlign: "center",
  },
  themeDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderRadius: Radius.lg,
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
    fontFamily: Fonts.bodyMedium,
  },

  button: {
    width: "100%",
    borderRadius: Radius.xl,
    marginTop: 12,
    overflow: "hidden",
    shadowColor: "#1D4C72",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { 
    color: "white", 
    fontSize: 18, 
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.6,
  },

  // Gerçek Ana Sayfa (ızgara)
  homeContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    marginBottom: 16,
  },
  homeTitleBadge: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  homeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeTitleIcon: {
    marginRight: 12,
  },
  homeTitleText: {
    fontSize: 22,
    fontFamily: Fonts.display,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  homeTitleAccent: {
    color: "#F2C94C",
    fontFamily: Fonts.display,
  },
  languageSection: {
    borderRadius: Radius.xl,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  languageTrigger: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  languageTriggerLeft: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1, minWidth: 0 },
  languageTriggerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  languageTriggerTextWrap: { flex: 1, minWidth: 0 },
  languageSectionTitle: { fontSize: 13, fontFamily: Fonts.bodySemiBold, lineHeight: 17 },
  languageCurrentValue: { fontSize: 11, fontFamily: Fonts.body, lineHeight: 15, marginTop: 1 },
  languageDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  languageOptionRow: {
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  languageOptionLabelWrap: { flex: 1, minWidth: 0 },
  languageNative: { fontSize: 13, fontFamily: Fonts.bodySemiBold, lineHeight: 17 },
  languageEnglish: { fontSize: 11, fontFamily: Fonts.body, lineHeight: 15, marginTop: 1 },
  languageActivePill: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  languageActiveText: { fontSize: 10, fontFamily: Fonts.bodySemiBold },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    opacity: 1,
  },

  card: {
    width: "48%",
    height: 152,
    borderRadius: Radius.xl,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
  },
  cardGradient: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  cardAccentStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    opacity: 0.9,
  },
  cardGlowLarge: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 58,
    right: -36,
    top: -28,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  cardGlowSmall: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    left: -18,
    bottom: -16,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.26)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.34)",
  },
  cardArrowBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.22)",
    borderWidth: 1,
  },
  cardWatermarkIcon: {
    position: "absolute",
    right: -6,
    top: 6,
  },
  cardTextBlock: {
    alignSelf: "stretch",
    gap: 4,
    marginTop: 28,
  },
  cardBottomAccent: {
    width: 56,
    height: 3,
    borderRadius: 999,
    opacity: 0.95,
  },
  cardTitle: { 
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
    color: "#F8FAFC",
    marginBottom: 4,
    letterSpacing: 0.15,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7,
  },
  cardSub: { 
    fontSize: 12, 
    lineHeight: 16,
    color: "rgba(241, 245, 249, 0.96)",
    fontFamily: Fonts.bodyMedium,
    letterSpacing: 0.14,
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: "100%",
  },
  gambleFreeCard: {
    borderRadius: Radius.xxl,
    marginBottom: 24,
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  gambleFreeImage: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    height: 148,
  },
  heroGlowTop: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -78,
    right: -48,
    backgroundColor: "rgba(148, 197, 255, 0.24)",
  },
  heroGlowBottom: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: -72,
    left: -52,
    backgroundColor: "rgba(255, 255, 255, 0.13)",
  },
  heroRing: {
    position: "absolute",
    width: 136,
    height: 136,
    borderRadius: 68,
    right: 12,
    top: 10,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.24)",
  },
  gambleFreeOverlay: {
    flex: 1,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gambleFreeLeft: {
    flex: 1,
    justifyContent: "center",
  },
  heroSignalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  heroSignalDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(191, 219, 254, 0.95)",
  },
  gambleFreeNumber: {
    fontSize: 42,
    fontFamily: Fonts.display,
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -1,
  },
  gambleFreeLabel: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: 4,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  gambleFreeSubLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    fontFamily: Fonts.bodyMedium,
    letterSpacing: 0.2,
  },
  gambleFreeRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  heroStatusBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.35)",
  },
  calendarCard: {
    width: 60,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  calendarHeader: {
    width: "100%",
    backgroundColor: "#DC2626",
    paddingVertical: 4,
    alignItems: "center",
  },
  calendarHeaderText: {
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  calendarBody: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 8,
  },
  calendarBodyText: {
    fontSize: 20,
    fontFamily: Fonts.bodySemiBold,
    color: "#0F172A",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 28,
    padding: 40,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.15,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "#FFFFFF",
  },
  modalIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  modalIconEmoji: {
    fontSize: 56,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Fonts.display,
    color: "#0F172A",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  modalNextBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#1D4C72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  modalNextText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.2,
  },
});
