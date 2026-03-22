import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ScreenHero } from "@/components/ui/screen-hero";
import { SectionLead } from "@/components/ui/section-lead";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  syncDiaryWithServer,
  DiaryEntry,
  deleteDiaryEntry,
  getDiaryEntries,
  getLocalDateKey,
  getTodayEntry,
  saveDiaryEntry,
} from "@/store/diaryStore";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

const DIARY_COPY = {
  tr: {
    title: "Gunluk",
    subtitle: "Kisisel kayitlarin",
    description:
      "Gunluk kayitlar, tetikleyicileri ve duygusal donguleri fark etmeni kolaylastirir.",
    tip: "Kisa notlar bile ilerlemeyi gorunur hale getirir.",
    entryNew: "Bugun icin ilk notun",
    entryEditing: "Kayit duzenleniyor",
    entryDatePrefix: "Tarih",
    inputPlaceholder:
      "Dusunceler, hisler ve bugunku deneyiminle ilgili notlarini yaz...",
    share: "Paylas",
    save: "Kaydet",
    newEntry: "Yeni",
    historyTitle: "Son Kayitlar",
    emptyHistory: "Henuz kayit yok.",
    delete: "Sil",
    deleteTitle: "Kaydi Sil",
    deleteBody: "Bu kaydi silmek istedigine emin misin?",
    cancel: "Iptal",
    alertLoadErrorTitle: "Hata",
    alertLoadErrorBody: "Gunluk kayitlari yuklenemedi.",
    alertEmptyTitle: "Bos Kayit",
    alertEmptyBody: "Kaydetmeden once bir sey yazmalisin.",
    alertSavedTitle: "Kaydedildi",
    alertSavedBody: "Kaydin basariyla guncellendi.",
    alertSaveErrorTitle: "Hata",
    alertSaveErrorBody: "Kayit kaydedilemedi.",
    alertShareEmptyBody: "Paylasilacak bir metin yok.",
    alertShareErrorBody: "Kayit paylasilamadi.",
    introTitle: "Gunluk Aliskanligi",
    introSubtitle: "Her gun kisa bir kontrol yap",
    introBody:
      "Durtu ve duygu degisimlerini not almak, hangi durumlarda zorlandigini gormene yardimci olur.",
    introTipLabel: "Odak",
    introTipBody: "3-4 cumlelik kayitlar bile guclu bir farkindalik olusturur.",
    introPrimary: "Yazmaya Basla",
    introSecondary: "Sonra",
    shareHeader: "Antislot Gunluk Notu",
  },
  en: {
    title: "Diary",
    subtitle: "Your personal log",
    description:
      "Daily entries help you identify triggers and emotional patterns earlier.",
    tip: "Even short notes make progress more visible.",
    entryNew: "Your first note for today",
    entryEditing: "Editing entry",
    entryDatePrefix: "Date",
    inputPlaceholder:
      "Write your thoughts, feelings, and what happened today...",
    share: "Share",
    save: "Save",
    newEntry: "New",
    historyTitle: "Recent Entries",
    emptyHistory: "No entries yet.",
    delete: "Delete",
    deleteTitle: "Delete Entry",
    deleteBody: "Are you sure you want to delete this entry?",
    cancel: "Cancel",
    alertLoadErrorTitle: "Error",
    alertLoadErrorBody: "Unable to load diary entries.",
    alertEmptyTitle: "Empty Entry",
    alertEmptyBody: "Write something before saving.",
    alertSavedTitle: "Saved",
    alertSavedBody: "Your entry was saved successfully.",
    alertSaveErrorTitle: "Error",
    alertSaveErrorBody: "Failed to save entry.",
    alertShareEmptyBody: "There is nothing to share.",
    alertShareErrorBody: "Unable to share this entry.",
    introTitle: "Diary Habit",
    introSubtitle: "Do a short daily check-in",
    introBody:
      "Tracking urges and feelings helps you see where risk increases and what helps.",
    introTipLabel: "Focus",
    introTipBody: "3-4 sentence entries are enough to build awareness.",
    introPrimary: "Start Writing",
    introSecondary: "Later",
    shareHeader: "Antislot Diary Note",
  },
} as const;

function formatEntryDate(date: string, locale: string) {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

export default function Diary() {
  const { language, locale, t } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(DIARY_COPY);

  const [showIntro, setShowIntro] = useState(true);
  const [diaryEntry, setDiaryEntry] = useState("");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isBusy = loading || saving;
  const hasContent = diaryEntry.trim().length > 0;

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const [todayEntry, allEntries] = await Promise.all([getTodayEntry(), getDiaryEntries()]);
      setEntries(allEntries);

      if (todayEntry) {
        setDiaryEntry(todayEntry.content);
        setEntryId(todayEntry.id);
        setEntryDate(todayEntry.date);
      } else {
        setDiaryEntry("");
        setEntryId(null);
        setEntryDate(null);
      }
    } catch (error) {
      console.error("Diary load error:", error);
      Alert.alert(copy.alertLoadErrorTitle, copy.alertLoadErrorBody);
    } finally {
      setLoading(false);
    }
  }, [copy.alertLoadErrorBody, copy.alertLoadErrorTitle]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    void (async () => {
      try {
        await syncDiaryWithServer();
        await loadEntries();
      } catch (error) {
        console.warn("Diary cloud sync error:", error);
      }
    })();
  }, [loadEntries]);

  const currentEntryDate = useMemo(() => {
    if (!entryDate) return null;
    return formatEntryDate(entryDate, locale);
  }, [entryDate, locale]);

  async function handleSave() {
    if (!hasContent) {
      Alert.alert(copy.alertEmptyTitle, copy.alertEmptyBody);
      return;
    }

    setSaving(true);
    try {
      const today = getLocalDateKey();
      const previous = entries.find((item) => item.id === entryId);
      const nextEntry: DiaryEntry = {
        id: entryId ?? `entry_${Date.now()}`,
        date: entryDate ?? today,
        content: diaryEntry.trim(),
        createdAt: previous?.createdAt ?? Date.now(),
      };

      await saveDiaryEntry(nextEntry);
      setEntryId(nextEntry.id);
      setEntryDate(nextEntry.date);
      await loadEntries();
      void syncDiaryWithServer()
        .then(() => loadEntries())
        .catch((error) => console.warn("Diary cloud sync error:", error));
      Alert.alert(copy.alertSavedTitle, copy.alertSavedBody);
    } catch (error) {
      console.error("Diary save error:", error);
      Alert.alert(copy.alertSaveErrorTitle, copy.alertSaveErrorBody);
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!hasContent) {
      Alert.alert(copy.alertEmptyTitle, copy.alertShareEmptyBody);
      return;
    }

    try {
      const sharedDate = entryDate ?? getLocalDateKey();
      await Share.share({
        message: `${copy.shareHeader}\n${sharedDate}\n\n${diaryEntry.trim()}`,
      });
    } catch (error) {
      console.error("Diary share error:", error);
      Alert.alert(copy.alertSaveErrorTitle, copy.alertShareErrorBody);
    }
  }

  function handleNewEntry() {
    setDiaryEntry("");
    setEntryId(null);
    setEntryDate(null);
  }

  function handleSelectEntry(selectedEntry: DiaryEntry) {
    setDiaryEntry(selectedEntry.content);
    setEntryId(selectedEntry.id);
    setEntryDate(selectedEntry.date);
  }

  function handleDeleteEntry(id: string) {
    Alert.alert(copy.deleteTitle, copy.deleteBody, [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDiaryEntry(id);
            if (entryId === id) {
              handleNewEntry();
            }
            await loadEntries();
            void syncDiaryWithServer()
              .then(() => loadEntries())
              .catch((error) => console.warn("Diary cloud sync error:", error));
          } catch (error) {
            console.error("Diary delete error:", error);
            Alert.alert(copy.alertSaveErrorTitle, copy.alertSaveErrorBody);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} testID="diary-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
          </TouchableOpacity>
        </View>

        <ScreenHero
          icon="book-outline"
          title={copy.title}
          subtitle={copy.subtitle}
          description={`${copy.description} ${copy.tip}`}
          badge={copy.historyTitle}
          gradient={["#30435A", "#4A6788"]}
          style={styles.heroCard}
        />

        <SectionLead
          icon="create-outline"
          title={entryId ? copy.entryEditing : copy.entryNew}
          subtitle={copy.inputPlaceholder}
          tone="primary"
          style={styles.sectionLead}
        />

        <View style={[styles.entrySection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.entryLabel, { color: colors.text }]}>
            {entryId ? copy.entryEditing : copy.entryNew}
          </Text>
          {currentEntryDate ? (
            <Text style={[styles.entryDate, { color: colors.textSecondary }]}> 
              {`${copy.entryDatePrefix}: ${currentEntryDate}`}
            </Text>
          ) : null}

          <TextInput
            style={[
              styles.entryInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={copy.inputPlaceholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={10}
            value={diaryEntry}
            onChangeText={setDiaryEntry}
            textAlignVertical="top"
            editable={!isBusy}
            testID="diary-input"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.background }, isBusy && styles.buttonDisabled]}
              onPress={handleShare}
              disabled={isBusy}
              activeOpacity={0.9}
              testID="diary-share-btn"
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{copy.share}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, isBusy && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isBusy}
              activeOpacity={0.9}
              testID="diary-save-btn"
            >
              <Text style={styles.primaryButtonText}>{copy.save}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.background }, isBusy && styles.buttonDisabled]}
              onPress={handleNewEntry}
              disabled={isBusy}
              activeOpacity={0.9}
              testID="diary-new-btn"
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{copy.newEntry}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionLead
          icon="time-outline"
          title={copy.historyTitle}
          subtitle={copy.emptyHistory}
          tone="neutral"
          style={styles.sectionLead}
        />

        <View style={[styles.historySection, { backgroundColor: colors.card, borderColor: colors.border }]} testID="diary-history">
          <Text style={[styles.historyTitle, { color: colors.text }]}>{copy.historyTitle}</Text>
          {loading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : entries.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.emptyHistory}</Text>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={[styles.historyCard, { backgroundColor: colors.background, borderColor: colors.border }]} testID={`diary-entry-${entry.id}`}>
                <TouchableOpacity style={styles.historyContent} onPress={() => handleSelectEntry(entry)} activeOpacity={0.85} testID={`diary-entry-select-${entry.id}`}>
                  <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                    {formatEntryDate(entry.date, locale)}
                  </Text>
                  <Text style={[styles.historyPreview, { color: colors.text }]} numberOfLines={3}>
                    {entry.content}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.warning ?? "#B45309" }]}
                  onPress={() => handleDeleteEntry(entry.id)}
                  activeOpacity={0.9}
                  testID={`diary-entry-delete-${entry.id}`}
                >
                  <Text style={styles.deleteButtonText}>{copy.delete}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showIntro}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIntro(false)}
        testID="diary-intro-modal"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{copy.introTitle}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{copy.introSubtitle}</Text>
            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>{copy.introBody}</Text>
            <View style={[styles.modalTip, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.modalTipLabel, { color: colors.text }]}>{copy.introTipLabel}</Text>
              <Text style={[styles.modalTipText, { color: colors.textSecondary }]}>{copy.introTipBody}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalSecondaryButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setShowIntro(false)}
                activeOpacity={0.9}
                testID="diary-intro-secondary"
              >
                <Text style={[styles.modalSecondaryText, { color: colors.text }]}>{copy.introSecondary}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowIntro(false)}
                activeOpacity={0.9}
                testID="diary-intro-primary"
              >
                <Text style={styles.modalPrimaryText}>{copy.introPrimary}</Text>
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
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.base,
  },
  header: {
    marginBottom: 4,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  sectionLead: {
    marginTop: 2,
  },
  heroIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroIconText: {
    fontSize: 26,
    fontFamily: Fonts.displayMedium,
  },
  title: {
    fontSize: 30,
    fontFamily: Fonts.display,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 14,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  tip: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: Fonts.body,
  },
  entrySection: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 18,
  },
  entryLabel: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  entryInput: {
    minHeight: 190,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  historySection: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 18,
  },
  historyTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 12,
  },
  loaderRow: {
    paddingVertical: 10,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    fontStyle: "italic",
  },
  historyCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  historyContent: {
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 6,
  },
  historyPreview: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  deleteButton: {
    alignSelf: "flex-start",
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: Fonts.display,
    textAlign: "center",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    textAlign: "center",
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 14,
  },
  modalTip: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 18,
  },
  modalTipLabel: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  modalTipText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.body,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalPrimaryButton: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  modalSecondaryButton: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalSecondaryText: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
});
