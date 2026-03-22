import { SOSQuickAccess } from "@/components/sos-quick-access";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import { useUrgeStore } from "@/store/urgeStore";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TASKS = {
  tr: [
    { id: "water", badge: "WATER", label: "Bir bardak su ic", durationSec: 60 },
    { id: "stretch", badge: "MOVE", label: "5 esneme hareketi yap", durationSec: 120 },
    { id: "music", badge: "MUSIC", label: "Bir sarki dinle", durationSec: 180 },
    { id: "walk", badge: "WALK", label: "Kisa bir yuruyuse cik", durationSec: 300 },
    { id: "journal", badge: "WRITE", label: "3 cumle not yaz", durationSec: 180 },
    { id: "breath", badge: "BREATH", label: "10 derin nefes al", durationSec: 60 },
  ],
  en: [
    { id: "water", badge: "WATER", label: "Drink a glass of water", durationSec: 60 },
    { id: "stretch", badge: "MOVE", label: "Do 5 stretches", durationSec: 120 },
    { id: "music", badge: "MUSIC", label: "Listen to one song", durationSec: 180 },
    { id: "walk", badge: "WALK", label: "Take a short walk", durationSec: 300 },
    { id: "journal", badge: "WRITE", label: "Write 3 sentences", durationSec: 180 },
    { id: "breath", badge: "BREATH", label: "Take 10 deep breaths", durationSec: 60 },
  ],
} as const;

const REDIRECTION_COPY = {
  tr: {
    title: "Hizli Aktivite",
    subtitle: "Dikkatini guvenli bir aktiviteye yonlendir. Birkac dakika bile etki eder.",
    selectedHint: "Aktiviteyi tamamlayip geri donebilirsin.",
    completed: "Aktivite tamamlandi",
    min: "dk",
  },
  en: {
    title: "Quick Activity",
    subtitle: "Redirect attention to a safe activity. Even a few minutes can help.",
    selectedHint: "Complete the activity and then continue.",
    completed: "Task completed",
    min: "min",
  },
} as const;

export default function RedirectionScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { addIntervention, completeIntervention } = useUrgeStore();
  const copy = useLocalizedCopy(REDIRECTION_COPY);
  const tasks = useLocalizedCopy(TASKS);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const selectedTask = selectedTaskId ? tasks.find((item) => item.id === selectedTaskId) ?? null : null;

  const handleSelectTask = async (taskId: string) => {
    setSelectedTaskId(taskId);
    await addIntervention("redirection");
  };

  const handleComplete = async () => {
    await completeIntervention("helpful");
    setCompleted(true);
    setTimeout(() => {
      router.push("/urge/intervene");
    }, 1200);
  };

  if (completed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.doneView}>
          <View style={[styles.doneBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.doneBadgeText}>OK</Text>
          </View>
          <Text style={[styles.doneText, { color: colors.text }]}>{copy.completed}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/urge/intervene")} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>{`<- ${t.urgeBack}`}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.subtitle}</Text>
        </View>

        {!selectedTask ? (
          <View style={styles.grid}>
            {tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => void handleSelectTask(task.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.badge, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{task.badge}</Text>
                </View>
                <Text style={[styles.cardLabel, { color: colors.text }]}>{task.label}</Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                  {`~${Math.max(1, Math.floor(task.durationSec / 60))} ${copy.min}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.selectedWrap}>
            <View style={[styles.selectedBadge, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.selectedBadgeText, { color: colors.primary }]}>{selectedTask.badge}</Text>
            </View>
            <Text style={[styles.selectedLabel, { color: colors.text }]}>{selectedTask.label}</Text>
            <Text style={[styles.selectedHint, { color: colors.textSecondary }]}>{copy.selectedHint}</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => void handleComplete()}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryBtnText}>{t.urgeCompleteButton}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <SOSQuickAccess variant="floating" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: { marginBottom: Spacing.base },
  backButton: { alignSelf: "flex-start" },
  backText: { fontSize: 16, fontFamily: Fonts.bodySemiBold },
  section: { marginBottom: Spacing.lg },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.display,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: "47%",
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: "center",
    ...Shadows.card,
  },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.3,
  },
  cardLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
    textAlign: "center",
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.body,
  },
  selectedWrap: {
    alignItems: "center",
    paddingTop: 10,
  },
  selectedBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  selectedBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.4,
  },
  selectedLabel: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: Fonts.displayMedium,
    textAlign: "center",
    marginBottom: 8,
  },
  selectedHint: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 18,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: 13,
    paddingHorizontal: 34,
    ...Shadows.button,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
  },
  doneView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  doneBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  doneBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.4,
  },
  doneText: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: Fonts.displayMedium,
    textAlign: "center",
  },
});
