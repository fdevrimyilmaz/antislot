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
import { completeSession, getSessionState, setSessionStep, startSession } from "@/store/sessionStore";
import { incrementSessionsCompleted } from "@/store/progressStore";
// Therapy content focuses on gambling.

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
    description: "Düşünce, duygu ve davranışların kumar dürtüleriyle nasıl bağlantılı olduğunu öğrenin.",
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

const THERAPY_FOCUS_COPY = {
  title: "Kumar odağı",
  description: "Kumar dürtüsüyle başa çıkmak için yapılandırılmış terapi adımlarını takip edin.",
};

export default function Therapy() {
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
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
    () => THERAPY_SESSIONS.find((s) => s.id === currentSessionId) || null,
    [currentSessionId]
  );
  const focusCopy = THERAPY_FOCUS_COPY;

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Terapi Seansları</Text>
        <Text style={styles.focusLabel}>{focusCopy.title}</Text>

        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🧠</Text>
          </View>
          <Text style={styles.cardTitle}>Yapılandırılmış Terapi Planı</Text>
          <Text style={styles.cardText}>{focusCopy.description}</Text>
        </View>

        <View style={styles.sessionHeader}>
          <Text style={styles.sectionTitle}>Seanslarınız</Text>
          <TouchableOpacity
            style={[styles.sessionAction, !currentSessionId && styles.disabled]}
            disabled={!currentSessionId}
            onPress={handleResume}
          >
            <Text style={styles.sessionActionText}>Devam Et</Text>
          </TouchableOpacity>
        </View>

        {THERAPY_SESSIONS.map((session) => {
          const isActive = currentSessionId === session.id;
          const isComplete = completedIds.includes(session.id);
          return (
            <View key={session.id} style={[styles.sessionCard, isActive && styles.sessionCardActive]}>
              <View style={styles.sessionRow}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.sessionMeta}>{session.duration} • {session.steps.length} adım</Text>
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
                  <Text style={styles.statusText}>{isComplete ? "Tamamlandı" : isActive ? "Devam ediyor" : "Yeni"}</Text>
                  <TouchableOpacity
                    style={[styles.primaryButton, isComplete && styles.secondaryButton]}
                    onPress={() => handleStart(session.id)}
                  >
                    <Text style={[styles.primaryButtonText, isComplete && styles.secondaryButtonText]}>
                      {isComplete ? "Yeniden Başlat" : isActive ? "Devam Et" : "Başla"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {currentSession && (
          <View style={styles.stepCard}>
            <Text style={styles.sectionTitle}>Geçerli Seans</Text>
            <Text style={styles.stepTitle}>
              {currentSession.title} • Adım {currentStep + 1}/{currentSession.steps.length}
            </Text>
            <Text style={styles.stepHeading}>{currentSession.steps[currentStep]?.title}</Text>
            <Text style={styles.stepBody}>{currentSession.steps[currentStep]?.body}</Text>
            <View style={styles.stepActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleBackStep} disabled={currentStep === 0}>
                <Text style={styles.secondaryButtonText}>Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
                <Text style={styles.secondaryButtonText}>Yeniden Başlat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>
                  {currentStep + 1 >= currentSession.steps.length ? "Tamamla" : "İleri"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showIntro && !loading}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIntro(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowIntro(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.modalIcon}>
              <Text style={styles.modalIconEmoji}>🧠</Text>
            </View>

            <Text style={styles.modalTitle}>Terapi Yol Haritası</Text>
            <Text style={styles.modalSubtitle}>{focusCopy.title} • Kısa, rehberli seanslar.</Text>

            <View style={styles.modalList}>
              <Text style={styles.modalListItem}>• BDT Temelleri ile başlayın</Text>
              <Text style={styles.modalListItem}>• Dürtü Sörfü&apos;nü her gün uygulayın</Text>
              <Text style={styles.modalListItem}>• Nüks Önleme planınızı oluşturun</Text>
              <Text style={styles.modalListItem}>• Değerleri Yeniden Hatırlama&apos;yı haftalık gözden geçirin</Text>
            </View>

            <TouchableOpacity style={styles.modalNextBtn} onPress={() => setShowIntro(false)}>
              <Text style={styles.modalNextText}>Şimdi Başla</Text>
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
  focusLabel: { fontSize: 14, fontWeight: "700", color: "#666", marginBottom: 12 },
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
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: { fontSize: 42 },
  cardTitle: { fontSize: 20, fontWeight: "800", marginBottom: 10, color: "#222" },
  cardText: { fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22 },
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
  sessionTitle: { fontSize: 16, fontWeight: "800", color: "#222", marginBottom: 4 },
  sessionMeta: { fontSize: 13, color: "#666", marginBottom: 6 },
  sessionDesc: { fontSize: 14, color: "#444", marginBottom: 8 },
  sessionTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: "#E8F0F8", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
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
  stepTitle: { fontSize: 14, fontWeight: "700", color: "#1D4C72", marginBottom: 6 },
  stepHeading: { fontSize: 18, fontWeight: "800", color: "#222", marginBottom: 8 },
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
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconEmoji: { fontSize: 54 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#FF9800", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 16 },
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
