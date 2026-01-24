import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  saveDiaryEntry,
  getTodayEntry,
  DiaryEntry,
  getDiaryEntries,
  deleteDiaryEntry,
} from "@/store/diaryStore";

export default function Diary() {
  const [showIntro, setShowIntro] = useState(true);
  const [diaryEntry, setDiaryEntry] = useState("");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayEntry();
  }, []);

  const loadTodayEntry = async () => {
    try {
      const today = await getTodayEntry();
      if (today) {
        setDiaryEntry(today.content);
        setEntryId(today.id);
        setEntryDate(today.date);
      }
      const allEntries = await getDiaryEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error("Günlük kaydı yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!diaryEntry.trim()) {
      Alert.alert("Boş Kayıt", "Kaydetmeden önce bir şeyler yazın.");
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const entry: DiaryEntry = {
        id: entryId || `entry_${Date.now()}`,
        date: entryDate || today,
        content: diaryEntry.trim(),
        createdAt: entryId ? Date.now() : Date.now(),
      };

      await saveDiaryEntry(entry);
      setEntryId(entry.id);
      setEntryDate(entry.date);
      const allEntries = await getDiaryEntries();
      setEntries(allEntries);
      Alert.alert("Kaydedildi", "Günlük kaydınız kaydedildi.");
    } catch (error) {
      Alert.alert("Hata", "Günlük kaydı kaydedilemedi.");
      console.error(error);
    }
  };

  const handleShare = async () => {
    if (!diaryEntry.trim()) {
      Alert.alert("Boş Kayıt", "Paylaşılacak bir şey yok.");
      return;
    }
    try {
      await Share.share({
        message: diaryEntry.trim(),
      });
    } catch {
      Alert.alert("Hata", "Kayıt paylaşılamadı.");
    }
  };

  const handleNewEntry = () => {
    setDiaryEntry("");
    setEntryId(null);
    setEntryDate(null);
  };

  const handleSelectEntry = (entry: DiaryEntry) => {
    setDiaryEntry(entry.content);
    setEntryId(entry.id);
    setEntryDate(entry.date);
  };

  const handleDeleteEntry = async (id: string) => {
    Alert.alert("Kaydı Sil", "Bu kaydı silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await deleteDiaryEntry(id);
          const allEntries = await getDiaryEntries();
          setEntries(allEntries);
          if (entryId === id) {
            handleNewEntry();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>📅</Text>
        </View>

        <Text style={styles.title}>Günlük</Text>
        <Text style={styles.subtitle}>Özel Günlüğünüz</Text>

        <Text style={styles.description}>
          Her gün kontrol ederek kumar davranışlarınızı, dürtülerinizi ve isteklerinizi gözden
          geçirin. Günlük kayıtlarınız duygusal kalıpları ve tetikleyicileri takip etmenize
          yardımcı olur ve ilerlemenize dair içgörüler sunar.
        </Text>

        <Text style={styles.reminder}>
          Günlüğünüzü ne kadar çok kullanırsanız, süreçteki içgörüler o kadar artar.
        </Text>

        <View style={styles.entryContainer}>
          <Text style={styles.entryLabel}>
            {entryId ? "Kayıt Düzenleniyor" : "İlk kaydınıza yukarıdan başlayın!"}
          </Text>
          <TextInput
            style={styles.entryInput}
            placeholder="Düşünceleriniz, duygularınız ve deneyimleriniz hakkında yazın..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={8}
            value={diaryEntry}
            onChangeText={setDiaryEntry}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.shareBtn}
            onPress={handleShare}
            disabled={loading}
          >
            <Text style={styles.shareText}>Paylaş</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.editText}>Kaydet</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.newBtn}
            onPress={handleNewEntry}
            disabled={loading}
          >
            <Text style={styles.newText}>Yeni</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Son Kayıtlar</Text>
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>Henüz kayıt yok.</Text>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={styles.historyCard}>
                <TouchableOpacity onPress={() => handleSelectEntry(entry)}>
                  <Text style={styles.historyDate}>{entry.date}</Text>
                  <Text style={styles.historyPreview} numberOfLines={2}>
                    {entry.content}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Sil</Text>
                </TouchableOpacity>
              </View>
            ))
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
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconEmoji}>📅</Text>
            </View>

            <Text style={styles.modalTitle}>Günlük</Text>
            <Text style={styles.modalSubtitle}>
              Özel Günlüğünüz
            </Text>

            <Text style={styles.modalDescription}>
              Her gün kontrol ederek kumar davranışlarınızı, dürtülerinizi ve isteklerinizi gözden
              geçirin. Günlük kayıtlarınız duygusal kalıpları ve tetikleyicileri takip etmenize
              yardımcı olur ve ilerlemenize dair içgörüler sunar.
            </Text>

            <Text style={styles.modalReminder}>
              Günlüğünüzü ne kadar çok kullanırsanız, süreçteki içgörüler o kadar artar.
            </Text>

            <Text style={styles.modalCTA}>
              İlk kaydınıza yukarıdan başlayın!
            </Text>

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={styles.modalShareBtn}
                onPress={() => setShowIntro(false)}
              >
                <Text style={styles.modalShareText}>Paylaş</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalEditBtn}
                onPress={() => setShowIntro(false)}
              >
                <Text style={styles.modalEditText}>Düzenle</Text>
              </TouchableOpacity>
            </View>
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
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "center",
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1E7A55",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  reminder: {
    fontSize: 15,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 24,
    textAlign: "center",
  },
  entryContainer: {
    marginBottom: 24,
  },
  entryLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E7A55",
    marginBottom: 12,
  },
  entryInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    minHeight: 200,
    fontSize: 16,
    color: "#222",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: "#4A4A4A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  shareText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#4A4A4A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  editText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  newBtn: {
    flex: 1,
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  newText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E7A55",
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  historyDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "600",
  },
  historyPreview: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  deleteBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#D06B5C",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
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
  modalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconEmoji: {
    fontSize: 50,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1E7A55",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 20,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 12,
  },
  modalReminder: {
    fontSize: 15,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 16,
  },
  modalCTA: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E7A55",
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtonGroup: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalShareBtn: {
    flex: 1,
    backgroundColor: "#4A4A4A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalShareText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  modalEditBtn: {
    flex: 1,
    backgroundColor: "#4A4A4A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalEditText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
