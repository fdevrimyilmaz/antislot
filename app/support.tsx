import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SupportResource = {
  id: string;
  category: string;
  title: string;
  description: string;
  phone?: string;
  website?: string;
};

const RESOURCES: SupportResource[] = [
  {
    id: "gambling-ncpg",
    category: "Kumar Desteği",
    title: "Ulusal Problemli Kumar Konseyi",
    description: "Kumar bağımlılığından iyileşme için yardım hattı ve kaynaklar.",
    phone: "18005224700",
    website: "https://www.ncpgambling.org",
  },
  {
    id: "gamblers-anon",
    category: "Kumar Desteği",
    title: "Kumarbazlar Anonim",
    description: "Akran destek toplantıları ve iyileşme topluluğu.",
    website: "https://www.gamblersanonymous.org",
  },
  {
    id: "mental-988",
    category: "Ruh Sağlığı",
    title: "İntihar ve Kriz Destek Hattı",
    description: "Telefon veya mesajla 7/24 kriz desteği.",
    phone: "988",
    website: "https://988lifeline.org",
  },
  {
    id: "crisis-text",
    category: "Ruh Sağlığı",
    title: "Kriz SMS Hattı",
    description: "Kriz anlarında mesajla destek.",
    website: "https://www.crisistextline.org",
  },
  {
    id: "nfcc",
    category: "Finansal Destek",
    title: "Ulusal Kredi Danışmanlığı Vakfı",
    description: "Bütçe planlama ve borç desteği.",
    website: "https://www.nfcc.org",
  },
  {
    id: "hud",
    category: "Barınma Desteği",
    title: "HUD Barınma Kaynakları",
    description: "Barınma desteği ve yerel programlar.",
    website: "https://www.hud.gov/topics/housing_assistance",
  },
  {
    id: "community",
    category: "Topluluk",
    title: "Akran Destek Topluluğu",
    description: "Denetlenen iyileşme sohbetlerine katılın.",
    website: "https://www.recovery.org",
  },
];

export default function Support() {
  const [showIntro, setShowIntro] = useState(true);
  const [query, setQuery] = useState("");

  const filteredResources = useMemo(() => {
    if (!query.trim()) return RESOURCES;
    const q = query.toLowerCase();
    return RESOURCES.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Destek Ağı</Text>
        <Text style={styles.subtitle}>Kumar bağımlılığından iyileşme ve iyi oluş için güvenilir kaynaklar.</Text>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
              placeholder="Destek kaynaklarında ara..."
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {filteredResources.map((resource) => (
          <View key={resource.id} style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <View>
                <Text style={styles.resourceCategory}>{resource.category}</Text>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
              </View>
            </View>
            <Text style={styles.resourceDescription}>{resource.description}</Text>
            <View style={styles.resourceActions}>
              {resource.phone && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => Linking.openURL(`tel:${resource.phone}`)}
                >
                  <Text style={styles.primaryButtonText}>Ara</Text>
                </TouchableOpacity>
              )}
              {resource.website && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    const website = resource.website;
                    if (website) {
                      Linking.openURL(website);
                    }
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Web Sitesi</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showIntro}
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
              <Text style={styles.modalIconEmoji}>💙</Text>
            </View>

            <Text style={styles.modalTitle}>Destek Haritası</Text>
            <Text style={styles.modalSubtitle}>
              Kumar bağımlılığından iyileşme, ruh sağlığı, finans ve barınma için doğru desteği bulun.
            </Text>

            <TouchableOpacity style={styles.modalNextBtn} onPress={() => setShowIntro(false)}>
              <Text style={styles.modalNextText}>Kaynakları Göster</Text>
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
  title: { fontSize: 28, fontWeight: "900", marginBottom: 6, color: "#222" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 16 },
  searchBox: { marginBottom: 16 },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  resourceCard: {
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
  resourceHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  resourceCategory: { fontSize: 12, color: "#7B6CCC", fontWeight: "700" },
  resourceTitle: { fontSize: 16, fontWeight: "800", color: "#222" },
  resourceDescription: { fontSize: 14, color: "#555", marginBottom: 12, lineHeight: 20 },
  resourceActions: { flexDirection: "row", gap: 10 },
  primaryButton: {
    backgroundColor: "#7B6CCC",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#E8E3FF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#7B6CCC", fontWeight: "700" },
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
    backgroundColor: "#E8E3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconEmoji: { fontSize: 54 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#7B6CCC", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 16 },
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
