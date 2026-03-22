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

const REFRAME_PROMPTS = {
  tr: [
    {
      question: "Bu durtu bana ne anlatmaya calisiyor?",
      guidance: "Durtu bir sinyal olabilir. Bedenin veya zihnin hangi ihtiyaci gostermeye calisiyor?",
    },
    {
      question: "Ayni durumda bir arkadasima ne soylerdim?",
      guidance: "Kendine, bir arkadasa gosterecegin kadar sefkatli bir cumle kur.",
    },
    {
      question: "Bu his olmasaydi su an ne yapardim?",
      guidance: "Durtu yokmus gibi dusun ve bir sonraki saglikli adimi sec.",
    },
    {
      question: "Gecmiste ise yarayan ne oldu?",
      guidance: "Daha once benzer anlarda seni toparlayan bir adimi hatirla.",
    },
  ],
  en: [
    {
      question: "What is this urge trying to tell me?",
      guidance: "Urges can be signals. What need might your mind or body be pointing to?",
    },
    {
      question: "What would I tell a friend in this situation?",
      guidance: "Offer yourself the same compassionate line you would give a friend.",
    },
    {
      question: "What would I do if this feeling was not here?",
      guidance: "Imagine the urge is absent and choose your next healthy action.",
    },
    {
      question: "What helped me in similar moments before?",
      guidance: "Recall one step that helped you recover in past episodes.",
    },
  ],
} as const;

const REFRAME_COPY = {
  tr: {
    progress: (current: number, total: number) => `${current}/${total}`,
    reflectionHint: "Kisa bir durup dusunme ani. Dogru/yanlis cevap yok.",
  },
  en: {
    progress: (current: number, total: number) => `${current}/${total}`,
    reflectionHint: "Take a short pause to reflect. There is no right or wrong answer.",
  },
} as const;

export default function ReframingScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { completeIntervention } = useUrgeStore();
  const prompts = useLocalizedCopy(REFRAME_PROMPTS);
  const copy = useLocalizedCopy(REFRAME_COPY);
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index < prompts.length - 1) {
      setIndex((prev) => prev + 1);
    }
  };

  const handleComplete = async () => {
    await completeIntervention("helpful");
    router.push("/urge/intervene");
  };

  const prompt = prompts[index];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/urge/intervene")} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>{`<- ${t.urgeBack}`}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardWrap}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {copy.progress(index + 1, prompts.length)}
          </Text>
          <Text style={[styles.question, { color: colors.text }]}>{prompt.question}</Text>

          <View style={[styles.guidanceBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.guidanceText, { color: colors.textSecondary }]}>{prompt.guidance}</Text>
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>{copy.reflectionHint}</Text>
        </View>

        <View style={styles.actionWrap}>
          {index < prompts.length - 1 ? (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleNext} activeOpacity={0.82}>
              <Text style={styles.primaryBtnText}>{t.urgeGroundingNext}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => void handleComplete()}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryBtnText}>{t.urgeContinue}</Text>
            </TouchableOpacity>
          )}
        </View>
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
  cardWrap: {
    borderRadius: Radius.lg,
    paddingVertical: 8,
  },
  progressText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 16,
  },
  question: {
    fontSize: 25,
    lineHeight: 32,
    fontFamily: Fonts.displayMedium,
    textAlign: "center",
    marginBottom: 16,
  },
  guidanceBox: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: 12,
    ...Shadows.card,
  },
  guidanceText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  actionWrap: { marginTop: Spacing.lg },
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
});
