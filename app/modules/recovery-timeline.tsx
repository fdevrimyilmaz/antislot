import { router } from "expo-router";
import React, { useMemo } from "react";
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
import { useProgressStore } from "@/store/progressStore";
import { haptics } from "@/services/haptics";

type RecoveryStage = {
  /** Time threshold (hours) when this stage typically becomes noticeable. */
  hours: number;
  category: "uyku" | "duygu" | "para" | "iliski" | "beyin" | "saglik";
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

/**
 * Timeline anchored on clinical literature on behavioural-addiction
 * recovery (gambling disorder). Times are typical, not personal —
 * cited as guidance, not a promise.
 */
const STAGES: RecoveryStage[] = [
  {
    hours: 0,
    category: "duygu",
    title: "İlk Saat",
    description:
      "Karar verdin. Kortizol biraz yükselebilir (sıkıntı), bu normal — bedenin değişimi fark ediyor.",
    icon: "play-circle",
  },
  {
    hours: 6,
    category: "beyin",
    title: "6. Saat",
    description:
      "Beyin ödül devresi 'bekleme' moduna girer. Yoğun dürtü dalgaları gelebilir — 90 saniyede zirveye çıkıp düşerler.",
    icon: "pulse",
  },
  {
    hours: 24,
    category: "uyku",
    title: "1. Gün",
    description:
      "İlk uyku farklı olabilir. Beyin gece tarama sırasında bahisli oyun düşüncelerini temizler. Bu çok yorucu ama normal.",
    icon: "moon",
  },
  {
    hours: 72,
    category: "duygu",
    title: "3. Gün",
    description:
      "En zor eşik. Dopamin baz değeri en düşükte — sıkıntı ve huzursuzluk doruğa çıkar. Bu geçicidir; sonrası iyi.",
    icon: "flame",
  },
  {
    hours: 168, // 1 week
    category: "uyku",
    title: "1. Hafta",
    description:
      "Uyku düzeni yavaş yavaş normalleşmeye başlar. Sabah daha az yorgun uyanmaya başlarsın.",
    icon: "sunny",
  },
  {
    hours: 336, // 2 weeks
    category: "beyin",
    title: "2. Hafta",
    description:
      "Odak süresi ölçülebilir şekilde artar. Bir kitap okumak, bir sohbeti dinlemek artık zor değil.",
    icon: "compass",
  },
  {
    hours: 720, // 1 month
    category: "para",
    title: "1. Ay",
    description:
      "İlk ay borç ödeme planı kurulabilir — bahis gideri kesilince nakit akışı görünür hale gelir.",
    icon: "wallet",
  },
  {
    hours: 1440, // 2 months
    category: "iliski",
    title: "2. Ay",
    description:
      "Yakınlarınla ilişkilerde gerilim azalır. Onlar da senin değiştiğini fark eder. Güven yavaş ama gerçek geri gelir.",
    icon: "people",
  },
  {
    hours: 2160, // 3 months (90 days)
    category: "beyin",
    title: "3. Ay (Kritik Eşik)",
    description:
      "Klinik açıdan en önemli kilometre taşı. 90 gün sonra dürtü tepkisi belirgin şekilde düşer. Aralıklı pekiştirme döngüsü kırılır.",
    icon: "shield-checkmark",
  },
  {
    hours: 4320, // 6 months
    category: "saglik",
    title: "6. Ay",
    description:
      "Vücudunda biriken kronik stres etkileri (uyku, baş ağrısı, mide) önemli oranda düzelir. Kilo ve kan basıncı düzene girebilir.",
    icon: "fitness",
  },
  {
    hours: 8760, // 1 year
    category: "duygu",
    title: "1. Yıl",
    description:
      "Kimliğin değişti — 'eski kumar oyuncusu' yerine 'bir yıldır temiz' olmak yeni norm. Olağanüstü bir başarı.",
    icon: "trophy",
  },
  {
    hours: 43800, // 5 years
    category: "iliski",
    title: "5. Yıl",
    description:
      "Klinik literatürde bağımlılığın 'iyileşmiş' olarak kabul edildiği eşik. Bahis düşüncesi nadirdir, geldiğinde de güçsüzdür.",
    icon: "infinite",
  },
];

const CATEGORY_META: Record<
  RecoveryStage["category"],
  { label: string; color: string }
> = {
  uyku: { label: "UYKU", color: "#A7AEFF" },
  duygu: { label: "DUYGU", color: "#F87171" },
  para: { label: "FİNANSAL", color: "#5EE0C7" },
  iliski: { label: "İLİŞKİ", color: "#FFB366" },
  beyin: { label: "BEYİN", color: "#7BB8FF" },
  saglik: { label: "SAĞLIK", color: "#FBBF24" },
};

function daysToHours(days: number): number {
  return days * 24;
}

export default function RecoveryTimelineModule() {
  const { colors } = useTheme();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const safeDays = Number.isFinite(gamblingFreeDays) ? gamblingFreeDays : 0;
  const currentHours = daysToHours(safeDays);

  const passedStages = useMemo(
    () => STAGES.filter((s) => currentHours >= s.hours).length,
    [currentHours]
  );
  const nextStage = useMemo(
    () => STAGES.find((s) => s.hours > currentHours),
    [currentHours]
  );

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
            colors={["#1F6B4E", "#185A41", "#134B36"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="fitness" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="leaf" size={11} color="#6DE2A5" />
              <Text style={styles.heroBadgeText}>İYİLEŞME</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Toparlanma Zaman Çizelgesi
            </Text>
            <Text style={styles.heroSubtitle}>
              Kumarı bıraktıktan sonra zihninde ve bedeninde ne zaman ne
              değişir? Bilim-temelli bir yol haritası.
            </Text>
            <View style={styles.heroStats}>
              <View>
                <Text style={styles.heroStatValue}>{safeDays}</Text>
                <Text style={styles.heroStatLabel}>TEMİZ GÜN</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View>
                <Text style={styles.heroStatValue}>
                  {passedStages}
                  <Text style={styles.heroStatTotal}>/{STAGES.length}</Text>
                </Text>
                <Text style={styles.heroStatLabel}>AŞAMA</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Next stage progress */}
          {nextStage ? (
            <Card style={styles.cardSpacing}>
              <View style={styles.nextHeader}>
                <Ionicons name={nextStage.icon} size={20} color={colors.primary} />
                <Text style={[styles.nextLabel, { color: colors.textMuted }]}>
                  SONRAKİ AŞAMA
                </Text>
              </View>
              <Text style={[styles.nextTitle, { color: colors.text }]}>
                {nextStage.title}
              </Text>
              <Text style={[styles.nextDays, { color: colors.textMuted }]}>
                {Math.ceil((nextStage.hours - currentHours) / 24)} gün sonra
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, (currentHours / nextStage.hours) * 100)}%` },
                  ]}
                />
              </View>
            </Card>
          ) : null}

          {/* Timeline */}
          <View style={styles.timeline}>
            {STAGES.map((stage, index) => {
              const reached = currentHours >= stage.hours;
              const isCurrent = !reached && stage === nextStage;
              const meta = CATEGORY_META[stage.category];
              return (
                <View key={stage.title} style={styles.stageRow}>
                  {/* Left rail */}
                  <View style={styles.railColumn}>
                    <View
                      style={[
                        styles.railDot,
                        {
                          backgroundColor: reached
                            ? meta.color
                            : isCurrent
                            ? colors.primary
                            : `${colors.cardBorder}AA`,
                          borderColor: isCurrent ? colors.primary : "transparent",
                        },
                      ]}
                    >
                      {reached ? (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      ) : null}
                    </View>
                    {index < STAGES.length - 1 ? (
                      <View
                        style={[
                          styles.railLine,
                          { backgroundColor: reached ? meta.color : `${colors.cardBorder}66` },
                        ]}
                      />
                    ) : null}
                  </View>

                  {/* Right card */}
                  <View
                    style={[
                      styles.stageCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: reached
                          ? `${meta.color}55`
                          : isCurrent
                          ? colors.primary
                          : colors.cardBorder,
                        opacity: reached || isCurrent ? 1 : 0.7,
                      },
                    ]}
                  >
                    <View style={styles.stageHeader}>
                      <View
                        style={[
                          styles.categoryChip,
                          { backgroundColor: `${meta.color}1A` },
                        ]}
                      >
                        <Ionicons name={stage.icon} size={11} color={meta.color} />
                        <Text style={[styles.categoryText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                      {isCurrent ? (
                        <View
                          style={[
                            styles.currentPill,
                            { backgroundColor: `${colors.primary}14` },
                          ]}
                        >
                          <Text style={[styles.currentPillText, { color: colors.primary }]}>
                            SIRADAKİ
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.stageTitle, { color: colors.text }]}>
                      {stage.title}
                    </Text>
                    <Text
                      style={[styles.stageBody, { color: reached ? colors.text : colors.textMuted }]}
                    >
                      {stage.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View
            style={[
              styles.disclaimer,
              { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}55` },
            ]}
          >
            <Ionicons name="information-circle" size={14} color={colors.warning} />
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              Bu zaman çizelgesi tipik durumu yansıtır. Senin deneyimin farklı
              olabilir. Tıbbi tavsiye değildir.
            </Text>
          </View>

          <Button
            title="İlerlememi Görüntüle"
            onPress={() => {
              haptics.tapLight();
              router.push("/progress");
            }}
            variant="secondary"
            fullWidth
            leftIcon="trending-up"
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
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
    backgroundColor: "rgba(109,226,165,0.18)",
    borderWidth: 1,
    borderColor: "rgba(109,226,165,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#6DE2A5",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  heroStats: { flexDirection: "row", alignItems: "center", gap: 16 },
  heroStatValue: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  heroStatTotal: { color: "rgba(255,255,255,0.6)", fontSize: 18, fontWeight: "700" },
  heroStatLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroStatDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.18)" },

  cardSpacing: { marginBottom: 14 },
  nextHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  nextLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  nextTitle: { fontSize: 22, fontWeight: "900", marginBottom: 2 },
  nextDays: { fontSize: 13, fontWeight: "700", marginBottom: 12 },
  progressTrack: { height: 8, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },

  timeline: { gap: 0 },
  stageRow: { flexDirection: "row", gap: 12 },
  railColumn: { alignItems: "center", width: 24 },
  railDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  railLine: { width: 2, flex: 1, marginTop: 2, marginBottom: 2 },
  stageCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  stageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  currentPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  currentPillText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  stageTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  stageBody: { fontSize: 13, lineHeight: 19 },

  disclaimer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  disclaimerText: { fontSize: 11, lineHeight: 15, flex: 1 },
});
