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
import { incrementSessionsCompleted } from "@/store/progressStore";
import { getPremiumState } from "@/store/premiumStore";
import { completeSession, getSessionState, setSessionStep, startSession } from "@/store/sessionStore";

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

const MINDFULNESS_FOCUS_COPY = {
  title: "Farkındalık odağı",
  description: "Dürtüyü azaltmak ve duygusal dengeyi korumak için kısa pratikler.",
};

export default function Mindfulness() {
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [premiumActive, setPremiumActive] = useState(false);

  useEffect(() => {
    (async () => {
      const state = await getSessionState("mindfulness");
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
      setCompletedIds(state.completedSessionIds);
      setLoading(false);
    })();
  }, []);

  const loadPremium = useCallback(() => {
    let active = true;
    (async () => {
      const state = await getPremiumState();
      if (active) setPremiumActive(state.isActive);
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
      Alert.alert(
        "Premium gerekli",
        "Bu seans Premium kapsamındadır. Premium'a geçerek erişebilirsiniz.",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Premium'a Git", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    const state = await startSession("mindfulness", session.id);
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
      const state = await completeSession("mindfulness", currentSession.id);
      setCurrentSessionId(state.currentSessionId);
      setCurrentStepState(state.currentStep);
      setCompletedIds(state.completedSessionIds);
      await incrementSessionsCompleted();
      return;
    }
    const state = await setSessionStep("mindfulness", currentSession.id, nextStep);
    setCurrentStepState(state.currentStep);
  };

  const handleBackStep = async () => {
    if (!currentSession) return;
    const nextStep = Math.max(0, currentStep - 1);
    const state = await setSessionStep("mindfulness", currentSession.id, nextStep);
    setCurrentStepState(state.currentStep);
  };

  const handleReset = async () => {
    if (!currentSession) return;
    const state = await startSession("mindfulness", currentSession.id);
    setCurrentSessionId(state.currentSessionId);
    setCurrentStepState(state.currentStep);
  };

  const focusCopy = MINDFULNESS_FOCUS_COPY;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Farkındalık Seansları</Text>
        <Text style={styles.focusLabel}>{focusCopy.title}</Text>

        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🧘</Text>
          </View>
          <Text style={styles.cardTitle}>Farkındalık Uygula</Text>
          <Text style={styles.cardText}>{focusCopy.description}</Text>
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipLabel}>İpucu:</Text>
          <Text style={styles.tipText}>
            Dürtü yükseldiğinde 10 yavaş nefes al. Dikkatini nefese ver ve isteğin geçmesine izin ver.
          </Text>
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

        {MINDFULNESS_SESSIONS.map((session) => {
          const isActive = currentSessionId === session.id;
          const isComplete = completedIds.includes(session.id);
          const locked = session.isPremium && !premiumActive;
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
                  <Text style={styles.statusText}>
                    {locked ? "Premium" : isComplete ? "Tamamlandı" : isActive ? "Devam ediyor" : "Yeni"}
                  </Text>
                  <TouchableOpacity
                    style={[locked ? styles.secondaryButton : styles.primaryButton, locked && styles.lockedButton]}
                    onPress={() => handleStart(session)}
                  >
                    <Text style={locked ? styles.secondaryButtonText : styles.primaryButtonText}>
                      {locked ? "Kilidi Aç" : isComplete ? "Yeniden Başlat" : isActive ? "Devam Et" : "Başla"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {currentSession && !loading ? (
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
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowIntro(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.modalIcon}>
              <Text style={styles.modalIconEmoji}>🧘</Text>
            </View>

            <Text style={styles.modalTitle}>Farkındalık Yol Haritası</Text>
            <Text style={styles.modalSubtitle}>
              Kısa seanslarla nefes, beden farkındalığı ve dürtü yönetimine odaklan.
            </Text>

            <View style={styles.modalList}>
              <Text style={styles.modalListItem}>• Rehberli nefes ile başlayın</Text>
              <Text style={styles.modalListItem}>• Dürtü sörfü ile güçlenin</Text>
              <Text style={styles.modalListItem}>• Beden taramasıyla gevşeyin</Text>
              <Text style={styles.modalListItem}>• Premium seanslarla derinleşin</Text>
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: { fontSize: 46 },
  cardTitle: { fontSize: 20, fontWeight: "800", marginBottom: 10, color: "#222" },
  cardText: { fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22 },
  tipBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#1D4C72",
  },
  tipLabel: { fontSize: 16, fontWeight: "800", marginBottom: 8, color: "#1D4C72" },
  tipText: { fontSize: 15, color: "#333", lineHeight: 22 },
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
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconEmoji: { fontSize: 54 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#1D4C72", marginBottom: 8 },
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
