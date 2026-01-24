import { router } from "expo-router";
import React, { useState } from "react";
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
import { useProgressStore } from "@/store/progressStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";
import { useUser } from "@/contexts/UserContext";

// Progress shows per-addiction metrics and reset actions.

export default function Progress() {
  const [showIntro, setShowIntro] = useState(true);
  const { userAddictions, hydrated } = useUserAddictionsStore();
  const { uid } = useUser();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const resetProgress = useProgressStore((state) => state.reset);
  const progressHydrated = useProgressStore((state) => state.hydrated);

  const handleReset = () => {
    if (!uid) {
      Alert.alert("Hata", "Kullanıcı bulunamadı.");
      return;
    }
    Alert.alert("İlerlemeyi Sıfırla", "Bu işlem seçili bağımlılık sayacını sıfırlar.", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sıfırla",
        style: "destructive",
        onPress: () => resetProgress(uid),
      },
    ]);
  };

  if (!hydrated || !progressHydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <Text>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>İlerleme</Text>
        <Text style={styles.subtitle}>Kumar için ilerlemeyi takip et.</Text>

        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🏆</Text>
          </View>
          <Text style={styles.cardTitle}>Yolculuğunuzu İzleyin</Text>
          <Text style={styles.cardText}>
            Seçtiğiniz bağımlılıkların her biri için ayrı ilerleme kartlarıyla motivasyonunuzu
            koruyun ve gelişiminizi görün.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kumar İlerlemesi</Text>
          {!userAddictions.gambling ? (
            <Text style={styles.emptyText}>Henüz seçim yok.</Text>
          ) : (
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <View>
                  <Text style={styles.progressTitle}>Kumar</Text>
                  <Text style={styles.progressLabel}>Temiz Gün</Text>
                </View>
                <Text style={styles.progressValue}>{gamblingFreeDays}</Text>
              </View>
              <TouchableOpacity style={styles.progressResetBtn} onPress={handleReset}>
                <Text style={styles.resetText}>Sıfırla</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Giriş Modali */}
      <Modal
        visible={showIntro}
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
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.modalIcon}>
              <Text style={styles.modalIconEmoji}>🏆</Text>
            </View>

            <Text style={styles.modalTitle}>İlerleme</Text>
            <Text style={styles.modalSubtitle}>Bağımlılık bazında ilerleme kartları</Text>

            <Text style={styles.modalDescription}>
              Seçtiğiniz bağımlılıkların her biri için ayrı metrikler göreceksiniz. Bu kartlar
              motivasyonunuzu takip etmenize yardımcı olur.
            </Text>

            <View style={styles.modalTip}>
              <Text style={styles.modalTipLabel}>İpucu:</Text>
              <Text style={styles.modalTipText}>
                Gelişiminizi destek ağınızla paylaşmak motive edici olabilir.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalNextBtn}
              onPress={() => setShowIntro(false)}
            >
              <Text style={styles.modalNextText}>İleri →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F9FF",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 16,
    color: "#1D4C72",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
    color: "#222",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF9E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 50,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    color: "#222",
    textAlign: "center",
  },
  cardText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
  },
  tipBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#1D4C72",
  },
  tipLabel: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
    color: "#1D4C72",
  },
  tipText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1D4C72",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  reviewBtn: {
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flex: 1,
  },
  reviewText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1D4C72",
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTitle: { fontSize: 15, fontWeight: "800", color: "#222" },
  progressLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  progressValue: { fontSize: 28, fontWeight: "900", color: "#1D4C72" },
  progressHint: { fontSize: 12, color: "#777", marginTop: 10 },
  emptyText: { fontSize: 13, color: "#999", fontStyle: "italic" },
  progressResetBtn: {
    backgroundColor: "#D06B5C",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: { fontSize: 14, color: "#666" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#222" },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  secondaryBtn: {
    backgroundColor: "#E8F0F8",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryText: { color: "#1D4C72", fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  resetBtn: {
    backgroundColor: "#D06B5C",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flex: 1,
  },
  resetText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  // Modal stilleri
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
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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
  closeText: {
    fontSize: 24,
    color: "#999",
    fontWeight: "300",
  },
  modalIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF9E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconEmoji: {
    fontSize: 60,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1D4C72",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
    marginBottom: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  modalTip: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 24,
  },
  modalTipLabel: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
    color: "#1D4C72",
  },
  modalTipText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  modalNextBtn: {
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  modalNextText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
