import { Fonts, Radius } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ScreenHero } from "@/components/ui/screen-hero";
import { SectionLead } from "@/components/ui/section-lead";
import { incrementSessionsCompleted } from "@/store/progressStore";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  completeSession,
  getSessionState,
  setSessionStep,
  startSession,
} from "@/store/sessionStore";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SessionStep = { title: string; body: string };

type Session = {
  id: string;
  title: string;
  duration: string;
  description: string;
  goals: string[];
  steps: SessionStep[];
};

const THERAPY_COPY = {
  tr: {
    title: "Destek Seanslari",
    focusLabel: "Kumar odagi",
    cardTitle: "Yapilandirilmis Destek Plani",
    cardText: "Kumar durtuleriyle basa cikmak icin rehberli adimlari uygula.",
    progressTitle: "Ilerlemen",
    sessionsCompleted: "seans tamamlandi",
    recommendedToday: "Bugun onerilen:",
    struggling: "Zorlandim (SOS)",
    sessions: "Seanslarin",
    continue: "Devam Et",
    statusComplete: "Tamamlandi",
    statusInProgress: "Devam ediyor",
    statusNew: "Yeni",
    actionRestart: "Yeniden Baslat",
    actionStart: "Basla",
    currentSession: "Gecerli Seans",
    step: "Adim",
    next: "Ileri",
    complete: "Tamamla",
    roadmapTitle: "Destek Yol Haritasi",
    roadmapSubtitle: "Kisa ve rehberli seanslarla beceri gelistir.",
    roadmapItems: [
      "BDT temelleri ile basla",
      "Durtu sorfunu gunluk uygula",
      "Nuks onleme planini olustur",
      "Degerlerini haftalik hatirla",
    ],
    startNow: "Simdi Basla",
    sessionsData: [
      {
        id: "cbt-foundations",
        title: "BDT Temelleri",
        duration: "15 dk",
        description:
          "Dusunce, duygu ve davranisin kumar durtuleriyle baglantisini fark et.",
        goals: [
          "Dusunce tuzaklarini belirle",
          "Tetikleyici-tepki zincirini cikar",
          "3 dakikalik sifirlama uygula",
        ],
        steps: [
          {
            title: "Durum Kontrolu",
            body: "Durtuyu 1-10 arasinda puanla ve ana tetikleyiciyi adlandir.",
          },
          {
            title: "Dusunce Tuzagi",
            body: "Durtuyu tetikleyen dusunceyi yaz. Ornek: Kayiplari geri kazanabilirim.",
          },
          {
            title: "Gerceklik Kontrolu",
            body: "Bu dusuncenin gercege uymadigini gosteren iki kanit yaz.",
          },
          {
            title: "Yerine Koyma",
            body: "Daha dengeli ve uygulanabilir bir ifadeyle dusunceyi degistir.",
          },
          {
            title: "Eylem Plani",
            body: "Onumuzdeki 10 dakika icin saglikli bir eylem sec.",
          },
        ],
      },
      {
        id: "urge-surfing",
        title: "Durtu Sorfu",
        duration: "10 dk",
        description: "Durtunun dalga gibi yukselip azalmasina eslik ederek gecmesine izin ver.",
        goals: [
          "Bedensel duyumu fark et",
          "Nefes ritmi uygula",
          "Durtunun sonmesini izle",
        ],
        steps: [
          {
            title: "Yerles",
            body: "Rahat otur ve durtuyu bedende nerede hissettigini fark et.",
          },
          {
            title: "Adlandir",
            body: "Su cumleyi kur: Bu bir durtu ve gecici.",
          },
          {
            title: "Nefes",
            body: "4 saniye al, 6 saniye ver. En az 2 dakika surdur.",
          },
          {
            title: "Gozlem",
            body: "Durtunun siddetindeki degisimi izle ve tekrar puanla.",
          },
          {
            title: "Cikis",
            body: "Seans sonunda kisa bir topraklama adimi sec.",
          },
        ],
      },
      {
        id: "relapse-prevention",
        title: "Nuks Onleme",
        duration: "20 dk",
        description: "Yuksek riskli durumlar icin onceden hazir bir guvenlik plani kur.",
        goals: [
          "Kirmizi bayraklari tanimla",
          "Mudahale plani yaz",
          "Destek baglantilarini netlestir",
        ],
        steps: [
          {
            title: "Erken Isaretler",
            body: "Kaymaya yaklastigini gosteren 3 erken isareti yaz.",
          },
          {
            title: "Yuksek Riskli Durumlar",
            body: "Seni en cok tetikleyen iki ortami veya zamani belirle.",
          },
          {
            title: "Basa Cikma",
            body: "Her riskli durum icin bir karsi eylem sec.",
          },
          {
            title: "Destek",
            body: "Durtu artisinda kime ulasacagini netlestir.",
          },
          {
            title: "Taahhut",
            body: "Bu hafta icin uygulanabilir bir kendine soz yaz.",
          },
        ],
      },
      {
        id: "values-reset",
        title: "Degerleri Yeniden Hatirlama",
        duration: "12 dk",
        description: "Motivasyonu korumak icin degerlerini tekrar merkeze al.",
        goals: [
          "Oncelikleri netlestir",
          "Deger-hedef bagini kur",
          "Gunluk hatirlatici belirle",
        ],
        steps: [
          {
            title: "Degerler",
            body: "Bugun senin icin en onemli 3 degeri sec.",
          },
          {
            title: "Neden",
            body: "Her degerin senin icin neden onemli oldugunu yaz.",
          },
          {
            title: "Gunluk Eylem",
            body: "Her degerle uyumlu kucuk bir eylem belirle.",
          },
          {
            title: "Hatirlatici",
            body: "Gun icinde tekrar edecegin bir cumle sec.",
          },
        ],
      },
    ] as Session[],
  },
  en: {
    title: "Support Sessions",
    focusLabel: "Gambling focus",
    cardTitle: "Structured Support Plan",
    cardText: "Follow guided steps to manage gambling urges.",
    progressTitle: "Your Progress",
    sessionsCompleted: "sessions completed",
    recommendedToday: "Recommended today:",
    struggling: "I'm Struggling (SOS)",
    sessions: "Your Sessions",
    continue: "Continue",
    statusComplete: "Completed",
    statusInProgress: "In progress",
    statusNew: "New",
    actionRestart: "Restart",
    actionStart: "Start",
    currentSession: "Current Session",
    step: "Step",
    next: "Next",
    complete: "Complete",
    roadmapTitle: "Support Roadmap",
    roadmapSubtitle: "Build skills through short guided sessions.",
    roadmapItems: [
      "Start with CBT foundations",
      "Practice urge surfing daily",
      "Build your relapse prevention plan",
      "Reconnect with core values weekly",
    ],
    startNow: "Start Now",
    sessionsData: [
      {
        id: "cbt-foundations",
        title: "CBT Foundations",
        duration: "15 min",
        description: "Learn how thoughts, emotions, and behavior connect to gambling urges.",
        goals: [
          "Identify thinking traps",
          "Map trigger-response loops",
          "Use a 3-minute reset",
        ],
        steps: [
          {
            title: "Situation Check",
            body: "Rate urge intensity from 1 to 10 and name the main trigger.",
          },
          {
            title: "Thinking Trap",
            body: "Write the thought behind the urge. Example: I can win losses back.",
          },
          {
            title: "Reality Check",
            body: "Write two facts that challenge this thought.",
          },
          {
            title: "Reframe",
            body: "Replace it with a balanced and actionable statement.",
          },
          {
            title: "Action Plan",
            body: "Choose one healthy action for the next 10 minutes.",
          },
        ],
      },
      {
        id: "urge-surfing",
        title: "Urge Surfing",
        duration: "10 min",
        description: "Allow the urge wave to rise and pass without acting on it.",
        goals: [
          "Notice body cues",
          "Apply breathing rhythm",
          "Observe urge decline",
        ],
        steps: [
          {
            title: "Settle",
            body: "Sit comfortably and notice where you feel the urge in your body.",
          },
          {
            title: "Name It",
            body: "Say: This is an urge, and it is temporary.",
          },
          {
            title: "Breathing",
            body: "Inhale for 4 seconds, exhale for 6 seconds for at least 2 minutes.",
          },
          {
            title: "Observe",
            body: "Watch changes in intensity and rate the urge again.",
          },
          {
            title: "Exit",
            body: "Choose one short grounding action before leaving.",
          },
        ],
      },
      {
        id: "relapse-prevention",
        title: "Relapse Prevention",
        duration: "20 min",
        description: "Create a ready-to-use safety plan for high-risk moments.",
        goals: [
          "Identify red flags",
          "Write intervention plan",
          "Define support contacts",
        ],
        steps: [
          {
            title: "Early Signals",
            body: "List 3 early signals that indicate you are slipping.",
          },
          {
            title: "High-Risk Situations",
            body: "Identify your top two high-risk contexts.",
          },
          {
            title: "Coping Actions",
            body: "Assign one coping action to each high-risk context.",
          },
          {
            title: "Support",
            body: "Decide who you will contact when urges escalate.",
          },
          {
            title: "Commitment",
            body: "Write one practical commitment for this week.",
          },
        ],
      },
      {
        id: "values-reset",
        title: "Values Reset",
        duration: "12 min",
        description: "Reconnect with personal values to sustain motivation.",
        goals: [
          "Clarify priorities",
          "Link values to goals",
          "Set daily reminder",
        ],
        steps: [
          {
            title: "Values",
            body: "Choose the top 3 values that matter most today.",
          },
          {
            title: "Why",
            body: "Write why each value matters to you right now.",
          },
          {
            title: "Daily Action",
            body: "Pick one small action for each value.",
          },
          {
            title: "Reminder",
            body: "Choose one phrase to repeat during the day.",
          },
        ],
      },
    ] as Session[],
  },
} as const;

export default function Therapy() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(THERAPY_COPY);

  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const sessions = copy.sessionsData;

  useEffect(() => {
    (async () => {
      const state = await getSessionState("therapy");
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
      setCompletedIds(state.completedSessionIds);
      setLoading(false);
    })();
  }, []);

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId) || null,
    [currentSessionId, sessions]
  );

  const completedCount = completedIds.length;
  const totalCount = sessions.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const nextRecommended = useMemo(() => {
    const firstIncomplete = sessions.find((s) => !completedIds.includes(s.id));
    return firstIncomplete || sessions[0];
  }, [completedIds, sessions]);

  const handleSOS = () => {
    router.push("/support-topic/sos");
  };

  const handleStart = async (sessionId: string) => {
    const state = await startSession("therapy", sessionId);
    setCurrentSessionId(state.currentSessionId);
    setCurrentStepState(state.currentStep);
  };

  const handleResume = () => {
    if (!currentSessionId) return;
    setCurrentSessionId(currentSessionId);
  };

  const handleNext = async () => {
    if (!currentSession) return;
    const nextStep = currentStep + 1;

    if (nextStep >= currentSession.steps.length) {
      const state = await completeSession("therapy", currentSession.id);
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
      setCompletedIds(state.completedSessionIds);
      await incrementSessionsCompleted();
      return;
    }

    const state = await setSessionStep("therapy", currentSession.id, nextStep);
    setCurrentStepState(state.currentStep);
  };

  const handleBackStep = async () => {
    if (!currentSession) return;
    const nextStep = Math.max(0, currentStep - 1);
    const state = await setSessionStep("therapy", currentSession.id, nextStep);
    setCurrentStepState(state.currentStep);
  };

  const handleReset = async () => {
    if (!currentSession) return;
    const state = await startSession("therapy", currentSession.id);
    setCurrentSessionId(state.currentSessionId);
    setCurrentStepState(state.currentStep);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
          </TouchableOpacity>
        </View>

        <ScreenHero
          icon="medkit-outline"
          title={copy.title}
          subtitle={copy.focusLabel}
          description={copy.cardText}
          badge={copy.cardTitle}
          gradient={["#0E3E6E", "#2C5F9B"]}
          style={styles.card}
        />

        <SectionLead
          icon="bar-chart-outline"
          title={copy.progressTitle}
          subtitle={copy.recommendedToday}
          badge={`${progressPercent}%`}
          tone="primary"
          style={styles.sectionLead}
        />

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.summaryTopRow}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>{copy.progressTitle}</Text>
            <Text style={[styles.summaryPercent, { color: colors.primary }]}>{progressPercent}%</Text>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: `${colors.primary}1A` }]}>
            <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
          </View>

          <Text style={[styles.summaryHint, { color: colors.textSecondary }]}>
            {`${completedCount}/${totalCount} ${copy.sessionsCompleted}`}
          </Text>

          <View style={styles.summaryButtons}>
            <TouchableOpacity
              style={[styles.recommendButton, { backgroundColor: colors.primary }]}
              onPress={() => handleStart(nextRecommended.id)}
            >
              <Text style={styles.recommendButtonText}>
                {`${copy.recommendedToday} ${nextRecommended.title} (${nextRecommended.duration})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sosButton, { backgroundColor: colors.warning ?? "#DC2626" }]} onPress={handleSOS}>
              <Text style={styles.sosButtonText}>{copy.struggling}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionLead
          icon="list-outline"
          title={copy.sessions}
          subtitle={copy.roadmapSubtitle}
          tone="neutral"
          style={styles.sectionLead}
        />

        <View style={styles.sessionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.sessions}</Text>
          <TouchableOpacity
            style={[styles.sessionAction, { backgroundColor: `${colors.primary}22` }, !currentSessionId && styles.disabled]}
            disabled={!currentSessionId}
            onPress={handleResume}
          >
            <Text style={[styles.sessionActionText, { color: colors.primary }]}>{copy.continue}</Text>
          </TouchableOpacity>
        </View>

        {sessions.map((session) => {
          const isActive = currentSessionId === session.id;
          const isComplete = completedIds.includes(session.id);

          return (
            <View
              key={session.id}
              style={[
                styles.sessionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                isActive && { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              <View style={styles.sessionRow}>
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionTitle, { color: colors.text }]}>{session.title}</Text>
                  <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                    {`${session.duration} - ${session.steps.length} ${copy.step.toLowerCase()}`}
                  </Text>
                  <Text style={[styles.sessionDesc, { color: colors.textSecondary }]}>{session.description}</Text>

                  <View style={styles.sessionTags}>
                    {session.goals.map((goal) => (
                      <View key={goal} style={[styles.tag, { backgroundColor: `${colors.primary}14` }]}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>{goal}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.sessionStatus}>
                  <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                    {isComplete ? copy.statusComplete : isActive ? copy.statusInProgress : copy.statusNew}
                  </Text>

                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }, isComplete && [styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]]}
                    onPress={() => handleStart(session.id)}
                  >
                    <Text style={[styles.primaryButtonText, isComplete && { color: colors.text }]}> 
                      {isComplete ? copy.actionRestart : isActive ? copy.continue : copy.actionStart}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {currentSession ? (
          <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.currentSession}</Text>
            <Text style={[styles.stepTitle, { color: colors.primary }]}>
              {`${currentSession.title} - ${copy.step} ${currentStep + 1}/${currentSession.steps.length}`}
            </Text>

            <Text style={[styles.stepHeading, { color: colors.text }]}>{currentSession.steps[currentStep]?.title}</Text>
            <Text style={[styles.stepBody, { color: colors.textSecondary }]}>{currentSession.steps[currentStep]?.body}</Text>

            <View style={styles.stepActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={handleBackStep}
                disabled={currentStep === 0}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{t.back}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={handleReset}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{copy.actionRestart}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>
                  {currentStep + 1 >= currentSession.steps.length ? copy.complete : copy.next}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={showIntro && !loading}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIntro(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowIntro(false)}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>x</Text>
            </TouchableOpacity>

            <View style={[styles.modalIcon, { backgroundColor: `${colors.primary}1A` }]}>
              <Text style={[styles.modalIconEmoji, { color: colors.primary }]}>TH</Text>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{copy.roadmapTitle}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{copy.roadmapSubtitle}</Text>

            <View style={styles.modalList}>
              {copy.roadmapItems.map((item) => (
                <Text key={item} style={[styles.modalListItem, { color: colors.textSecondary }]}>{`- ${item}`}</Text>
              ))}
            </View>

            <TouchableOpacity style={[styles.modalNextBtn, { backgroundColor: colors.primary }]} onPress={() => setShowIntro(false)}>
              <Text style={styles.modalNextText}>{copy.startNow}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 24 },
  backBtn: { alignSelf: "flex-start" },
  backText: { fontSize: 16, fontFamily: Fonts.bodyMedium },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  focusLabel: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 14,
    letterSpacing: 0.4,
  },

  card: {
    borderRadius: Radius.xl,
    padding: 28,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  sectionLead: {
    marginBottom: 12,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: { fontSize: 24, fontFamily: Fonts.displayMedium },
  cardTitle: {
    fontSize: 20,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  cardText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: Fonts.body,
  },

  summaryCard: {
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTitle: { fontSize: 16, fontFamily: Fonts.bodySemiBold },
  summaryPercent: { fontSize: 15, fontFamily: Fonts.bodySemiBold },
  progressTrack: {
    height: 10,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: Radius.full },
  summaryHint: { marginTop: 10, fontSize: 12, fontFamily: Fonts.bodyMedium },
  summaryButtons: { marginTop: 14, gap: 12 },
  recommendButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
  },
  recommendButtonText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  sosButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  sosButtonText: { color: "#FFFFFF", fontFamily: Fonts.bodySemiBold, fontSize: 14 },

  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: -0.1,
  },
  sessionAction: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  sessionActionText: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },

  sessionCard: {
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
  },
  sessionRow: { flexDirection: "row", gap: 18 },
  sessionInfo: { flex: 1 },
  sessionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  sessionMeta: { fontSize: 13, marginBottom: 6, fontFamily: Fonts.body },
  sessionDesc: { fontSize: 14, marginBottom: 10, lineHeight: 20, fontFamily: Fonts.body },
  sessionTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: { fontSize: 11, fontFamily: Fonts.bodySemiBold },

  sessionStatus: { alignItems: "flex-end", gap: 10 },
  statusText: { fontSize: 12, fontFamily: Fonts.bodyMedium },

  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
  },
  primaryButtonText: { color: "#FFFFFF", fontFamily: Fonts.bodySemiBold, fontSize: 14 },

  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  secondaryButtonText: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },

  disabled: { opacity: 0.5 },

  stepCard: {
    borderRadius: Radius.lg,
    padding: 24,
    marginTop: 12,
    borderWidth: 1,
  },
  stepTitle: { fontSize: 14, fontFamily: Fonts.bodySemiBold, marginBottom: 8 },
  stepHeading: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  stepBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: Fonts.body,
  },
  stepActions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: Radius.xxl,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: { fontSize: 20, fontFamily: Fonts.bodySemiBold },
  modalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconEmoji: { fontSize: 24, fontFamily: Fonts.displayMedium },
  modalTitle: {
    fontSize: 22,
    fontFamily: Fonts.display,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
  modalList: { width: "100%", marginBottom: 24 },
  modalListItem: { fontSize: 14, marginBottom: 8, lineHeight: 20, fontFamily: Fonts.body },
  modalNextBtn: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: Radius.md,
    width: "100%",
    alignItems: "center",
  },
  modalNextText: { color: "#FFFFFF", fontSize: 17, fontFamily: Fonts.bodySemiBold },
});
