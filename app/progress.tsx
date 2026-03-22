import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ScreenHero } from "@/components/ui/screen-hero";
import { SectionLead } from "@/components/ui/section-lead";
import { usePremium } from "@/hooks/usePremium";
import { usePremiumStore } from "@/store/premiumStore";
import { useProgressStore } from "@/store/progressStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";
import * as SecureStore from "@/lib/secureStoreCompat";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SESSIONS_COMPLETED_KEY = "antislot_sessions_completed";
const PREMIUM_DAILY_TASKS_KEY = "antislot_progress_premium_daily_tasks_v1";

type PremiumTaskId = "breathe" | "trigger" | "support";
type PremiumTaskState = Record<PremiumTaskId, boolean>;

const PREMIUM_TASK_ORDER: PremiumTaskId[] = ["breathe", "trigger", "support"];

const DEFAULT_PREMIUM_TASKS: PremiumTaskState = {
  breathe: false,
  trigger: false,
  support: false,
};

function getDayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cloneDefaultPremiumTasks(): PremiumTaskState {
  return { ...DEFAULT_PREMIUM_TASKS };
}

function normalizePremiumTasks(input: unknown): PremiumTaskState {
  if (!input || typeof input !== "object") return cloneDefaultPremiumTasks();
  const raw = input as Partial<PremiumTaskState>;
  return {
    breathe: !!raw.breathe,
    trigger: !!raw.trigger,
    support: !!raw.support,
  };
}

async function getPremiumDailyTasks(): Promise<PremiumTaskState> {
  try {
    const raw = await SecureStore.getItemAsync(PREMIUM_DAILY_TASKS_KEY);
    if (!raw) return cloneDefaultPremiumTasks();
    const parsed = JSON.parse(raw) as { dayKey?: string; tasks?: unknown } | null;
    if (!parsed || parsed.dayKey !== getDayKey()) return cloneDefaultPremiumTasks();
    return normalizePremiumTasks(parsed.tasks);
  } catch {
    return cloneDefaultPremiumTasks();
  }
}

async function setPremiumDailyTasks(tasks: PremiumTaskState): Promise<void> {
  const payload = {
    dayKey: getDayKey(),
    tasks,
  };
  await SecureStore.setItemAsync(PREMIUM_DAILY_TASKS_KEY, JSON.stringify(payload));
}

async function getSessionsCompleted(): Promise<number> {
  const countStr = await SecureStore.getItemAsync(SESSIONS_COMPLETED_KEY);
  if (!countStr) return 0;
  try {
    return parseInt(countStr, 10);
  } catch {
    return 0;
  }
}

const PROGRESS_COPY = {
  tr: {
    loading: "Yukleniyor...",
    title: "Ilerleme",
    subtitle: "Kumar icin ilerlemeyi takip et.",
    heroTitle: "Yolculugunu Izle",
    heroBody:
      "Secili bagimliliklar icin ilerleme kartlariyla motivasyonunu koru ve gelisimini gor.",
    gamblingSection: "Kumar Ilerlemesi",
    noSelection: "Henuz secim yok.",
    cleanDays: "Temiz Gun",
    reset: "Sifirla",
    resetTitle: "Ilerlemeyi Sifirla",
    resetBody: "Bu islem secili bagimlilik sayacini sifirlar.",
    cancel: "Iptal",
    resetConfirm: "Sifirla",
    userMissingTitle: "Hata",
    userMissingBody: "Kullanici bulunamadi.",
    advancedStats: "Gelismis Istatistikler",
    premiumBadge: "Premium",
    streak: "Temiz Gun Serisi",
    sessionsCompleted: "Tamamlanan Seans",
    weeklyGoal: "Haftalik Hedef",
    weeklyGoalText: (value: number) => `${value}% tamamlandi (7 gunluk dongu)`,
    monthlyGoal: "Aylik Hedef",
    monthlyGoalText: (value: number) => `${value}% tamamlandi (30 gunluk dongu)`,
    premiumLockedBody: "Bu bolum Premium ozelligidir. Detayli istatistikler icin kilidi ac.",
    unlock: "Kilidi Ac",
    insights: "Icgoruler",
    insightsLockedBody: "Premium icgoruler kilitli. Kisisel analizler icin Premium'u etkinlestir.",
    goPremium: "Premium'a Git",
    insightStreakTitle: "Seri Analizi",
    insightSessionTitle: "Seans Etkinligi",
    insightSuggestionTitle: "Kisisel Oneri",
    introTitle: "Ilerleme",
    introSubtitle: "Bagimlilik bazli ilerleme kartlari",
    introBody:
      "Her bagimlilik icin ayri metrikler gorursun. Bu kartlar motivasyonunu takip etmene yardimci olur.",
    introTipLabel: "Ipucu",
    introTipBody: "Gelisimini destek aginla paylasmak motive edici olabilir.",
    introContinue: "Devam Et",
    streakLevelLegend: "Efsane",
    streakLevelStrong: "Guclu",
    streakLevelSteady: "Istikrarli",
    streakLevelStart: "Baslangic",
    streakLevelNew: "Yeni",
    streakInsightHigh:
      "Harika! 30 gunu astin. Aliskanlik dongusunu kirmada kritik esigi gectin.",
    streakInsightMid:
      "Bir haftayi tamamladin. Ilk hafta en zor donemdir, guclu ilerliyorsun.",
    streakInsightLow: "Her gun bir basari. Kucuk adimlar buyuk degisimler baslatir.",
    sessionInsightHigh: "Duzenli seans tamamliyorsun. Farkindalik pratigin gucleniyor.",
    sessionInsightMid: "Iyi bir baslangic. Seanslari duzenli yapmak durtu yonetimini kolaylastirir.",
    sessionInsightLow: "Farkindalik seanslariyla durtu yonetimini guclendirebilirsin.",
    suggestionEarly: "Ilk 72 saat kritik donemdir. Durtu sorfu ve nefes egzersizlerini dene.",
    suggestionMid: "Tetikleyici durumlari not et. Hangi ortamlar durtuyu artiriyor?",
    suggestionHigh: "Destek agini guclendir. Ilerlemeni guvendigin biriyle paylas.",
    premiumLabTitle: "Premium Kalkan Merkezi",
    premiumLabSubtitle: "Nuks riskini dusurmek icin anlik analiz ve eylem paneli.",
    riskRadarTitle: "Nuks Risk Radari",
    riskScoreText: (value: number) => `Risk skoru ${value}/100`,
    riskTierLow: "Dusuk Risk",
    riskTierMedium: "Orta Risk",
    riskTierHigh: "Yuksek Risk",
    riskInsightLow: "Denge guclu. Rutinini koruyarak bu seviyeyi sabitle.",
    riskInsightMedium: "Tetikleyiciler artabilir. Bugun kisa bir kalkan plani uygula.",
    riskInsightHigh: "Bugun savunmayi guclendir. Riskli ortamlardan uzaklas ve destek hattini ac.",
    dailyPlanTitle: "Gunluk Kalkan Gorevleri",
    dailyPlanSubtitle: (done: number, total: number) => `${done}/${total} gorev tamamlandi`,
    dailyPlanProgress: (value: number) => `Gunluk kalkan tamamlama: %${value}`,
    premiumTaskLabels: {
      breathe: "2 dakika nefes regulesi uygula",
      trigger: "Bugunun en buyuk tetikleyicisini adlandir",
      support: "Guvendigin bir kisiye durum guncellemesi gonder",
    },
    toolActionsTitle: "Hizli Koruma Aksiyonlari",
    openMindfulness: "Mindfulness",
    openSOS: "SOS Kalkan",
    openSupport: "Destek Hatti",
    motivationTitle: "Motivasyon Takviyesi",
    newMotivation: "Yeni motivasyon",
    motivationLines: [
      "Kazanmak degil, kontrol etmek hedef. Kontrol sende.",
      "Bir durus, bir karar, bir gun daha temiz.",
      "Durtu gecici, secimin kalici.",
      "Kendini koruman bugunun en guclu hamlesi.",
    ],
    premiumToolsLockedBody:
      "Premium Kalkan Merkezi kilitli. Risk radari, gunluk gorevler ve hizli koruma aksiyonlari icin Premium'u etkinlestir.",
  },
  en: {
    loading: "Loading...",
    title: "Progress",
    subtitle: "Track your gambling recovery progress.",
    heroTitle: "Track Your Journey",
    heroBody:
      "Use progress cards for selected addictions to stay motivated and see your growth.",
    gamblingSection: "Gambling Progress",
    noSelection: "No selection yet.",
    cleanDays: "Clean Days",
    reset: "Reset",
    resetTitle: "Reset Progress",
    resetBody: "This will reset the selected addiction counter.",
    cancel: "Cancel",
    resetConfirm: "Reset",
    userMissingTitle: "Error",
    userMissingBody: "User not found.",
    advancedStats: "Advanced Stats",
    premiumBadge: "Premium",
    streak: "Clean Day Streak",
    sessionsCompleted: "Completed Sessions",
    weeklyGoal: "Weekly Goal",
    weeklyGoalText: (value: number) => `${value}% completed (7-day cycle)`,
    monthlyGoal: "Monthly Goal",
    monthlyGoalText: (value: number) => `${value}% completed (30-day cycle)`,
    premiumLockedBody: "This section is a Premium feature. Unlock to see detailed stats.",
    unlock: "Unlock",
    insights: "Insights",
    insightsLockedBody: "Premium insights are locked. Enable Premium for personal analysis.",
    goPremium: "Go Premium",
    insightStreakTitle: "Streak Analysis",
    insightSessionTitle: "Session Effectiveness",
    insightSuggestionTitle: "Personal Suggestion",
    introTitle: "Progress",
    introSubtitle: "Addiction-based progress cards",
    introBody:
      "You will see separate metrics for each addiction. These cards help you track motivation.",
    introTipLabel: "Tip",
    introTipBody: "Sharing progress with your support network can improve consistency.",
    introContinue: "Continue",
    streakLevelLegend: "Legend",
    streakLevelStrong: "Strong",
    streakLevelSteady: "Steady",
    streakLevelStart: "Starter",
    streakLevelNew: "New",
    streakInsightHigh:
      "Great work. You passed 30 days, which is a key threshold for breaking the cycle.",
    streakInsightMid:
      "You completed your first week. The first week is usually the hardest phase.",
    streakInsightLow: "Every day is progress. Small steps create durable change.",
    sessionInsightHigh: "You complete sessions consistently. Your mindfulness routine is strengthening.",
    sessionInsightMid: "Good start. Regular sessions improve urge regulation.",
    sessionInsightLow: "You can strengthen urge management by starting mindfulness sessions.",
    suggestionEarly: "The first 72 hours are critical. Try urge surfing and breathing exercises.",
    suggestionMid: "Track triggers. Which environments increase urges most?",
    suggestionHigh: "Strengthen your support network and share progress with someone trusted.",
    premiumLabTitle: "Premium Shield Center",
    premiumLabSubtitle: "Live analysis and action panel to lower relapse risk.",
    riskRadarTitle: "Relapse Risk Radar",
    riskScoreText: (value: number) => `Risk score ${value}/100`,
    riskTierLow: "Low Risk",
    riskTierMedium: "Medium Risk",
    riskTierHigh: "High Risk",
    riskInsightLow: "Your balance is strong. Keep your routine stable.",
    riskInsightMedium: "Triggers may rise. Apply a short shield plan today.",
    riskInsightHigh: "Strengthen your defense today. Avoid risky environments and open support.",
    dailyPlanTitle: "Daily Shield Tasks",
    dailyPlanSubtitle: (done: number, total: number) => `${done}/${total} tasks completed`,
    dailyPlanProgress: (value: number) => `Daily shield completion: ${value}%`,
    premiumTaskLabels: {
      breathe: "Complete a 2-minute breathing regulation",
      trigger: "Name today's strongest trigger",
      support: "Send a short update to a trusted person",
    },
    toolActionsTitle: "Rapid Protection Actions",
    openMindfulness: "Mindfulness",
    openSOS: "SOS Shield",
    openSupport: "Support Line",
    motivationTitle: "Motivation Boost",
    newMotivation: "New motivation",
    motivationLines: [
      "The goal is control, not chasing wins. You are in control.",
      "One pause, one decision, one more clean day.",
      "Urges are temporary, your choice is lasting.",
      "Protecting yourself is today's strongest move.",
    ],
    premiumToolsLockedBody:
      "Premium Shield Center is locked. Enable Premium to access risk radar, daily tasks, and rapid protection actions.",
  },
} as const;

export default function Progress() {
  const { language, t } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(PROGRESS_COPY);

  const [showIntro, setShowIntro] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [premiumTasks, setPremiumTasks] = useState<PremiumTaskState>(cloneDefaultPremiumTasks());
  const [motivationIndex, setMotivationIndex] = useState(0);

  const { userAddictions, hydrated } = useUserAddictionsStore();
  const { uid } = useUser();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const resetProgress = useProgressStore((state) => state.reset);
  const progressHydrated = useProgressStore((state) => state.hydrated);

  const { isActive: isPremiumActive, hasFeature } = usePremium();
  const hydratePremium = usePremiumStore((state) => state.hydrate);
  const advancedStatsEnabled = isPremiumActive || hasFeature("advanced_stats");
  const premiumInsightsEnabled = isPremiumActive || hasFeature("premium_insights");

  useEffect(() => {
    hydratePremium();
  }, [hydratePremium]);

  useEffect(() => {
    (async () => {
      const count = await getSessionsCompleted();
      setSessionsCompleted(count);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const tasks = await getPremiumDailyTasks();
      setPremiumTasks(tasks);
    })();
  }, []);

  const streakLevel = useMemo(() => {
    if (gamblingFreeDays >= 90) {
      return { label: copy.streakLevelLegend, color: "#D4A017" };
    }
    if (gamblingFreeDays >= 30) {
      return { label: copy.streakLevelStrong, color: "#1E7A55" };
    }
    if (gamblingFreeDays >= 7) {
      return { label: copy.streakLevelSteady, color: colors.primary };
    }
    if (gamblingFreeDays >= 1) {
      return { label: copy.streakLevelStart, color: colors.warning ?? "#B54708" };
    }
    return { label: copy.streakLevelNew, color: colors.textSecondary };
  }, [copy, colors.primary, colors.textSecondary, colors.warning, gamblingFreeDays]);

  const weeklyCycleDay = gamblingFreeDays === 0 ? 0 : ((gamblingFreeDays - 1) % 7) + 1;
  const monthlyCycleDay = gamblingFreeDays === 0 ? 0 : ((gamblingFreeDays - 1) % 30) + 1;
  const weeklyGoalPercent = Math.round((weeklyCycleDay / 7) * 100);
  const monthlyGoalPercent = Math.round((monthlyCycleDay / 30) * 100);

  const handleReset = () => {
    if (!uid) {
      Alert.alert(copy.userMissingTitle, copy.userMissingBody);
      return;
    }

    Alert.alert(copy.resetTitle, copy.resetBody, [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.resetConfirm,
        style: "destructive",
        onPress: () => {
          void resetProgress(uid);
        },
      },
    ]);
  };

  const streakInsight =
    gamblingFreeDays >= 30 ? copy.streakInsightHigh : gamblingFreeDays >= 7 ? copy.streakInsightMid : copy.streakInsightLow;

  const sessionInsight =
    sessionsCompleted >= 10
      ? copy.sessionInsightHigh
      : sessionsCompleted >= 3
        ? copy.sessionInsightMid
        : copy.sessionInsightLow;

  const suggestionInsight =
    gamblingFreeDays < 3 ? copy.suggestionEarly : gamblingFreeDays < 14 ? copy.suggestionMid : copy.suggestionHigh;

  const premiumTasksCompleted = useMemo(
    () => PREMIUM_TASK_ORDER.filter((taskId) => premiumTasks[taskId]).length,
    [premiumTasks]
  );
  const premiumTaskPercent = Math.round((premiumTasksCompleted / PREMIUM_TASK_ORDER.length) * 100);

  const riskScore = useMemo(() => {
    let score = 72;
    if (gamblingFreeDays >= 30) score -= 26;
    else if (gamblingFreeDays >= 14) score -= 18;
    else if (gamblingFreeDays >= 7) score -= 12;
    else if (gamblingFreeDays >= 3) score -= 6;

    if (sessionsCompleted >= 10) score -= 18;
    else if (sessionsCompleted >= 5) score -= 12;
    else if (sessionsCompleted >= 2) score -= 6;

    if (weeklyGoalPercent >= 85) score -= 10;
    else if (weeklyGoalPercent >= 60) score -= 6;

    score -= premiumTasksCompleted * 5;
    return Math.max(10, Math.min(95, score));
  }, [gamblingFreeDays, premiumTasksCompleted, sessionsCompleted, weeklyGoalPercent]);

  const riskMeta = useMemo(() => {
    if (riskScore >= 66) {
      return {
        label: copy.riskTierHigh,
        insight: copy.riskInsightHigh,
        color: colors.warning ?? "#B54708",
      };
    }
    if (riskScore >= 36) {
      return {
        label: copy.riskTierMedium,
        insight: copy.riskInsightMedium,
        color: "#B7791F",
      };
    }
    return {
      label: copy.riskTierLow,
      insight: copy.riskInsightLow,
      color: "#1E7A55",
    };
  }, [colors.warning, copy, riskScore]);

  const motivationMessage = useMemo(() => {
    const lines = copy.motivationLines;
    if (!lines.length) return "";
    return lines[motivationIndex % lines.length];
  }, [copy.motivationLines, motivationIndex]);

  const togglePremiumTask = (taskId: PremiumTaskId) => {
    setPremiumTasks((previous) => {
      const next = {
        ...previous,
        [taskId]: !previous[taskId],
      };
      void setPremiumDailyTasks(next);
      return next;
    });
  };

  if (!hydrated || !progressHydrated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loader}>
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>{copy.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{`< ${t.back}`}</Text>
          </TouchableOpacity>
        </View>

        <ScreenHero
          icon="stats-chart-outline"
          title={copy.title}
          subtitle={copy.heroTitle}
          description={copy.heroBody}
          badge={copy.subtitle}
          gradient={["#17407A", "#2763B8"]}
          style={styles.card}
        />

        <SectionLead
          icon="calendar-outline"
          title={copy.gamblingSection}
          subtitle={copy.cleanDays}
          badge={`${gamblingFreeDays}`}
          tone="primary"
          style={styles.sectionLead}
        />

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.gamblingSection}</Text>
          {!userAddictions.gambling ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.noSelection}</Text>
          ) : (
            <View style={[styles.progressCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <View style={styles.progressRow}>
                <View>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>{language === "en" ? "Gambling" : "Kumar"}</Text>
                  <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{copy.cleanDays}</Text>
                </View>
                <Text style={[styles.progressValue, { color: colors.primary }]}>{gamblingFreeDays}</Text>
              </View>
              <TouchableOpacity style={[styles.progressResetBtn, { backgroundColor: colors.warning ?? "#D06B5C" }]} onPress={handleReset}>
                <Text style={styles.resetText}>{copy.reset}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <SectionLead
          icon="analytics-outline"
          title={copy.advancedStats}
          subtitle={copy.insights}
          tone="neutral"
          style={styles.sectionLead}
        />

        {advancedStatsEnabled ? (
          <>
            <View style={styles.advancedHeader}>
              <Text style={[styles.advancedTitle, { color: colors.text }]}>{copy.advancedStats}</Text>
              <View style={[styles.advancedBadge, { backgroundColor: `${colors.primary}1F` }]}>
                <Text style={[styles.advancedBadgeText, { color: colors.primary }]}>{copy.premiumBadge}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <Text style={[styles.statNumber, { color: streakLevel.color }]}>{gamblingFreeDays}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{copy.streak}</Text>
                <View style={[styles.levelBadge, { backgroundColor: `${streakLevel.color}22` }]}>
                  <Text style={[styles.levelBadgeText, { color: streakLevel.color }]}>{streakLevel.label}</Text>
                </View>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <Text style={[styles.statNumber, { color: colors.primary }]}>{sessionsCompleted}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{copy.sessionsCompleted}</Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.weeklyGoal}</Text>
              <View style={[styles.goalBarContainer, { backgroundColor: `${colors.primary}1A` }]}>
                <View style={[styles.goalBar, { width: `${weeklyGoalPercent}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.goalText, { color: colors.textSecondary }]}>{copy.weeklyGoalText(weeklyGoalPercent)}</Text>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.monthlyGoal}</Text>
              <View style={[styles.goalBarContainer, { backgroundColor: `${colors.secondary}1A` }]}>
                <View style={[styles.goalBar, { width: `${monthlyGoalPercent}%`, backgroundColor: colors.secondary }]} />
              </View>
              <Text style={[styles.goalText, { color: colors.textSecondary }]}>{copy.monthlyGoalText(monthlyGoalPercent)}</Text>
            </View>
          </>
        ) : (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.advancedStats}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.premiumLockedBody}</Text>
            <TouchableOpacity style={[styles.unlockButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/premium")}>
              <Text style={styles.unlockButtonText}>{copy.unlock}</Text>
            </TouchableOpacity>
          </View>
        )}

        {premiumInsightsEnabled ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.insights}</Text>

            <View style={[styles.insightCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>{copy.insightStreakTitle}</Text>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>{streakInsight}</Text>
              </View>
            </View>

            <View style={[styles.insightCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>{copy.insightSessionTitle}</Text>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>{sessionInsight}</Text>
              </View>
            </View>

            <View style={[styles.insightCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>{copy.insightSuggestionTitle}</Text>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>{suggestionInsight}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.insights}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.insightsLockedBody}</Text>
            <TouchableOpacity style={[styles.unlockButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/premium")}>
              <Text style={styles.unlockButtonText}>{copy.goPremium}</Text>
            </TouchableOpacity>
          </View>
        )}

        {premiumInsightsEnabled ? (
          <View
            style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
            testID="progress-premium-lab"
          >
            <View style={styles.premiumLabHeader}>
              <View style={styles.premiumLabHeaderText}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>{copy.premiumLabTitle}</Text>
                <Text style={[styles.premiumLabSubtitle, { color: colors.textSecondary }]}>{copy.premiumLabSubtitle}</Text>
              </View>
              <View style={[styles.advancedBadge, { backgroundColor: `${riskMeta.color}22` }]}>
                <Text style={[styles.advancedBadgeText, { color: riskMeta.color }]}>{riskMeta.label}</Text>
              </View>
            </View>

            <View style={[styles.premiumPanelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.riskHeaderRow}>
                <Text style={[styles.premiumPanelTitle, { color: colors.text }]}>{copy.riskRadarTitle}</Text>
                <Text style={[styles.riskScoreText, { color: riskMeta.color }]}>{copy.riskScoreText(riskScore)}</Text>
              </View>
              <View style={[styles.riskTrack, { backgroundColor: `${riskMeta.color}1A` }]}>
                <View style={[styles.riskFill, { width: `${riskScore}%`, backgroundColor: riskMeta.color }]} />
              </View>
              <Text style={[styles.riskInsightText, { color: colors.textSecondary }]}>{riskMeta.insight}</Text>
            </View>

            <View style={[styles.premiumPanelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.premiumPanelTitle, { color: colors.text }]}>{copy.dailyPlanTitle}</Text>
              <Text style={[styles.premiumPlanSubtitle, { color: colors.textSecondary }]}>
                {copy.dailyPlanSubtitle(premiumTasksCompleted, PREMIUM_TASK_ORDER.length)}
              </Text>

              {PREMIUM_TASK_ORDER.map((taskId) => {
                const active = premiumTasks[taskId];
                return (
                  <TouchableOpacity
                    key={taskId}
                    style={[styles.taskRow, { borderColor: colors.border }]}
                    onPress={() => togglePremiumTask(taskId)}
                    testID={`progress-premium-task-${taskId}`}
                  >
                    <View
                      style={[
                        styles.taskCheck,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primary : "transparent",
                        },
                      ]}
                    >
                      <Text style={[styles.taskCheckText, { color: active ? "#FFFFFF" : "transparent" }]}>x</Text>
                    </View>
                    <Text style={[styles.taskText, { color: colors.text }]}>{copy.premiumTaskLabels[taskId]}</Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.taskProgressText, { color: colors.textSecondary }]}>
                {copy.dailyPlanProgress(premiumTaskPercent)}
              </Text>
            </View>

            <View style={[styles.premiumPanelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.premiumPanelTitle, { color: colors.text }]}>{copy.toolActionsTitle}</Text>
              <View style={styles.quickActionRow}>
                <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/mindfulness")}>
                  <Text style={styles.quickActionText}>{copy.openMindfulness}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: colors.warning ?? "#B54708" }]} onPress={() => router.push("/sos")}>
                  <Text style={styles.quickActionText}>{copy.openSOS}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: colors.secondary }]} onPress={() => router.push("/support")}>
                  <Text style={styles.quickActionText}>{copy.openSupport}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.premiumPanelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.premiumPanelTitle, { color: colors.text }]}>{copy.motivationTitle}</Text>
              <Text style={[styles.motivationText, { color: colors.textSecondary }]}>{motivationMessage}</Text>
              <TouchableOpacity
                style={[styles.motivationBtn, { backgroundColor: `${colors.primary}1A`, borderColor: colors.border }]}
                onPress={() => setMotivationIndex((value) => value + 1)}
                testID="progress-premium-new-motivation"
              >
                <Text style={[styles.motivationBtnText, { color: colors.primary }]}>{copy.newMotivation}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.premiumLabTitle}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.premiumToolsLockedBody}</Text>
            <TouchableOpacity style={[styles.unlockButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/premium")}>
              <Text style={styles.unlockButtonText}>{copy.goPremium}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={showIntro} transparent animationType="fade" onRequestClose={() => setShowIntro(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowIntro(false)}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>x</Text>
            </TouchableOpacity>

            <View style={[styles.modalIcon, { backgroundColor: `${colors.primary}1A` }]}>
              <Text style={[styles.modalIconLabel, { color: colors.primary }]}>PR</Text>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{copy.introTitle}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{copy.introSubtitle}</Text>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>{copy.introBody}</Text>

            <View style={[styles.modalTip, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <Text style={[styles.modalTipLabel, { color: colors.text }]}>{copy.introTipLabel}</Text>
              <Text style={[styles.modalTipText, { color: colors.textSecondary }]}>{copy.introTipBody}</Text>
            </View>

            <TouchableOpacity style={[styles.modalNextBtn, { backgroundColor: colors.primary }]} onPress={() => setShowIntro(false)}>
              <Text style={styles.modalNextText}>{copy.introContinue}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  loaderText: { fontSize: 15, fontFamily: Fonts.body },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { alignSelf: "flex-start" },
  backText: { fontSize: 16, fontFamily: Fonts.bodyMedium },
  title: { fontSize: 28, fontFamily: Fonts.display, marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24, fontFamily: Fonts.body },
  card: {
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  sectionLead: {
    marginBottom: 12,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: { fontSize: 28, fontFamily: Fonts.displayMedium },
  cardTitle: {
    fontSize: 22,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 12,
    textAlign: "center",
  },
  cardText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: Fonts.body,
  },
  section: {
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 12,
  },
  progressCard: {
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTitle: { fontSize: 15, fontFamily: Fonts.bodySemiBold },
  progressLabel: { fontSize: 12, marginTop: 4, fontFamily: Fonts.body },
  progressValue: { fontSize: 28, fontFamily: Fonts.displayMedium },
  emptyText: { fontSize: 13, fontStyle: "italic", fontFamily: Fonts.body },
  progressResetBtn: {
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: "center",
    marginTop: 12,
  },
  resetText: { color: "#FFFFFF", fontSize: 14, fontFamily: Fonts.bodySemiBold },
  advancedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 8,
  },
  advancedTitle: { fontSize: 20, fontFamily: Fonts.displayMedium },
  advancedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  advancedBadgeText: { fontSize: 11, fontFamily: Fonts.bodySemiBold },
  premiumLabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  premiumLabHeaderText: { flex: 1 },
  premiumLabSubtitle: { fontSize: 12, lineHeight: 18, fontFamily: Fonts.body },
  premiumPanelCard: {
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  premiumPanelTitle: {
    fontSize: 14,
    marginBottom: 6,
    fontFamily: Fonts.bodySemiBold,
  },
  premiumPlanSubtitle: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: Fonts.body,
  },
  riskHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  riskScoreText: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
  riskTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  riskFill: {
    height: "100%",
    borderRadius: 999,
  },
  riskInsightText: { fontSize: 12, lineHeight: 18, fontFamily: Fonts.body },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckText: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
  taskText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: Fonts.body },
  taskProgressText: { fontSize: 12, marginTop: 8, fontFamily: Fonts.body },
  quickActionRow: { flexDirection: "row", gap: 8 },
  quickActionBtn: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  quickActionText: { color: "#FFFFFF", fontSize: 12, fontFamily: Fonts.bodySemiBold },
  motivationText: { fontSize: 13, lineHeight: 19, marginBottom: 10, fontFamily: Fonts.body },
  motivationBtn: {
    alignSelf: "flex-start",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  motivationBtnText: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 36,
    fontFamily: Fonts.displayMedium,
    marginBottom: 4,
  },
  statLabel: { fontSize: 13, textAlign: "center", marginBottom: 8, fontFamily: Fonts.body },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  levelBadgeText: { fontSize: 11, fontFamily: Fonts.bodySemiBold },
  goalBarContainer: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  goalBar: {
    height: "100%",
    borderRadius: 5,
  },
  goalText: { fontSize: 12, fontFamily: Fonts.body },
  insightCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  insightContent: { flex: 1 },
  insightTitle: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  insightText: { fontSize: 13, lineHeight: 19, fontFamily: Fonts.body },
  unlockButton: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  unlockButtonText: { color: "#FFFFFF", fontSize: 14, fontFamily: Fonts.bodySemiBold },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: Radius.xl,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: { fontSize: 24, fontFamily: Fonts.body },
  modalIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconLabel: { fontSize: 30, fontFamily: Fonts.displayMedium },
  modalTitle: {
    fontSize: 26,
    fontFamily: Fonts.display,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: Fonts.body,
  },
  modalTip: {
    borderRadius: Radius.md,
    padding: 16,
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
  },
  modalTipLabel: { fontSize: 15, marginBottom: 6, fontFamily: Fonts.bodySemiBold },
  modalTipText: { fontSize: 14, lineHeight: 20, fontFamily: Fonts.body },
  modalNextBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: Radius.md,
    width: "100%",
    alignItems: "center",
  },
  modalNextText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
  },
});
