import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LossCategoryId = "time" | "focus" | "opportunity" | "relationships" | "selfTrust";
type LossCounts = Record<LossCategoryId, number>;

type LossCategory = {
  id: LossCategoryId;
  badge: string;
  labelTr: string;
  labelEn: string;
  unitTr: string;
  unitEn: string;
  noteTr: string;
  noteEn: string;
};

const CATEGORIES: LossCategory[] = [
  {
    id: "time",
    badge: "TIME",
    labelTr: "Kayip zaman",
    labelEn: "Lost time",
    unitTr: "saat",
    unitEn: "hours",
    noteTr: "Plan disi gecen saatler",
    noteEn: "Hours spent outside your plan",
  },
  {
    id: "focus",
    badge: "FOCUS",
    labelTr: "Odak kaybi",
    labelEn: "Focus loss",
    unitTr: "gun",
    unitEn: "days",
    noteTr: "Verim dususu yasadigin gunler",
    noteEn: "Days with reduced productivity",
  },
  {
    id: "opportunity",
    badge: "OPP",
    labelTr: "Kacan firsat",
    labelEn: "Missed opportunity",
    unitTr: "adet",
    unitEn: "items",
    noteTr: "Ertelenen hedef ve firsatlar",
    noteEn: "Delayed goals and opportunities",
  },
  {
    id: "relationships",
    badge: "REL",
    labelTr: "Iliski etkisi",
    labelEn: "Relationship impact",
    unitTr: "an",
    unitEn: "moments",
    noteTr: "Bagi zayiflatan anlar",
    noteEn: "Moments that weakened connection",
  },
  {
    id: "selfTrust",
    badge: "TRUST",
    labelTr: "Oz guven kirilmasi",
    labelEn: "Self-trust hit",
    unitTr: "kez",
    unitEn: "times",
    noteTr: "Kendine verdigin sozu bozdugun anlar",
    noteEn: "Moments you broke a promise to yourself",
  },
];

const INITIAL_COUNTS: LossCounts = {
  time: 0,
  focus: 0,
  opportunity: 0,
  relationships: 0,
  selfTrust: 0,
};

export default function LossCounterScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const isTr = language === "tr";
  const [counts, setCounts] = useState<LossCounts>(INITIAL_COUNTS);

  const total = useMemo(() => Object.values(counts).reduce((sum, value) => sum + value, 0), [counts]);
  const dominant = useMemo(() => {
    let best: LossCategory | null = null;
    for (const category of CATEGORIES) {
      if (!best || counts[category.id] > counts[best.id]) {
        best = category;
      }
    }
    return best && counts[best.id] > 0 ? best : null;
  }, [counts]);

  const increment = (id: LossCategoryId) => {
    setCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
  };

  const decrement = (id: LossCategoryId) => {
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, prev[id] - 1) }));
  };

  const reset = () => {
    Alert.alert(
      isTr ? "Sayaci sifirla" : "Reset counter",
      isTr ? "Tum degerler sifirlansin mi?" : "Reset all values?",
      [
        { text: isTr ? "Vazgec" : "Cancel", style: "cancel" },
        { text: isTr ? "Sifirla" : "Reset", style: "destructive", onPress: () => setCounts(INITIAL_COUNTS) },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t.exploreModules.lossCounter.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.exploreModules.lossCounter.subtitle}
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {isTr
              ? "Para disi kayiplari saymak, davranisin gercek etkisini daha net gosterir. Bu sayac sadece farkindalik icindir."
              : "Counting non-financial losses reveals the real-life impact more clearly. This counter is for awareness only."}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.primary }]}>
            {isTr ? "Toplam kayit" : "Total entries"}
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{total}</Text>
          <Text style={[styles.summaryHint, { color: colors.textSecondary }]}>
            {dominant
              ? isTr
                ? `En yuksek alan: ${dominant.labelTr}`
                : `Highest area: ${dominant.labelEn}`
              : isTr
                ? "Henuz veri girilmedi."
                : "No data entered yet."}
          </Text>
        </View>

        <View style={styles.list}>
          {CATEGORIES.map((category) => (
            <View key={category.id} style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.badge, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{category.badge}</Text>
              </View>

              <View style={styles.rowMeta}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {isTr ? category.labelTr : category.labelEn}
                </Text>
                <Text style={[styles.rowNote, { color: colors.textSecondary }]}>
                  {isTr ? category.noteTr : category.noteEn}
                </Text>
                <Text style={[styles.rowUnit, { color: colors.textSecondary }]}>
                  {isTr ? category.unitTr : category.unitEn}
                </Text>
              </View>

              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => decrement(category.id)}
                >
                  <Text style={[styles.stepperText, { color: colors.primary }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.text }]}>{counts[category.id]}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => increment(category.id)}
                >
                  <Text style={[styles.stepperText, { color: colors.primary }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={reset}
          >
            <Text style={[styles.resetText, { color: colors.primary }]}>{isTr ? "Tumunu sifirla" : "Reset all"}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {isTr
              ? "Veriler bu cihazda kalir. Diledigin zaman guncelleyebilir veya sifirlayabilirsin."
              : "Data stays on this device. You can update or reset anytime."}
          </Text>
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
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.display,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 10,
  },
  intro: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 34,
    fontFamily: Fonts.display,
    lineHeight: 40,
  },
  summaryHint: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
  list: {
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    ...Shadows.card,
  },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
    fontFamily: Fonts.bodySemiBold,
  },
  rowMeta: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  rowNote: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
    marginBottom: 3,
  },
  rowUnit: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: {
    fontSize: 18,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
  },
  stepperValue: {
    minWidth: 26,
    textAlign: "center",
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  footerActions: {
    marginBottom: Spacing.base,
  },
  resetBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  resetText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
});
