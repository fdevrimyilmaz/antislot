import { SOSQuickAccess } from "@/components/sos-quick-access";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { validateUserContent } from "@/lib/safety/language-validator";
import { useUrgeStore } from "@/store/urgeStore";
import type { InterventionEffectiveness, UrgeIntensity } from "@/types/urge";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INTENSITY_OPTIONS: UrgeIntensity[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const EFFECTIVENESS_OPTIONS: {
  value: InterventionEffectiveness;
  badge: string;
  fallbackLabel: string;
}[] = [
  { value: "very_helpful", badge: "++", fallbackLabel: "Very helpful" },
  { value: "helpful", badge: "+", fallbackLabel: "Helpful" },
  { value: "neutral", badge: "=", fallbackLabel: "Neutral" },
  { value: "not_helpful", badge: "-", fallbackLabel: "Not helpful" },
];

export default function UrgeCompleteScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { activeUrge, hydrated, completeUrge, updateUrgeIntensity, syncWithServer } = useUrgeStore();

  const [finalIntensity, setFinalIntensity] = useState<UrgeIntensity | null>(null);
  const [effectiveness, setEffectiveness] = useState<InterventionEffectiveness | null>(null);
  const [note, setNote] = useState("");
  const [completed, setCompleted] = useState(false);
  const [noteWarnings, setNoteWarnings] = useState<string[]>([]);
  const [needsReview, setNeedsReview] = useState(false);

  useEffect(() => {
    if (hydrated && !activeUrge) {
      router.replace("/urge/detect");
      return;
    }
    if (!activeUrge) return;
    setFinalIntensity(activeUrge.currentIntensity);
  }, [hydrated, activeUrge]);

  if (!activeUrge) return null;

  const handleNoteChange = (text: string) => {
    setNote(text);
    if (!text.trim()) {
      setNoteWarnings([]);
      setNeedsReview(false);
      return;
    }
    const validation = validateUserContent(text);
    setNoteWarnings(validation.warnings);
    setNeedsReview(validation.needsReview);
  };

  const handleComplete = async () => {
    if (finalIntensity === null || effectiveness === null) return;
    try {
      const safeNote = note.trim() ? validateUserContent(note).safe : undefined;
      await completeUrge(finalIntensity, effectiveness, safeNote);
      await syncWithServer().catch((error) => {
        console.warn("[UrgeComplete] Cloud sync failed:", error);
      });
      setCompleted(true);
    } catch (error) {
      console.error("[UrgeComplete] Error completing urge:", error);
    }
  };

  if (completed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.doneView}>
          <Text style={[styles.doneTitle, { color: colors.text }]}>{t.urgeCompleteThankYou}</Text>
          <Text style={[styles.doneSubtitle, { color: colors.textSecondary }]}>{t.urgeCompleteThankYouSubtitle}</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.82}
          >
            <Text style={styles.primaryBtnText}>{t.urgeCompleteDone}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>{`<- ${t.urgeBack}`}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>{t.urgeCompleteTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.urgeCompleteSubtitle}</Text>

          <View style={styles.intensityGrid}>
            {INTENSITY_OPTIONS.map((value) => {
              const selected = finalIntensity === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.intensityButton,
                    selected
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setFinalIntensity(value);
                    updateUrgeIntensity(value);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.intensityText, { color: selected ? "#FFFFFF" : colors.text }]}>{value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.urgeCompleteEffectiveness}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t.urgeCompleteEffectivenessSubtitle}</Text>

          <View style={styles.effectivenessGrid}>
            {EFFECTIVENESS_OPTIONS.map((option) => {
              const selected = effectiveness === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.effectivenessButton,
                    selected
                      ? { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => setEffectiveness(option.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.effectBadge, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={[styles.effectBadgeText, { color: selected ? colors.primary : colors.textSecondary }]}>
                      {option.badge}
                    </Text>
                  </View>
                  <Text style={[styles.effectLabel, { color: selected ? colors.primary : colors.text }]}>
                    {t.urgeEffectivenessLabels[option.value] || option.fallbackLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.urgeCompleteNote}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t.urgeCompleteNoteSubtitle}</Text>
          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: colors.card,
                borderColor: needsReview ? colors.warning ?? "#D97706" : colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t.urgeCompleteNoteSubtitle}
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={handleNoteChange}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {noteWarnings.length > 0 ? (
            <Text style={[styles.warningText, { color: colors.warning ?? "#D97706" }]}>{noteWarnings.join(", ")}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              backgroundColor: finalIntensity !== null && effectiveness !== null ? colors.primary : colors.disabled,
              opacity: finalIntensity !== null && effectiveness !== null ? 1 : 0.55,
            },
          ]}
          onPress={() => void handleComplete()}
          disabled={finalIntensity === null || effectiveness === null}
          activeOpacity={0.82}
        >
          <Text style={styles.primaryBtnText}>{t.urgeCompleteButton}</Text>
        </TouchableOpacity>
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
  backText: { fontSize: 16, lineHeight: 20, fontFamily: Fonts.bodySemiBold },
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  intensityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  intensityButton: {
    width: "9%",
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  intensityText: { fontSize: 15, lineHeight: 18, fontFamily: Fonts.bodySemiBold },
  effectivenessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  effectivenessButton: {
    flex: 1,
    minWidth: "47%",
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: "center",
    ...Shadows.card,
  },
  effectBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  effectBadgeText: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  effectLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: Fonts.bodyMedium,
    textAlign: "center",
  },
  noteInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
    minHeight: 96,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  warningText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.body,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: "center",
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
  doneTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: Fonts.display,
    marginBottom: 8,
    textAlign: "center",
  },
  doneSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 20,
  },
});
