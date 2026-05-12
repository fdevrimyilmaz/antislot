import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
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
import {
  completeSession,
  getSessionState,
  setSessionStep,
  startSession,
} from "@/store/sessionStore";
import { incrementSessionsCompleted } from "@/store/progressStore";

type Session = {
  id: string;
  title: string;
  duration: string;
  description: string;
  goals: string[];
  steps: { title: string; body: string }[];
};

const THERAPY_SESSIONS: Session[] = [
  {
    id: "cbt-foundations",
    title: "BDT Temelleri",
    duration: "15 dk",
    description:
      "Düşünce, duygu ve davranışların kumar dürtüleriyle nasıl bağlantılı olduğunu öğrenin.",
    goals: [
      "Yaygın düşünce tuzaklarını belirleyin",
      "Tetikleyicileri ve tepkileri haritalayın",
      "3 dakikalık bir sıfırlama uygulayın",
    ],
    steps: [
      { title: "Durum Kontrolü", body: "Dürtünüzü 1-10 arasında puanlayın ve ana tetikleyiciyi adlandırın." },
      { title: "Düşünce Tuzağı", body: "Dürtüyü tetikleyen düşünceyi yazın. Örnek: Kaybettiklerimi geri kazanabilirim." },
      { title: "Gerçeklik Kontrolü", body: "Bu düşüncenin doğru olmadığını gösteren iki neden yazın." },
      { title: "Yerine Koyma", body: "İnanabileceğiniz dengeli bir ifadeyle değiştirin." },
      { title: "Eylem Planı", body: "Önümüzdeki 10 dakika içinde yapacağınız bir sağlıklı eylem seçin." },
    ],
  },
  {
    id: "urge-surfing",
    title: "Dürtü Sörfü",
    duration: "10 dk",
    description: "Dürtüyü bir dalga gibi, ona kapılmadan sürün.",
    goals: ["Bedensel duyumları fark edin", "Nefes ritmini uygulayın", "Dürtünün yükselip sönmesine izin verin"],
    steps: [
      { title: "Yerleşin", body: "Rahatça oturun ve dürtüyü nerede hissettiğinizi fark edin." },
      { title: "Adlandırın", body: "Şunu söyleyin: Bu bir dürtü. Yükselip azalacak." },
      { title: "Nefes Al", body: "4 saniye nefes al, 6 saniye ver. 2 dakika boyunca tekrarla." },
      { title: "Gözlemle", body: "Dürtünün değişimini izle. Tekrar 1-10 arası puanla." },
      { title: "Bırak", body: "Ayrılmadan önce bir topraklama eylemi seç." },
    ],
  },
  {
    id: "relapse-prevention",
    title: "Nüks Önleme",
    duration: "20 dk",
    description: "Yüksek riskli durumlar ve erken uyarı işaretleri için bir plan oluşturun.",
    goals: ["Kırmızı bayrakları fark edin", "Güvenlik planı oluşturun", "Destek kişilerini belirleyin"],
    steps: [
      { title: "Uyarı İşaretleri", body: "Kaymaya başladığınızı gösteren 3 erken işaret yazın." },
      { title: "Yüksek Riskli Durumlar", body: "Sizi tetikleyen en önemli 2 durumu yazın." },
      { title: "Baş Etme Planı", body: "Her durum için bir baş etme aracı belirleyin." },
      { title: "Destek", body: "Dürtüler artarsa kiminle iletişime geçeceğinizi yazın." },
      { title: "Taahhüt", body: "Bu hafta için kendinize bir söz yazın." },
    ],
  },
  {
    id: "values-reset",
    title: "Değerleri Yeniden Hatırlama",
    duration: "12 dk",
    description: "Motivasyonunuzu korumak için değerlerinizle yeniden bağ kurun.",
    goals: ["Neyin önemli olduğunu netleştirin", "Değerleri hedeflere bağlayın", "Günlük bir hatırlatıcı belirleyin"],
    steps: [
      { title: "Değerler", body: "Bugün en çok önem verdiğiniz 3 değeri seçin." },
      { title: "Neden", body: "Her değerin sizin için neden önemli olduğunu yazın." },
      { title: "Günlük Eylem", body: "Her değerle uyumlu bir eylem seçin." },
      { title: "Hatırlatıcı", body: "Tekrarlayabileceğiniz bir hatırlatıcı cümle belirleyin." },
    ],
  },
];

export default function Therapy() {
  const { colors } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const state = await getSessionState("therapy");
        setCurrentSessionId(state.currentSessionId);
        setCurrentStepState(state.currentStep);
        setCompletedIds(state.completedSessionIds);
      } catch (error) {
        reportError(error, { scope: "therapy.load", level: "warning" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentSession = useMemo(
    () => THERAPY_SESSIONS.find((s) => s.id === currentSessionId) || null,
    [currentSessionId]
  );

  const handleStart = async (sessionId: string) => {
    haptics.tapMedium();
    try {
      const state = await startSession("therapy", sessionId);
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
    } catch (error) {
      reportError(error, { scope: "therapy.start" });
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
        const state = await completeSession("therapy", currentSession.id);
        setCurrentSessionId(state.currentSessionId);
        setCurrentStepState(state.currentStep);
        setCompletedIds(state.completedSessionIds);
        await incrementSessionsCompleted();
        haptics.success();
        toast.success("Seans tamamlandı. Harika iş!", "Tamamlandı");
        return;
      }
      const state = await setSessionStep("therapy", currentSession.id, nextStep);
      setCurrentStepState(state.currentStep);
    } catch (error) {
      reportError(error, { scope: "therapy.next" });
    }
  };

  const handleBackStep = async () => {
    if (!currentSession || currentStep === 0) return;
    haptics.tapLight();
    try {
      const state = await setSessionStep("therapy", currentSession.id, Math.max(0, currentStep - 1));
      setCurrentStepState(state.currentStep);
    } catch (error) {
      reportError(error, { scope: "therapy.back" });
    }
  };

  const handleReset = async () => {
    if (!currentSession) return;
    haptics.warning();
    try {
      const state = await startSession("therapy", currentSession.id);
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
    } catch (error) {
      reportError(error, { scope: "therapy.reset" });
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
              <Ionicons name="bulb" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle} accessibilityRole="header">
                Terapi Seansları
              </Text>
              <Text style={styles.heroSubtitle}>
                Kumar dürtüsüyle başa çıkmak için yapılandırılmış, kısa rehberli adımlar.
              </Text>
            </View>
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
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.cardBorder },
                ]}
              >
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
                    currentStep + 1 >= currentSession.steps.length
                      ? "checkmark"
                      : "arrow-forward"
                  }
                  style={styles.nextBtn}
                />
              </View>
            </Card>
          ) : null}

          <View style={styles.sessionList}>
            {THERAPY_SESSIONS.map((session) => {
              const isActive = currentSessionId === session.id;
              const isComplete = completedIds.includes(session.id);
              const tone: "active" | "trial" | "neutral" = isComplete
                ? "active"
                : isActive
                ? "trial"
                : "neutral";
              const statusLabel = isComplete
                ? "Tamamlandı"
                : isActive
                ? "Devam ediyor"
                : "Yeni";
              const buttonLabel = isComplete
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
                        <Text style={[styles.goalText, { color: colors.textMuted }]}>
                          {goal}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Button
                    title={buttonLabel}
                    onPress={() => handleStart(session.id)}
                    disabled={loading}
                    variant={isComplete ? "secondary" : "primary"}
                    leftIcon={isComplete ? "refresh" : isActive ? "play" : "play-circle"}
                    fullWidth
                    style={styles.startBtn}
                  />
                </Card>
              );
            })}
          </View>
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
  sessionList: {},
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
