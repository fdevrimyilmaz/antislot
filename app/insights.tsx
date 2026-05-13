import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumBarChart, type PremiumBarChartDatum } from "@/components/ui/premium-bar-chart";
import {
  computeStats,
  getUrgeLog,
  type UrgeEntry,
  type UrgeTrigger,
} from "@/store/urgeLogStore";
import {
  getCheckinHistory,
  type CheckinEntry,
  type CheckinMood,
} from "@/store/checkinStore";
import { useProgressStore } from "@/store/progressStore";
import {
  calculateSavings,
  formatCurrency,
  getSavingsConfig,
  type SavingsConfig,
} from "@/store/savingsStore";
import { reportError } from "@/services/monitoring";

const TRIGGER_LABEL: Record<UrgeTrigger, string> = {
  stres: "Stres",
  sikinti: "Sıkıntı",
  yalniz: "Yalnızlık",
  kayip: "Kayıp",
  ofke: "Öfke",
  alkol: "Alkol",
  reklam: "Reklam",
  diger: "Diğer",
};

const MOOD_SCORE: Record<CheckinMood, number> = {
  kotu: 1,
  zor: 2,
  idare: 3,
  iyi: 4,
  harika: 5,
};

const MOOD_LABEL: Record<CheckinMood, string> = {
  kotu: "Kötü",
  zor: "Zor",
  idare: "İdare",
  iyi: "İyi",
  harika: "Harika",
};

export default function InsightsScreen() {
  const { colors } = useTheme();
  const gamblingFreeDays = useProgressStore((s) => s.gamblingFreeDays);
  const progressHydrated = useProgressStore((s) => s.hydrated);

  const [urgeEntries, setUrgeEntries] = useState<UrgeEntry[] | null>(null);
  const [checkins, setCheckins] = useState<CheckinEntry[] | null>(null);
  const [savingsConfig, setSavingsConfigState] = useState<SavingsConfig | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [urges, ch, cfg] = await Promise.all([
          getUrgeLog(),
          getCheckinHistory(),
          getSavingsConfig(),
        ]);
        setUrgeEntries(urges);
        setCheckins(ch);
        setSavingsConfigState(cfg);
      } catch (error) {
        reportError(error, { scope: "insights.load", level: "warning" });
        setUrgeEntries([]);
        setCheckins([]);
      }
    })();
  }, []);

  const loading =
    !progressHydrated || urgeEntries === null || checkins === null || savingsConfig === null;

  const safeDays = Number.isFinite(gamblingFreeDays) ? gamblingFreeDays : 0;
  const savedAmount = useMemo(
    () => calculateSavings(safeDays, savingsConfig?.dailyAverage ?? 0),
    [safeDays, savingsConfig?.dailyAverage]
  );
  const savedLabel = useMemo(
    () => formatCurrency(savedAmount, savingsConfig?.currency ?? "₺"),
    [savedAmount, savingsConfig?.currency]
  );

  // Urge analysis
  const urgeStats = useMemo(
    () => (urgeEntries ? computeStats(urgeEntries) : null),
    [urgeEntries]
  );

  const peakTrigger = useMemo(() => {
    if (!urgeStats || urgeStats.total === 0) return null;
    let best: { name: UrgeTrigger; count: number } | null = null;
    for (const [k, v] of Object.entries(urgeStats.byTrigger) as [UrgeTrigger, number][]) {
      if (!best || v > best.count) best = { name: k, count: v };
    }
    return best && best.count > 0 ? best : null;
  }, [urgeStats]);

  const peakHour = useMemo(() => {
    if (!urgeStats || urgeStats.total === 0) return null;
    let bestIdx = -1;
    let bestVal = 0;
    urgeStats.byHour.forEach((v, i) => {
      if (v > bestVal) {
        bestVal = v;
        bestIdx = i;
      }
    });
    return bestVal > 0 ? { hour: bestIdx, count: bestVal } : null;
  }, [urgeStats]);

  // Last 7 days urge count series
  const last7DaysData = useMemo<PremiumBarChartDatum[] | null>(() => {
    if (!urgeEntries) return null;
    const now = new Date();
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = urgeEntries.filter(
        (e) => e.createdAt >= d.getTime() && e.createdAt < next.getTime()
      ).length;
      days.push({
        label: d.toLocaleDateString("tr-TR", { weekday: "short" }).slice(0, 3),
        count,
      });
    }
    const max = Math.max(1, ...days.map((d) => d.count));
    return days.map((d, i) => ({
      key: `d${i}`,
      label: d.label,
      value: (d.count / max) * 100,
      valueLabel: String(d.count),
    }));
  }, [urgeEntries]);

  // 24h urge distribution
  const hourChartData = useMemo<PremiumBarChartDatum[] | null>(() => {
    if (!urgeStats) return null;
    const max = Math.max(1, ...urgeStats.byHour);
    // Show every 3rd hour label to keep things readable.
    return urgeStats.byHour.map((v, h) => ({
      key: `h${h}`,
      label: h % 3 === 0 ? String(h) : "",
      value: (v / max) * 100,
      inactive: v === 0,
    }));
  }, [urgeStats]);

  // Trigger breakdown
  const triggerChartData = useMemo<PremiumBarChartDatum[] | null>(() => {
    if (!urgeStats) return null;
    const entries = (Object.entries(urgeStats.byTrigger) as [UrgeTrigger, number][])
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;
    const max = entries[0][1];
    return entries.map(([k, v], i) => ({
      key: `t${i}`,
      label: TRIGGER_LABEL[k],
      value: (v / max) * 100,
      valueLabel: String(v),
    }));
  }, [urgeStats]);

  // Mood trend (last 14 days)
  const moodTrend = useMemo<{ avg: number; chart: PremiumBarChartDatum[] } | null>(() => {
    if (!checkins || checkins.length === 0) return null;
    const recent = checkins.slice(0, 14).reverse();
    const points = recent.map((c, i) => ({
      score: MOOD_SCORE[c.mood],
      key: `m${i}`,
      label: i % 2 === 0 ? new Date(c.createdAt).getDate().toString() : "",
    }));
    const avg = points.reduce((s, p) => s + p.score, 0) / points.length;
    const chart = points.map((p) => ({
      key: p.key,
      label: p.label,
      value: (p.score / 5) * 100,
    }));
    return { avg, chart };
  }, [checkins]);

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ThemeTexture
        primary={colors.primary}
        secondary={colors.secondary}
        accent={colors.accent}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Kişisel İçgörüler
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Senin verinden — soyut tavsiye değil, gerçek desenler. Sadece bu cihazda hesaplanır.
          </Text>

          {/* Hero KPIs */}
          <Card variant="hero" padding={22} style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroCell}>
                <Text style={styles.heroBig}>{safeDays}</Text>
                <Text style={styles.heroSub}>gün</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroCell}>
                <Text style={styles.heroBig}>{savedLabel}</Text>
                <Text style={styles.heroSub}>tasarruf</Text>
              </View>
            </View>
          </Card>

          {/* Urge summary */}
          {urgeStats && urgeStats.total > 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Dürtü özeti"
                icon="pulse"
                meta={`${urgeStats.total} kayıt`}
              />
              <View style={styles.miniRow}>
                <MiniStat
                  label="Direniş"
                  value={`${Math.round(urgeStats.resistanceRate * 100)}%`}
                  color={colors.success}
                />
                <MiniStat
                  label="Ort. yoğunluk"
                  value={urgeStats.avgIntensity.toFixed(1)}
                  color={colors.warning}
                />
                <MiniStat
                  label="Direnilen"
                  value={String(urgeStats.resistedCount)}
                  color={colors.primary}
                />
              </View>
              {peakTrigger || peakHour ? (
                <View style={styles.insightLines}>
                  {peakTrigger ? (
                    <InsightLine
                      icon="flash"
                      colors={colors}
                      text={`En sık tetikleyicin: ${TRIGGER_LABEL[peakTrigger.name]} (${peakTrigger.count} kez).`}
                    />
                  ) : null}
                  {peakHour ? (
                    <InsightLine
                      icon="time"
                      colors={colors}
                      text={`En riskli saat: ${String(peakHour.hour).padStart(2, "0")}:00 civarı (${peakHour.count} dürtü).`}
                    />
                  ) : null}
                </View>
              ) : null}
            </Card>
          ) : !loading ? (
            <EmptyCard
              icon="pulse"
              title="Henüz dürtü kaydı yok"
              hint="Dürtü Defteri modülünden ilk kaydını ekle — içgörüler birikmeye başlasın."
            />
          ) : null}

          {/* Last 7 days */}
          {last7DaysData && last7DaysData.some((d) => d.value > 0) ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Son 7 gün"
                icon="calendar"
                subtitle="Günlük dürtü sayısı."
              />
              <PremiumBarChart data={last7DaysData} colors={colors} chartHeight={120} />
            </Card>
          ) : null}

          {/* Hour distribution */}
          {hourChartData && hourChartData.some((d) => !d.inactive) ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Saat dağılımı"
                icon="time"
                subtitle="Hangi saatler senin için en riskli."
              />
              <PremiumBarChart
                data={hourChartData}
                colors={colors}
                chartHeight={110}
                highlightPeak
              />
            </Card>
          ) : null}

          {/* Triggers */}
          {triggerChartData ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Tetikleyici kırılımı"
                icon="git-network"
                subtitle="En sık tetikleyicilerden başlayarak — fark etmek değişimin yarısıdır."
              />
              <PremiumBarChart data={triggerChartData} colors={colors} chartHeight={130} />
            </Card>
          ) : null}

          {/* Mood trend */}
          {moodTrend ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Ruh hali trendi"
                icon="happy"
                subtitle={`Son ${moodTrend.chart.length} check-in ortalaması: ${
                  MOOD_LABEL[scoreToMood(moodTrend.avg)]
                } (${moodTrend.avg.toFixed(1)}/5).`}
              />
              <PremiumBarChart data={moodTrend.chart} colors={colors} chartHeight={110} />
            </Card>
          ) : !loading ? (
            <EmptyCard
              icon="happy"
              title="Henüz check-in yok"
              hint="Günlük Check-in widget'ından bir tane kaydet; ruh hali trendin burada görünür."
            />
          ) : null}

          {/* Privacy note */}
          <Card
            style={[styles.cardSpacing, { backgroundColor: `${colors.success}10` }]}
          >
            <View style={styles.privacyRow}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              <Text style={[styles.privacyText, { color: colors.text }]}>
                Bütün bu hesaplamalar sadece bu cihazda yapılır. Hiçbir veri
                sunucuya gönderilmez.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function scoreToMood(score: number): CheckinMood {
  if (score >= 4.5) return "harika";
  if (score >= 3.5) return "iyi";
  if (score >= 2.5) return "idare";
  if (score >= 1.5) return "zor";
  return "kotu";
}

type MiniStatProps = { label: string; value: string; color: string };
function MiniStat({ label, value, color }: MiniStatProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.miniStat, { backgroundColor: `${color}14`, borderColor: color }]}>
      <Text style={[styles.miniStatValue, { color }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

type InsightLineProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: ReturnType<typeof useTheme>["colors"];
};
function InsightLine({ icon, text, colors }: InsightLineProps) {
  return (
    <View style={styles.insightLine}>
      <View style={[styles.insightIcon, { backgroundColor: `${colors.primary}14` }]}>
        <Ionicons name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={[styles.insightText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

type EmptyProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
};
function EmptyCard({ icon, title, hint }: EmptyProps) {
  const { colors } = useTheme();
  return (
    <Card style={styles.cardSpacing}>
      <View style={styles.emptyWrap}>
        <View
          style={[styles.emptyIcon, { backgroundColor: `${colors.primary}14` }]}
        >
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.emptyHint, { color: colors.textMuted }]}>{hint}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 22, paddingBottom: 60 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 18 },

  heroCard: { marginBottom: 14 },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroCell: { flex: 1, alignItems: "center" },
  heroDivider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginHorizontal: 14,
  },
  heroBig: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  heroSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  cardSpacing: { marginBottom: 14 },

  miniRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  miniStat: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  miniStatValue: { fontSize: 18, fontWeight: "900" },
  miniStatLabel: { fontSize: 11, fontWeight: "700", marginTop: 2 },

  insightLines: { gap: 8, marginTop: 4 },
  insightLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  insightIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  insightText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },

  emptyWrap: { alignItems: "center", paddingVertical: 12 },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800" },
  emptyHint: { fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 16 },

  privacyRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  privacyText: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 18 },
});
