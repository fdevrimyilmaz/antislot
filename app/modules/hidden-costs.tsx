import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { withPremiumGate } from "@/components/ui/premium-gate";
import {
  ScrollView,
  StyleSheet,
  Text,
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
import { haptics } from "@/services/haptics";

type Dimension = "time" | "relationships" | "focus" | "sleep" | "health";

type Question = {
  id: string;
  prompt: string;
  options: { label: string; cost: Record<Dimension, number> }[];
  dim: Dimension;
};

/**
 * Each option contributes weighted "cost" points across five dimensions.
 * The final summary visualises the dominant cost area; not a clinical
 * assessment — a reflection tool to make the invisible visible.
 */
const QUESTIONS: Question[] = [
  {
    id: "hours_per_week",
    prompt: "Son ay haftada ortalama kaç saat kumar/bahis ile geçirdin?",
    dim: "time",
    options: [
      { label: "Hiç / çok az (< 2 saat)", cost: { time: 0, relationships: 0, focus: 0, sleep: 0, health: 0 } },
      { label: "Az (2-5 saat)", cost: { time: 1, relationships: 0, focus: 1, sleep: 0, health: 0 } },
      { label: "Orta (5-15 saat)", cost: { time: 2, relationships: 1, focus: 2, sleep: 1, health: 1 } },
      { label: "Çok (15+ saat)", cost: { time: 3, relationships: 2, focus: 3, sleep: 2, health: 2 } },
    ],
  },
  {
    id: "sleep",
    prompt: "Kumar yüzünden uyumadan kaç gece geçirdin?",
    dim: "sleep",
    options: [
      { label: "Hiç", cost: { time: 0, relationships: 0, focus: 0, sleep: 0, health: 0 } },
      { label: "1-2 gece", cost: { time: 1, relationships: 0, focus: 1, sleep: 2, health: 1 } },
      { label: "3-5 gece", cost: { time: 2, relationships: 1, focus: 2, sleep: 3, health: 2 } },
      { label: "6+ gece", cost: { time: 3, relationships: 2, focus: 3, sleep: 4, health: 3 } },
    ],
  },
  {
    id: "arguments",
    prompt: "Para / kumar sebepli kaç tartışma / soğukluk yaşadın?",
    dim: "relationships",
    options: [
      { label: "Hiç", cost: { time: 0, relationships: 0, focus: 0, sleep: 0, health: 0 } },
      { label: "1-2 kez", cost: { time: 0, relationships: 2, focus: 1, sleep: 1, health: 0 } },
      { label: "3-5 kez", cost: { time: 0, relationships: 3, focus: 2, sleep: 2, health: 1 } },
      { label: "6+ kez", cost: { time: 0, relationships: 4, focus: 3, sleep: 2, health: 2 } },
    ],
  },
  {
    id: "missed_commitments",
    prompt: "Erteleyip yapamadığın iş / okul / aile sözü?",
    dim: "focus",
    options: [
      { label: "Hiç", cost: { time: 0, relationships: 0, focus: 0, sleep: 0, health: 0 } },
      { label: "1-2 kez", cost: { time: 1, relationships: 1, focus: 2, sleep: 0, health: 0 } },
      { label: "3-5 kez", cost: { time: 2, relationships: 2, focus: 3, sleep: 0, health: 1 } },
      { label: "6+ kez", cost: { time: 3, relationships: 3, focus: 4, sleep: 1, health: 1 } },
    ],
  },
  {
    id: "physical",
    prompt: "Son ay fiziksel olarak nasıl hissettin? (baş, mide, kas)",
    dim: "health",
    options: [
      { label: "İyi", cost: { time: 0, relationships: 0, focus: 0, sleep: 0, health: 0 } },
      { label: "Bazen yorgun", cost: { time: 0, relationships: 0, focus: 1, sleep: 1, health: 1 } },
      { label: "Sık sık şikayetli", cost: { time: 0, relationships: 0, focus: 2, sleep: 2, health: 3 } },
      { label: "Sürekli kötü", cost: { time: 1, relationships: 1, focus: 3, sleep: 3, health: 4 } },
    ],
  },
];

const DIM_META: Record<
  Dimension,
  { label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; color: string }
> = {
  time: { label: "Zaman", icon: "time", color: "#7BB8FF" },
  relationships: { label: "İlişkiler", icon: "people", color: "#F87171" },
  focus: { label: "Odak", icon: "compass", color: "#FBBF24" },
  sleep: { label: "Uyku", icon: "moon", color: "#A7AEFF" },
  health: { label: "Sağlık", icon: "heart", color: "#5EE0C7" },
};

function HiddenCostsModule() {
  const { colors } = useTheme();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const handleAnswer = (qId: string, optionIndex: number) => {
    haptics.selection();
    setAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      haptics.success();
      setDone(true);
    }
  };

  const totals = useMemo<Record<Dimension, number>>(() => {
    const sum: Record<Dimension, number> = {
      time: 0,
      relationships: 0,
      focus: 0,
      sleep: 0,
      health: 0,
    };
    for (const q of QUESTIONS) {
      const idx = answers[q.id];
      if (idx === undefined) continue;
      const opt = q.options[idx];
      (Object.keys(sum) as Dimension[]).forEach((dim) => {
        sum[dim] += opt.cost[dim];
      });
    }
    return sum;
  }, [answers]);

  const maxScore = Math.max(...Object.values(totals), 1);
  const dominantDim = (Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "time") as Dimension;

  const handleRestart = () => {
    haptics.warning();
    setAnswers({});
    setStep(0);
    setDone(false);
  };

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={["#4A5566", "#3F4858", "#353C49"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="eye-off" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="eye-off" size={11} color="#9DAFC6" />
              <Text style={styles.heroBadgeText}>FARKINDALIK</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Görünmez Maliyetler
            </Text>
            <Text style={styles.heroSubtitle}>
              Kumar yalnızca paradan değil zamandan, ilişkilerden, odaktan ve
              uykudan da alır. Birkaç hızlı soruyla bu görünmez maliyetleri
              göster.
            </Text>
          </LinearGradient>

          {!done ? (
            <Card style={styles.cardSpacing}>
              <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
                Soru {step + 1} / {QUESTIONS.length}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${((step + 1) / QUESTIONS.length) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.questionPrompt, { color: colors.text }]}>
                {QUESTIONS[step].prompt}
              </Text>
              <View style={styles.optionList}>
                {QUESTIONS[step].options.map((opt, i) => (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => handleAnswer(QUESTIONS[step].id, i)}
                    style={[
                      styles.optionBtn,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                  >
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          ) : (
            <>
              <Card style={styles.cardSpacing}>
                <SectionHeader
                  title="Maliyet Haritan"
                  icon="analytics"
                  subtitle="Her sütun bir alan — yüksekse o alan kumar yüzünden zorlanıyor."
                />
                <View style={styles.barChart}>
                  {(Object.keys(totals) as Dimension[]).map((dim) => {
                    const value = totals[dim];
                    const ratio = value / Math.max(maxScore, 1);
                    return (
                      <View key={dim} style={styles.barCol}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                backgroundColor: DIM_META[dim].color,
                                height: `${Math.max(8, ratio * 100)}%`,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.barLabelWrap}>
                          <Ionicons name={DIM_META[dim].icon} size={12} color={DIM_META[dim].color} />
                          <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                            {DIM_META[dim].label}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>

              <Card style={styles.cardSpacing}>
                <View style={styles.dominantRow}>
                  <View
                    style={[
                      styles.dominantIcon,
                      { backgroundColor: `${DIM_META[dominantDim].color}22` },
                    ]}
                  >
                    <Ionicons
                      name={DIM_META[dominantDim].icon}
                      size={22}
                      color={DIM_META[dominantDim].color}
                    />
                  </View>
                  <View style={styles.dominantText}>
                    <Text style={[styles.dominantLabel, { color: colors.textMuted }]}>
                      EN ÇOK ZARAR GÖREN ALAN
                    </Text>
                    <Text style={[styles.dominantValue, { color: colors.text }]}>
                      {DIM_META[dominantDim].label}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.dominantBody, { color: colors.text }]}>
                  {dominantHelp(dominantDim)}
                </Text>
              </Card>

              <View style={styles.actionRow}>
                <Button
                  title="Yeniden Yap"
                  onPress={handleRestart}
                  variant="secondary"
                  leftIcon="refresh"
                />
                <Button
                  title="Günlüğe Ekle"
                  onPress={() => {
                    haptics.tapLight();
                    router.push("/diary");
                  }}
                  variant="primary"
                  rightIcon="arrow-forward"
                  style={styles.actionPrimary}
                />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function dominantHelp(dim: Dimension): string {
  switch (dim) {
    case "time":
      return "Zaman — kumara giden saatler başka bir şeyden çalınıyor: aileden, sağlıktan, kariyerden. Bir hafta boyunca telefonun ekran sürelerine bak; oradaki rakam aslında \"yapmadığın şeylerin\" listesi.";
    case "relationships":
      return "İlişkiler — kumar genelde tek başına oynanır ama hasar paylaşılır. Önce bir kişiye söyle, sonra sınır koy. Yalnızlık dürtüyü besler.";
    case "focus":
      return "Odak — beyin sürekli bir sonraki bahsi hesaplarken iş, okul ve yaratıcılık geri planda kalır. Sabah 2 saatlik tek bir derin çalışma denemesi büyük fark yaratır.";
    case "sleep":
      return "Uyku — gece kumar oynamak melatoninin saatini bozar. Sonraki gün dürtü direkt yükselir. Telefonu yatak odasından çıkar ve sabit bir uyku saati koy.";
    case "health":
      return "Sağlık — stres hormonu kortizol sürekli yüksek olduğunda baş ağrısı, mide, kas gerginliği başlar. 10 dakikalık günlük yürüyüş kortizolü ölçülebilir şekilde düşürür.";
  }
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backText: { fontSize: 17, fontWeight: "600" },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroDecor: { position: "absolute", right: -20, bottom: -20 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(157,175,198,0.16)",
    borderWidth: 1,
    borderColor: "rgba(157,175,198,0.34)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#9DAFC6",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 19 },

  cardSpacing: { marginBottom: 14 },
  stepLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4, marginBottom: 6 },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: { height: "100%", borderRadius: 999 },
  questionPrompt: { fontSize: 18, fontWeight: "800", lineHeight: 24, marginBottom: 14 },
  optionList: { gap: 8 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionLabel: { fontSize: 14, fontWeight: "700", flex: 1 },

  barChart: {
    flexDirection: "row",
    height: 180,
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 8,
  },
  barCol: { flex: 1, alignItems: "center", gap: 8, height: "100%" },
  barTrack: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 8,
    overflow: "hidden",
  },
  barFill: { width: "100%", borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  barLabel: { fontSize: 10, fontWeight: "700" },

  dominantRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  dominantIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dominantText: { flex: 1, minWidth: 0 },
  dominantLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 2 },
  dominantValue: { fontSize: 22, fontWeight: "900" },
  dominantBody: { fontSize: 13, lineHeight: 19 },

  actionRow: { flexDirection: "row", gap: 10 },
  actionPrimary: { flex: 1 },
});

export default withPremiumGate(HiddenCostsModule, {
  title: "Görünmez Maliyetler",
  subtitle: "Zaman · İlişki · Odak · Uyku",
});
