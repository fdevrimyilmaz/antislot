import { type Href, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import {
  isOnboardingDone,
  hasWelcomeBeenShown,
  setWelcomeShown,
} from "@/store/onboardingFlag";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProgressStore } from "@/store/progressStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";
import { useToast } from "@/components/ui/toast";
import { ThemeTexture } from "@/components/theme-texture";
import { HomeCard, type HomeCardTone } from "@/components/ui/home-card";
import { DailyStreakCard } from "@/components/ui/daily-streak-card";
import { FloatingSOSButton } from "@/components/ui/floating-sos-button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { SavingsWidget, DailyCheckinWidget } from "@/components/ui/insight-widgets";
import { TodayCard } from "@/components/ui/today-card";
import {
  formatRemaining,
  isLockoutActive,
  remainingMs,
  useLockoutStore,
} from "@/store/lockoutStore";
import {
  formatHM,
  getActiveWindow,
  useRiskWindowsStore,
} from "@/store/riskWindowsStore";
import {
  pendingCelebration,
  useCelebrationStore,
  type MilestoneThreshold,
} from "@/store/celebrationStore";
import { MilestoneCelebration } from "@/components/ui/milestone-celebration";
import { WelcomeTour } from "@/components/ui/welcome-tour";
import { useWelcomeTourStore } from "@/store/welcomeTourStore";
import { pickDailyMotivation } from "../data/dailyMotivations";

type ModuleDef = {
  key: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  decorativeIcon: React.ComponentProps<typeof Ionicons>["name"];
  tone: HomeCardTone;
  route: Href;
};

// Motivation copy is sourced from the rotating dataset in
// `app/data/dailyMotivations.ts` — picks a stage-appropriate quote keyed on
// (streak length, day-of-year) so the same streak shows a different message
// every day.

export default function HomeScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const toast = useToast();

  const { hydrated } = useUserAddictionsStore();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const progressHydrated = useProgressStore((state) => state.hydrated);

  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const onboardingDone = await isOnboardingDone();
      setDone(onboardingDone);
      setLoading(false);

      if (!onboardingDone) {
        router.replace("/onboarding");
        return;
      }

      const welcomeShown = await hasWelcomeBeenShown();
      if (!welcomeShown) {
        await setWelcomeShown();
        toast.info(t.welcomeDescription, t.welcomeToAntislot);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const safeDays = Number.isFinite(gamblingFreeDays) ? gamblingFreeDays : 0;
  const motivation = useMemo(() => pickDailyMotivation(safeDays), [safeDays]);

  const lockoutState = useLockoutStore((s) => s.state);
  const lockoutActive = isLockoutActive(lockoutState);
  const lockoutLabel = lockoutActive
    ? formatRemaining(remainingMs(lockoutState))
    : "";

  // Re-evaluate the active risk window every minute so the banner appears
  // and disappears in real time as the clock crosses the window boundary.
  const riskWindows = useRiskWindowsStore((s) => s.windows);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const activeRiskWindow = useMemo(
    () => getActiveWindow(riskWindows, now),
    [riskWindows, now]
  );

  // Streak milestone celebration. Fires once per crossed threshold;
  // persisted in celebrationStore so a relaunch doesn't double-show.
  const celebrationHydrated = useCelebrationStore((s) => s.hydrated);
  const celebratedUpTo = useCelebrationStore((s) => s.celebratedUpTo);
  const hydrateCelebration = useCelebrationStore((s) => s.hydrate);
  const markCelebrated = useCelebrationStore((s) => s.markCelebrated);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneThreshold | null>(null);

  useEffect(() => {
    if (!celebrationHydrated) hydrateCelebration();
  }, [celebrationHydrated, hydrateCelebration]);

  useEffect(() => {
    if (!celebrationHydrated || !progressHydrated) return;
    const next = pendingCelebration(safeDays, celebratedUpTo);
    if (next !== null) setActiveMilestone(next);
  }, [celebrationHydrated, progressHydrated, safeDays, celebratedUpTo]);

  const handleCelebrationClose = async () => {
    if (activeMilestone !== null) {
      await markCelebrated(activeMilestone);
    }
    setActiveMilestone(null);
  };

  // Welcome tour — fires once after onboarding finishes (or once for
  // existing users on first launch after this version ships).
  const tourHydrated = useWelcomeTourStore((s) => s.hydrated);
  const tourShown = useWelcomeTourStore((s) => s.shown);
  const hydrateTour = useWelcomeTourStore((s) => s.hydrate);
  const markTourShown = useWelcomeTourStore((s) => s.markShown);
  const [tourVisible, setTourVisible] = useState(false);

  useEffect(() => {
    if (!tourHydrated) hydrateTour();
  }, [tourHydrated, hydrateTour]);

  useEffect(() => {
    if (!tourHydrated || tourShown) return;
    // Open the tour only after onboarding is finished and the welcome
    // toast has had a moment to clear.
    if (done && !loading) {
      const timeout = setTimeout(() => setTourVisible(true), 800);
      return () => clearTimeout(timeout);
    }
  }, [tourHydrated, tourShown, done, loading]);

  const handleTourClose = async () => {
    setTourVisible(false);
    await markTourShown();
  };

  // Modules are split into two visual groups on the home grid:
  //   • "Hızlı erişim" — safety + intervention quartet (always on top)
  //   • "Araştır ve büyü" — supporting tools and content
  // The 30-day curriculum is intentionally NOT in the grid: it's surfaced
  // as today's task via <TodayCard /> right above.
  const quickAccess = useMemo<ModuleDef[]>(
    () => [
      {
        key: "sos",
        title: "Dürtü Desteği",
        subtitle: "Yönlendirmeli müdahalelerle",
        icon: "pulse",
        decorativeIcon: "pulse-outline",
        tone: "coral",
        route: "/sos",
      },
      {
        key: "blocker",
        title: "Para Koruma",
        subtitle: "Bugün param güvende mi?",
        icon: "shield-checkmark",
        decorativeIcon: "shield-outline",
        tone: "teal",
        route: "/blocker",
      },
      {
        key: "self-exclusion",
        title: "Self-Exclusion",
        subtitle: "Kararı önceden ver, kilitle",
        icon: "lock-closed",
        decorativeIcon: "shield-checkmark",
        tone: "slate",
        route: "/self-exclusion" as Href,
      },
      {
        key: "risk-windows",
        title: "Risk Pencereleri",
        subtitle: "Riskli saatleri önceden işaretle",
        icon: "time",
        decorativeIcon: "alarm",
        tone: "coral",
        route: "/risk-windows" as Href,
      },
    ],
    []
  );

  const extras = useMemo<ModuleDef[]>(
    () => [
      {
        key: "insights",
        title: "İçgörüler",
        subtitle: "Kişisel patern analizi",
        icon: "analytics",
        decorativeIcon: "stats-chart",
        tone: "indigo",
        route: "/insights" as Href,
      },
      {
        key: "therapy",
        title: "Destek Seansları",
        subtitle: "Yönlendirmeli",
        icon: "medkit",
        decorativeIcon: "medkit-outline",
        tone: "indigo",
        route: "/therapy",
      },
      {
        key: "mindfulness",
        title: "Farkındalık",
        subtitle: "Seanslar",
        icon: "leaf",
        decorativeIcon: "leaf-outline",
        tone: "emerald",
        route: "/mindfulness",
      },
      {
        key: "modules",
        title: "Modüller",
        subtitle: "Para alternatifi, gelecek simülasyonu…",
        icon: "apps",
        decorativeIcon: "grid",
        tone: "amber",
        route: "/modules" as Href,
      },
      {
        key: "progress",
        title: "İlerleme",
        subtitle: "Şimdi incele",
        icon: "bar-chart",
        decorativeIcon: "stats-chart",
        tone: "ocean",
        route: "/progress",
      },
      {
        key: "diary",
        title: "Günlük",
        subtitle: "Özel günlüğün",
        icon: "book",
        decorativeIcon: "book-outline",
        tone: "indigo",
        route: "/diary",
      },
      {
        key: "facts",
        title: "Gerçekler",
        subtitle: "Online kumarın gerçek yüzü",
        icon: "eye",
        decorativeIcon: "eye-outline",
        tone: "violet",
        route: "/facts",
      },
      {
        key: "sms-filter",
        title: "Spam Tanıyıcı",
        subtitle: "Şüpheli mesajı yapıştır, sınıflandır",
        icon: "mail-unread",
        decorativeIcon: "mail-outline",
        tone: "slate",
        route: "/sms-filter",
      },
    ],
    []
  );

  if (loading || !done || !hydrated || !progressHydrated) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loader}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.homeContainer}
    >
      <ThemeTexture primary={colors.primary} secondary={colors.secondary} accent={colors.accent} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentWrapper}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand pill */}
          <View style={styles.brandRow}>
            <LinearGradient
              colors={colors.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandPill}
            >
              <View style={[styles.brandBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
                <Ionicons name="ban" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.brandText} accessibilityRole="header">
                ANTİ-<Text style={styles.brandAccent}>SLOT</Text>
              </Text>
            </LinearGradient>
          </View>

          {/* Language + theme quick controls */}
          <View style={styles.controlsRow}>
            <View style={styles.controlsLang}>
              <LanguageSelector variant="row" />
            </View>
            <TouchableOpacity
              onPress={() => router.push("/themes" as Href)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Tema galerisini aç"
              style={[
                styles.themeChip,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.themeChipIcon,
                  { backgroundColor: `${colors.primary}14` },
                ]}
              >
                <Ionicons name="color-palette" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.themeChipLabel, { color: colors.text }]}>Tema</Text>
            </TouchableOpacity>
          </View>

          {/* Self-exclusion banner — only while a lockout window is active. */}
          {lockoutActive ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/self-exclusion" as Href)}
              accessibilityRole="button"
              accessibilityLabel={`Self-Exclusion aktif, ${lockoutLabel} kaldı`}
              style={[
                styles.lockoutBanner,
                {
                  backgroundColor: `${colors.success}1A`,
                  borderColor: colors.success,
                },
              ]}
            >
              <View
                style={[
                  styles.lockoutIcon,
                  { backgroundColor: `${colors.success}22` },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={colors.success}
                />
              </View>
              <View style={styles.lockoutText}>
                <Text
                  style={[styles.lockoutTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  Self-Exclusion aktif
                </Text>
                <Text
                  style={[styles.lockoutSub, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  Kalan: {lockoutLabel} · dokun, detayları gör
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}

          {/* Active risk-window alert — only while clock falls inside one. */}
          {activeRiskWindow ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/risk-windows" as Href)}
              accessibilityRole="button"
              accessibilityLabel={`Risk penceresi aktif: ${activeRiskWindow.label}`}
              style={[
                styles.riskBanner,
                {
                  backgroundColor: `${colors.danger}1A`,
                  borderColor: colors.danger,
                },
              ]}
            >
              <View
                style={[
                  styles.riskIcon,
                  { backgroundColor: `${colors.danger}22` },
                ]}
              >
                <Ionicons name="warning" size={18} color={colors.danger} />
              </View>
              <View style={styles.riskText}>
                <Text
                  style={[styles.riskTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  Risk penceresi: {activeRiskWindow.label}
                </Text>
                <Text
                  style={[styles.riskSub, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {formatHM(activeRiskWindow.startHour, activeRiskWindow.startMinute)}
                  –{formatHM(activeRiskWindow.endHour, activeRiskWindow.endMinute)}
                  {" · dürtü riski yüksek, nazik ol"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}

          {/* Daily streak hero */}
          <View style={styles.heroWrap}>
            <DailyStreakCard
              days={safeDays}
              headline={motivation.headline}
              message={motivation.message}
            />
          </View>

          {/* Insight widgets: savings + daily check-in */}
          <View style={styles.insightRow}>
            <SavingsWidget days={safeDays} />
            <DailyCheckinWidget />
          </View>

          {/* "Today" checklist — surfaces pledge, curriculum day, check-in */}
          <TodayCard />

          {/* Quick-access safety + intervention quartet */}
          <Text style={[styles.groupLabel, { color: colors.textMuted }]}>
            HIZLI ERİŞİM
          </Text>
          <View style={styles.grid}>
            {quickAccess.map((m) => (
              <HomeCard
                key={m.key}
                title={m.title}
                subtitle={m.subtitle}
                icon={m.icon}
                decorativeIcon={m.decorativeIcon}
                tone={m.tone}
                onPress={() => router.push(m.route)}
              />
            ))}
          </View>

          {/* Supporting tools and content */}
          <Text style={[styles.groupLabel, { color: colors.textMuted, marginTop: 18 }]}>
            ARAŞTIR VE BÜYÜ
          </Text>
          <View style={styles.grid}>
            {extras.map((m) => (
              <HomeCard
                key={m.key}
                title={m.title}
                subtitle={m.subtitle}
                icon={m.icon}
                decorativeIcon={m.decorativeIcon}
                tone={m.tone}
                onPress={() => router.push(m.route)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating SOS — always within thumb reach */}
      <FloatingSOSButton />

      <MilestoneCelebration
        visible={activeMilestone !== null}
        threshold={activeMilestone}
        streakDays={safeDays}
        onClose={handleCelebrationClose}
      />

      <WelcomeTour visible={tourVisible} onClose={handleTourClose} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  homeContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
  },
  brandRow: {
    alignItems: "center",
    marginBottom: 18,
    marginTop: 4,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  brandBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
    color: "#FFFFFF",
  },
  brandAccent: {
    color: "#FFB366",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginBottom: 14,
  },
  controlsLang: {
    flex: 1,
    minWidth: 0,
  },
  themeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  themeChipLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  heroWrap: {
    marginBottom: 14,
  },
  lockoutBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  lockoutIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lockoutText: { flex: 1, minWidth: 0 },
  lockoutTitle: { fontSize: 14, fontWeight: "800" },
  lockoutSub: { fontSize: 12, marginTop: 2 },
  riskBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  riskIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  riskText: { flex: 1, minWidth: 0 },
  riskTitle: { fontSize: 14, fontWeight: "800" },
  riskSub: { fontSize: 12, marginTop: 2 },
  insightRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 10,
    marginLeft: 4,
  },
});
