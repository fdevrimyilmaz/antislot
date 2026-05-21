import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import {
  saveDiaryEntry,
  getTodayEntry,
  DiaryEntry,
  getDiaryEntries,
  deleteDiaryEntry,
} from "@/store/diaryStore";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Diary() {
  const { colors } = useTheme();
  const toast = useToast();

  const [diaryEntry, setDiaryEntry] = useState("");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEntries = async () => {
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
      reportError(error, { scope: "diary.load", level: "warning" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSave = async () => {
    const trimmed = diaryEntry.trim();
    if (!trimmed) {
      haptics.warning();
      toast.warning("Kaydetmeden önce bir şeyler yazın.", "Boş Kayıt");
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const entry: DiaryEntry = {
        id: entryId || `entry_${Date.now()}`,
        date: entryDate || today,
        content: trimmed,
        createdAt: Date.now(),
      };

      await saveDiaryEntry(entry);
      setEntryId(entry.id);
      setEntryDate(entry.date);
      const allEntries = await getDiaryEntries();
      setEntries(allEntries);
      haptics.success();
      toast.success("Günlük kaydınız güvenle kaydedildi.", "Kaydedildi");
    } catch (error) {
      reportError(error, { scope: "diary.save" });
      haptics.error();
      toast.error("Günlük kaydı kaydedilemedi.", "Hata");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const trimmed = diaryEntry.trim();
    if (!trimmed) {
      haptics.warning();
      toast.warning("Paylaşılacak bir şey yok.", "Boş Kayıt");
      return;
    }
    haptics.tapLight();
    try {
      await Share.share({ message: trimmed });
    } catch (error) {
      reportError(error, { scope: "diary.share", level: "warning" });
      toast.error("Kayıt paylaşılamadı.", "Hata");
    }
  };

  const handleNewEntry = () => {
    haptics.tapLight();
    setDiaryEntry("");
    setEntryId(null);
    setEntryDate(null);
  };

  const handleSelectEntry = (entry: DiaryEntry) => {
    haptics.selection();
    setDiaryEntry(entry.content);
    setEntryId(entry.id);
    setEntryDate(entry.date);
  };

  const handleDeleteEntry = (id: string) => {
    haptics.warning();
    Alert.alert("Kaydı Sil", "Bu kaydı silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDiaryEntry(id);
            const allEntries = await getDiaryEntries();
            setEntries(allEntries);
            if (entryId === id) {
              handleNewEntry();
            }
            haptics.success();
            toast.info("Kayıt silindi.");
          } catch (error) {
            reportError(error, { scope: "diary.delete" });
            haptics.error();
            toast.error("Kayıt silinemedi.", "Hata");
          }
        },
      },
    ]);
  };

  const isEditing = entryId !== null;
  const wordCount = diaryEntry.trim().length === 0 ? 0 : diaryEntry.trim().split(/\s+/).length;

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
          <View style={styles.headerRow}>
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
              <Text style={[styles.backButtonText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>

            {isEditing ? (
              <TouchableOpacity
                onPress={handleNewEntry}
                style={[styles.newEntryChip, { backgroundColor: colors.primary + "1A" }]}
                accessibilityRole="button"
                accessibilityLabel="Yeni günlük kaydı oluştur"
              >
                <Ionicons name="add" size={14} color={colors.primary} />
                <Text style={[styles.newEntryChipText, { color: colors.primary }]}>
                  Yeni Kayıt
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Card variant="hero" style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="journal" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle} accessibilityRole="header">
                Günlük
              </Text>
              <Text style={styles.heroSubtitle}>
                Düşüncelerinizi, dürtülerinizi ve ilerlemenizi takip edin. Tüm kayıtlar
                cihazınızda güvenle saklanır.
              </Text>
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title={isEditing ? "Kayıt Düzenleniyor" : "Yeni Kayıt"}
              icon="create"
              subtitle={
                isEditing && entryDate
                  ? `Tarih: ${formatDate(entryDate)}`
                  : "Bugünün düşüncelerini yazmaya başlayın."
              }
              meta={wordCount > 0 ? `${wordCount} kelime` : undefined}
            />
            <TextInput
              style={[
                styles.entryInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Düşünceleriniz, duygularınız ve deneyimleriniz hakkında yazın..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={10}
              value={diaryEntry}
              onChangeText={setDiaryEntry}
              textAlignVertical="top"
              editable={!loading && !saving}
              accessibilityLabel="Günlük metni"
            />

            <View style={styles.actionRow}>
              <Button
                title="Kaydet"
                onPress={handleSave}
                disabled={loading || saving || diaryEntry.trim().length === 0}
                loading={saving}
                variant="primary"
                leftIcon="checkmark"
                style={styles.actionPrimary}
              />
              <Button
                title="Paylaş"
                onPress={handleShare}
                disabled={loading || saving || diaryEntry.trim().length === 0}
                variant="secondary"
                leftIcon="share-outline"
              />
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Son Kayıtlar"
              icon="time"
              meta={entries.length > 0 ? `${entries.length} kayıt` : undefined}
            />

            {loading ? (
              <View style={styles.historyList}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.historyRow,
                      i < 2 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.historyInfo}>
                      <Skeleton width={120} height={12} />
                      <Skeleton width="90%" height={14} style={styles.skelGap} />
                      <Skeleton width="70%" height={14} style={styles.skelGap} />
                    </View>
                  </View>
                ))}
              </View>
            ) : entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="journal-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Henüz kayıt yok
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  İlk kaydınızı yukarıdan oluşturun.
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {entries.map((entry, index) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.historyRow,
                      index < entries.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.cardBorder,
                      },
                      entry.id === entryId && {
                        backgroundColor: `${colors.primary}0F`,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.historyInfo}
                      onPress={() => handleSelectEntry(entry)}
                      accessibilityRole="button"
                      accessibilityLabel={`${formatDate(entry.date)} kaydını aç`}
                    >
                      <Text style={[styles.historyDate, { color: colors.primary }]}>
                        {formatDate(entry.date)}
                      </Text>
                      <Text
                        style={[styles.historyPreview, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {entry.content}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteEntry(entry.id)}
                      style={styles.deleteBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`${formatDate(entry.date)} kaydını sil`}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  newEntryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newEntryChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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
  cardSpacing: {
    marginBottom: 14,
  },
  entryInput: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    minHeight: 180,
    borderWidth: 1,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionPrimary: {
    flex: 1,
  },
  historyList: {
    width: "100%",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 10,
    borderRadius: 8,
  },
  historyInfo: {
    flex: 1,
    minWidth: 0,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  historyPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyHint: {
    fontSize: 13,
    textAlign: "center",
  },
  skelGap: {
    marginTop: 6,
  },
});
