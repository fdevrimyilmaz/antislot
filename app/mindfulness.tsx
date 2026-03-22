import { ProfessionalMindfulnessPlugins } from "@/components/mindfulness/ProfessionalMindfulnessPlugins";
import { ScreenHero } from "@/components/ui/screen-hero";
import { SectionLead } from "@/components/ui/section-lead";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePremium } from "@/hooks/usePremium";
import { usePremiumStore } from "@/store/premiumStore";
import { incrementSessionsCompleted } from "@/store/progressStore";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  completeSession,
  getSessionState,
  setSessionStep,
  startSession,
} from "@/store/sessionStore";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

type Session = {
  id: string;
  title: string;
  duration: string;
  description: string;
  goals: string[];
  steps: { title: string; body: string }[];
  isPremium?: boolean;
};

const MINDFULNESS_SESSIONS: Session[] = [
  {
    id: "breath-reset",
    title: "Rehberli Nefes Sifirlama",
    duration: "6 dk",
    description: "Zihin ve bedeni sakinlestirmek icin kisa bir nefes seansi.",
    goals: ["Nefesi yavaslat", "Duyguyu duzenle", "Durtuyu yumusat"],
    steps: [
      {
        title: "Durus",
        body: "Omuzlarini gevs et, ayaklarini yere sabitle ve gozlerini yumusat.",
      },
      {
        title: "Nefes Ritmi",
        body: "4 saniye nefes al, 6 saniye ver. Bunu 2 dakika surdur.",
      },
      {
        title: "Beden Farkindaligi",
        body: "Gogus ve karin hareketini gozlemle, dusunceleri yargisiz birak.",
      },
      {
        title: "Kapanis",
        body: "Su anki duygu puanini 1-10 arasinda degerlendir.",
      },
    ],
  },
  {
    id: "body-scan",
    title: "Beden Taramasi",
    duration: "10 dk",
    description: "Bedenindeki gerginlikleri fark et ve gevset.",
    goals: ["Kaslari gevset", "Stresi azalt", "Odaklanmayi guclendir"],
    steps: [
      {
        title: "Baslangic",
        body: "Derin bir nefes al ve bedeni taramaya basla.",
      },
      {
        title: "Bas ve Boyun",
        body: "Alnini, ceneni ve omuzlarini gevset. Gerginligi birak.",
      },
      {
        title: "Gogus ve Karin",
        body: "Nefesin girdigi alani hisset, yavasca gevset.",
      },
      {
        title: "Kalca ve Bacaklar",
        body: "Bacaklarini zemine agirlastir, kaslari serbest birak.",
      },
      {
        title: "Kapanis",
        body: "Bedenindeki en rahat bolgeyi not et.",
      },
    ],
  },
  {
    id: "urge-surfing",
    title: "Durtu Sorfu",
    duration: "8 dk",
    description: "Durtuyu bastirmadan dalga gibi surmeyi ogren.",
    goals: ["Durtuyu adlandir", "Gozlem becerisini artir", "Yargisiz kal"],
    steps: [
      {
        title: "Adlandir",
        body: "Su cumleyi kur: Su an bir durtu hissediyorum.",
      },
      {
        title: "Dalga Metaforu",
        body: "Durtunun yukselip sonra azaldigini hayal et.",
      },
      {
        title: "Nefese Don",
        body: "Nefesi yavaslat, 4-6 ritmini uygula.",
      },
      {
        title: "Puana Bak",
        body: "Durtu yogunlugunu tekrar 1-10 arasinda degerlendir.",
      },
    ],
  },
  {
    id: "self-compassion",
    title: "Sefkatli Farkindalik",
    duration: "12 dk",
    description: "Kendine daha nazik bir ic ses gelistirmeyi hedefler.",
    goals: ["Sucluluk yerine sefkat", "Ic konusmayi yumusat", "Motivasyonu artir"],
    isPremium: true,
    steps: [
      {
        title: "Niyet",
        body: "Kendime nazik davranmayi seciyorum cumlesini tekrarla.",
      },
      {
        title: "Zor An",
        body: "Zor bir ani dusun ve bedendeki tepkiyi gozlemle.",
      },
      {
        title: "Sefkat Cumlesi",
        body: "Bu zor ama yalniz degilim cumlesini tekrarla.",
      },
      {
        title: "Kapanis",
        body: "Bugun kendine yapabilecegin kucuk bir iyilik sec.",
      },
    ],
  },
  {
    id: "sleep-calm",
    title: "Uyku Oncesi Sakinlesme",
    duration: "9 dk",
    description: "Gunun sonunda zihni yavaslatmak icin.",
    goals: ["Zihni sakinlestir", "Gece durtulerini azalt", "Uykuya gecis"],
    isPremium: true,
    steps: [
      {
        title: "Gun Ozeti",
        body: "Bugunu tek bir cumleyle ozetle.",
      },
      {
        title: "Veda",
        body: "Bugunun zorlayici dusuncelerini birakmaya niyet et.",
      },
      {
        title: "Yavas Nefes",
        body: "6 saniye nefes al, 6 saniye ver. 2 dakika devam et.",
      },
      {
        title: "Rahatlama",
        body: "Kaslarini sirayla gevset ve gozlerini kapat.",
      },
    ],
  },
  {
    id: "trigger-lab",
    title: "Tetikleyici Lab",
    duration: "11 dk",
    description: "Tetikleyici dusunce ve ortamlarda daha sogukkanli kalmana yardim eder.",
    goals: ["Tetikleyiciyi tani", "Yaniti geciktir", "Kontrolu guclendir"],
    isPremium: true,
    steps: [
      {
        title: "Haritalama",
        body: "Son zorlandigin 3 tetikleyiciyi yaz ve ortak noktayi sec.",
      },
      {
        title: "Mikro Durak",
        body: "Tetikleyici geldiginde 20 saniyelik nefes arasi uygula.",
      },
      {
        title: "Yanit Cumlesi",
        body: "Kendine su cumleyi soyle: Bu dalga gececek, secimi ben yapacagim.",
      },
      {
        title: "Guvenli Rota",
        body: "Riskli alandan cikis icin tek adimlik bir rota belirle.",
      },
      {
        title: "Kapanis",
        body: "Bugun uygulayacagin tek savunma davranisini sec.",
      },
    ],
  },
  {
    id: "relapse-shield",
    title: "Nuks Kalkani",
    duration: "14 dk",
    description: "Yuksek riskli saatler icin uygulanabilir bir acil durum plani olusturur.",
    goals: ["Risk saatini tespit et", "Acil plani sabitle", "Nuks riskini dusur"],
    isPremium: true,
    steps: [
      {
        title: "Risk Saati",
        body: "En cok zorlandigin saat araligini netlestir.",
      },
      {
        title: "Uc Katman",
        body: "1) nefes 2) ortam degisimi 3) destek aramasi sirasini kur.",
      },
      {
        title: "Mesaj Taslagi",
        body: "Gerektiginde gonderecegin kisa destek mesajini hazirla.",
      },
      {
        title: "Engel Noktasi",
        body: "En zayif halkayi sec ve tek bir onlemle guclendir.",
      },
      {
        title: "Kapanis",
        body: "Bir sonraki zor an icin uygulama niyetini yuksek sesle tekrar et.",
      },
    ],
  },
];
const MINDFULNESS_COPY = {
  tr: {
    focus: {
      title: "Farkindalik odagi",
      description:
        "Durtuyu azaltmak ve duygusal dengeyi korumak icin kisa pratikler.",
    },
    heroTitle: "Farkindalik Seanslari",
    heroBadge: "Mindfulness",
    premiumLabel: "Premium",
    dailyLeadTitle: "Gunluk Oneri",
    dailyLeadSubtitle: "Kisa nefes ve odak protokolu",
    tipLabel: "Ipucu:",
    tipBody:
      "Durtu yukseldiginde 10 yavas nefes al. Dikkatini nefese ver ve istegin gecmesine izin ver.",
    summaryTitle: "Ilerleme",
    summaryText: (completed: number, total: number) =>
      `${completed}/${total} seans tamamlandi`,
    recommendText: (title: string, duration: string) =>
      `Bugun onerilen: ${title} (${duration})`,
    premiumShowcaseTitle: "Premium Derinlesme Paketi",
    premiumBadgeActive: "Aktif",
    premiumBadgeLocked: "Kilitli",
    premiumSubtitleActive:
      "Dinamik premium seanslarla yuksek risk anlarini daha guvenli yonet.",
    premiumSubtitleLocked:
      "Derin seanslar, net acil durum plani ve hizli premium yonlendirmeler.",
    premiumStatSessions: "Premium seans",
    premiumStatCompleted: "Tamamlanan",
    premiumStatProgress: "Ilerleme",
    premiumInsightNoSessions: "Bu yapida premium seans tanimi bulunmuyor.",
    premiumInsightComplete:
      "Tum premium seanslari tamamladin. Derin pratik seviyesine gectin.",
    premiumInsightReady:
      "Temel rutini kurdun. Premium seanslarla derinlesmeye hazirsin.",
    premiumInsightDefault:
      "Premium modlar, temel seans ilerlemenle birlikte daha guclu etki verir.",
    premiumPrimaryActive: "Siradaki premium seansi baslat",
    premiumPrimaryLocked: "Premium kilidini ac",
    premiumSecondaryActive: "Premium paneli",
    premiumSecondaryLocked: "Planlari incele",
    programLeadTitle: "Seans Programi",
    programLeadSubtitle: "Ritmini koru ve siradaki seansi ac",
    sessionsTitle: "Seanslariniz",
    resume: "Devam Et",
    sessionMeta: (duration: string, stepCount: number) =>
      `${duration} - ${stepCount} adim`,
    statusCompleted: "Tamamlandi",
    statusInProgress: "Devam ediyor",
    statusNew: "Yeni",
    unlock: "Kilidi Ac",
    restart: "Yeniden Baslat",
    start: "Basla",
    currentSession: "Gecerli Seans",
    stepLabel: (title: string, current: number, total: number) =>
      `${title} - Adim ${current}/${total}`,
    back: "Geri",
    complete: "Tamamla",
    next: "Ileri",
    introTitle: "Farkindalik Yol Haritasi",
    introSubtitle:
      "Kisa seanslarla nefes, beden farkindaligi ve durtu yonetimine odaklan.",
    introBullets: [
      "Rehberli nefes ile baslayin",
      "Durtu sorfu ile guclenin",
      "Beden taramasiyla gevsesin",
      "Premium seanslarla derinlesin",
    ],
    introStart: "Simdi Basla",
    premiumRequiredTitle: "Premium gerekli",
    premiumRequiredBody:
      "Bu seans Premium kapsamindadir. Premium'a gecerek erisebilirsiniz.",
    premiumRequiredCancel: "Vazgec",
    premiumRequiredCta: "Premium'a Git",
  },
  en: {
    focus: {
      title: "Mindfulness focus",
      description:
        "Short practices to reduce urges and maintain emotional balance.",
    },
    heroTitle: "Mindfulness Sessions",
    heroBadge: "Mindfulness",
    premiumLabel: "Premium",
    dailyLeadTitle: "Daily Recommendation",
    dailyLeadSubtitle: "Short breathing and focus protocol",
    tipLabel: "Tip:",
    tipBody:
      "When an urge rises, take 10 slow breaths. Focus on your breathing and let the urge pass.",
    summaryTitle: "Progress",
    summaryText: (completed: number, total: number) =>
      `${completed}/${total} sessions completed`,
    recommendText: (title: string, duration: string) =>
      `Recommended today: ${title} (${duration})`,
    premiumShowcaseTitle: "Premium Deepening Pack",
    premiumBadgeActive: "Active",
    premiumBadgeLocked: "Locked",
    premiumSubtitleActive:
      "Manage high-risk moments more safely with dynamic premium sessions.",
    premiumSubtitleLocked:
      "Deep sessions, a clear emergency plan, and quick premium actions.",
    premiumStatSessions: "Premium sessions",
    premiumStatCompleted: "Completed",
    premiumStatProgress: "Progress",
    premiumInsightNoSessions: "No premium sessions are defined in this setup.",
    premiumInsightComplete:
      "You completed all premium sessions. You reached advanced practice level.",
    premiumInsightReady:
      "You built the core routine. You are ready to deepen with premium sessions.",
    premiumInsightDefault:
      "Premium modes become more effective as your core session progress grows.",
    premiumPrimaryActive: "Start next premium session",
    premiumPrimaryLocked: "Unlock premium",
    premiumSecondaryActive: "Premium panel",
    premiumSecondaryLocked: "Review plans",
    programLeadTitle: "Session Program",
    programLeadSubtitle: "Keep your rhythm and open the next session",
    sessionsTitle: "Your Sessions",
    resume: "Continue",
    sessionMeta: (duration: string, stepCount: number) =>
      `${duration} - ${stepCount} steps`,
    statusCompleted: "Completed",
    statusInProgress: "In progress",
    statusNew: "New",
    unlock: "Unlock",
    restart: "Restart",
    start: "Start",
    currentSession: "Current Session",
    stepLabel: (title: string, current: number, total: number) =>
      `${title} - Step ${current}/${total}`,
    back: "Back",
    complete: "Complete",
    next: "Next",
    introTitle: "Mindfulness Roadmap",
    introSubtitle:
      "Use short sessions to focus on breathing, body awareness, and urge regulation.",
    introBullets: [
      "Start with guided breathing",
      "Build strength with urge surfing",
      "Release tension with body scan",
      "Go deeper with premium sessions",
    ],
    introStart: "Start now",
    premiumRequiredTitle: "Premium required",
    premiumRequiredBody:
      "This session is part of Premium. Upgrade to Premium to access it.",
    premiumRequiredCancel: "Cancel",
    premiumRequiredCta: "Go Premium",
  },
} as const;

export default function Mindfulness() {
  const { language, t } = useLanguage();
  const copy = useLocalizedCopy(MINDFULNESS_COPY);
  const { isActive: premiumActive } = usePremium();
  const hydratePremium = usePremiumStore((s) => s.hydrate);
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const state = await getSessionState("mindfulness");
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
      setCompletedIds(state.completedSessionIds);
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      hydratePremium();
    }, [hydratePremium]),
  );

  const currentSession = useMemo(
    () => MINDFULNESS_SESSIONS.find((s) => s.id === currentSessionId) || null,
    [currentSessionId],
  );

  const completedCount = completedIds.length;
  const progressPercent = Math.round(
    (completedCount / MINDFULNESS_SESSIONS.length) * 100,
  );
  const nextRecommended = useMemo(() => {
    const next = MINDFULNESS_SESSIONS.find(
      (session) => !completedIds.includes(session.id),
    );
    return next ?? MINDFULNESS_SESSIONS[0];
  }, [completedIds]);
  const premiumSessions = useMemo(
    () => MINDFULNESS_SESSIONS.filter((session) => !!session.isPremium),
    [],
  );
  const completedPremiumCount = useMemo(
    () =>
      premiumSessions.filter((session) => completedIds.includes(session.id))
        .length,
    [completedIds, premiumSessions],
  );
  const premiumProgressPercent =
    premiumSessions.length > 0
      ? Math.round((completedPremiumCount / premiumSessions.length) * 100)
      : 0;
  const nextPremiumSession = useMemo(() => {
    const next = premiumSessions.find(
      (session) => !completedIds.includes(session.id),
    );
    return next ?? premiumSessions[0] ?? null;
  }, [completedIds, premiumSessions]);
  const hasPremiumSessions = premiumSessions.length > 0;
  const showPremiumShowcase = hasPremiumSessions || __DEV__;
  const premiumInsight = useMemo(() => {
    if (!hasPremiumSessions) {
      return copy.premiumInsightNoSessions;
    }
    if (completedPremiumCount === premiumSessions.length) {
      return copy.premiumInsightComplete;
    }
    if (completedCount >= 3) {
      return copy.premiumInsightReady;
    }
    return copy.premiumInsightDefault;
  }, [
    copy,
    completedCount,
    completedPremiumCount,
    hasPremiumSessions,
    premiumSessions.length,
  ]);

  const handleStart = async (session: Session) => {
    if (session.isPremium && !premiumActive) {
      Alert.alert(
        copy.premiumRequiredTitle,
        copy.premiumRequiredBody,
        [
          { text: copy.premiumRequiredCancel, style: "cancel" },
          { text: copy.premiumRequiredCta, onPress: () => router.push("/premium") },
        ],
      );
      return;
    }
    const state = await startSession("mindfulness", session.id);
    setCurrentSessionId(state.currentSessionId);
    setCurrentStepState(state.currentStep);
  };

  const handleStartNextPremium = async () => {
    if (!nextPremiumSession) {
      router.push("/premium");
      return;
    }
    await handleStart(nextPremiumSession);
  };

  const handleResume = () => {
    if (!currentSessionId) return;
    setCurrentSessionId(currentSessionId);
  };

  const handleNext = async () => {
    if (!currentSession) return;
    const nextStep = currentStep + 1;
    if (nextStep >= currentSession.steps.length) {
      const state = await completeSession("mindfulness", currentSession.id);
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
      setCompletedIds(state.completedSessionIds);
      await incrementSessionsCompleted();
      return;
    }
    const state = await setSessionStep(
      "mindfulness",
      currentSession.id,
      nextStep,
    );
    setCurrentStepState(state.currentStep);
  };

  const handleBackStep = async () => {
    if (!currentSession) return;
    const nextStep = Math.max(0, currentStep - 1);
    const state = await setSessionStep(
      "mindfulness",
      currentSession.id,
      nextStep,
    );
    setCurrentStepState(state.currentStep);
  };

  const handleReset = async () => {
    if (!currentSession) return;
    const state = await startSession("mindfulness", currentSession.id);
    setCurrentSessionId(state.currentSessionId);
    setCurrentStepState(state.currentStep);
  };

  const focusCopy = copy.focus;

  return (
    <SafeAreaView style={styles.container} testID="mindfulness-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>{`< ${t.back}`}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{copy.heroTitle}</Text>
        <Text style={styles.focusLabel}>{focusCopy.title}</Text>

        <ScreenHero
          icon="leaf-outline"
          title={copy.heroTitle}
          subtitle={focusCopy.title}
          description={focusCopy.description}
          badge={copy.heroBadge}
          gradient={["#0D6B55", "#0D8A6E"]}
          style={styles.card}
        />


        <SectionLead
          icon="sparkles-outline"
          title={copy.dailyLeadTitle}
          subtitle={copy.dailyLeadSubtitle}
          tone="success"
          style={styles.sectionLead}
        />

        <View style={styles.tipBox}>
          <Text style={styles.tipLabel}>{copy.tipLabel}</Text>
          <Text style={styles.tipText}>{copy.tipBody}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{copy.summaryTitle}</Text>
            <Text style={styles.summaryPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <Text style={styles.summaryText}>{copy.summaryText(completedCount, MINDFULNESS_SESSIONS.length)}</Text>
          <TouchableOpacity
            style={styles.recommendButton}
            onPress={() => handleStart(nextRecommended)}
          >
            <Text style={styles.recommendButtonText}>{copy.recommendText(nextRecommended.title, nextRecommended.duration)}</Text>
          </TouchableOpacity>
        </View>

        <ProfessionalMindfulnessPlugins />

        {showPremiumShowcase ? (
          <View
            style={[
              styles.premiumShowcaseCard,
              premiumActive
                ? styles.premiumShowcaseActive
                : styles.premiumShowcaseLocked,
            ]}
            testID="mindfulness-premium-showcase"
          >
            <View style={styles.premiumShowcaseHeader}>
              <Text style={styles.premiumShowcaseTitle}>{copy.premiumShowcaseTitle}</Text>
              <Text style={styles.premiumShowcaseBadge}>
                {premiumActive ? copy.premiumBadgeActive : copy.premiumBadgeLocked}
              </Text>
            </View>
            <Text style={styles.premiumShowcaseSubtitle}>
              {premiumActive
                ? copy.premiumSubtitleActive
                : copy.premiumSubtitleLocked}
            </Text>
            <View style={styles.premiumStatsRow}>
              <View style={styles.premiumStatBox}>
                <Text style={styles.premiumStatValue}>
                  {premiumSessions.length}
                </Text>
                <Text style={styles.premiumStatLabel}>{copy.premiumStatSessions}</Text>
              </View>
              <View style={styles.premiumStatBox}>
                <Text style={styles.premiumStatValue}>
                  {completedPremiumCount}/{premiumSessions.length || 0}
                </Text>
                <Text style={styles.premiumStatLabel}>{copy.premiumStatCompleted}</Text>
              </View>
              <View style={styles.premiumStatBox}>
                <Text style={styles.premiumStatValue}>
                  {premiumProgressPercent}%
                </Text>
                <Text style={styles.premiumStatLabel}>{copy.premiumStatProgress}</Text>
              </View>
            </View>
            <Text style={styles.premiumInsightText}>{premiumInsight}</Text>
            <View style={styles.premiumActionsRow}>
              <TouchableOpacity
                style={styles.premiumPrimaryButton}
                onPress={
                  premiumActive
                    ? handleStartNextPremium
                    : () => router.push("/premium")
                }
                testID="mindfulness-premium-primary-btn"
              >
                <Text style={styles.premiumPrimaryButtonText}>
                  {premiumActive
                ? copy.premiumPrimaryActive
                : copy.premiumPrimaryLocked}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.premiumSecondaryButton}
                onPress={() => router.push("/premium")}
                testID="mindfulness-premium-detail-btn"
              >
                <Text style={styles.premiumSecondaryButtonText}>
                  {premiumActive ? copy.premiumSecondaryActive : copy.premiumSecondaryLocked}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <SectionLead
          icon="list-outline"
          title={copy.programLeadTitle}
          subtitle={copy.programLeadSubtitle}
          tone="primary"
          style={styles.sectionLead}
        />

        <View style={styles.sessionHeader}>
          <Text style={styles.sectionTitle}>{copy.sessionsTitle}</Text>
          <TouchableOpacity
            style={[styles.sessionAction, !currentSessionId && styles.disabled]}
            disabled={!currentSessionId}
            onPress={handleResume}
            testID="mindfulness-resume-btn"
          >
            <Text style={styles.sessionActionText}>{copy.resume}</Text>
          </TouchableOpacity>
        </View>

        {MINDFULNESS_SESSIONS.map((session) => {
          const isActive = currentSessionId === session.id;
          const isComplete = completedIds.includes(session.id);
          const locked = session.isPremium && !premiumActive;
          return (
            <View
              key={session.id}
              style={[styles.sessionCard, isActive && styles.sessionCardActive]}
              testID={`mindfulness-session-${session.id}`}
            >
              <View style={styles.sessionRow}>
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    {session.isPremium ? (
                      <View style={styles.premiumChip}>
                        <Text style={styles.premiumChipText}>{copy.premiumLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.sessionMeta}>{copy.sessionMeta(session.duration, session.steps.length)}</Text>
                  <Text style={styles.sessionDesc}>{session.description}</Text>
                  <View style={styles.sessionTags}>
                    {session.goals.map((goal) => (
                      <View key={goal} style={styles.tag}>
                        <Text style={styles.tagText}>{goal}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.sessionStatus}>
                  <Text style={styles.statusText}>
                    {
                      locked
                        ? copy.premiumLabel
                        : isComplete
                          ? copy.statusCompleted
                          : isActive
                            ? copy.statusInProgress
                            : copy.statusNew
                    }
                  </Text>
                  <TouchableOpacity
                    style={[
                      locked ? styles.secondaryButton : styles.primaryButton,
                      locked && styles.lockedButton,
                    ]}
                    onPress={() => handleStart(session)}
                    testID={`mindfulness-session-action-${session.id}`}
                  >
                    <Text
                      style={
                        locked
                          ? styles.secondaryButtonText
                          : styles.primaryButtonText
                      }
                    >
                      {
                      locked
                        ? copy.unlock
                        : isComplete
                          ? copy.restart
                          : isActive
                            ? copy.resume
                            : copy.start
                    }
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {currentSession && !loading ? (
          <View style={styles.stepCard} testID="mindfulness-step-card">
            <Text style={styles.sectionTitle}>{copy.currentSession}</Text>
            <Text style={styles.stepTitle}>{copy.stepLabel(currentSession.title, currentStep + 1, currentSession.steps.length)}</Text>
            <Text style={styles.stepHeading}>
              {currentSession.steps[currentStep]?.title}
            </Text>
            <Text style={styles.stepBody}>
              {currentSession.steps[currentStep]?.body}
            </Text>
            <View style={styles.stepActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBackStep}
                disabled={currentStep === 0}
                testID="mindfulness-step-back-btn"
              >
                <Text style={styles.secondaryButtonText}>{copy.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleReset}
                testID="mindfulness-step-reset-btn"
              >
                <Text style={styles.secondaryButtonText}>{copy.restart}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleNext}
                testID="mindfulness-step-next-btn"
              >
                <Text style={styles.primaryButtonText}>
                  {currentStep + 1 >= currentSession.steps.length
                    ? copy.complete : copy.next}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={showIntro && !loading}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIntro(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowIntro(false)}
            >
              <Text style={styles.closeText}>x</Text>
            </TouchableOpacity>

            <View style={styles.modalIcon}>
              <Text style={styles.modalIconEmoji}>MF</Text>
            </View>

            <Text style={styles.modalTitle}>{copy.introTitle}</Text>
            <Text style={styles.modalSubtitle}>{copy.introSubtitle}</Text>

            <View style={styles.modalList}>{copy.introBullets.map((item) => (<Text key={item} style={styles.modalListItem}>{`- ${item}`}</Text>))}</View>

            <TouchableOpacity
              style={styles.modalNextBtn}
              onPress={() => setShowIntro(false)}
              testID="mindfulness-intro-start"
            >
              <Text style={styles.modalNextText}>{copy.introStart}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF" },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { alignSelf: "flex-start" },
  backText: { fontSize: 16, color: "#1D4C72" },
  title: { fontSize: 28, fontWeight: "900", marginBottom: 16, color: "#222" },
  focusLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionLead: {
    marginBottom: 12,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: { fontSize: 46 },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    color: "#222",
  },
  cardText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
  tipBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#1D4C72",
  },
  tipLabel: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
    color: "#1D4C72",
  },
  tipText: { fontSize: 15, color: "#333", lineHeight: 22 },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D6E3F3",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryTitle: { fontSize: 15, fontWeight: "800", color: "#1D4C72" },
  summaryPercent: { fontSize: 14, fontWeight: "800", color: "#1D4C72" },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#EAF2FB",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#1D4C72" },
  summaryText: {
    fontSize: 12,
    color: "#596A82",
    marginBottom: 10,
    fontWeight: "700",
  },
  recommendButton: {
    backgroundColor: "#1D4C72",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  recommendButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  premiumShowcaseCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D6E3F3",
  },
  premiumShowcaseActive: {
    backgroundColor: "#EAF3FF",
  },
  premiumShowcaseLocked: {
    backgroundColor: "#F8FBFF",
  },
  premiumShowcaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  premiumShowcaseTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F3555",
    flex: 1,
    marginRight: 8,
  },
  premiumShowcaseBadge: {
    fontSize: 12,
    color: "#0F3555",
    fontWeight: "800",
    backgroundColor: "#DCEBFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  premiumShowcaseSubtitle: {
    fontSize: 13,
    color: "#385473",
    lineHeight: 18,
    marginBottom: 12,
  },
  premiumStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  premiumStatBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#D6E3F3",
    alignItems: "center",
  },
  premiumStatValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F3555",
  },
  premiumStatLabel: {
    fontSize: 11,
    color: "#536B85",
    fontWeight: "700",
    marginTop: 2,
  },
  premiumInsightText: {
    fontSize: 13,
    color: "#2F4964",
    lineHeight: 19,
    marginBottom: 12,
    fontWeight: "600",
  },
  premiumActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  premiumPrimaryButton: {
    flex: 1,
    backgroundColor: "#0F3555",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  premiumPrimaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  premiumSecondaryButton: {
    flex: 1,
    backgroundColor: "#E3EFFC",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  premiumSecondaryButtonText: {
    color: "#0F3555",
    fontWeight: "700",
    fontSize: 12,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1D4C72" },
  sessionAction: {
    backgroundColor: "#1D4C72",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sessionActionText: { color: "#FFFFFF", fontWeight: "700" },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sessionCardActive: { borderWidth: 2, borderColor: "#1D4C72" },
  sessionRow: { flexDirection: "row", gap: 16 },
  sessionInfo: { flex: 1 },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
    marginBottom: 4,
  },
  premiumChip: {
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumChipText: {
    color: "#854D0E",
    fontSize: 10,
    fontWeight: "800",
  },
  sessionMeta: { fontSize: 13, color: "#666", marginBottom: 6 },
  sessionDesc: { fontSize: 14, color: "#444", marginBottom: 8 },
  sessionTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: "#E8F0F8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: { fontSize: 11, color: "#1D4C72", fontWeight: "600" },
  sessionStatus: { alignItems: "flex-end", gap: 8 },
  statusText: { fontSize: 12, color: "#666", fontWeight: "700" },
  primaryButton: {
    backgroundColor: "#1D4C72",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#E8F0F8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  secondaryButtonText: { color: "#1D4C72", fontWeight: "700" },
  lockedButton: { borderWidth: 1, borderColor: "#1D4C72" },
  disabled: { opacity: 0.5 },
  stepCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D4C72",
    marginBottom: 6,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },
  stepBody: { fontSize: 15, color: "#444", lineHeight: 22, marginBottom: 16 },
  stepActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  closeBtn: { position: "absolute", top: 16, right: 16 },
  closeText: { fontSize: 24, color: "#999", fontWeight: "300" },
  modalIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconEmoji: { fontSize: 54 },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1D4C72",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 16,
  },
  modalList: { width: "100%", marginBottom: 20 },
  modalListItem: { fontSize: 14, color: "#333", marginBottom: 6 },
  modalNextBtn: {
    backgroundColor: "#1D4C72",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  modalNextText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});


