import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IdentityCard = {
  id: "future" | "calm" | "impulsive" | "disciplined";
  labelTr: string;
  labelEn: string;
  descTr: string;
  descEn: string;
  promptTr: string;
  promptEn: string;
};

const IDENTITIES: IdentityCard[] = [
  {
    id: "future",
    labelTr: "Gelecek odakli ben",
    labelEn: "Future-focused self",
    descTr: "Uzun vadeli hedeflere gore hareket eder, bugunku kararin yarina etkisini dusunur.",
    descEn: "Acts from long-term goals and considers how today impacts tomorrow.",
    promptTr: "Bu karar 3 ay sonra bana ne kazandirir?",
    promptEn: "What does this decision give me in 3 months?",
  },
  {
    id: "calm",
    labelTr: "Sakin ben",
    labelEn: "Calm self",
    descTr: "Duyguyu fark eder ama hemen tepki vermez. Once durur, sonra secim yapar.",
    descEn: "Notices emotion without immediate reaction. Pauses first, chooses second.",
    promptTr: "Su an 2 dakika durursam ne degisir?",
    promptEn: "What changes if I pause for 2 minutes now?",
  },
  {
    id: "impulsive",
    labelTr: "Durtusel ben",
    labelEn: "Impulsive self",
    descTr: "Hizli rahatlama ve heyecan arar. Sonucu degil anlik hisse odaklanir.",
    descEn: "Seeks quick relief and excitement. Focuses on immediate feeling, not outcome.",
    promptTr: "Bu secim duyguya mi dayaniyor, degerlere mi?",
    promptEn: "Is this choice based on emotion or values?",
  },
  {
    id: "disciplined",
    labelTr: "Disiplinli ben",
    labelEn: "Disciplined self",
    descTr: "Kucuk adimlari tekrarlar, mukemmel olmasa da plana sadik kalir.",
    descEn: "Repeats small steps and stays aligned with the plan, even if imperfect.",
    promptTr: "Bugun tek bir mikro adim ne olabilir?",
    promptEn: "What is one micro-step I can complete today?",
  },
];

const REFLECTION_STEPS = {
  tr: [
    "Hangi ben aktif, sec.",
    "Bu benin dusuncesini bir cumleyle yaz.",
    "2 dakikalik gecikme uygula.",
    "Sonra kararini tekrar degerlendir.",
  ],
  en: [
    "Identify which self is active.",
    "Write that self's thought in one sentence.",
    "Apply a 2-minute delay.",
    "Re-evaluate your decision.",
  ],
};

export default function IdentityModeScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const isTr = language === "tr";
  const [selectedId, setSelectedId] = useState<IdentityCard["id"] | null>(null);

  const selected = useMemo(
    () => IDENTITIES.find((item) => item.id === selectedId) ?? null,
    [selectedId]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t.exploreModules.identityMode.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.exploreModules.identityMode.subtitle}</Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {isTr
              ? "Karar aninda birden fazla ic ses devreye girebilir. Hangi modda oldugunu gormek, otomatik davranisi yavaslatir."
              : "More than one inner voice can show up during decisions. Identifying your mode slows automatic behavior."}
          </Text>
        </View>

        <View style={styles.cardList}>
          {IDENTITIES.map((item) => {
            const active = selectedId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.identityCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.86}
                onPress={() => setSelectedId(active ? null : item.id)}
              >
                <Text style={[styles.identityTitle, { color: colors.text }]}>
                  {isTr ? item.labelTr : item.labelEn}
                </Text>
                <Text style={[styles.identityDesc, { color: colors.textSecondary }]}>
                  {isTr ? item.descTr : item.descEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selected ? (
          <View style={[styles.focusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.focusLabel, { color: colors.primary }]}>
              {isTr ? "Su anki ana soru" : "Primary reflection question"}
            </Text>
            <Text style={[styles.focusTitle, { color: colors.text }]}>
              {isTr ? selected.labelTr : selected.labelEn}
            </Text>
            <Text style={[styles.focusPrompt, { color: colors.textSecondary }]}>
              {isTr ? selected.promptTr : selected.promptEn}
            </Text>
          </View>
        ) : null}

        <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stepsTitle, { color: colors.text }]}>
            {isTr ? "Hizli karar protokolu" : "Quick decision protocol"}
          </Text>
          {(isTr ? REFLECTION_STEPS.tr : REFLECTION_STEPS.en).map((step, index) => (
            <Text key={step} style={[styles.stepItem, { color: colors.textSecondary }]}>
              {`${index + 1}. ${step}`}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.bodyMedium,
    lineHeight: 22,
    marginBottom: 12,
  },
  intro: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  cardList: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  identityCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  identityTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  identityDesc: {
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 20,
  },
  focusCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  focusLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  focusTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  focusPrompt: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  stepsCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  stepsTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  stepItem: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.body,
    marginBottom: 4,
  },
});
