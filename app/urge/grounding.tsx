import { SOSQuickAccess } from "@/components/sos-quick-access";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import { useUrgeStore } from "@/store/urgeStore";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GROUNDING_STEPS = {
  tr: [
    { number: 5, sense: "Gorme", instruction: "Etrafinda gordugun 5 seyi adlandir." },
    { number: 4, sense: "Dokunma", instruction: "Dokunabildigin veya hissedebildigin 4 seyi adlandir." },
    { number: 3, sense: "Duyma", instruction: "Duydugun 3 sesi adlandir." },
    { number: 2, sense: "Koku", instruction: "Fark ettigin 2 kokuyu adlandir." },
    { number: 1, sense: "Tat", instruction: "Aklina gelen 1 tat hissini adlandir." },
  ],
  en: [
    { number: 5, sense: "See", instruction: "Name 5 things you can see around you." },
    { number: 4, sense: "Touch", instruction: "Name 4 things you can touch or feel." },
    { number: 3, sense: "Hear", instruction: "Name 3 things you can hear." },
    { number: 2, sense: "Smell", instruction: "Name 2 things you can smell." },
    { number: 1, sense: "Taste", instruction: "Name 1 thing you can taste." },
  ],
} as const;

const GROUNDING_COPY = {
  tr: {
    progress: (current: number, total: number) => `${current}/${total}`,
    helper: "Acele etmeden sadece fark etmeye odaklan.",
  },
  en: {
    progress: (current: number, total: number) => `${current}/${total}`,
    helper: "No rush. Focus only on noticing.",
  },
} as const;

export default function GroundingScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { activeUrge, hydrated, completeIntervention } = useUrgeStore();
  const copy = useLocalizedCopy(GROUNDING_COPY);
  const steps = useLocalizedCopy(GROUNDING_STEPS);

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (hydrated && !activeUrge) {
      router.replace("/urge/detect");
    }
  }, [hydrated, activeUrge]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
    setCompleted(true);
  };

  const handleComplete = async () => {
    await completeIntervention("helpful");
    router.push("/urge/intervene");
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/urge/intervene")} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>{`<- ${t.urgeBack}`}</Text>
          </TouchableOpacity>
        </View>

        {!completed ? (
          <View style={styles.stepView}>
            <Text style={[styles.title, { color: colors.text }]}>{t.urgeGroundingTitle}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.urgeGroundingSubtitle}</Text>

            <View style={styles.progressWrap}>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {copy.progress(currentStep + 1, steps.length)}
              </Text>
            </View>

            <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.numberCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.numberText}>{step.number}</Text>
              </View>
              <Text style={[styles.senseText, { color: colors.primary }]}>{step.sense}</Text>
              <Text style={[styles.instruction, { color: colors.text }]}>{step.instruction}</Text>
              <Text style={[styles.helper, { color: colors.textSecondary }]}>{copy.helper}</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleNext}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryBtnText}>
                {currentStep < steps.length - 1 ? t.urgeGroundingNext : t.urgeGroundingComplete}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.doneView}>
            <Text style={[styles.doneTitle, { color: colors.text }]}>{t.urgeCompleteThankYou}</Text>
            <Text style={[styles.doneSubtitle, { color: colors.textSecondary }]}>{t.urgeGroundingSubtitle}</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => void handleComplete()}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryBtnText}>{t.urgeContinue}</Text>
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
  stepView: { flex: 1 },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.display,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 16,
  },
  progressWrap: { marginBottom: Spacing.base },
  progressTrack: {
    height: 8,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", borderRadius: Radius.full },
  progressText: { textAlign: "center", fontSize: 12, fontFamily: Fonts.body },
  stepCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  numberCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  numberText: { color: "#FFFFFF", fontSize: 38, lineHeight: 42, fontFamily: Fonts.display },
  senseText: {
    fontSize: 20,
    lineHeight: 25,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  instruction: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: Fonts.bodyMedium,
    textAlign: "center",
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
    textAlign: "center",
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
    alignItems: "center",
    paddingTop: 20,
  },
  doneTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: Fonts.display,
    marginBottom: 8,
    textAlign: "center",
  },
  doneSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 20,
  },
});
