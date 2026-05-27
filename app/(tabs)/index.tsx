import { type Href, router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { FloatingSOSButton } from "@/components/ui/floating-sos-button";
import {
  formatRemaining,
  isLockoutActive,
  remainingMs,
  useLockoutStore,
} from "@/store/lockoutStore";
import {
  getActiveWindow,
  useRiskWindowsStore,
} from "@/store/riskWindowsStore";
import {
  getMilestoneCopy,
  MILESTONE_THRESHOLDS,
  pendingCelebration,
  useCelebrationStore,
  type MilestoneThreshold,
} from "@/store/celebrationStore";
import { MilestoneCelebration } from "@/components/ui/milestone-celebration";
import { WelcomeTour } from "@/components/ui/welcome-tour";
import { useWelcomeTourStore } from "@/store/welcomeTourStore";
import { useCurriculumStore, getNextDay } from "@/store/curriculumStore";
import { getDay } from "@/app/data/recoveryCurriculum";
import { pickDailyMotivation } from "@/app/data/dailyMotivations";
import {
  CalmBackground,
  CalmHeader,
  EmotionalCheckin,
  GlassCard,
  PrimaryAction,
  Space,
  Type,
} from "@/components/calm";

/**
 * Home — the calm front door.
 *
 * Five things only, in this order:
 *   1. Streak hero (display-size number, milestone hint underneath)
 *   2. Emotional check-in (one tap, inline)
 *   3. One recommended action (today's curriculum step or a soft default)
 *   4. SOS (the floating button, always present)
 *   5. Progress summary (quiet text-only link to /progress)
 *
 * Everything else — modules, language, theme, settings — is one tap away
 * but NOT on this surface. Decision fatigue is itself a relapse risk.
 */
export default function HomeScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const toast = useToast();

  const { hydrated } = useUserAddictionsStore();
  const gamblingFreeDays = useProgressStore((s) => s.gamblingFreeDays);
  const progressHydrated = useProgressStore((s) => s.hydrated);
  const recomputeDays = useProgressStore((s) => s.recomputeDays);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeDays = Number.isFinite(gamblingFreeDays) ? gamblingFreeDays : 0;

  // Day-rollover tick: every minute. Cheaper than mounting a per-second
  // clock and good enough to flip the count over within ~60s of midnight.
  useEffect(() => {
    const id = setInterval(() => recomputeDays(), 60_000);
    return () => clearInterval(id);
  }, [recomputeDays]);

  const motivation = useMemo(
    () => pickDailyMotivation(safeDays, new Date(), language),
    [safeDays, language]
  );

  // Next milestone — used both for the eyebrow countdown and the slim
  // progress bar inside the streak hero card.
  const nextMilestone = useMemo<MilestoneThreshold | null>(
    () => MILESTONE_THRESHOLDS.find((m) => m > safeDays) ?? null,
    [safeDays]
  );
  const previousMilestone = useMemo(() => {
    const past = MILESTONE_THRESHOLDS.filter((m) => m <= safeDays);
    return past.length > 0 ? past[past.length - 1] : 0;
  }, [safeDays]);
  const milestoneSpan = Math.max(1, (nextMilestone ?? safeDays) - previousMilestone);
  const milestoneProgress = Math.min(
    1,
    Math.max(0, (safeDays - previousMilestone) / milestoneSpan)
  );
  const milestoneCopy = nextMilestone !== null ? getMilestoneCopy(nextMilestone) : null;

  // Self-exclusion + risk window state — banners surface only when active.
  const lockoutState = useLockoutStore((s) => s.state);
  const lockoutActive = isLockoutActive(lockoutState);
  const lockoutLabel = lockoutActive
    ? formatRemaining(remainingMs(lockoutState))
    : "";
  const riskWindows = useRiskWindowsStore((s) => s.windows);
  const activeRiskWindow = useMemo(
    () => getActiveWindow(riskWindows, new Date()),
    [riskWindows]
  );

  // Today's curriculum step → becomes the single primary action when
  // available. If the user finished today (or hasn't started yet) we fall
  // back to a softer default action.
  const curriculumState = useCurriculumStore((s) => s.state);
  const curriculumHydrated = useCurriculumStore((s) => s.hydrated);
  const hydrateCurriculum = useCurriculumStore((s) => s.hydrate);
  useEffect(() => {
    if (!curriculumHydrated) hydrateCurriculum();
  }, [curriculumHydrated, hydrateCurriculum]);
  const nextDayNum = getNextDay(curriculumState);
  const nextDay = getDay(nextDayNum);
  const curriculumStartedOrInProgress =
    curriculumState.completed.length > 0 || curriculumState.startedAt !== null;
  const curriculumTodayDone =
    curriculumStartedOrInProgress &&
    curriculumState.completed.includes(nextDayNum);

  const primaryAction = useMemo(() => {
    if (!curriculumStartedOrInProgress) {
      return {
        title: "30 Günlük Toparlanma Programını Başlat",
        hint: "İlk gün sadece 5 dakika.",
        icon: "compass" as const,
        route: "/curriculum" as Href,
      };
    }
    if (curriculumTodayDone) {
      return {
        title: "İlerlemeni İncele",
        hint: "Bugünü tamamladın. Birikenleri gör.",
        icon: "trending-up" as const,
        route: "/progress" as Href,
      };
    }
    return {
      title: `Bugünün Adımı · Gün ${nextDayNum}`,
      hint: nextDay?.title ?? "Sıradaki kısa adım seni bekliyor.",
      icon: "leaf" as const,
      route: `/curriculum/${nextDayNum}` as Href,
    };
  }, [curriculumStartedOrInProgress, curriculumTodayDone, nextDayNum, nextDay]);

  // Milestone celebration — keeps the existing once-per-threshold semantics.
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
    if (activeMilestone !== null) await markCelebrated(activeMilestone);
    setActiveMilestone(null);
  };

  // Welcome tour — same behavior, mounted but hidden until ready.
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
    if (done && !loading) {
      const timeout = setTimeout(() => setTourVisible(true), 800);
      return () => clearTimeout(timeout);
    }
  }, [tourHydrated, tourShown, done, loading]);
  const handleTourClose = async () => {
    setTourVisible(false);
    await markTourShown();
  };

  // Pull-to-refresh — hydrate progress + lockout. Same UX as before.
  const [refreshing, setRefreshing] = useState(false);
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const hydrateLockout = useLockoutStore((s) => s.hydrate);
  const refreshHome = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([hydrateProgress(), hydrateLockout()]);
    } finally {
      setRefreshing(false);
    }
  }, [hydrateProgress, hydrateLockout]);

  if (loading || !hydrated) {
    return (
      <CalmBackground>
        <SafeAreaView style={styles.loadingSafe}>
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      </CalmBackground>
    );
  }

  return (
    <CalmBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshHome}
              tintColor={colors.primary}
            />
          }
        >
          {/* Top-right quiet utility — settings only. No theme/lang chips
              here; they add noise that doesn't help in a crisis moment. */}
          <View style={styles.topUtility}>
            <TouchableOpacity
              onPress={() => router.push("/settings" as Href)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Ayarlar"
              style={[
                styles.utilityBtn,
                { backgroundColor: `${colors.card}99`, borderColor: `${colors.primary}22` },
              ]}
            >
              <Ionicons name="settings-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <CalmHeader
            eyebrow={greetingFor(new Date())}
            title={motivation.headline}
            subtitle={motivation.message}
          />

          {/* Floating banners — render only when load-bearing, never both
              at once. The lockout overrides the risk window banner. */}
          {lockoutActive ? (
            <Pressable
              onPress={() => router.push("/self-exclusion" as Href)}
              style={({ pressed }) => [
                styles.banner,
                {
                  borderColor: `${colors.success}55`,
                  backgroundColor: `${colors.success}14`,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={16} color={colors.success} />
              <Text style={[styles.bannerText, { color: colors.text }]}>
                Öz-Kısıtlama aktif — {lockoutLabel} kaldı
              </Text>
            </Pressable>
          ) : activeRiskWindow ? (
            <Pressable
              onPress={() => router.push("/risk-windows" as Href)}
              style={({ pressed }) => [
                styles.banner,
                {
                  borderColor: `${colors.warning}55`,
                  backgroundColor: `${colors.warning}14`,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="time" size={16} color={colors.warning} />
              <Text style={[styles.bannerText, { color: colors.text }]}>
                Risk penceresi aktif — {activeRiskWindow.label}
              </Text>
            </Pressable>
          ) : null}

          {/* (1) Streak hero — the emotional anchor of the screen. */}
          <GlassCard variant="hero" style={styles.heroCard}>
            <Text style={[Type.caption, { color: colors.textMuted }]}>
              TEMİZ GÜN
            </Text>
            <Text style={[Type.display, styles.streakNumber, { color: colors.text }]}>
              {safeDays}
            </Text>

            <View style={styles.milestoneTrack}>
              <View
                style={[
                  styles.milestoneFill,
                  {
                    width: `${Math.max(2, milestoneProgress * 100)}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[Type.subtitle, styles.milestoneLine, { color: colors.textMuted }]}>
              {milestoneCopy && nextMilestone !== null
                ? `${milestoneCopy.emoji}  Sonraki ${nextMilestone} gün — ${nextMilestone - safeDays} gün kaldı`
                : "En uzun seri — koruduğun her gün yeni bir rekor."}
            </Text>
          </GlassCard>

          {/* (2) Emotional check-in. */}
          <EmotionalCheckin />

          {/* (3) One primary action. */}
          <PrimaryAction
            title={primaryAction.title}
            hint={primaryAction.hint}
            icon={primaryAction.icon}
            onPress={() => router.push(primaryAction.route)}
          />

          {/* (5) Progress summary — text-only link, never competes with CTA. */}
          <Pressable
            onPress={() => router.push("/progress" as Href)}
            style={({ pressed }) => [
              styles.quietLinkRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.progress}
          >
            <Text style={[Type.subtitle, { color: colors.textMuted }]}>
              İlerlemeyi gör
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textMuted}
            />
          </Pressable>

          {/* Quiet bottom-shelf — three discovery routes, no icons, no
              cards. Everything else lives one tap deeper. */}
          <View style={styles.shelfRow}>
            <ShelfLink label="Modüller" onPress={() => router.push("/modules" as Href)} />
            <ShelfDivider />
            <ShelfLink label="Keşfet" onPress={() => router.push("/explore" as Href)} />
            <ShelfDivider />
            <ShelfLink label="Yardım" onPress={() => router.push("/support" as Href)} />
          </View>
        </ScrollView>

        {/* (4) SOS — always reachable, never hidden, never the loudest. */}
        <FloatingSOSButton />
      </SafeAreaView>

      <MilestoneCelebration
        visible={activeMilestone !== null}
        threshold={activeMilestone}
        streakDays={safeDays}
        onClose={handleCelebrationClose}
      />
      <WelcomeTour visible={tourVisible} onClose={handleTourClose} />
    </CalmBackground>
  );
}

function ShelfLink({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[Type.subtitle, { color: colors.textMuted, fontWeight: "600" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ShelfDivider() {
  const { colors } = useTheme();
  return <View style={[styles.shelfDot, { backgroundColor: `${colors.textMuted}66` }]} />;
}

/**
 * Time-of-day greeting. Quiet, friendly, no emojis (those go in the
 * milestone copy where they earn their place).
 */
function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 5) return "İYİ GECELER";
  if (h < 12) return "GÜNAYDIN";
  if (h < 18) return "İYİ ÖĞLENLER";
  return "İYİ AKŞAMLAR";
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingSafe: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: {
    paddingHorizontal: Space.lg + 4,
    paddingTop: Space.lg,
    paddingBottom: 120,
    gap: Space.lg,
  },

  topUtility: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Space.sm,
  },
  utilityBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    paddingVertical: Space.md,
    paddingHorizontal: Space.lg,
    borderRadius: 18,
    borderWidth: 1,
  },
  bannerText: { fontSize: 13, fontWeight: "600", flex: 1 },

  heroCard: {
    alignItems: "flex-start",
  },
  streakNumber: {
    marginTop: Space.xs,
    marginBottom: Space.lg,
  },
  milestoneTrack: {
    width: "100%",
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  milestoneFill: {
    height: "100%",
    borderRadius: 999,
  },
  milestoneLine: { marginTop: Space.md },

  quietLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Space.md,
    paddingHorizontal: Space.xs,
  },

  shelfRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Space.md,
    marginTop: Space.sm,
    paddingVertical: Space.md,
  },
  shelfDot: { width: 3, height: 3, borderRadius: 1.5 },
});

// Suppress an unused-import warning when Platform isn't currently used.
void Platform;
