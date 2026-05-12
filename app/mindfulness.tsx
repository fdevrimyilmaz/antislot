import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { incrementSessionsCompleted } from "@/store/progressStore";
import { getPremiumState } from "@/store/premiumStore";
import {
  completeSession,
  getSessionState,
  setSessionStep,
  startSession,
} from "@/store/sessionStore";

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
    title: "Rehberli Nefes Sıfırlama",
    duration: "6 dk",
    description: "Zihin ve bedenini sakinleştirmek için kısa bir nefes seansı.",
    goals: ["Nefesi yavaşlat", "Duyguyu düzenle", "Dürtüyü yumuşat"],
    steps: [
      { title: "Duruş", body: "Omuzları gevşet, ayakları yere sabitle ve gözlerini yumuşat." },
      { title: "Nefes Ritmi", body: "4 saniye nefes al, 6 saniye ver. 2 dakika sürdür." },
      { title: "Beden Farkındalığı", body: "Göğüs ve karın hareketini gözlemle, düşünceleri yargısız bırak." },
      { title: "Kapanış", body: "Şu anki duygu puanını 1-10 arasında değerlendir." },
    ],
  },
  {
    id: "body-scan",
    title: "Beden Taraması",
    duration: "10 dk",
    description: "Bedenindeki gerginlikleri fark et ve gevşet.",
    goals: ["Kasları gevşet", "Stresi azalt", "Odaklanmayı güçlendir"],
    steps: [
      { title: "Başlangıç", body: "Derin bir nefes al ve bedenini taramaya başla." },
      { title: "Baş ve Boyun", body: "Alnını, çeneni ve omuzlarını gevşet. Gerginliği bırak." },
      { title: "Göğüs ve Karın", body: "Nefesin girdiği alanı hisset, yavaşça gevşet." },
      { title: "Kalça ve Bacaklar", body: "Bacaklarını zemine ağırlaştır, kasları serbest bırak." },
      { title: "Kapanış", body: "Bedenindeki en rahat bölgeyi not et." },
    ],
  },
  {
    id: "urge-surfing",
    title: "Dürtü Sörfü",
    duration: "8 dk",
    description: "Dürtüyü bastırmadan dalga gibi sürmeyi öğren.",
    goals: ["Dürtüyü adlandır", "Gözlem becerisini artır", "Yargısız kal"],
    steps: [
      { title: "Adlandır", body: "Şunu söyle: “Şu an bir dürtü hissediyorum.”" },
      { title: "Dalga Metaforu", body: "Dürtünün yükseldiğini, sonra azalacağını hayal et." },
      { title: "Nefese Dön", body: "Nefesi yavaşlat, 4-6 ritmi uygula." },
      { title: "Puana Bak", body: "Dürtü yoğunluğunu tekrar 1-10 arasında değerlendir." },
    ],
  },
  {
    id: "self-compassion",
    title: "Şefkatli Farkındalık",
    duration: "12 dk",
    description: "Kendine nazik bir iç ses geliştirmeyi hedefler.",
    goals: ["Suçluluk yerine şefkat", "İç konuşmayı yumuşat", "Motivasyonu artır"],
    isPremium: true,
    steps: [
      { title: "Niyet", body: "“Kendime nazik davranmayı seçiyorum.” cümlesini tekrarla." },
      { title: "Zor An", body: "Zor bir anı düşün ve bedenindeki tepkiyi gözlemle." },
      { title: "Şefkat Cümlesi", body: "“Bu zor, ama yalnız değilim.” cümlesini tekrarla." },
      { title: "Kapanış", body: "Bugün kendine yapabileceğin küçük bir iyilik seç." },
    ],
  },
  {
    id: "sleep-calm",
    title: "Uyku Öncesi Sakinleşme",
    duration: "9 dk",
    description: "Günün sonunda zihni yavaşlatmak için.",
    goals: ["Zihni sakinleştir", "Gece dürtülerini azalt", "Uykuya geçiş"],
    isPremium: true,
    steps: [
      { title: "Gün Özeti", body: "Bugünü tek bir cümleyle özetle." },
      { title: "Veda", body: "Bugünün zorlayıcı düşüncelerini bırakmaya niyet et." },
      { title: "Yavaş Nefes", body: "6 saniye nefes al, 6 saniye ver. 2 dakika devam et." },
      { title: "Rahatlama", body: "Kaslarını sırayla gevşet ve gözlerini kapat." },
    ],
  },
];

export default function Mindfulness() {
  const { colors } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [premiumActive, setPremiumActive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const state = await getSessionState("mindfulness");
        setCurrentSessionId(state.currentSessionId);
        setCurrentStepState(state.currentStep);
        setCompletedIds(state.completedSessionIds);
      } catch (error) {
        reportError(error, { scope: "mindfulness.load", level: "warning" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadPremium = useCallback(() => {
    let active = true;
    (async () => {
      try {
        const state = await getPremiumState();
        if (active) setPremiumActive(state.isActive);
      } catch (error) {
        reportError(error, { scope: "mindfulness.premium", level: "warning" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(loadPremium);

  const currentSession = useMemo(
    () => MINDFULNESS_SESSIONS.find((s) => s.id === currentSessionId) || null,
    [currentSessionId]
  );

  const handleStart = async (session: Session) => {
    if (session.isPremium && !premiumActive) {
      haptics.warning();
      Alert.alert(
        "Premium Gerekli",
        "Bu seans Premium kapsamındadır. Premium'a geçerek erişebilirsiniz.",
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Premium'a Git",
            onPress: () => {
              haptics.tapLight();
              router.push("/premium");
            },
          },
        ]
      );
      return;
    }
    haptics.tapMedium();
    try {
      const state = await startSession("mindfulness", session.id);
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
    } catch (error) {
      reportError(error, { scope: "mindfulness.start" });
      haptics.error();
      toast.error("Seans başlatılamadı.", "Hata");
    }
  };

  const handleNext = async () => {
    if (!currentSession) return;
    const nextStep = currentStep + 1;
    haptics.tapLight();
    try {
      if (nextStep >= currentSession.steps.length) {
        const state = await completeSession("mindfulness", currentSession.id);
        setCurrentSessionId(state.currentSessionId);
        setCurrentStepState(state.currentStep);
        setCompletedIds(state.completedSessionIds);
        await incrementSessionsCompleted();
        haptics.success();
        toast.success("Seans tamamlandı.", "Tamamlandı");
        return;
      }
      const state = await setSessionStep("mindfulness", currentSession.id, nextStep);
      setCurrentStepState(state.currentStep);
    } catch (error) {
      reportError(error, { scope: "mindfulness.next" });
    }
  };

  const handleBackStep = async () => {
    if (!currentSession || currentStep === 0) return;
    haptics.tapLight();
    try {
      const state = await setSessionStep(
        "mindfulness",
        currentSession.id,
        Math.max(0, currentStep - 1)
      );
      setCurrentStepState(state.currentStep);
    } catch (error) {
      reportError(error, { scope: "mindfulness.back" });
    }
  };

  const handleReset = async () => {
    if (!currentSession) return;
    haptics.warning();
    try {
      const state = await startSession("mindfulness", currentSession.id);
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
    } catch (error) {
      reportError(error, { scope: "mindfulness.reset" });
    }
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.text}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          <Card variant="hero" style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="leaf" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle} accessibilityRole="header">
                Farkındalık Seansları
              </Text>
              <Text style={styles.heroSubtitle}>
                Dürtüyü azaltmak ve duygusal dengeyi korumak için kısa pratikler.
              </Text>
            </View>
          </Card>

          <Card style={[styles.cardSpacing, styles.tipCard, { borderColor: `${colors.warning}55` }]}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={18} color={colors.warning} />
              <Text style={[styles.tipLabel, { color: colors.warning }]}>İpucu</Text>
            </View>
            <Text style={[styles.tipText, { color: colors.text }]}>
              Dürtü yükseldiğinde 10 yavaş nefes al. Dikkatini nefese ver ve isteğin geçmesine
              izin ver.
            </Text>
          </Card>

          {currentSession ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Aktif Seans"
                icon="play-circle"
                meta={`Adım ${currentStep + 1}/${currentSession.steps.length}`}
              />
              <Text style={[styles.activeSessionTitle, { color: colors.text }]}>
                {currentSession.title}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${((currentStep + 1) / currentSession.steps.length) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {currentSession.steps[currentStep]?.title}
              </Text>
              <Text style={[styles.stepBody, { color: colors.textMuted }]}>
                {currentSession.steps[currentStep]?.body}
              </Text>

              <View style={styles.stepActions}>
                <Button
                  title="Geri"
                  onPress={handleBackStep}
                  disabled={currentStep === 0}
                  variant="secondary"
                  leftIcon="chevron-back"
                />
                <Button
                  title="Yenile"
                  onPress={handleReset}
                  variant="secondary"
                  leftIcon="refresh"
                />
                <Button
                  title={
                    currentStep + 1 >= currentSession.steps.length ? "Tamamla" : "İleri"
                  }
                  onPress={handleNext}
                  variant="primary"
                  rightIcon={
                    currentStep + 1 >= currentSession.steps.length ? "checkmark" : "arrow-forward"
                  }
                  style={styles.nextBtn}
                />
              </View>
            </Card>
          ) : null}

          {MINDFULNESS_SESSIONS.map((session) => {
            const isActive = currentSessionId === session.id;
            const isComplete = completedIds.includes(session.id);
            const locked = session.isPremium && !premiumActive;
            const tone: "active" | "trial" | "neutral" | "inactive" = locked
              ? "inactive"
              : isComplete
              ? "active"
              : isActive
              ? "trial"
              : "neutral";
            const statusLabel = locked
              ? "Premium"
              : isComplete
              ? "Tamamlandı"
              : isActive
              ? "Devam ediyor"
              : "Yeni";
            const buttonLabel = locked
              ? "Premium ile Aç"
              : isComplete
              ? "Yeniden Başlat"
              : isActive
              ? "Devam Et"
              : "Başla";

            return (
              <Card key={session.id} style={styles.cardSpacing}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionTitleWrap}>
                    <Text
                      style={[styles.sessionTitle, { color: colors.text }]}
                      accessibilityRole="header"
                    >
                      {session.title}
                    </Text>
                    <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>
                      {session.duration} · {session.steps.length} adım
                    </Text>
                  </View>
                  <StatusBadge label={statusLabel} tone={tone} />
                </View>
                <Text style={[styles.sessionDesc, { color: colors.text }]}>
                  {session.description}
                </Text>
                <View style={styles.goalList}>
                  {session.goals.map((goal) => (
                    <View key={goal} style={styles.goalRow}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      <Text style={[styles.goalText, { color: colors.textMuted }]}>{goal}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  title={buttonLabel}
                  onPress={() => handleStart(session)}
                  disabled={loading}
                  variant={locked ? "gradient" : isComplete ? "secondary" : "primary"}
                  leftIcon={
                    locked
                      ? "lock-closed"
                      : isComplete
                      ? "refresh"
                      : isActive
                      ? "play"
                      : "play-circle"
                  }
                  fullWidth
                  style={styles.startBtn}
                />
              </Card>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backText: { fontSize: 17, fontWeight: "600" },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTextWrap: { flex: 1 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#FFFFFF",
    opacity: 0.92,
    fontSize: 13,
    lineHeight: 18,
  },
  cardSpacing: { marginBottom: 14 },
  tipCard: {
    borderWidth: 1,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  tipLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  tipText: { fontSize: 13, lineHeight: 18 },
  activeSessionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  stepBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  nextBtn: { flex: 1 },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  sessionTitleWrap: { flex: 1, minWidth: 0 },
  sessionTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 2,
  },
  sessionMeta: {
    fontSize: 12,
    fontWeight: "600",
  },
  sessionDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  goalList: { gap: 6, marginBottom: 12 },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  startBtn: { marginTop: 4 },
});
